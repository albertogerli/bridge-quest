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
    // La forma esatta vista in produzione il 26/09/2026, iPhone su /admin:
    // supabase-js consegna l'errore di rete come oggetto con il nome del tipo
    // davanti al messaggio, e il filtro deve prenderlo lo stesso.
    expect(eDiRete({ message: "TypeError: Load failed" })).toBe(true);
    // `AuthRetryableFetchError`, da supabase-auth-js: il nome dice già che è
    // da riprovare, ma a `eDiRete` arriva solo il messaggio. Visto in
    // produzione il 26/09/2026 su /gioca/sfida-imp.
    expect(eDiRete({ name: "AuthRetryableFetchError", message: "Load failed" })).toBe(true);
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

  /**
   * Gli errori INCARTATI, che il messaggio non lo portano più.
   *
   * `SyncAuthError` butta via il messaggio originale apposta e tiene solo il
   * codice: dentro «Sync authentication failed (AuthRetryableFetchError)»
   * non c'è nessun «Load failed» da riconoscere. Il segnale sta nel campo.
   */
  it("riconosce un errore di rete dal codice quando il messaggio non ce l'ha", () => {
    expect(
      eDiRete({
        name: "SyncAuthError",
        code: "AuthRetryableFetchError",
        status: 0,
        message: "Sync authentication failed (AuthRetryableFetchError)",
      }),
    ).toBe(true);
    expect(eDiRete({ name: "SyncWriteError", code: "network_error", status: 0 })).toBe(true);
    expect(eDiRete({ name: "SyncWriteError", code: "request_aborted", status: 0 })).toBe(true);
  });

  /**
   * LA LINEA. `status 0` è la richiesta che non è mai partita — la rete di
   * chi gioca. Un 502 è il server che ha risposto male: è un problema
   * nostro, e deve svegliare qualcuno. Lo stesso codice può presentarsi in
   * tutti e due i modi, quindi il codice da solo non basta.
   */
  it("un 5xx NON è la rete: il server ha risposto, e ha risposto male", () => {
    expect(eDiRete({ code: "AuthRetryableFetchError", status: 502 })).toBe(false);
    expect(eDiRete({ name: "SyncWriteError", code: "http_error", status: 503 })).toBe(false);
  });

  it("un errore del database resta un difetto, codice o non codice", () => {
    expect(eDiRete({ code: "42501", message: "permission denied for table profiles" })).toBe(false);
    expect(eDiRete({ code: "23505", message: "duplicate key value" })).toBe(false);
  });
});
