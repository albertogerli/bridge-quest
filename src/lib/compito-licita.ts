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

/**
 * Da quante stelle in su la mano è riuscita.
 *
 * Due stelle vogliono dire al massimo sei IMP lasciati rispetto al par
 * (`stelle-licita.ts`): un contratto giusto ma non il migliore. Sotto si è
 * mancata una manche o si è finiti in un contratto che non sta in piedi, e la
 * mano va ridichiarata — come una mano caduta va rigiocata.
 */
export const STELLE_PER_RIUSCITA = 2;

const GIRO: Position[] = ["north", "east", "south", "west"];

/**
 * Chi dà le carte.
 *
 * Prima quello scelto dall'insegnante; poi quello di un'eventuale licita
 * registrata; altrimenti il giro del torneo sul numero del board, che è anche
 * quello con cui il generatore assegna la zona.
 */
export function mazziereDellaMano(s: Pick<Smazzata, "mazziere" | "bidding" | "board">): Position {
  if (s.mazziere) return s.mazziere;
  if (s.bidding?.dealer) return s.bidding.dealer;
  return GIRO[(((s.board - 1) % 4) + 4) % 4];
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
    },
  };
}

/** Le stelle come si scrivono: «2½», «3», «½». */
export function stelleScritte(stelle: number): string {
  const intere = Math.floor(stelle);
  const mezza = stelle - intere >= 0.5;
  if (intere === 0 && mezza) return "½";
  return `${intere}${mezza ? "½" : ""}`;
}
