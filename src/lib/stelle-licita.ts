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
 * DUE METRI, E VANNO TENUTI DISTINTI
 * `esatto` confronta col par double dummy della smazzata così com'è. È esatto,
 * ma premia chi ha indovinato: un 3SA che passa nove volte su dieci e cade su
 * questa prende zero stelle.
 * `atteso` confronta col miglior contratto per valore atteso, ottenuto
 * rimescolando molte volte le carte avversarie (`valore-atteso.ts`). È il metro
 * di Cuebids, ed è quello giusto per giudicare una DICHIARAZIONE: misura la
 * scelta, non la fortuna. Costa simulazioni, quindi si usa dove il valore
 * atteso è già stato calcolato in fase di generazione — le mani in
 * `mani_generate`.
 *
 * LE SOGLIE SONO NOSTRE. Cuebids non pubblica le proprie («dipende da molti
 * fattori»). Queste sono scelte guardando cosa conta a lezione: perdere una
 * manche è un errore grosso, un parziale storto molto meno. Sono le stesse per
 * i due metri: la distanza si misura in punti di score in entrambi i casi.
 */

/** Con che cosa si confronta il contratto raggiunto. */
export type Metro = "esatto" | "atteso";

export interface EsitoLicita {
  /** Da 0 a 3. */
  stelle: number;
  /** Punteggio del contratto raggiunto, dal punto di vista di chi dichiara. */
  punteggio: number;
  /** Punteggio di riferimento: il par, o il miglior valore atteso. */
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

export function valutaLicita(
  punteggio: number,
  punteggioPar: number,
  metro: Metro = "esatto"
): EsitoLicita {
  const differenza = Math.max(0, punteggioPar - punteggio);

  let stelle: number;
  let commento: string;

  if (differenza <= TRE_STELLE) {
    stelle = 3;
    if (metro === "atteso") {
      commento =
        punteggio > punteggioPar
          ? "Meglio del contratto migliore: con queste carte hai preso di più di quanto ci si potesse aspettare."
          : "La scelta migliore: in media nessun altro contratto rendeva di più.";
    } else {
      commento =
        punteggio > punteggioPar
          ? "Meglio del par: hai preso più di quanto la smazzata prometteva."
          : "Contratto par: su questa smazzata non si poteva fare meglio.";
    }
  } else {
    const rif = metro === "atteso" ? "sotto il contratto migliore" : "sotto il par";
    if (differenza <= DUE_STELLE) {
      stelle = 2;
      commento = `Ci sei quasi: ${differenza} punti ${rif}. Di solito è un parziale al posto di un altro, o una presa in meno.`;
    } else if (differenza <= UNA_STELLA) {
      stelle = 1;
      commento = `${differenza} punti ${rif}: spesso vuol dire una manche mancata, o una dichiarata che non stava in piedi.`;
    } else {
      stelle = 0;
      commento = `${differenza} punti ${rif}. Vale la pena rivedere la mano: qualcosa si è perso per strada.`;
    }
  }

  return { stelle, punteggio, punteggioPar, differenza, commento };
}
