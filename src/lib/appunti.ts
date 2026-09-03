/**
 * Copiare negli appunti, sapendo se è andata.
 *
 * IL PROBLEMA. `navigator.clipboard.writeText()` fallisce in modi diversi e
 * per motivi che non sono difetti nostri, e ogni punto del portale se la
 * cavava a modo suo: qualcuno con un ripiego, qualcuno segnalando l'errore,
 * qualcuno mostrando «copiato» anche quando non aveva copiato niente — che è
 * il peggiore, perché chi legge lo scopre solo quando prova a incollare.
 *
 * I MODI IN CUI FALLISCE, tutti visti in produzione:
 *
 *  · «Document is not focused» — la pagina ha perso il fuoco fra il tocco e la
 *    copia. Succede quando la copia parte da un `setTimeout` o dopo un `await`
 *    e nel frattempo l'utente è passato ad altro. NON È UN DIFETTO: è una
 *    persona che ha cambiato finestra;
 *  · «Write permission denied» — il browser nega il permesso;
 *  · l'API non c'è affatto — contesti non sicuri, browser dentro le app.
 *
 * COSA FA QUI. Prova l'API moderna; se non riesce, prova la strada vecchia con
 * `execCommand`, che è deprecata ma funziona ancora dove l'altra si rifiuta. E
 * soprattutto **dice com'è andata**, così chi chiama non è costretto a mentire
 * all'utente né a segnalare come guasto qualcosa che non lo è.
 */

export type EsitoCopia =
  /** Il testo è negli appunti. */
  | "copiato"
  /** La pagina non aveva il fuoco: l'utente era altrove. Non è un difetto. */
  | "senza-fuoco"
  /** Il browser ha negato il permesso. */
  | "negato"
  /** Non c'è modo di copiare qui: va mostrato il testo da copiare a mano. */
  | "impossibile";

/** True se vale la pena segnalarlo: le altre cause non sono difetti nostri. */
export function copiaDaSegnalare(esito: EsitoCopia): boolean {
  return esito === "impossibile";
}

function senzaFuoco(errore: unknown): boolean {
  const messaggio =
    errore && typeof errore === "object" && "message" in errore
      ? String((errore as { message?: unknown }).message ?? "")
      : String(errore ?? "");
  return /not focused|document is not focused/i.test(messaggio);
}

function negato(errore: unknown): boolean {
  const nome =
    errore && typeof errore === "object" && "name" in errore
      ? String((errore as { name?: unknown }).name ?? "")
      : "";
  const messaggio =
    errore && typeof errore === "object" && "message" in errore
      ? String((errore as { message?: unknown }).message ?? "")
      : "";
  return nome === "NotAllowedError" || /permission denied|denied/i.test(messaggio);
}

/**
 * La strada vecchia: una casella di testo invisibile e `execCommand`.
 *
 * Deprecata, e la si tiene lo stesso: è sincrona, non chiede permessi e in
 * parecchi casi riesce dove l'API moderna si rifiuta. Se fallisce anche
 * questa, non c'è altro da provare.
 */
function copiaAllAnticaSync(testo: string): boolean {
  try {
    const casella = document.createElement("textarea");
    casella.value = testo;
    // Fuori dallo schermo ma NON `display:none`: un elemento nascosto così non
    // si può selezionare, e senza selezione `execCommand` non copia niente.
    casella.setAttribute("readonly", "");
    casella.style.position = "fixed";
    casella.style.top = "-1000px";
    casella.style.opacity = "0";
    document.body.appendChild(casella);
    casella.select();
    casella.setSelectionRange(0, testo.length);
    const riuscito = document.execCommand("copy");
    document.body.removeChild(casella);
    return riuscito;
  } catch {
    return false;
  }
}

/**
 * Copia `testo` negli appunti e racconta com'è andata.
 *
 * Chi chiama deve usare l'esito: mostrare «copiato» senza aver copiato è il
 * difetto che questa funzione esiste per impedire.
 */
export async function copiaTesto(testo: string): Promise<EsitoCopia> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(testo);
      return "copiato";
    } catch (errore) {
      // Prima di arrendersi si prova la strada vecchia: spesso riesce.
      if (copiaAllAnticaSync(testo)) return "copiato";
      if (senzaFuoco(errore)) return "senza-fuoco";
      if (negato(errore)) return "negato";
      return "impossibile";
    }
  }
  return copiaAllAnticaSync(testo) ? "copiato" : "impossibile";
}
