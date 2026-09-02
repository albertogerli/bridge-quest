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
 * True se l'errore è la rete che non c'è, e non qualcosa da correggere.
 *
 * Chi lo usa NON deve tacere in silenzio: deve comunque far vedere all'utente
 * che il dato non è arrivato. Qui si decide solo se vale la pena svegliare
 * qualcuno.
 */
export function eDiRete(errore: unknown): boolean {
  const testo = messaggio(errore);
  if (!testo) return false;
  return FORME_DI_RETE.some((f) => f.test(testo));
}
