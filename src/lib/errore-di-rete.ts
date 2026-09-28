/**
 * «È solo la rete», e come distinguerlo da un difetto.
 *
 * PERCHÉ NON BASTA IL FILTRO GLOBALE DI SENTRY. In `sentry-shared.ts` ci sono
 * già voci larghe come «Failed to fetch» e «Load failed». Allargarle ancora
 * sarebbe la strada sbagliata: più il filtro è generico, più è probabile che un
 * giorno nasconda un guasto vero, e un filtro che nasconde non lo scopri finché
 * non ti serve.
 *
 * Qui la decisione si prende NEL PUNTO in cui si conosce il contesto: chi
 * chiama sa che stava leggendo la lista degli amici, e sa che se la rete è
 * caduta non c'è niente da correggere. Il resto continua ad arrivare.
 *
 * LE FORME CHE PRENDE, tutte viste in produzione:
 *  · `Failed to fetch`         Chrome
 *  · `Load failed`             Safari — con la elle minuscola, che è il motivo
 *                              per cui una volta è sfuggito a un filtro
 *  · `NetworkError when …`     Firefox
 *  · `no-response` dentro un
 *    `FetchEvent.respondWith`  il service worker non ha raggiunto la rete per
 *                              una richiesta che stava gestendo lui
 *
 * NON è di rete un errore del database — un permesso negato, un vincolo
 * violato, una colonna che non esiste: quelli sono difetti e devono arrivare.
 */

const FORME_DI_RETE = [
  /failed to fetch/i,
  /\bload failed\b/i,
  /networkerror/i,
  /network request failed/i,
  /\bno-response\b/i,
  /fetchevent\.respondwith/i,
  /the internet connection appears to be offline/i,
];

/** Il messaggio di un errore, comunque sia fatto l'oggetto. */
function messaggio(errore: unknown): string {
  if (typeof errore === "string") return errore;
  if (errore && typeof errore === "object") {
    const o = errore as { message?: unknown; error_description?: unknown };
    if (typeof o.message === "string") return o.message;
    if (typeof o.error_description === "string") return o.error_description;
  }
  return String(errore ?? "");
}

/**
 * I codici che dicono «la richiesta non è mai arrivata al server».
 *
 * PERCHÉ NON BASTA IL MESSAGGIO. `SyncAuthError` in `progress-sync.ts`
 * BUTTA VIA il messaggio originale — apposta, per non far finire in Sentry
 * quello che l'autenticazione si porta dietro — e ne tiene solo il codice
 * ripulito. Il risultato arriva come «Sync authentication failed
 * (AuthRetryableFetchError)»: dentro non c'è più nessun «Load failed» da
 * riconoscere. Visto in produzione il 26/09/2026, Android su
 * /gioca/mano-del-giorno, dopo che il filtro sui messaggi era già in piedi.
 *
 * Il segnale però c'è, in un campo invece che in una frase.
 */
const CODICI_DI_RETE = new Set([
  "AuthRetryableFetchError", // supabase-auth-js: lo dice il nome
  "network_error",           // SyncWriteError: la fetch non è partita
  "request_aborted",         // la pagina è cambiata sotto, o il tempo è scaduto
]);

/**
 * Lo `status` HTTP, se l'errore ne porta uno.
 *
 * LA LINEA È QUI, ed è la distinzione che conta: `status 0` (o assente) vuol
 * dire che la richiesta non ha MAI raggiunto il server — è la rete di chi
 * gioca. Un 502 o un 503 vuol dire che il server ha risposto, e ha risposto
 * male: quello è un problema nostro e deve svegliare qualcuno. Lo stesso
 * codice `AuthRetryableFetchError` può presentarsi in entrambi i modi.
 */
function stato(errore: unknown): number | undefined {
  if (errore && typeof errore === "object") {
    const o = errore as { status?: unknown };
    if (typeof o.status === "number") return o.status;
  }
  return undefined;
}

function codice(errore: unknown): string {
  if (errore && typeof errore === "object") {
    const o = errore as { code?: unknown; name?: unknown };
    if (typeof o.code === "string" && CODICI_DI_RETE.has(o.code)) return o.code;
    if (typeof o.name === "string" && CODICI_DI_RETE.has(o.name)) return o.name;
  }
  return "";
}

/**
 * True se l'errore è la rete che non c'è, e non qualcosa da correggere.
 *
 * Chi lo usa NON deve tacere in silenzio: deve comunque far vedere all'utente
 * che il dato non è arrivato. Qui si decide solo se vale la pena svegliare
 * qualcuno.
 */
export function eDiRete(errore: unknown): boolean {
  const s = stato(errore);
  if (codice(errore) && (s === undefined || s === 0)) return true;

  const testo = messaggio(errore);
  if (!testo) return false;
  return FORME_DI_RETE.some((f) => f.test(testo));
}

/**
 * Il gettone di accesso è scaduto: non è un difetto, è il tempo che passa.
 *
 * PostgREST lo dice con PGRST301/302/303 e stato 401. Succede a chi lascia
 * una scheda aperta la notte: la prima scrittura del mattino parte col
 * gettone di ieri, fallisce, e al giro dopo — rinnovato il gettone — passa.
 * Sentry ne ha ricevute due in otto ore il 27-28/09/2026 (sync profile, sync
 * badges), nessuna con qualcosa da correggere.
 *
 * Stessa famiglia della rete caduta, e per lo stesso motivo non si segnala:
 * chi lo vede non può fare niente, e il sistema si rimette da solo.
 */
const CODICI_SESSIONE = new Set(["PGRST301", "PGRST302", "PGRST303"]);

export function eSessioneScaduta(errore: unknown): boolean {
  if (!errore || typeof errore !== "object") return false;
  const o = errore as { code?: unknown };
  return typeof o.code === "string" && CODICI_SESSIONE.has(o.code);
}
