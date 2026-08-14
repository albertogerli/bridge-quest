/**
 * Sfida a coppie: due coppie, le stesse mani, avversari BEN.
 *
 * COME FUNZIONA IL CONFRONTO
 * Ogni coppia dichiara le stesse smazzate, ognuno vedendo solo la propria
 * mano. Il contratto raggiunto vale un punteggio; i due punteggi si
 * confrontano in IMP, come in una gara a squadre. In più ogni coppia riceve le
 * stelle rispetto al par: l'IMP dice chi ha vinto, le stelle dicono quanto
 * bene ha dichiarato — sono due domande diverse e servono entrambe.
 *
 * Si può vincere un incontro dichiarando male, se l'altra coppia ha
 * dichiarato peggio. Le stelle lo mostrano; senza, un 2-0 sembrerebbe una
 * bella prestazione anche quando sono state due brutte licite.
 *
 * PERCHÉ NON È DUPLICATO VERO
 * Nel bridge a squadre le due coppie siedono in linee opposte sulla stessa
 * smazzata. Qui giocano entrambe la stessa linea contro il computer: serve a
 * poter giocare in momenti diversi, che per i nostri iscritti è la differenza
 * fra usarlo e non usarlo. È scritto anche nella schermata: chi conosce il
 * bridge a squadre non deve credere che sia la stessa cosa.
 */

import { calculateBoardIMP, calculateMatchIMP } from "./bridge-scoring";
import { scoreContract } from "./scoring";
import type { Strain } from "./minibridge";
import { valutaLicita } from "./stelle-licita";
import type { Position, Suit } from "./bridge-engine";

/** Prese ottenibili per ogni denominazione, dal double dummy. */
export type TabellaPrese = Record<Strain, Record<Position, number>>;

export interface BoardSfida {
  /** Le prese che Nord-Sud fa in ogni denominazione. */
  tricks: TabellaPrese;
  /** Punteggio del par, dal punto di vista di Nord-Sud. */
  parScore: number;
  /** Contratto raggiunto dalle due coppie: `null` se passo generale. */
  contrattoA: string | null;
  contrattoB: string | null;
}

export interface EsitoBoard {
  punteggioA: number;
  punteggioB: number;
  imp: number;
  /** Positivo se ha guadagnato A. */
  aFavoreDi: "A" | "B" | "pari";
  stelleA: number;
  stelleB: number;
}

export interface EsitoSfida {
  boards: EsitoBoard[];
  impA: number;
  impB: number;
  stelleA: number;
  stelleB: number;
  /** Chi ha vinto l'incontro, per IMP. */
  vincitore: "A" | "B" | "pari";
}

const SIMBOLO_A_STRAIN: Record<string, Strain> = {
  "♣": "club", "♦": "diamond", "♥": "heart", "♠": "spade", SA: "nt",
};

/** Da "4♠" a livello e denominazione. `null` se non è un contratto. */
export function leggiContratto(c: string | null): { level: number; strain: Strain } | null {
  if (!c) return null;
  const level = Number(c[0]);
  const strain = SIMBOLO_A_STRAIN[c.slice(1)];
  if (!level || level < 1 || level > 7 || !strain) return null;
  return { level, strain };
}

/**
 * Punteggio di un contratto su questa smazzata, dal lato Nord-Sud.
 * Le prese sono quelle del dichiarante migliore fra i due della linea: a
 * carte scoperte i due compagni ottengono lo stesso risultato.
 */
export function punteggioDelContratto(
  contratto: string | null,
  tricks: TabellaPrese
): number {
  const letto = leggiContratto(contratto);
  // Passo generale: zero, che è già peggio di quasi tutto.
  if (!letto) return 0;
  const t = tricks[letto.strain];
  const prese = Math.max(t.north, t.south);
  return scoreContract({ level: letto.level, strain: letto.strain, tricksMade: prese }).score;
}

export function valutaBoard(b: BoardSfida): EsitoBoard {
  const punteggioA = punteggioDelContratto(b.contrattoA, b.tricks);
  const punteggioB = punteggioDelContratto(b.contrattoB, b.tricks);
  const { challengerIMP, opponentIMP } = calculateBoardIMP({
    challengerScore: punteggioA,
    opponentScore: punteggioB,
  });
  return {
    punteggioA,
    punteggioB,
    imp: challengerIMP || opponentIMP,
    aFavoreDi: challengerIMP > 0 ? "A" : opponentIMP > 0 ? "B" : "pari",
    stelleA: valutaLicita(punteggioA, b.parScore).stelle,
    stelleB: valutaLicita(punteggioB, b.parScore).stelle,
  };
}

export function valutaSfida(boards: readonly BoardSfida[]): EsitoSfida {
  const esiti = boards.map(valutaBoard);
  const match = calculateMatchIMP(
    boards.map((b) => ({
      challengerScore: punteggioDelContratto(b.contrattoA, b.tricks),
      opponentScore: punteggioDelContratto(b.contrattoB, b.tricks),
    }))
  );
  const impA = match.challengerTotal;
  const impB = match.opponentTotal;
  return {
    boards: esiti,
    impA,
    impB,
    stelleA: esiti.reduce((s, e) => s + e.stelleA, 0),
    stelleB: esiti.reduce((s, e) => s + e.stelleB, 0),
    vincitore: impA > impB ? "A" : impB > impA ? "B" : "pari",
  };
}

/** Il seme della smazzata come lo vede la tabella, per il conto delle prese. */
export function strainDiSeme(s: Suit | null): Strain {
  return s ?? "nt";
}
