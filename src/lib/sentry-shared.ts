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
 * Firme note di rumore del browser. Non filtrare gli errori di rete per
 * messaggio: "Failed to fetch" può nascondere un guasto dei salvataggi.
 * Anche AbortError, senza il contesto del chiamante, non prova che la
 * cancellazione fosse volontaria. Gli abort previsti vanno gestiti lì.
 */
export const IGNORE_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  // Estensioni/browser
  "top.GLOBALS",
  "chrome-extension://",
  "moz-extension://",
  /**
   * Le tre frasi con cui un'estensione del browser sbaglia a parlare con la
   * propria pagina di servizio. Sono arrivate come errori NOSTRI perché
   * emergono come rifiuti di promesse non gestiti dentro la nostra pagina, e
   * il gestore globale di Sentry le raccoglie lì — ma il codice che le produce
   * non è nostro e non è raggiungibile da noi.
   *
   * PERCHÉ NON BASTAVA QUELLO CHE C'ERA. `chrome-extension://` e i
   * `DENY_URLS` filtrano sull'INDIRIZZO del file, e questi eventi arrivano
   * senza nemmeno un fotogramma di stack: c'è solo il messaggio. Il primo caso
   * reale è stato «Invalid call to runtime.sendMessage(). Tab not found.» dal
   * browser DuckDuckGo su Mac, l'11/09/2026.
   *
   * PERCHÉ SI POSSONO FILTRARE SENZA RISCHIO: `runtime.sendMessage` è l'API
   * delle estensioni, e BridgeLab non la chiama — verificato, non compare in
   * una riga del sorgente. Le altre due sono la stessa famiglia: l'estensione
   * è stata aggiornata o disattivata mentre la pagina era aperta.
   *
   * Sono qui e non in `beforeSend` perché `ignoreErrors` guarda il messaggio,
   * che è l'unica cosa che questi eventi hanno.
   */
  "runtime.sendMessage",
  "Extension context invalidated",
  "The message port closed before a response was received",
];

export const DENY_URLS = [
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
];

/**
 * Only the known Google renderer shim proves an unsupported crawler context.
 * A failed download, `.waiting` on undefined or a register frame alone can
 * also be a broken deployment, CSP or service-worker implementation.
 * A historical successful GET /sw.js cannot rule those out for a later event.
 */
const GOOGLE_RENDERER_SW = /wrsParams\.serviceWorkers\.navigator\.serviceWorker\.register/;

export function isServiceWorkerNoise(event: {
  exception?: {
    values?: Array<{
      value?: string;
      stacktrace?: { frames?: Array<{ function?: string; filename?: string }> };
    }>;
  };
}): boolean {
  return (event.exception?.values ?? []).some(value =>
    (value.stacktrace?.frames ?? []).some(frame =>
      GOOGLE_RENDERER_SW.test(frame.function ?? "") ||
      GOOGLE_RENDERER_SW.test(frame.filename ?? "")
    )
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
