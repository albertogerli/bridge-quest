import { afterEach, describe, expect, it } from "vitest";
import { AI_LEVEL_PREDEFINITO, getAILevel, setAILevel, type AILevel } from "./ai-difficulty";

/**
 * Il livello predefinito è una scelta di prodotto costata una segnalazione:
 * era «intermedio», che alla misura risulta fra i peggiori disponibili
 * (vedi `robot-quality.test.ts`). Questi test impediscono che torni indietro
 * per distrazione, e che una scelta esplicita dell'utente venga ignorata.
 */

/** Finto `window` con localStorage, per provare il ramo del browser. */
function conBrowser(valore: string | null) {
  const store = new Map<string, string>();
  if (valore !== null) store.set("bq_ai_level", valore);
  (globalThis as { window?: unknown }).window = {};
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  return store;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe("livello predefinito dell'avversario", () => {
  it("è «esperto»", () => {
    // Cambiarlo è legittimo, ma va fatto guardando la misura, non per caso.
    expect(AI_LEVEL_PREDEFINITO).toBe<AILevel>("esperto");
  });

  it("vale anche fuori dal browser, dove non c'è nulla da leggere", () => {
    expect(getAILevel()).toBe("esperto");
  });

  it("vale per chi non ha mai scelto", () => {
    conBrowser(null);
    expect(getAILevel()).toBe("esperto");
  });

  it("NON sovrascrive chi ha scelto: la preferenza dell'utente vince", () => {
    conBrowser("intermedio");
    expect(getAILevel()).toBe("intermedio");
    conBrowser("base");
    expect(getAILevel()).toBe("base");
  });

  it("la scelta salvata è quella riletta", () => {
    const store = conBrowser(null);
    setAILevel("base");
    expect(store.get("bq_ai_level")).toBe("base");
    expect(getAILevel()).toBe("base");
  });
});
