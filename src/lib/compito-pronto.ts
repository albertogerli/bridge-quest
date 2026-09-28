/**
 * Il compito si può creare?
 *
 * Una funzione sola per il pulsante e per il gestore, perché il 28/09/2026
 * erano due condizioni diverse e non dicevano la stessa cosa: il gestore
 * accettava un compito di soli ESERCIZI, il pulsante si accendeva solo con
 * almeno una MANO. Un compito di soli esercizi era impossibile da creare, e
 * il pulsante spento non spiegava perché.
 */
export function compitoPronto(stato: {
  titolo: string;
  mani: number;
  esercizi: number;
}): { pronto: boolean; manca: "contenuto" | "titolo" | null } {
  if (stato.mani === 0 && stato.esercizi === 0) return { pronto: false, manca: "contenuto" };
  if (!stato.titolo.trim()) return { pronto: false, manca: "titolo" };
  return { pronto: true, manca: null };
}
