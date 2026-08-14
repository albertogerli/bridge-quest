/**
 * Quanto vale davvero un contratto: il valore atteso.
 *
 * PERCHÉ NON BASTA IL DOUBLE DUMMY SECCO
 * Sulla singola smazzata il double dummy dà il risultato esatto, e per dire
 * «hai fatto dieci prese» va benissimo. Ma per giudicare una DICHIARAZIONE è
 * il metro sbagliato: premia chi ha indovinato la disposizione avversaria e
 * punisce chi ha dichiarato bene e ha trovato le carte messe male.
 *
 * Un 3SA che passa nove volte su dieci e cade su questa è una buona
 * dichiarazione. Un 6♠ che regge solo perché la dama è terza in Ovest è una
 * cattiva dichiarazione fortunata. Col double dummy secco il primo prende zero
 * stelle e il secondo tre — cioè si insegna esattamente il contrario.
 *
 * COME SI CALCOLA
 * Si tengono ferme le due mani della linea che dichiara e si rimescolano le
 * ventisei carte avversarie molte volte, risolvendo ogni volta a carte
 * scoperte. Il valore atteso è la media dei punteggi. È il metodo di Cuebids,
 * e con le nostre mani generate è calcolabile una volta sola in fase di
 * generazione — dove il costo non lo paga nessun utente.
 *
 * COSA NON FA
 * Non corregge per il gioco umano: il double dummy trova impasse che al tavolo
 * nessuno troverebbe, quindi i contratti che dipendono da una scelta a
 * indovinare risultano un po' migliori di quanto siano. Cuebids applica una
 * correzione; qui non ancora, e va detto invece di far finta.
 */

import type { Card, Position, Suit } from "./bridge-engine";
import { calcDdsTable, strainOf } from "./dds-table";
import { scoreContract } from "./scoring";
import type { Strain } from "./minibridge";

/** Generatore riproducibile: stesso seme, stesse rimescolate. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mescola<T>(v: T[], rnd: () => number): T[] {
  const out = [...v];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const STRAIN_TUTTI: Strain[] = ["club", "diamond", "heart", "spade", "nt"];

export interface ValoreAtteso {
  /** Media dei punteggi sulle distribuzioni provate. */
  ev: number;
  /** Quante volte il contratto è stato mantenuto. */
  mantenuto: number;
  /** Su quante distribuzioni. */
  prove: number;
  /** Prese medie. */
  preseMedie: number;
}

/**
 * Valore atteso di un contratto, tenendo ferme le mani della linea che
 * dichiara e rimescolando le altre due.
 *
 * `prove` va scelto sapendo che ogni prova è una risoluzione double dummy: a
 * venti si ha già un'indicazione stabile, a cento si perde qualche secondo.
 */
export async function valoreAtteso(
  hands: Record<Position, Card[]>,
  contratto: { level: number; strain: Strain; declarer: Position },
  opzioni: { prove?: number; seed?: number; vulnerable?: boolean } = {}
): Promise<ValoreAtteso> {
  const seme: Suit | null = contratto.strain === "nt" ? null : contratto.strain;
  const tabelle = await simula(hands, contratto.declarer, opzioni);

  let totale = 0;
  let mantenuto = 0;
  let presePerTutte = 0;

  for (const table of tabelle) {
    const prese = table.tricks[strainOf(seme)][contratto.declarer];
    const punti = scoreContract({
      level: contratto.level,
      strain: contratto.strain,
      tricksMade: prese,
      vulnerable: opzioni.vulnerable,
    });
    totale += punti.score;
    presePerTutte += prese;
    if (punti.made) mantenuto++;
  }

  const prove = tabelle.length;
  return {
    ev: Math.round(totale / prove),
    mantenuto,
    prove,
    preseMedie: Math.round((presePerTutte / prove) * 10) / 10,
  };
}

/**
 * Le tabelle double dummy di N smazzate che condividono le mani della linea di
 * `dichiarante` e differiscono per come sono divise le ventisei carte avverse.
 *
 * Sta a parte perché una sola serie di simulazioni serve a TUTTI i contratti
 * giocabili da quella linea: una tabella dà già le prese di tutte e venti le
 * combinazioni seme/dichiarante. È la differenza fra pagare venti risoluzioni e
 * pagarne millequattrocento.
 */
async function simula(
  hands: Record<Position, Card[]>,
  dichiarante: Position,
  opzioni: { prove?: number; seed?: number }
) {
  const prove = opzioni.prove ?? 20;
  const rnd = mulberry32(opzioni.seed ?? 1);

  const nostri: Position[] =
    dichiarante === "north" || dichiarante === "south"
      ? ["north", "south"]
      : ["east", "west"];
  const loro: Position[] = (["north", "east", "south", "west"] as Position[]).filter(
    (p) => !nostri.includes(p)
  );

  // Le ventisei carte da rimescolare sono quelle delle due mani avversarie.
  const daMescolare = [...hands[loro[0]], ...hands[loro[1]]];
  const tabelle = [];
  for (let i = 0; i < prove; i++) {
    const mescolate = mescola(daMescolare, rnd);
    tabelle.push(
      await calcDdsTable({
        ...hands,
        [loro[0]]: mescolate.slice(0, 13),
        [loro[1]]: mescolate.slice(13, 26),
      })
    );
  }
  return tabelle;
}

export interface ContrattoAtteso {
  level: number;
  strain: Strain;
  declarer: Position;
  /** Punteggio medio sulle distribuzioni che non hanno partecipato alla scelta. */
  ev: number;
  /** Su quante di quelle è stato mantenuto. */
  mantenuto: number;
}

/**
 * Il contratto che rende di più, in media, alla linea che dichiara.
 *
 * NON È IL PAR, e la differenza conta. Il par tiene conto anche del sacrificio
 * avversario: su una smazzata dove Est-Ovest fanno 4♠ e Nord-Sud salvano in 5♥
 * contrato, il par è il sacrificio. Qui invece si risponde a una domanda più
 * ristretta e più utile a chi impara a dichiarare: «data la tua mano e quella
 * del tuo compagno, qual era il contratto migliore da scegliere?». Gli
 * avversari li si suppone silenziosi, perché la loro licita non è nelle mani
 * che stiamo giudicando.
 *
 * Le simulazioni si fanno una volta sola, in fase di generazione: al giocatore
 * questo costo non arriva mai.
 *
 * SI SCEGLIE SU METÀ DELLE PROVE E SI MISURA SULL'ALTRA METÀ.
 * Prendere il massimo fra settanta contratti valutati sulle stesse
 * distribuzioni e poi riportare quel massimo è il classico modo di gonfiare un
 * numero: vince quasi sempre il contratto che ha avuto fortuna, e il suo
 * punteggio medio è più alto del vero. Siccome quel numero diventa il
 * riferimento con cui si danno le stelle, gonfiarlo vuol dire togliere stelle
 * a tutti per un difetto di conto.
 * Il rimedio non costa una simulazione in più: la prima metà delle
 * distribuzioni sceglie il contratto, la seconda — che nella scelta non ha
 * avuto voce — ne misura il valore.
 */
export async function migliorContrattoAtteso(
  hands: Record<Position, Card[]>,
  lato: "ns" | "ew",
  opzioni: { prove?: number; seed?: number; vulnerable?: boolean } = {}
): Promise<ContrattoAtteso> {
  const dichiaranti: Position[] = lato === "ns" ? ["north", "south"] : ["east", "west"];
  const tabelle = await simula(hands, dichiaranti[0], opzioni);

  // Con una prova sola non c'è niente da dividere: si sceglie e si misura lì.
  const meta = tabelle.length > 1 ? Math.ceil(tabelle.length / 2) : 0;
  const perScegliere = meta > 0 ? tabelle.slice(0, meta) : tabelle;
  const perMisurare = meta > 0 ? tabelle.slice(meta) : tabelle;

  const misura = (
    campione: typeof tabelle,
    level: number,
    strain: Strain,
    declarer: Position
  ) => {
    const chiave = strainOf(strain === "nt" ? null : strain);
    let totale = 0;
    let mantenuto = 0;
    for (const table of campione) {
      const punti = scoreContract({
        level,
        strain,
        tricksMade: table.tricks[chiave][declarer],
        vulnerable: opzioni.vulnerable,
      });
      totale += punti.score;
      if (punti.made) mantenuto++;
    }
    return { ev: Math.round(totale / campione.length), mantenuto };
  };

  let scelto: { level: number; strain: Strain; declarer: Position; ev: number } | null = null;
  for (const declarer of dichiaranti) {
    for (const strain of STRAIN_TUTTI) {
      for (let level = 1; level <= 7; level++) {
        const { ev } = misura(perScegliere, level, strain, declarer);
        // Il confronto è stretto: a parità vince il contratto trovato prima,
        // cioè il più basso. È quello che al tavolo si raggiunge davvero, e
        // non premiamo chi tira a indovinare uno slam che rende quanto la
        // manche.
        if (!scelto || ev > scelto.ev) scelto = { level, strain, declarer, ev };
      }
    }
  }

  // `dichiaranti` non è vuoto, quindi il ciclo assegna sempre.
  const c = scelto as { level: number; strain: Strain; declarer: Position };
  const finale = misura(perMisurare, c.level, c.strain, c.declarer);
  return { level: c.level, strain: c.strain, declarer: c.declarer, ...finale };
}
