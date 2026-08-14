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
  opzioni: { prove?: number; seed?: number } = {}
): Promise<ValoreAtteso> {
  const prove = opzioni.prove ?? 20;
  const rnd = mulberry32(opzioni.seed ?? 1);

  const nostri: Position[] =
    contratto.declarer === "north" || contratto.declarer === "south"
      ? ["north", "south"]
      : ["east", "west"];
  const loro: Position[] = (["north", "east", "south", "west"] as Position[]).filter(
    (p) => !nostri.includes(p)
  );

  // Le ventisei carte da rimescolare sono quelle delle due mani avversarie.
  const daMescolare = [...hands[loro[0]], ...hands[loro[1]]];
  const seme: Suit | null = contratto.strain === "nt" ? null : contratto.strain;

  let totale = 0;
  let mantenuto = 0;
  let presePerTutte = 0;

  for (let i = 0; i < prove; i++) {
    const mescolate = mescola(daMescolare, rnd);
    const variante: Record<Position, Card[]> = {
      ...hands,
      [loro[0]]: mescolate.slice(0, 13),
      [loro[1]]: mescolate.slice(13, 26),
    };
    const table = await calcDdsTable(variante);
    const prese = table.tricks[strainOf(seme)][contratto.declarer];
    const punti = scoreContract({
      level: contratto.level,
      strain: contratto.strain,
      tricksMade: prese,
    });
    totale += punti.score;
    presePerTutte += prese;
    if (punti.made) mantenuto++;
  }

  return {
    ev: Math.round(totale / prove),
    mantenuto,
    prove,
    preseMedie: Math.round((presePerTutte / prove) * 10) / 10,
  };
}
