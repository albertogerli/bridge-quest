// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { SyncAuthError, SyncSessionChangedError, SyncWriteError } from "@/lib/progress-sync";
import { useSupabaseSync } from "./use-supabase-sync";

const f = vi.hoisted(() => ({
  auth: { user: { id: "synthetic-a" } as { id: string } | null, profile: {} as Record<string, unknown>, loading: false },
  state: { xp: 10, streak: 1, handsPlayed: 1, completedModules: {} as Record<string, boolean>, lastLogin: null },
  client: {}, read: vi.fn(), write: vi.fn(), report: vi.fn(),
}));
vi.mock("@/contexts/auth-provider", () => ({ useSharedAuth: () => f.auth }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => f.client }));
vi.mock("@/lib/report-error", () => ({ reportError: f.report }));
vi.mock("@/store/use-game-store", () => ({ useGameStore: {
  getState: () => f.state,
  setState: (next: Partial<typeof f.state>) => { f.state = { ...f.state, ...next }; },
} }));
vi.mock("@/lib/progress-sync", async (original) => ({
  ...await original<typeof import("@/lib/progress-sync")>(),
  readProgress: f.read, writeProgress: f.write,
}));

const statuses: string[] = [];
const onStatus = (event: Event) => statuses.push((event as CustomEvent).detail);
const flush = () => act(async () => {});
const retry = () => act(async () => { window.dispatchEvent(new Event("online")); });
function profile(id: string) {
  return { id, xp: 0, streak: 0, hands_played: 0, total_minutes: 0, memory_best: null };
}
beforeEach(() => {
  vi.useFakeTimers();
  // Isolate the Storage contract from Node 25's partial Web Storage global.
  const values = new Map<string, string>();
  const storage: Storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    clear: () => values.clear(),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  vi.stubGlobal("localStorage", storage);
  statuses.length = 0;
  window.addEventListener("bq_sync_status", onStatus);
  f.auth = { user: { id: "synthetic-a" }, profile: profile("synthetic-a"), loading: false };
  f.state = { xp: 10, streak: 1, handsPlayed: 1, completedModules: {}, lastLogin: null };
  f.report.mockReset();
  f.write.mockReset().mockResolvedValue("next");
  f.read.mockReset().mockResolvedValue({
    moduleResult: { error: null, data: [] }, badgeResult: { error: null, data: [] },
    reviewResult: { error: null, data: { items: [], revision: "initial" } },
  });
});
afterEach(() => {
  cleanup();
  window.removeEventListener("bq_sync_status", onStatus);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("conferma solo una scrittura completata", async () => {
  renderHook(() => useSupabaseSync());
  await flush();
  expect(statuses).toEqual(["saved"]);
  expect(f.write).toHaveBeenCalledTimes(1);
  expect(f.write.mock.calls[0][2].xp).toBe(10);
  await retry();
  expect(f.write).toHaveBeenCalledTimes(1);
});

it("mantiene visibile un guasto auth/rete e recupera gli stessi progressi al retry", async () => {
  renderHook(() => useSupabaseSync());
  await flush();
  f.state.xp = 20;
  const error = new SyncAuthError(new AuthRetryableFetchError("diagnostica privata", 0));
  f.write.mockRejectedValueOnce(error);
  await retry();
  expect(f.report).toHaveBeenCalledExactlyOnceWith("sync:push", error);
  expect(statuses).toEqual(["saved", "error"]);
  expect(f.state.xp).toBe(20);
  await retry();
  expect(f.write.mock.calls[2][2].xp).toBe(20);
  expect(statuses).toEqual(["saved", "error", "saved"]);
});

it("sessione assente durante push: niente falso successo o allarme, stato locale recuperabile", async () => {
  renderHook(() => useSupabaseSync());
  await flush();
  f.state.xp = 20;
  f.write.mockRejectedValueOnce(new SyncSessionChangedError());
  await retry();
  expect(f.report).not.toHaveBeenCalled();
  expect(statuses).toEqual(["saved", "error"]);
  expect(f.state.xp).toBe(20);
  await retry();
  expect(statuses.at(-1)).toBe("saved");
  expect(f.write.mock.calls[2][2].xp).toBe(20);
});

it.each([
  { code: "network_error", status: 0 },
  { code: "request_aborted", status: 0 },
  { code: "http_error", status: 502 },
])("mantiene il profilo da salvare dopo $code e riprova al prossimo intervallo", async ({ code, status }) => {
  const error = new SyncWriteError(code, "profile", status);
  f.write.mockRejectedValueOnce(error);
  renderHook(() => useSupabaseSync());
  await flush();
  expect(statuses).toEqual(["error"]);
  expect(f.report).toHaveBeenCalledExactlyOnceWith("sync:push", error);
  expect(f.state.xp).toBe(10);
  await act(() => vi.advanceTimersByTimeAsync(30_000));
  expect(f.write).toHaveBeenCalledTimes(2);
  expect(f.write.mock.calls[1][2]).toEqual(f.write.mock.calls[0][2]);
  expect(f.write.mock.calls[1][3]).toBe("initial");
  expect(statuses).toEqual(["error", "saved"]);
});

it("sessione assente in lettura: nessun merge/scrittura e ripresa al ritorno della sessione", async () => {
  f.read.mockRejectedValueOnce(new SyncSessionChangedError());
  renderHook(() => useSupabaseSync());
  await flush();
  expect(f.write).not.toHaveBeenCalled();
  expect(f.report).not.toHaveBeenCalled();
  expect(f.state.xp).toBe(10);
  expect(statuses).toEqual(["error"]);
  await retry();
  expect(statuses).toEqual(["error", "saved"]);
});

it("continua a segnalare gli errori di permessi", async () => {
  f.write.mockRejectedValueOnce(new SyncWriteError("42501", "reviews"));
  renderHook(() => useSupabaseSync());
  await flush();
  expect(f.report).toHaveBeenCalledWith("sync:push", expect.objectContaining({ code: "42501" }));
  expect(statuses).toEqual(["error"]);
});

it("rilegge le revisioni dopo un conflitto invece di confermare una sovrascrittura", async () => {
  f.write.mockRejectedValueOnce(new SyncWriteError("40001", "reviews"));
  renderHook(() => useSupabaseSync());
  await flush();
  expect(statuses).toEqual(["error"]);
  await retry();
  expect(f.read).toHaveBeenCalledTimes(2);
  expect(statuses).toEqual(["error", "saved"]);
});

it("non mostra all'account nuovo il fallimento tardivo di quello precedente", async () => {
  let reject!: (error: Error) => void;
  f.write.mockReturnValueOnce(new Promise<string>((_, r) => { reject = r; }));
  const { rerender } = renderHook(() => useSupabaseSync());
  await flush();
  const oldCurrent = f.write.mock.calls[0][4];
  f.auth = { user: { id: "synthetic-b" }, profile: profile("synthetic-b"), loading: false };
  rerender();
  await flush();
  expect(oldCurrent()).toBe(false);
  expect(f.state.xp).toBe(0);
  expect(statuses).toEqual(["saved"]);
  await act(async () => { reject(new Error("old operation")); });
  expect(f.report).not.toHaveBeenCalled();
  expect(statuses).toEqual(["saved"]);
  f.auth = { user: { id: "synthetic-a" }, profile: profile("synthetic-a"), loading: false };
  rerender();
  await flush();
  expect(f.state.xp).toBe(10); // backup del primo account, non dati del secondo
});

it("ignora un vecchio successo anche dopo uscita e rientro nello stesso account", async () => {
  let resolve!: (revision: string) => void;
  f.write.mockReturnValueOnce(new Promise<string>((r) => { resolve = r; }));
  const { rerender } = renderHook(() => useSupabaseSync());
  await flush();
  f.auth.user = null;
  rerender();
  await flush();
  f.auth.user = { id: "synthetic-a" };
  rerender();
  await flush();
  expect(statuses).toEqual(["saved"]);
  await act(async () => { resolve("obsolete-revision"); });
  expect(statuses).toEqual(["saved"]);
});

it("lo smontaggio invalida i job attivi e rimuove timer/listener", async () => {
  let reject!: (error: Error) => void;
  f.write.mockReturnValueOnce(new Promise<string>((_, r) => { reject = r; }));
  const { unmount } = renderHook(() => useSupabaseSync());
  await flush();
  const current = f.write.mock.calls[0][4];
  unmount();
  expect(current()).toBe(false);
  await act(async () => { reject(new Error("late failure")); });
  await retry();
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(f.report).not.toHaveBeenCalled();
  expect(statuses).toEqual([]);
  expect(f.write).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
