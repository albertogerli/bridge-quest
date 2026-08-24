import { describe, expect, it } from "vitest";
import { isInAppBrowserNoise, isServiceWorkerNoise } from "./sentry-shared";

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

/**
 * Browser dentro le app. Il confine è una barra sola: `app:///_next/...` è
 * nostro, `app://qualcosa` è la strumentazione di Facebook. Scriverlo male
 * significherebbe buttare via tutti i nostri errori del client.
 */
const app = (...filenames: string[]) => ({
  exception: { values: [{ stacktrace: { frames: filenames.map((filename) => ({ filename })) } }] },
});

describe("isInAppBrowserNoise", () => {
  it("scarta l'evento reale del 2026-08-13 dal browser di Facebook", () => {
    expect(
      isInAppBrowserNoise(
        app("app://navigation_performance_logger_android", "app://navigation_performance_logger_android")
      )
    ).toBe(true);
  });

  it("NON scarta i nostri errori: `app:///_next` ha tre barre", () => {
    // Il caso che, se sbagliato, ci farebbe perdere ogni errore del client.
    expect(isInAppBrowserNoise(app("app:///_next/static/chunks/main.js"))).toBe(false);
    expect(isInAppBrowserNoise(app("app:///_next/static/chunks/5306.js"))).toBe(false);
  });

  it("NON scarta se anche un solo fotogramma è nostro", () => {
    // La libreria potrebbe aver solo fatto emergere un difetto nostro.
    expect(
      isInAppBrowserNoise(app("app://navigation_performance_logger_android", "app:///_next/static/chunks/gioco.js"))
    ).toBe(false);
  });

  it("NON scarta un evento senza stack", () => {
    expect(isInAppBrowserNoise({})).toBe(false);
    expect(isInAppBrowserNoise(app())).toBe(false);
  });

  it("NON scarta gli errori da https://", () => {
    expect(isInAppBrowserNoise(app("https://bridgelab.it/_next/static/chunks/main.js"))).toBe(false);
  });
});

describe("isInAppBrowserNoise — il ponte Java sparito", () => {
  const conMessaggio = (value: string, filenames: string[] = []) => ({
    exception: {
      values: [{ value, stacktrace: { frames: filenames.map((filename) => ({ filename })) } }],
    },
  });

  it("scarta l'evento del 2026-08-13 anche se uno stack frame è nostro", () => {
    // Quel frame è l'involucro con cui Sentry avvolge addEventListener: è
    // nostro solo perché sta nel nostro pacchetto.
    expect(
      isInAppBrowserNoise(
        conMessaggio("Error invoking postMessage: Java object is gone", [
          "app://navigation_performance_logger_android",
          "app:///_next/static/chunks/5306-7c02d1f80c8e8e29.js",
        ])
      )
    ).toBe(true);
  });

  it("scarta anche la prima forma vista, sulla tastiera", () => {
    expect(
      isInAppBrowserNoise(
        conMessaggio("Error invoking enableDidUserTypeOnKeyboardLogging: Java object is gone")
      )
    ).toBe(true);
  });

  it("NON scarta un errore nostro che parla di oggetti mancanti", () => {
    // Il confine: «object is gone» senza «Java» resta un errore da guardare.
    expect(
      isInAppBrowserNoise(
        conMessaggio("Cannot read properties of undefined (reading 'hands')", [
          "app:///_next/static/chunks/tavolo.js",
        ])
      )
    ).toBe(false);
    expect(isInAppBrowserNoise(conMessaggio("Object is gone", ["app:///_next/x.js"]))).toBe(false);
  });
});

describe("registrazione del service worker non scaricata", () => {
  const conMessaggio = (value: string) => ({ exception: { values: [{ value }] } });

  it("scarta il fallimento di download dello script", () => {
    // Chrome per Android, 15/08/2026: rete caduta mentre scaricava /sw.js.
    // Verificato che in produzione /sw.js risponda 200 col tipo giusto.
    expect(
      isServiceWorkerNoise(
        conMessaggio(
          "Failed to register a ServiceWorker for scope ('https://bridgelab.it/') with " +
            "script ('https://bridgelab.it/sw.js'): An unknown error occurred when fetching the script."
        )
      )
    ).toBe(true);
  });

  it("ma un errore DENTRO il service worker arriva lo stesso", () => {
    // Se il filtro guardasse la sola parola «ServiceWorker», si perderebbero
    // i difetti veri del nostro codice offline.
    expect(
      isServiceWorkerNoise(conMessaggio("ServiceWorker: cache.put fallita su /api/lezioni"))
    ).toBe(false);
  });
});

/**
 * La stessa cosa detta da WebKit. Su iOS ogni browser gira dentro WKWebView,
 * quindi questa è la formulazione che arriva da iPhone e iPad — e arriva
 * SENZA fotogrammi di stack, il che rendeva cieco il filtro per nome di
 * funzione.
 */
describe("registrazione del service worker — la formulazione di WebKit", () => {
  const conMessaggio = (value: string) => ({ exception: { values: [{ value }] } });

  it("scarta l'evento reale del 2026-08-23 da Chrome per iOS", () => {
    expect(
      isServiceWorkerNoise(conMessaggio("Script https://bridgelab.it/sw.js load failed"))
    ).toBe(true);
  });

  it("scarta anche il service worker delle notifiche", () => {
    expect(
      isServiceWorkerNoise(
        conMessaggio("Script https://bridgelab.it/sw-notifications.js load failed")
      )
    ).toBe(true);
  });

  it("NON scarta il mancato caricamento di un pezzo dell'applicazione", () => {
    // Il confine che conta: se un giorno non si caricasse un chunk, quello è
    // un guasto vero e deve arrivare. Vale anche per un file il cui nome
    // COMINCIA per «sw» senza essere un service worker.
    expect(
      isServiceWorkerNoise(
        conMessaggio("Script https://bridgelab.it/_next/static/chunks/main.js load failed")
      )
    ).toBe(false);
    expect(
      isServiceWorkerNoise(conMessaggio("Script https://bridgelab.it/js/switch.js load failed"))
    ).toBe(false);
  });

  it("NON scarta un «load failed» che non nomina uno script", () => {
    expect(isServiceWorkerNoise(conMessaggio("Image load failed"))).toBe(false);
  });
});
