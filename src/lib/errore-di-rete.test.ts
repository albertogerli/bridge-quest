import { describe, expect, it } from "vitest";
import { eDiRete } from "./errore-di-rete";

/**
 * Il confine fra «non c'è rete» e «c'è un difetto».
 *
 * Sbagliarlo da un lato riempie Sentry di allarmi per gente in metropolitana;
 * sbagliarlo dall'altro nasconde un guasto vero. Il secondo errore è quello
 * grave, e i test che contano di più qui sotto sono quelli che verificano che
 * NON si taccia.
 */
describe("eDiRete — le forme della rete che manca", () => {
  it("riconosce le formulazioni dei tre browser", () => {
    expect(eDiRete(new TypeError("Failed to fetch"))).toBe(true);           // Chrome
    expect(eDiRete(new TypeError("Load failed"))).toBe(true);               // Safari
    expect(eDiRete({ message: "NetworkError when attempting to fetch resource." })).toBe(true);
  });

  it("riconosce il service worker che non raggiunge la rete", () => {
    // L'evento reale del 01/09/2026, da un iPhone: la richiesta delle amicizie
    // gestita dal service worker, che non ha ottenuto risposta.
    expect(
      eDiRete(
        'TypeError: FetchEvent.respondWith received an error: no-response: no-response :: ' +
          '[{"url":"https://xxx.supabase.co/rest/v1/friendships?select=id"}]',
      ),
    ).toBe(true);
  });

  it("riconosce la connessione assente di iOS", () => {
    expect(eDiRete({ message: "The Internet connection appears to be offline." })).toBe(true);
  });

  it("NON tace su un errore del database", () => {
    // Il caso che non va perso: sono difetti, e devono arrivare.
    expect(eDiRete({ message: "permission denied for table profiles" })).toBe(false);
    expect(eDiRete({ message: 'column "xyz" does not exist' })).toBe(false);
    expect(eDiRete({ message: "duplicate key value violates unique constraint" })).toBe(false);
    expect(eDiRete({ message: "new row violates row-level security policy" })).toBe(false);
  });

  it("NON tace su un errore del nostro codice", () => {
    expect(eDiRete(new TypeError("Cannot read properties of undefined (reading 'hands')"))).toBe(false);
    expect(eDiRete(new Error("Contratto illeggibile"))).toBe(false);
  });

  it("regge oggetti strani senza esplodere", () => {
    expect(eDiRete(null)).toBe(false);
    expect(eDiRete(undefined)).toBe(false);
    expect(eDiRete({})).toBe(false);
    expect(eDiRete(42)).toBe(false);
    expect(eDiRete({ error_description: "Failed to fetch" })).toBe(true);
  });

  it("«load failed» si riconosce con qualsiasi maiuscola", () => {
    // Una volta è sfuggito proprio per questo: il filtro aveva «Load failed»
    // e il browser scriveva «load failed».
    expect(eDiRete("Script https://x/sw.js load failed")).toBe(true);
    expect(eDiRete("LOAD FAILED")).toBe(true);
  });
});
