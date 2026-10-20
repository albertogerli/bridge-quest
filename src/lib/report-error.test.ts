// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const catturate = vi.hoisted(() => [] as unknown[]);
vi.mock("@sentry/nextjs", () => ({ captureException: (e: unknown) => catturate.push(e) }));
vi.mock("@/lib/sentry-shared", () => ({ SENTRY_ENABLED: true }));
const sessione = vi.hoisted(() => ({ aperta: false }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: sessione.aperta ? {} : null } }) },
  }),
}));

import { reportError } from "./report-error";

describe("reportError nel browser", () => {
  beforeEach(() => {
    catturate.length = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("la rete caduta non arriva a Sentry, anche passando da una funzione di libreria", () => {
    reportError("ingresso-aula:carica", { message: "TypeError: Failed to fetch (x.supabase.co)" });
    reportError("sync:initial", { name: "AuthRetryableFetchError", message: "Load failed" });
    expect(catturate).toHaveLength(0);
  });

  it("la sessione scaduta non arriva a Sentry", () => {
    reportError("sync:push", { code: "PGRST303", message: "JWT expired" });
    expect(catturate).toHaveLength(0);
  });

  it("un errore vero del database arriva", () => {
    reportError("classe:scrittura", { code: "23514", message: "violates check constraint" });
    expect(catturate).toHaveLength(1);
  });

  it("un 503 del server arriva: ha risposto, e male", () => {
    reportError("x", { name: "AuthRetryableFetchError", message: "Service Unavailable", status: 503 });
    expect(catturate).toHaveLength(1);
  });

  it("l'errore del service worker arriva, TLS compreso", () => {
    const e = Object.assign(new Error("Service worker registration failed (tls_certificate)"), {
      code: "tls_certificate",
    });
    reportError("pwa:register", e);
    expect(catturate).toHaveLength(1);
  });

  it("permesso negato a sessione chiusa: la chiamata è partita da anonimo, non arriva", async () => {
    sessione.aperta = false;
    reportError("home:richieste-in-attesa", { code: "42501", message: "permission denied for function mie_richieste_in_attesa" });
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(catturate).toHaveLength(0);
  });

  it("permesso negato con la sessione aperta: è un difetto, arriva", async () => {
    sessione.aperta = true;
    reportError("home:richieste-in-attesa", { code: "42501", message: "permission denied for function mie_richieste_in_attesa" });
    await vi.waitFor(() => expect(catturate).toHaveLength(1));
  });
});
