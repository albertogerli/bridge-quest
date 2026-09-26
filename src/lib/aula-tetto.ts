// Modulo senza dipendenze apposta: lo importa anche `api/aula/entra/route.ts`,
// che gira sul server, e `aula.ts` tira dentro il client del browser.
/**
 * Il tetto degli ospiti è pieno?
 *
 * Sta qui, e non dentro la rotta, perché la parte che si sbaglia non è la
 * disuguaglianza: è COSA si conta. Contare i membri attivi voleva dire che una
 * classe con quaranta allievi veri era «al completo» prima che entrasse il
 * primo ospite. La rotta passa il numero degli ospiti — vivi, non scaduti — e
 * questa funzione esiste per poter scrivere quella distinzione in un test.
 *
 * `max` a zero significa aula chiusa, non aula senza limite: un invito con
 * tetto zero non fa entrare nessuno, che è la lettura letterale del numero.
 */
export function aulaAlCompleto(ospitiInAula: number, max: number): boolean {
  return ospitiInAula >= max;
}
