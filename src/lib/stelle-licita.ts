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
 * Le soglie, in IMP persi rispetto al riferimento, e il voto che danno.
 *
 * MEZZE STELLE perché quattro gradini sono pochi per una scala che deve
 * distinguere «hai sbagliato colore» da «hai mancato la manche»: con soli
 * quattro livelli metà delle mani finiva sullo stesso voto, e il voto smetteva
 * di dire qualcosa. Sette gradini bastano — di più diventerebbe un numero con
 * la virgola travestito da stelle.
 *
 * Un IMP di scarto è rumore (venti punti su una manche) e vale il pieno.
 * Oltre i tredici si è persa una manche intera o peggio, e lì non c'è mezza
 * stella che tenga.
 */
const SCALA: { entro: number; stelle: number }[] = [
  { entro: 1, stelle: 3 },
  { entro: 3, stelle: 2.5 },
  { entro: 6, stelle: 2 },
  { entro: 8, stelle: 1.5 },
  { entro: 11, stelle: 1 },
  { entro: 13, stelle: 0.5 },
];

export function valutaLicita(
  punteggio: number,
  punteggioPar: number,
  metro: Metro = "esatto"
): EsitoLicita {
  const differenza = Math.max(0, punteggioPar - punteggio);
  const imp = rawToIMP(differenza);
  const stelle = SCALA.find((s) => imp <= s.entro)?.stelle ?? 0;

  let commento: string;

  if (stelle === 3) {
    /**
     * TRE STELLE NON VUOL DIRE «PERFETTO».
     *
     * La scala dà tre stelle fino a un IMP di scarto, cioè fino a una
     * quarantina di punti: è giusto, al tavolo quella differenza non si vede.
     * Ma il commento diceva «in media nessun altro contratto rendeva di più»
     * ANCHE con lo scarto, e quella frase è vera solo a scarto zero — con la
     * tabella dei contratti stampata subito sotto, che mostrava il contratto
     * migliore con un punteggio più alto di quello ottenuto. Visto in
     * produzione il 19/08/2026: verdetto «la scelta migliore» sopra una
     * tabella in cui 1♦ di Nord rendeva 101 e il contratto raggiunto 67.
     *
     * Una lode che il resto della schermata smentisce non è generosità: è il
     * modo più rapido di far smettere di credere ai voti.
     */
    const perfetto = punteggio >= punteggioPar;
    if (metro === "atteso") {
      commento = perfetto
        ? punteggio > punteggioPar
          ? "Meglio del contratto migliore: con queste carte hai preso di più di quanto ci si potesse aspettare."
          : "La scelta migliore: in media nessun altro contratto rendeva di più."
        : `Ottima scelta: solo ${differenza} punti sotto il contratto migliore, una differenza che al tavolo non si vede.`;
    } else {
      commento = perfetto
        ? punteggio > punteggioPar
          ? "Meglio del par: hai preso più di quanto la smazzata prometteva."
          : "Contratto par: su questa smazzata non si poteva fare meglio."
        : `Ottima scelta: solo ${differenza} punti sotto il par, una differenza che al tavolo non si vede.`;
    }
  } else {
    const rif = metro === "atteso" ? "sotto il contratto migliore" : "sotto il par";
    /**
     * IL COMMENTO SEGUE I PUNTI, NON LE STELLE.
     *
     * Prima dipendeva dal voto, e siccome due stelle coprono tutto ciò che sta
     * entro sei IMP, lo stesso «Ci sei quasi: di solito è un parziale al posto
     * di un altro» usciva sia per venti punti sia per duecentoventicinque —
     * dove non è un parziale al posto di un altro, è una manche mancata. Un
     * commento che dice una cosa falsa è peggio di nessun commento: l'allievo
     * impara la spiegazione sbagliata e la porta al tavolo.
     *
     * Le soglie sono quelle che un giocatore riconosce: sotto il centinaio si
     * cambia parziale, intorno ai trecento si perde la manche, oltre i
     * cinquecento si è persa una manche in zona o uno slam.
     */
    if (differenza < 100) {
      commento = `Ci sei quasi: ${differenza} punti ${rif} — un parziale al posto di un altro, o una presa in meno.`;
    } else if (differenza < 300) {
      commento = `${differenza} punti ${rif}: è la distanza fra un parziale e la manche. Con queste carte la manche si poteva cercare.`;
    } else if (differenza < 600) {
      commento = `${differenza} punti ${rif}: una manche intera. O non è stata dichiarata, o il contratto scelto non stava in piedi.`;
    } else {
      commento = `${differenza} punti ${rif}: qui è andato perso uno slam, oppure il contratto è caduto pesante. Vale la pena rivedere la mano.`;
    }
  }

  return { stelle, punteggio, punteggioPar, differenza, commento };
}
