import type { Card, Position, Suit } from "./bridge-engine";

interface Trick {
  plays: { position: Position; card: Card }[];
  leader: Position;
  winner?: Position;
}

interface GameResult {
  tricksMade: number;
  tricksNeeded: number;
  result: number;
}

/**
 * Save game data for the AI analysis page (/gioca/analisi).
 * Call this when a game finishes.
 */
export function saveGameForAnalysis(
  hands: Record<Position, Card[]>,
  tricks: Trick[],
  contract: { level: number; suit: Suit | string | null; declarer: string },
  result: GameResult,
  /**
   * Come riconoscere «la stessa mano» fra i risultati degli altri: il tipo di
   * gioco e la chiave che quel gioco salva (vedi `risultati_stessa_mano`).
   * Assente per le mani che nessun altro ha giocato uguali.
   */
  confronto?: { tipo: string; chiave: string },
  /** I posti dell'allievo; senza, dichiarante e morto. In difesa va passato:
   *  la pagina di analisi giudicava ogni mano come se l'allievo dichiarasse. */
  giocatori?: Position[],
) {
  try {
    const data = {
      hands,
      tricks: tricks.map(t => ({
        cards: t.plays.map(p => ({ player: p.position, card: p.card })),
        winner: t.winner || t.leader,
      })),
      contract: {
        level: contract.level,
        suit: contract.suit || "NT",
        declarer: contract.declarer,
      },
      tricksMade: result.tricksMade,
      tricksNeeded: result.tricksNeeded,
      result: result.result,
      confronto: confronto ?? null,
      giocatori: giocatori ?? null,
    };
    localStorage.setItem("bq_last_game_for_analysis", JSON.stringify(data));
  } catch {}
}
