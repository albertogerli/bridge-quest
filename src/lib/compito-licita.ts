/**
 * Il compito di licita: le regole che non dipendono dalla schermata.
 *
 * PERCHÉ ESISTE. Fino al 22/10/2026 un compito di classe si giocava sempre:
 * le mani arrivavano con il contratto già deciso. Un'insegnante che aveva
 * appena spiegato i transfer ha generato otto mani per farle dichiarare, e gli
 * allievi le hanno solo giocate. Con `Assignment.licita` l'allievo le dichiara
 * da Sud, come in «Licita e vediamo», e il voto è il contratto raggiunto
 * rispetto al par della smazzata.
 *
 * I RISULTATI STANNO DOVE STANNO QUELLI DI GIOCO — una riga di `game_results`
 * per mano, `game_type = 'compito'` — così completamento, promemoria e
 * classifica di classe li contano senza saperne niente. Il prezzo è uno: la
 * classifica (`get_class_leaderboard`) conta come riuscita una riga con
 * `score >= 0`. Lo `score` di una mano dichiarata è quindi costruito apposta,
 * vedi `rigaCompitoLicita`.
 */

import type { Position } from "./bridge-engine";
import type { Smazzata } from "./catalog";
import { dichiarante as dichiaranteDellAsta } from "./asta";

/**
 * Da quante stelle in su la mano è riuscita.
 *
 * Due stelle vogliono dire al massimo sei IMP lasciati rispetto al par
 * (`stelle-licita.ts`): un contratto giusto ma non il migliore. Sotto si è
 * mancata una manche o si è finiti in un contratto che non sta in piedi, e la
 * mano va ridichiarata — come una mano caduta va rigiocata.
 */
export const STELLE_PER_RIUSCITA = 2;

/**
 * Chi dà le carte.
 *
 * Prima quello scelto dall'insegnante; poi quello di un'eventuale licita
 * registrata; altrimenti il dichiarante della mano.
 *
 * PERCHÉ IL DICHIARANTE E NON IL GIRO DEL BOARD. Le mani del generatore sono
 * costruite per una mano precisa — «Apertura di 1SA» dà 15-17 bilanciati a
 * Sud — e la prima versione faceva dare le carte a turno: sulla mano 1 dava
 * Nord, Est apriva 2♥ prima di Sud, e l'allievo l'1SA da allenare non lo
 * dichiarava mai (Allievi Mondello, 22/10/2026). Il dichiarante del par è la
 * mano per cui la smazzata è stata pensata.
 */
export function mazziereDellaMano(s: Pick<Smazzata, "mazziere" | "bidding" | "declarer">): Position {
  if (s.mazziere) return s.mazziere;
  if (s.bidding?.dealer) return s.bidding.dealer;
  return s.declarer;
}

export interface EsitoCompitoLicita {
  stelle: number;
  /** Il contratto raggiunto, leggibile («3SA»), o `null` col passo generale. */
  contratto: string | null;
  dichiarante: Position | null;
  /** Il punteggio del contratto raggiunto, visto da Nord-Sud. */
  punteggio: number;
  /** Il par della smazzata, visto da Nord-Sud. */
  par: number;
  bids: string[];
  /** Chi ha dato le carte: senza, le dichiarazioni non si rimettono al loro posto. */
  mazziere: Position;
}

/**
 * Lo `score` e i `details` della riga di `game_results`.
 *
 * `score` è il numero intero di stelle quando la mano è riuscita, e −1 quando
 * non lo è: la classifica di classe guarda solo il segno. Il voto esatto —
 * mezze stelle comprese — sta in `details.stelle`, e `details.made` lo dice
 * esplicitamente a chi legge i risultati.
 */
export function rigaCompitoLicita(esito: EsitoCompitoLicita): {
  score: number;
  details: Record<string, unknown>;
} {
  const made = esito.stelle >= STELLE_PER_RIUSCITA;
  return {
    score: made ? Math.round(esito.stelle) : -1,
    details: {
      licita: true,
      made,
      stelle: esito.stelle,
      contratto: esito.contratto,
      dichiarante: esito.dichiarante,
      punteggio: esito.punteggio,
      par: esito.par,
      bids: esito.bids,
      mazziere: esito.mazziere,
    },
  };
}

const POSTI: Position[] = ["north", "east", "south", "west"];

/**
 * Chi aveva dato le carte in una mano già registrata.
 *
 * Le righe scritte prima del 22/10/2026 pomeriggio non hanno `mazziere`, e il
 * mazziere di oggi (`mazziereDellaMano`) non è quello con cui furono giocate:
 * allora le carte giravano sul board. Lo si ricava dall'asta stessa — è il
 * solo mazziere per cui il dichiarante registrato è quello dell'asta. Con il
 * passo generale, o se l'asta non decide, resta `riserva`.
 */
export function mazziereRegistrato(
  details: { mazziere?: unknown; bids?: unknown; dichiarante?: unknown },
  riserva: Position,
): Position {
  if (typeof details.mazziere === "string" && POSTI.includes(details.mazziere as Position)) {
    return details.mazziere as Position;
  }
  const bids = Array.isArray(details.bids) ? (details.bids as string[]) : [];
  const chi = details.dichiarante;
  if (typeof chi !== "string") return riserva;
  const compatibili = POSTI.filter((d) => dichiaranteDellAsta(d, bids) === chi);
  if (compatibili.length === 1) return compatibili[0];
  return compatibili.includes(riserva) ? riserva : (compatibili[0] ?? riserva);
}

/** Le stelle come si scrivono: «2½», «3», «½». */
export function stelleScritte(stelle: number): string {
  const intere = Math.floor(stelle);
  const mezza = stelle - intere >= 0.5;
  if (intere === 0 && mezza) return "½";
  return `${intere}${mezza ? "½" : ""}`;
}

/**
 * Le dichiarazioni nella forma dei dati di gioco: «1♠» → «1S», «3SA» → «3NT».
 *
 * La licita del compito usa i simboli della schermata; il pannello dell'asta
 * della partita (`BiddingPanel`) legge la forma ASCII delle smazzate, e un
 * «1♠» lì non trova il seme.
 */
export function licitaInAscii(bids: readonly string[]): string[] {
  const semi: Record<string, string> = { "♠": "S", "♥": "H", "♦": "D", "♣": "C", SA: "NT" };
  return bids.map((b) => {
    const m = b.match(/^([1-7])(♠|♥|♦|♣|SA)$/);
    return m ? m[1] + semi[m[2]] : b;
  });
}
