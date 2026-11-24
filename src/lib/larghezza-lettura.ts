/**
 * Le pagine «da leggere» (elenchi, profilo, classe) hanno una larghezza
 * massima: senza la colonna destra, su uno schermo largo le loro righe
 * arrivavano a 1600 pixel, con il titolo a sinistra e la freccia lontanissima.
 * Il tavolo di gioco e le lezioni no: lì lo spazio serve alle carte.
 * `esatte` vale solo per l'indirizzo preciso, `sotto` anche per le sottopagine.
 */
const LARGHEZZA_LETTURA = {
  esatte: ["/", "/gioca", "/lezioni"],
  sotto: ["/profilo", "/classifica", "/amici", "/forum", "/negozio", "/obiettivi", "/collezione", "/classi", "/esercizi", "/dispense", "/ripasso", "/impostazioni", "/trova-circolo", "/scopri", "/glossario", "/corsi"],
};
export function haLarghezzaLettura(percorso: string): boolean {
  return LARGHEZZA_LETTURA.esatte.includes(percorso) || LARGHEZZA_LETTURA.sotto.some((r) => percorso === r || percorso.startsWith(`${r}/`));
}

