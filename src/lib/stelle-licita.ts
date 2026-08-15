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
 * LA DISTANZA SI MISURA IN IMP, NON IN PUNTI.
 * Prima le soglie erano in punti secchi — 200 e 500 — e sono state cambiate
 * guardando un caso reale: su una mano da slam, 5♣ rendeva 609 e 3SA 668, e
 * prendevano una stella e due. Cinquantanove punti di differenza, una stella
 * di salto, perché cadevano ai due lati di una soglia fissa. Su una mano da
 * parziale, invece, quegli stessi 200 punti sono un abisso.
 *
 * Gli IMP sono la scala che il bridge usa da sempre proprio per questo: sono
 * concavi, quindi cento punti in basso contano più di cento punti in alto, ed
 * è esattamente il correttivo che serve. Le soglie qui sotto sono nostre
 * (Cuebids non pubblica le proprie), ma la scala non è più arbitraria.
 */

import { rawToIMP } from "./bridge-scoring";

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

/**
 * Soglie, in IMP persi rispetto al riferimento.
 *
 * Un IMP di scarto è rumore — 20 punti su una manche — e vale il pieno. Sopra
 * gli undici si è persa una manche intera o peggio.
 */
const TRE_STELLE = 1;
const DUE_STELLE = 6;
const UNA_STELLA = 11;

export function valutaLicita(
  punteggio: number,
  punteggioPar: number,
  metro: Metro = "esatto"
): EsitoLicita {
  const differenza = Math.max(0, punteggioPar - punteggio);
  const imp = rawToIMP(differenza);

  let stelle: number;
  let commento: string;

  if (imp <= TRE_STELLE) {
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
    if (imp <= DUE_STELLE) {
      stelle = 2;
      commento = `Ci sei quasi: ${differenza} punti ${rif}. Di solito è un parziale al posto di un altro, o una presa in meno.`;
    } else if (imp <= UNA_STELLA) {
      stelle = 1;
      commento = `${differenza} punti ${rif}: spesso vuol dire una manche mancata, o una dichiarata che non stava in piedi.`;
    } else {
      stelle = 0;
      commento = `${differenza} punti ${rif}. Vale la pena rivedere la mano: qualcosa si è perso per strada.`;
    }
  }

  return { stelle, punteggio, punteggioPar, differenza, commento };
}
