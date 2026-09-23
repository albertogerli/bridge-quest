// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { createClient as createSdkClient } from "@supabase/supabase-js";
import { createElement, StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RicordaLingua } from "./ricorda-lingua";

const fixture = vi.hoisted(() => ({
  user: { id: "synthetic-a" } as { id: string } | null,
  lingua: "it",
  client: null as unknown,
  fetch: vi.fn<typeof fetch>(),
  report: vi.fn(),
}));
vi.mock("@/contexts/auth-provider", () => ({ useSharedAuth: () => ({ user: fixture.user }) }));
vi.mock("@/hooks/use-lingua", () => ({ useLingua: () => ({ lingua: fixture.lingua }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => fixture.client }));
vi.mock("@/lib/report-error", () => ({ reportError: fixture.report }));

const ok = (count = 1) => new Response(null, {
  status: 204,
  headers: { "content-range": `*/${count}` },
});
const failure = (status: number, code: string, message = "synthetic error") => new Response(
  JSON.stringify({ code, message, details: "", hint: "" }),
  { status, headers: { "content-type": "application/json" } },
);
const flush = () => act(async () => {});
const online = (value: boolean) => vi.spyOn(navigator, "onLine", "get").mockReturnValue(value);
const connectionRestored = () => act(async () => {
  online(true);
  window.dispatchEvent(new Event("online"));
});

beforeEach(() => {
  vi.useFakeTimers();
  fixture.user = { id: "synthetic-a" };
  fixture.lingua = "it";
  fixture.report.mockReset();
  fixture.fetch.mockReset().mockImplementation(async () => ok());
  online(true);
  // SDK reale: verifica anche la conversione di fetch rejection in status 0,
  // l'assenza di retry automatici PATCH e il parsing del conteggio HTTP.
  // Nessuna richiesta può raggiungere un database, nemmeno per l'auth.
  fixture.client = createSdkClient("https://language-test.invalid", "synthetic-key", {
    accessToken: async () => "synthetic-token",
    global: { fetch: fixture.fetch },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("non scrive per un visitatore anonimo", async () => {
  fixture.user = null;
  renderHook(() => RicordaLingua());
  await flush();
  expect(fixture.fetch).not.toHaveBeenCalled();
});

it("scrive una volta e chiede il conteggio, senza leggere dati personali", async () => {
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  const [url, options] = fixture.fetch.mock.calls[0];
  expect(String(url)).toBe("https://language-test.invalid/rest/v1/profiles?id=eq.synthetic-a");
  expect(options?.method).toBe("PATCH");
  expect(options?.body).toBe('{"lingua":"it"}');
  expect(new Headers(options?.headers).get("Prefer")).toContain("count=exact");
  fixture.user = { id: "synthetic-a" }; // rinnovo sessione, stesso account
  rerender();
  await flush();
  await connectionRestored();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  expect(fixture.report).not.toHaveBeenCalled();
});

it("non duplica la scrittura nel replay degli effetti di StrictMode", async () => {
  renderHook(() => RicordaLingua(), {
    wrapper: ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children),
  });
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
});

it.each([
  "Failed to fetch",
  "Failed to fetch (language-test.invalid)",
  "NetworkError when attempting to fetch resource.",
  "Load failed",
])("recupera un errore temporaneo %s prima di confermare il salvataggio", async (message) => {
  fixture.fetch.mockRejectedValueOnce(new TypeError(message));
  renderHook(() => RicordaLingua());
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  expect(fixture.report).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(1_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  expect(fixture.report).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
});

it("se il guasto persiste si ferma a tre richieste e segnala una sola volta", async () => {
  fixture.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  await act(() => vi.advanceTimersByTimeAsync(1_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  await act(() => vi.advanceTimersByTimeAsync(3_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(3);
  expect(fixture.report).toHaveBeenCalledTimes(1);
  expect(fixture.report).toHaveBeenCalledWith("lingua:profilo", expect.objectContaining({
    message: "TypeError: Failed to fetch", code: "",
  }));
  fixture.user = { id: "synthetic-a" };
  rerender();
  await connectionRestored();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(3);
});

it("aspetta la connessione senza sprecare richieste se il browser è offline", async () => {
  online(false);
  renderHook(() => RicordaLingua());
  await flush();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).not.toHaveBeenCalled();
  await connectionRestored();
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  expect(fixture.report).not.toHaveBeenCalled();
});

it("sospende il retry se cade la rete e lo riprende a connessione ripristinata", async () => {
  fixture.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  renderHook(() => RicordaLingua());
  await flush();
  online(false);
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  await connectionRestored();
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
});

it.each([502, 503, 504])("ritenta una risposta HTTP %s temporanea", async (status) => {
  fixture.fetch.mockResolvedValueOnce(failure(status, ""));
  renderHook(() => RicordaLingua());
  await flush();
  await act(() => vi.advanceTimersByTimeAsync(1_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  expect(fixture.report).not.toHaveBeenCalled();
});

it.each([[403, "42501"], [401, "PGRST301"], [400, "PGRST204"], [500, "XX000"]])(
  "non nasconde né ritenta l'errore HTTP %s (%s)", async (status, code) => {
    fixture.fetch.mockResolvedValueOnce(failure(status as number, code as string));
    renderHook(() => RicordaLingua());
    await flush();
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fixture.fetch).toHaveBeenCalledTimes(1);
    expect(fixture.report).toHaveBeenCalledWith("lingua:profilo", expect.objectContaining({ code }));
  },
);

it.each([
  new TypeError("Cannot read properties of undefined"),
  new DOMException("signal is aborted without reason", "AbortError"),
])("non tratta come rete qualsiasi TypeError o AbortError", async (error) => {
  fixture.fetch.mockRejectedValueOnce(error);
  renderHook(() => RicordaLingua());
  await flush();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  expect(fixture.report).toHaveBeenCalledTimes(1);
});

it.each([0, 2, null])("non conferma il salvataggio con conteggio %s", async (count) => {
  fixture.fetch.mockResolvedValueOnce(count === null ? new Response(null, { status: 204 }) : ok(count));
  renderHook(() => RicordaLingua());
  await flush();
  expect(fixture.report).toHaveBeenCalledWith("lingua:profilo", expect.objectContaining({
    code: "LINGUA_NOT_SAVED",
  }));
});

it("salva per un nuovo account anche se la lingua non cambia", async () => {
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  fixture.user = { id: "synthetic-b" };
  rerender();
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  expect(String(fixture.fetch.mock.calls[1][0])).toContain("id=eq.synthetic-b");
});

it("resetta la conferma dopo logout e nuovo login dello stesso account", async () => {
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  fixture.user = null;
  rerender();
  fixture.user = { id: "synthetic-a" };
  rerender();
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
});

it("annulla il retry al logout senza scrivere con una sessione successiva", async () => {
  fixture.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  fixture.user = null;
  rerender();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  await connectionRestored();
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  expect(fixture.report).not.toHaveBeenCalled();
});

it("rimuove listener offline e timer quando il componente viene smontato", async () => {
  online(false);
  const { unmount } = renderHook(() => RicordaLingua());
  await flush();
  unmount();
  await connectionRestored();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it("serializza i cambi rapidi e scarta la lingua intermedia non ancora inviata", async () => {
  let termina!: (response: Response) => void;
  fixture.fetch.mockImplementationOnce(() => new Promise<Response>((resolve) => { termina = resolve; }));
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  fixture.lingua = "en";
  rerender();
  await flush();
  fixture.lingua = "it";
  rerender();
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(1);
  await act(async () => { termina(ok()); });
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  expect(fixture.fetch.mock.calls.map(([, options]) => options?.body)).toEqual([
    '{"lingua":"it"}', '{"lingua":"it"}',
  ]);
  expect(fixture.report).not.toHaveBeenCalled();
});

it("un cambio lingua durante l'attesa libera la coda e salva la nuova scelta", async () => {
  fixture.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  fixture.lingua = "en";
  rerender();
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  expect(fixture.fetch.mock.calls[1][1]?.body).toBe('{"lingua":"en"}');
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  expect(fixture.report).not.toHaveBeenCalled();
});

it("riscrive l'italiano dopo una richiesta inglese ancora in corso", async () => {
  const { rerender } = renderHook(() => RicordaLingua());
  await flush();
  let termina!: (response: Response) => void;
  fixture.fetch.mockImplementationOnce(() => new Promise<Response>((resolve) => { termina = resolve; }));
  fixture.lingua = "en";
  rerender();
  await flush();
  fixture.lingua = "it";
  rerender();
  await flush();
  expect(fixture.fetch).toHaveBeenCalledTimes(2);
  await act(async () => { termina(ok()); });
  expect(fixture.fetch.mock.calls.map(([, options]) => options?.body)).toEqual([
    '{"lingua":"it"}', '{"lingua":"en"}', '{"lingua":"it"}',
  ]);
});

it("gestisce una rejection inattesa senza lasciare una promise non gestita", async () => {
  const errore = new Error("synthetic unexpected failure");
  fixture.client = { from: () => ({ update: () => ({ eq: () => Promise.reject(errore) }) }) };
  renderHook(() => RicordaLingua());
  await flush();
  expect(fixture.report).toHaveBeenCalledExactlyOnceWith("lingua:profilo", errore);
});
