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

import type { VisibilitaSoluzioni } from "@/lib/instructors";

const SITO = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");

/** Che cosa dire delle soluzioni, senza promettere quello che non succederà. */
function frasesSoluzioni(soluzioni?: VisibilitaSoluzioni): string {
  switch (soluzioni) {
    case "subito":
      return "Le soluzioni sono già disponibili.";
    case "dopo-la-scadenza":
      return "Le soluzioni si aprono dopo la scadenza.";
    case "quando-l-insegnante-decide":
      return "Le soluzioni le apro io dopo che le abbiamo viste insieme.";
    default:
      return "Le soluzioni si aprono dopo che avete giocato.";
  }
}

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
  /**
   * Quando si aprono le soluzioni. SERVE, perché la riga finale prometteva
   * «si aprono dopo che avete giocato» a prescindere — e da quando esiste
   * `quando-l-insegnante-decide` quella frase può essere falsa. Un allievo che
   * gioca, non vede le soluzioni e ha in mano un messaggio che gliele
   * prometteva, pensa che il portale sia rotto.
   */
  soluzioni?: VisibilitaSoluzioni,
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
  righe.push(``, frasesSoluzioni(soluzioni));
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

/**
 * I materiali di una lezione: videolezione, dispensa, esercizi.
 *
 * PERCHÉ ESISTE. È il gesto che Trevissoi fa ogni settimana, lezione per
 * lezione, e oggi lo fa a mano tramite lo staff: tre link copiati e incollati
 * nel gruppo. Qui escono già scritti, con i link giusti e nell'ordine in cui si
 * usano — prima si guarda, poi si legge, poi si esercita.
 *
 * LA DISPENSA PORTA LA CLASSE nell'indirizzo. Senza, chi tocca il link atterra
 * su «le dispense del sito» invece che sui materiali del suo corso, e tutto il
 * lavoro sul percorso guidato viene scavalcato proprio dal canale che
 * l'insegnante usa di più.
 *
 * SI PUÒ RISCRIVERE TUTTO. Quello che esce è testo, e basta: niente qui dentro
 * lo rilegge, lo cerca o si aspetta di ritrovarlo. Un insegnante che aggiunge
 * una riga di suo pugno — e molti lo faranno, ed è giusto — non rompe niente,
 * perché non c'è niente da rompere. I link sono assoluti e completi, quindi
 * funzionano anche se il testo intorno cambia o sparisce.
 */
export function materialiLezioneWhatsApp(opzioni: {
  titoloLezione: string;
  classId: string;
  /** Il compito della lezione, se è stato assegnato. */
  assignmentId?: string | null;
  /** Per aprire le dispense sul corso giusto. */
  corsoId?: string | null;
  linkVideo?: string | null;
}): string {
  const { titoloLezione, classId, assignmentId, corsoId, linkVideo } = opzioni;
  const righe = [`${titoloLezione}`, ``];

  if (linkVideo) righe.push(`La videolezione: ${linkVideo}`);

  const corso = corsoId ? `&corso=${corsoId}` : "";
  righe.push(`La dispensa: ${SITO}/dispense?classe=${classId}${corso}`);

  if (assignmentId) {
    righe.push(`Gli esercizi: ${SITO}/classi/${classId}/compito/${assignmentId}`);
  }

  return righe.join("\n");
}
