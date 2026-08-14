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

/**
 * Seconda forma della stessa cosa, vista in produzione il 13/08/2026.
 *
 * Dove `navigator.serviceWorker.register()` non fallisce ma risolve
 * `undefined` — succede con i renderer dei crawler e con le estensioni che lo
 * sostituiscono con un finto — la libreria della PWA legge `.waiting` su
 * niente e produce un `TypeError` non gestito.
 *
 * Il filtro sopra non lo prendeva: cerca il NOME della funzione, e in
 * produzione la minificazione l'aveva ridotta a `o.register`. Cercare `o\.`
 * sarebbe assurdo, quindi qui si riconosce il messaggio, che è specifico: in
 * tutto il nostro codice non esiste una sola lettura di `.waiting`, quindi
 * questo errore può venire solo da lì. Ogni browser lo formula a modo suo.
 *
 * Nessun utente ne è toccato: senza service worker la PWA degrada da sola.
 */
const WAITING_SU_UNDEFINED =
  /(undefined|null).*\bwaiting\b|\bwaiting\b.*\b(undefined|null)\b|_registration is (undefined|null)/i;

/** True se l'evento è rumore di registrazione del service worker. */
export function isServiceWorkerNoise(event: {
  exception?: {
    values?: Array<{
      value?: string;
      stacktrace?: { frames?: Array<{ function?: string; filename?: string }> };
    }>;
  };
}): boolean {
  const values = event.exception?.values ?? [];
  const frames = values.flatMap((v) => v.stacktrace?.frames ?? []);
  return (
    frames.some(
      (f) => SERVICE_WORKER_NOISE.test(f.function ?? "") || SERVICE_WORKER_NOISE.test(f.filename ?? "")
    ) || values.some((v) => WAITING_SU_UNDEFINED.test(v.value ?? ""))
  );
}

/**
 * Rumore dei browser dentro le app (Facebook, Instagram e simili).
 *
 * Evento reale del 13/08/2026 su /trova-circolo, da un Oppo con Android 13
 * dentro il browser di Facebook:
 *
 *   Error invoking enableDidUserTypeOnKeyboardLogging: Java object is gone
 *     at sendBeforeUnloadMessage (app://navigation_performance_logger_android)
 *
 * È la strumentazione di Facebook che si scollega dal proprio ponte Java
 * mentre la pagina viene chiusa. Non c'è una riga di codice nostro nello
 * stack, non c'è niente da correggere e nessun utente se ne accorge: la
 * pagina si stava chiudendo comunque.
 *
 * COME SI RICONOSCE
 * Il nostro codice compare sempre come `app:///_next/...` — tre barre, perché
 * l'host è vuoto. Queste librerie usano `app://<nome>`, con due barre e un
 * host. La differenza di una barra è l'intero confine, quindi va scritta con
 * cura: `app://x` è rumore, `app:///x` siamo noi.
 */
const FRAME_ESTERNO_APP = /^app:\/\/[^/]/;

/**
 * Il ponte Java delle WebView Android, che sparisce mentre la pagina si chiude.
 *
 * Secondo evento, 13/08 a mezzanotte, da un Samsung dentro Facebook:
 *
 *   Error invoking postMessage: Java object is gone
 *     at sendDataToNative (app://navigation_performance_logger_android)
 *     ...
 *     at u (app:///_next/static/chunks/5306-…)
 *
 * Stavolta nello stack c'è anche un frame NOSTRO, quindi la regola «tutti i
 * fotogrammi esterni» — giusta in generale — non basta. Ma quel frame è il
 * involucro con cui Sentry avvolge `addEventListener` (lo dice il `mechanism`
 * dell'evento): è nostro solo perché sta nel nostro pacchetto, non perché sia
 * codice nostro a sbagliare.
 *
 * Il messaggio invece è inequivocabile: «Java object is gone» è l'oggetto
 * ponte di una WebView Android che non c'è più. BridgeLab non parla con
 * nessun ponte Java — verificato: la stringa non compare in una sola riga del
 * sorgente — quindi questo errore non può in nessun caso essere nostro.
 */
const PONTE_JAVA_SPARITO = /Java object is gone/i;

/** True se l'evento arriva dalla strumentazione di un browser dentro un'app. */
export function isInAppBrowserNoise(event: {
  exception?: {
    values?: Array<{
      value?: string;
      stacktrace?: { frames?: Array<{ filename?: string }> };
    }>;
  };
}): boolean {
  const values = event.exception?.values ?? [];
  if (values.some((v) => PONTE_JAVA_SPARITO.test(v.value ?? ""))) return true;

  const frames = values.flatMap((v) => v.stacktrace?.frames ?? []);
  if (frames.length === 0) return false;
  // TUTTI i fotogrammi devono essere esterni. Se anche uno solo è nostro,
  // l'errore ci riguarda: la libreria potrebbe averlo solo fatto emergere.
  return frames.every((f) => FRAME_ESTERNO_APP.test(f.filename ?? ""));
}
