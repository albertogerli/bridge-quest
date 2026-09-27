import { describe, expect, it, vi } from "vitest";

/**
 * Il client del browser dev'essere UNO.
 *
 * Il costo di sbagliarlo non è la memoria: un canale Realtime aperto da
 * un'istanza si chiude solo con quella, e se il componente nel frattempo si è
 * ridisegnato su un'istanza diversa il canale resta appeso. Con quaranta tavoli
 * e centosessanta persone — e un tetto di cinquecento connessioni sul piano —
 * moltiplicare i canali ferma una serata senza che nessuno capisca perché.
 */

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ finto: true })),
}));

describe("il client del browser", () => {
  it("è sempre lo stesso oggetto, anche chiamato mille volte", async () => {
    const { createClient } = await import("./client");
    const { createBrowserClient } = await import("@supabase/ssr");

    const primo = createClient();
    for (let i = 0; i < 1000; i++) createClient();

    expect(createClient()).toBe(primo);
    // La prova che conta: la libreria è stata invocata UNA volta sola.
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });
});
