/**
 * Quanto vale la licita che hai fatto.
 *
 * L'IDEA, PRESA DA CUEBIDS
 * Non si giudica una dichiarazione dicendo «giusta» o «sbagliata»: si confronta
 * il punteggio del contratto raggiunto con quello del PAR, cioè del miglior
 * contratto possibile su quella smazzata. Tre stelle significa esserci
 * arrivati; meno stelle misurano quanto si è lasciato per strada.
 *
 * È un metro onesto perché non dipende da opinioni sul sistema: un 4♥ che vale
 * 620 quando il par ne vale 620 è perfetto, comunque tu ci sia arrivato.
 *
 * DIFFERENZA DA CUEBIDS
 * Loro non conoscono le mani avversarie e simulano mille distribuzioni. Qui la
 * smazzata è fissa e le carte le sappiamo tutte: il double dummy dà il
 * risultato esatto, non una media. Più preciso per la singola mano, e senza
 * l'incertezza che loro devono stimare.
 *
 * LE SOGLIE SONO NOSTRE. Cuebids non pubblica le proprie («dipende da molti
 * fattori»). Queste sono scelte guardando cosa conta a lezione: perdere una
 * manche è un errore grosso, un parziale storto molto meno.
 */

export interface EsitoLicita {
  /** Da 0 a 3. */
  stelle: number;
  /** Punteggio del contratto raggiunto, dal punto di vista di chi dichiara. */
  punteggio: number;
  /** Punteggio del par. */
  punteggioPar: number;
  /** Quanto si è lasciato per strada (0 se si è raggiunto o superato il par). */
  differenza: number;
  /** Una frase che spiega il voto. */
  commento: string;
}

/** Soglie, in punti persi rispetto al par. */
const TRE_STELLE = 0;
const DUE_STELLE = 200;
const UNA_STELLA = 500;

export function valutaLicita(punteggio: number, punteggioPar: number): EsitoLicita {
  const differenza = Math.max(0, punteggioPar - punteggio);

  let stelle: number;
  let commento: string;

  if (differenza <= TRE_STELLE) {
    stelle = 3;
    commento =
      punteggio > punteggioPar
        ? "Meglio del par: hai preso più di quanto la smazzata prometteva."
        : "Contratto par: su questa smazzata non si poteva fare meglio.";
  } else if (differenza <= DUE_STELLE) {
    stelle = 2;
    commento = `Ci sei quasi: ${differenza} punti sotto il par. Di solito è un parziale al posto di un altro, o una presa in meno.`;
  } else if (differenza <= UNA_STELLA) {
    stelle = 1;
    commento = `${differenza} punti sotto il par: spesso vuol dire una manche mancata, o una dichiarata che non stava in piedi.`;
  } else {
    stelle = 0;
    commento = `${differenza} punti sotto il par. Vale la pena rivedere la mano: qualcosa si è perso per strada.`;
  }

  return { stelle, punteggio, punteggioPar, differenza, commento };
}
