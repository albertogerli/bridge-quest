import { describe, expect, it } from "vitest";
import { isServiceWorkerNoise } from "./sentry-shared";

/**
 * Il primo evento reale arrivato in produzione: il renderer di Google (WRS),
 * lanciato dal crawler di Google Ads sulla landing, rifiuta la registrazione
 * del service worker. Non è un difetto dell'app; questi test fissano il
 * confine fra ciò che va scartato e ciò che deve continuare ad arrivare.
 */

const evt = (frames: Array<{ function?: string; filename?: string }>) => ({
  exception: { values: [{ stacktrace: { frames } }] },
});

describe("isServiceWorkerNoise", () => {
  it("scarta il rifiuto del renderer di Google (evento reale del 2026-08-09)", () => {
    expect(
      isServiceWorkerNoise(
        evt([
          { function: "wrsParams.serviceWorkers.navigator.serviceWorker.register" },
          { function: "o._registerScript", filename: "app:///_next/static/chunks/5306.js" },
          { function: "o.register", filename: "app:///_next/static/chunks/5306.js" },
        ])
      )
    ).toBe(true);
  });

  it("scarta qualunque fallimento di registrazione del service worker", () => {
    expect(isServiceWorkerNoise(evt([{ function: "navigator.serviceWorker.register" }]))).toBe(true);
  });

  it("NON scarta un errore applicativo qualsiasi", () => {
    expect(
      isServiceWorkerNoise(
        evt([
          { function: "playCard", filename: "app:///_next/static/chunks/bridge.js" },
          { function: "onClick", filename: "app:///_next/static/chunks/page.js" },
        ])
      )
    ).toBe(false);
  });

  it("NON scarta un errore che nomina un service worker senza registrarlo", () => {
    // Un bug dentro il nostro sw.ts deve continuare ad arrivare.
    expect(isServiceWorkerNoise(evt([{ function: "onPush", filename: "app:///sw.js" }]))).toBe(false);
  });

  it("regge eventi senza stack o senza exception", () => {
    expect(isServiceWorkerNoise({})).toBe(false);
    expect(isServiceWorkerNoise({ exception: { values: [{}] } })).toBe(false);
    expect(isServiceWorkerNoise(evt([]))).toBe(false);
  });
});

/**
 * Seconda forma: la registrazione non fallisce, risolve `undefined`, e la
 * libreria della PWA legge `.waiting` su niente. Il filtro sullo stack non
 * bastava — in produzione la funzione era minificata in `o.register`, un nome
 * su cui non si può filtrare senza scartare mezzo mondo.
 */
const msg = (value: string, frames: Array<{ function?: string }> = []) => ({
  exception: { values: [{ value, stacktrace: { frames } }] },
});

describe("isServiceWorkerNoise — .waiting su undefined", () => {
  it("scarta l'evento reale del 2026-08-13, minificato", () => {
    expect(
      msgNoise("Cannot read properties of undefined (reading 'waiting')", [
        { function: "o.register" },
      ])
    ).toBe(true);
  });

  it("riconosce la stessa cosa detta da Firefox e da Safari", () => {
    expect(msgNoise("this._registration is undefined")).toBe(true);
    expect(
      msgNoise("undefined is not an object (evaluating 'this._registration.waiting')")
    ).toBe(true);
  });

  it("scarta anche la variante con null", () => {
    expect(msgNoise("Cannot read properties of null (reading 'waiting')")).toBe(true);
  });

  it("NON scarta un errore nostro che parla d'altro", () => {
    // Il confine che conta: se un giorno il gioco leggesse una proprietà su
    // undefined, quell'errore deve continuare ad arrivare.
    expect(msgNoise("Cannot read properties of undefined (reading 'tricks')")).toBe(false);
    expect(msgNoise("Cannot read properties of undefined (reading 'hands')")).toBe(false);
  });

  it("NON scarta un errore che nomina l'attesa senza essere quello", () => {
    expect(msgNoise("Timeout waiting for the tournament leaderboard")).toBe(false);
  });
});

function msgNoise(value: string, frames: Array<{ function?: string }> = []) {
  return isServiceWorkerNoise(msg(value, frames));
}
