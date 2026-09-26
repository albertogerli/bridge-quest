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
    if (eAutomatico()) return;
    reportError("pwa:register", new ServiceWorkerRegistrationError(error));
  });
  attempts.set(client, attempt);
  return attempt;
}
