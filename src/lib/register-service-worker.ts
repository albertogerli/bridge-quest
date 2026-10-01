import { reportError } from "@/lib/report-error";

type RegistrationClient = { register(): Promise<unknown> };
const attempts = new WeakMap<RegistrationClient, Promise<void>>();

/** Technical categories only: never retain URLs, query strings or raw causes. */
export class ServiceWorkerRegistrationError extends Error {
  readonly code: string;

  constructor(error: unknown) {
    const known = error instanceof Error || (typeof DOMException !== "undefined" && error instanceof DOMException);
    const name = known ? error.name : "";
    const message = known ? error.message : "";
    const code = name === "SecurityError"
      ? /SSL certificate error occurred when fetching the script\./.test(message) ? "tls_certificate" : "security_policy"
      : name === "TypeError" ? "registration_type_error"
        : name === "AbortError" ? "registration_aborted" : "registration_failed";
    super(`Service worker registration failed (${code})`);
    this.name = "ServiceWorkerRegistrationError";
    this.code = code;
  }
}

/**
 * Un browser guidato da un programma: crawler, prova automatica, robot.
 *
 * `navigator.webdriver` è la dichiarazione standard, ed è quella che ci si può
 * permettere di credere: non serve a difendersi da nessuno, serve a non
 * svegliare qualcuno per un robot che non installerà mai niente.
 */
function eAutomatico(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

/**
 * Il browser incorporato in un'app: TikTok, Instagram, Facebook, Messenger,
 * LINE, Snapchat, Pinterest, LinkedIn, WeChat. Chi arriva da un annuncio o da
 * un post apre il sito lì dentro, e quei browser di solito non permettono il
 * service worker: la registrazione si interrompe. Il sito funziona lo stesso —
 * manca solo l'installazione offline, che è facoltativa — e non c'è niente da
 * correggere da parte nostra (primo caso: TikTok su iOS 15, 01/10/2026).
 */
const APP_CON_BROWSER_INCORPORATO =
  /\b(TikTok|musical_ly|BytedanceWebview|Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\/|Snapchat|Pinterest|LinkedInApp|MicroMessenger)\b/i;

function eBrowserIncorporato(): boolean {
  return typeof navigator !== "undefined" && APP_CON_BROWSER_INCORPORATO.test(navigator.userAgent ?? "");
}

/** Once per Serwist instance, including React StrictMode/remounts. No TLS bypass or retry loop. */
export function registerServiceWorker(client: RegistrationClient): Promise<void> {
  const existing = attempts.get(client);
  if (existing) return existing;
  const attempt = Promise.resolve().then(() => client.register()).then(() => {}, (error: unknown) => {
    // Offline installation is optional; the online app must remain usable.
    // Keep security/deployment faults visible instead of globally filtering them.
    //
    // UN BROWSER AUTOMATICO NON HA NULLA DA INSTALLARE. Il primo caso reale è
    // stato HeadlessChrome su Linux — un crawler — che fallisce la
    // registrazione per una propria restrizione, non per un difetto nostro.
    // Il filtro guarda CHI chiede, non che errore è: filtrare per codice
    // avrebbe nascosto anche il `registration_type_error` di un utente vero,
    // che invece vogliamo vedere perché può essere `sw.js` servito male.
    if (eAutomatico() || eBrowserIncorporato()) return;
    const errore = new ServiceWorkerRegistrationError(error);
    // UNA REGISTRAZIONE INTERROTTA NON È UN GUASTO: succede quando si lascia la
    // pagina prima che finisca, o quando il browser decide di non
    // installare. Chi la vede non può fare niente e il sito funziona.
    // Gli altri codici restano visibili — TLS, sicurezza, `sw.js` servito
    // male — perché quelli possono essere difetti nostri.
    if (errore.code === "registration_aborted") {
      console.warn("[pwa:register] registrazione interrotta:", errore.message);
      return;
    }
    reportError("pwa:register", errore);
  });
  attempts.set(client, attempt);
  return attempt;
}
