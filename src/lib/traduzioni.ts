/**
 * Le traduzioni: la chiave è la frase italiana.
 *
 * `t("Tocca a te")` restituisce «Tocca a te» in italiano e «Your turn» in
 * inglese. Non `t("gioco.turno.tuo")`.
 *
 * PERCHÉ LA FRASE E NON UN CODICE. Con le chiavi simboliche il codice smette
 * di dire quello che mostra: si legge `t("riepilogo.stelle.commento.quasi")` e
 * per sapere cosa vede l'utente si apre un altro file. In un progetto dove i
 * testi parlano al giocatore — «Ci sei quasi: 225 punti sotto il contratto
 * migliore» — quella distanza si paga a ogni lettura, e in una revisione si
 * paga il doppio.
 *
 * Ne seguono tre conseguenze, tutte volute:
 *
 *   1. **L'italiano non ha dizionario.** È il codice. Non c'è un `it.json` da
 *      tenere allineato, e quindi non c'è modo che diverga.
 *   2. **Il ripiego è la lingua di casa.** Chiave inglese assente: si mostra
 *      l'italiano. Una frase non ancora tradotta si vede in italiano invece di
 *      lasciare un buco o un codice a schermo, il che permette di tradurre
 *      un'area alla volta con il sito vivo.
 *   3. **Cambiare il testo italiano invalida la traduzione**, perché cambia la
 *      chiave. Sembra un difetto ed è la proprietà più utile che abbiamo:
 *      quella frase torna in italiano e si vede: senza, resterebbe l'inglese
 *      vecchio, che è il difetto che nessuno scopre.
 *
 * IL SEGNAPOSTO è `{nome}`: `t("Mancano {n} punti", { n: 12 })`. Si è scelto
 * questo e non l'interpolazione del linguaggio perché la frase deve restare
 * una stringa intera — spezzarla in tre pezzi attorno a una variabile rende
 * impossibile tradurla in una lingua che mette le parole in un altro ordine.
 */

import type { Lingua } from "./lingua";

/** Il dizionario di una lingua: frase italiana → frase tradotta. */
export type Dizionario = Record<string, string>;

/**
 * Sostituisce i segnaposti `{nome}` con i valori.
 *
 * Un segnaposto senza valore resta com'è, a vista: `{n}` a schermo è brutto ma
 * si nota subito, mentre una stringa vuota passa inosservata e diventa «Mancano
 *  punti» — una frase che sembra giusta e non lo è.
 */
export function riempi(
  frase: string,
  valori?: Record<string, string | number>
): string {
  if (!valori) return frase;
  return frase.replace(/\{(\w+)\}/g, (intero, nome) =>
    nome in valori ? String(valori[nome]) : intero
  );
}

/**
 * Traduce, con ripiego sull'italiano.
 *
 * Funzione pura: prende il dizionario invece di andarselo a cercare, così si
 * prova senza montare niente.
 */
export function traduci(
  frase: string,
  dizionario: Dizionario | null,
  valori?: Record<string, string | number>
): string {
  const tradotta = dizionario?.[frase];
  return riempi(tradotta && tradotta.trim() ? tradotta : frase, valori);
}

/**
 * Carica il dizionario di una lingua, o `null` se non serve.
 *
 * L'italiano non ha dizionario per definizione. L'inglese si carica a parte —
 * `import()` dinamico — così le sue migliaia di frasi non pesano sul primo
 * caricamento di chi legge in italiano, che è quasi tutti.
 */
export async function caricaDizionario(lingua: Lingua): Promise<Dizionario | null> {
  if (lingua === "it") return null;
  try {
    const modulo = await import(`../traduzioni/${lingua}.json`);
    return (modulo.default ?? modulo) as Dizionario;
  } catch {
    // Manca il file: si continua in italiano. È lo stato normale finché una
    // lingua non è stata tradotta, e non è un errore da segnalare a Sentry.
    return null;
  }
}
