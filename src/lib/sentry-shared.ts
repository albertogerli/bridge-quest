/**
 * Configurazione Sentry condivisa fra client, server ed edge.
 *
 * Senza DSN tutto è no-op: l'app gira identica in locale e nei preview
 * senza inquinare il progetto Sentry (né consumare quota).
 */

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const SENTRY_ENABLED = !!SENTRY_DSN;

/** Percentuale di transazioni tracciate: in prod 10%, in dev tutto. */
export const TRACES_SAMPLE_RATE =
  process.env.NODE_ENV === "production" ? 0.1 : 1.0;

/**
 * Rumore da non inviare: estensioni del browser, errori di rete transitori,
 * interruzioni volontarie (l'utente cambia pagina mentre una fetch è in volo).
 */
export const IGNORE_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "Non-Error promise rejection captured",
  "AbortError",
  "The operation was aborted",
  "Failed to fetch",
  "NetworkError when attempting to fetch resource",
  "Load failed",
  // Estensioni/browser
  "top.GLOBALS",
  "chrome-extension://",
  "moz-extension://",
];

export const DENY_URLS = [
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
];

/**
 * La registrazione del service worker fallisce in ambienti che non lo
 * supportano — e il primo caso reale è stato il renderer di Google (WRS), che
 * la rifiuta sempre: il crawler di Google Ads ha aperto la landing e ha
 * generato un `Error: Rejected` non gestito.
 *
 * Non è un difetto dell'app e nessun utente ne è toccato: la PWA degrada da
 * sola. Segnalarlo consuma solo quota e notifiche, quindi questi eventi
 * vengono scartati riconoscendoli dallo stack (il messaggio "Rejected", da
 * solo, sarebbe troppo generico per filtrarlo senza rischi).
 */
const SERVICE_WORKER_NOISE = /serviceWorker\.register|wrsParams|_registerScript/;

/** True se l'evento è rumore di registrazione del service worker. */
export function isServiceWorkerNoise(event: {
  exception?: { values?: Array<{ stacktrace?: { frames?: Array<{ function?: string; filename?: string }> } }> };
}): boolean {
  const frames = event.exception?.values?.flatMap((v) => v.stacktrace?.frames ?? []) ?? [];
  return frames.some(
    (f) => SERVICE_WORKER_NOISE.test(f.function ?? "") || SERVICE_WORKER_NOISE.test(f.filename ?? "")
  );
}
