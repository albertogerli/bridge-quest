/**
 * Messaggi WhatsApp precompilati.
 *
 * PERCHÉ WHATSAPP E NON UNA NOTIFICA. Gli insegnanti la classe la tengono già
 * lì: il gruppo esiste, gli allievi lo leggono, e nessuno deve installare o
 * autorizzare niente. Un link `wa.me` non è un'integrazione — non c'è un
 * servizio da chiamare, una chiave da custodire o un permesso da chiedere: è
 * un indirizzo che apre WhatsApp con il testo già scritto. Chi preme decide se
 * mandarlo e a chi.
 *
 * NON SI MANDA A UN NUMERO. `wa.me/` senza numero apre il selettore dei
 * contatti: l'insegnante sceglie il gruppo. Mettere il numero vorrebbe dire
 * conservare i numeri degli allievi, che è un'altra cosa e ha un altro costo.
 */

const SITO = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");

/** L'indirizzo che apre WhatsApp con questo testo già pronto. */
export function linkWhatsApp(testo: string): string {
  return `https://wa.me/?text=${encodeURIComponent(testo)}`;
}

/**
 * L'invito a entrare in classe.
 *
 * Il codice sta nel messaggio E nel collegamento: chi legge da telefono tocca,
 * chi legge da computer copia. Il codice a mano serve anche perché il
 * collegamento, nei gruppi, a volte non è cliccabile.
 */
export function invitoClasse(nomeClasse: string, codice: string): string {
  return [
    `Ciao! Ci vediamo su BridgeLab per il corso «${nomeClasse}».`,
    ``,
    `Iscriviti con il codice ${codice}:`,
    `${SITO}/classi`,
    ``,
    `Se non hai ancora un account lo crei lì in un minuto.`,
  ].join("\n");
}

/**
 * «Vi ho messo il compito».
 *
 * Il collegamento porta dritto al compito. Chi non è collegato passa dal login
 * e ci torna: la destinazione sopravvive, ma solo da quando il cancello lato
 * client ha smesso di buttarla via (vedi `layout-shell.tsx`).
 */
export function compitoAssegnatoWhatsApp(
  titolo: string,
  classId: string,
  assignmentId: string,
  mani?: number,
  /** La stanza di videoconferenza, se il corso ne ha una. */
  linkVideo?: string | null,
): string {
  const quante = mani && mani > 0 ? ` (${mani} ${mani === 1 ? "mano" : "mani"})` : "";
  const righe = [
    `Nuovo compito: «${titolo}»${quante}.`,
    ``,
    `${SITO}/classi/${classId}/compito/${assignmentId}`,
  ];
  // Il link della videoconferenza va QUI e non in un messaggio a parte: chi lo
  // incolla a mano in chat prima di ogni lezione lo fa perché non c'è, e due
  // messaggi separati nel gruppo diventano due cose da cercare.
  if (linkVideo) righe.push(``, `Ci vediamo qui: ${linkVideo}`);
  righe.push(``, `Le soluzioni si aprono dopo che avete giocato.`);
  return righe.join("\n");
}

/** Il promemoria a ridosso della scadenza. */
export function promemoriaScadenzaWhatsApp(
  titolo: string,
  classId: string,
  assignmentId: string,
  giorni: number,
): string {
  const quando =
    giorni <= 0 ? "scade oggi" : giorni === 1 ? "scade domani" : `scade fra ${giorni} giorni`;
  return [
    `Promemoria: «${titolo}» ${quando}.`,
    ``,
    `${SITO}/classi/${classId}/compito/${assignmentId}`,
  ].join("\n");
}
