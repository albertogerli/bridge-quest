/**
 * FIGB Bridge LAB - Play error classifier
 *
 * Inspects the trick-by-trick record of a finished hand and detects classic
 * beginner mistakes made by the human player. Each category maps to the
 * lesson/module that teaches the underlying concept, so errors can feed the
 * spaced-repetition review queue (/ripasso).
 *
 * Rule-based and explainable by design — no solver needed for the per-trick
 * detections; the overall "below optimal" check uses the DD analysis already
 * computed at the end of the hand.
 */

import {
  type Card,
  type Position,
  type Suit,
  type Trick,
  type TrickPlay,
  rankValue,
  partnerOf,
  cardToString,
} from "./bridge-engine";

export type PlayErrorCategory =
  | "missed-ruff"
  | "discarded-winner"
  | "wasted-honor"
  | "below-optimal";

export interface PlayError {
  category: PlayErrorCategory;
  /** Lesson/module that teaches the concept (links into /lezioni and /ripasso) */
  lessonId: number;
  moduleId: string;
  /** Human-readable description (Italian), shown as the review "question" */
  description: string;
  trickNumber?: number;
}

/** Italian display labels, shared by the student recap and the instructor portal */
export const PLAY_ERROR_LABELS: Record<PlayErrorCategory, string> = {
  "missed-ruff": "Tagli mancati",
  "discarded-winner": "Vincenti scartate",
  "wasted-honor": "Onori sprecati",
  "below-optimal": "Sotto il piano ottimale",
};

/** Map each error category to the lesson module that teaches the concept */
const CATEGORY_LESSON: Record<Exclude<PlayErrorCategory, "below-optimal">, { lessonId: number; moduleId: string }> = {
  "missed-ruff": { lessonId: 5, moduleId: "5-3" }, // Il potere di taglio e di allungamento
  "discarded-winner": { lessonId: 1, moduleId: "1-1" }, // Carte vincenti
  "wasted-honor": { lessonId: 4, moduleId: "4-2" }, // Il rientro e le comunicazioni
};

const HONOR_RANKS = new Set(["A", "K", "Q"]);

function isSameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

function winningPlaySoFar(plays: TrickPlay[], trumpSuit: Suit | null): TrickPlay {
  const leadSuit = plays[0].card.suit;
  let winning = plays[0];
  for (let i = 1; i < plays.length; i++) {
    const play = plays[i];
    const winIsTrump = trumpSuit !== null && winning.card.suit === trumpSuit;
    const playIsTrump = trumpSuit !== null && play.card.suit === trumpSuit;
    if (playIsTrump && !winIsTrump) {
      winning = play;
    } else if (playIsTrump === winIsTrump && play.card.suit === winning.card.suit) {
      if (rankValue(play.card.rank) > rankValue(winning.card.rank)) winning = play;
    } else if (!winIsTrump && !playIsTrump && play.card.suit === leadSuit && winning.card.suit !== leadSuit) {
      winning = play;
    }
  }
  return winning;
}

export interface ClassifyOptions {
  /** Completed tricks of the finished hand (with winners) */
  tricks: Trick[];
  /** The 13-card hands as dealt */
  originalHands: Record<Position, Card[]>;
  trumpSuit: Suit | null;
  /** Seats the human controlled (declarer+dummy, or a defender) */
  playerPositions: Position[];
  declarer: Position;
  /** Double-dummy optimal tricks for declarer (when known and exact) */
  ddTricks?: number | null;
  /** Actual tricks made by declarer's side */
  tricksMade?: number;
}

export function classifyPlayErrors(opts: ClassifyOptions): PlayError[] {
  const { tricks, originalHands, trumpSuit, playerPositions, declarer } = opts;
  const errors: PlayError[] = [];

  // Live copies of the hands, consumed as we replay the tricks
  const hands: Record<Position, Card[]> = {
    north: [...originalHands.north],
    south: [...originalHands.south],
    east: [...originalHands.east],
    west: [...originalHands.west],
  };

  // All cards already played (for "master card" detection)
  const played = new Set<string>();
  const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

  /** Is this card the highest of its suit still in play? */
  const isMaster = (card: Card): boolean => {
    for (let v = rankValue(card.rank) + 1; v <= 14; v++) {
      const rank = (["2","3","4","5","6","7","8","9","10","J","Q","K","A"] as const)[v - 2];
      if (!played.has(`${card.suit}-${rank}`)) return false;
    }
    return true;
  };

  const isHuman = (pos: Position) => playerPositions.includes(pos);

  for (let t = 0; t < tricks.length; t++) {
    const trick = tricks[t];
    const trickNumber = t + 1;
    const leadSuit = trick.plays[0]?.card.suit;
    if (!leadSuit) continue;

    for (let i = 0; i < trick.plays.length; i++) {
      const play = trick.plays[i];
      const hand = hands[play.position];
      const couldFollow = hand.some((c) => c.suit === leadSuit);
      const playsSoFar = trick.plays.slice(0, i);
      const winningBefore = playsSoFar.length > 0 ? winningPlaySoFar(playsSoFar, trumpSuit) : null;
      const partner = partnerOf(play.position);
      const partnerWinning = winningBefore?.position === partner;

      if (isHuman(play.position) && i > 0) {
        // ── Missed ruff: void in the lead suit, holds trumps, discards while
        //    the opponents are winning the trick ──
        if (
          trumpSuit &&
          !couldFollow &&
          play.card.suit !== trumpSuit &&
          !partnerWinning &&
          hand.some((c) => c.suit === trumpSuit) &&
          trick.winner &&
          !playerPositions.includes(trick.winner) &&
          trick.winner !== partner
        ) {
          errors.push({
            category: "missed-ruff",
            ...CATEGORY_LESSON["missed-ruff"],
            description: `Presa ${trickNumber}: potevi tagliare con l'atout ma hai scartato. Ripassa il potere di taglio.`,
            trickNumber,
          });
        }

        // ── Discarded a winner: threw away a master card while holding a
        //    non-master alternative ──
        if (
          !couldFollow &&
          (trumpSuit === null || play.card.suit !== trumpSuit) &&
          isMaster(play.card) &&
          hand.some((c) => !isSameCard(c, play.card) && c.suit !== trumpSuit && !isMaster(c))
        ) {
          errors.push({
            category: "discarded-winner",
            ...CATEGORY_LESSON["discarded-winner"],
            description: `Presa ${trickNumber}: hai scartato ${cardToString(play.card)}, che era una carta vincente. Conta le tue vincenti prima di scartare.`,
            trickNumber,
          });
        }

        // ── Wasted honor: in 4th seat, overtook the partner's already-winning
        //    card with an honor while holding a low alternative ──
        if (
          i === 3 &&
          couldFollow &&
          partnerWinning &&
          HONOR_RANKS.has(play.card.rank) &&
          play.card.suit === winningBefore!.card.suit &&
          rankValue(play.card.rank) > rankValue(winningBefore!.card.rank) &&
          hand.some((c) => c.suit === leadSuit && !HONOR_RANKS.has(c.rank))
        ) {
          errors.push({
            category: "wasted-honor",
            ...CATEGORY_LESSON["wasted-honor"],
            description: `Presa ${trickNumber}: hai superato il tuo compagno che stava già vincendo (${cardToString(play.card)}). Economizza gli onori e cura le comunicazioni.`,
            trickNumber,
          });
        }
      }

      // Consume the card
      const idx = hand.findIndex((c) => isSameCard(c, play.card));
      if (idx >= 0) hand.splice(idx, 1);
      played.add(cardKey(play.card));
    }
  }

  // ── Below optimal: the hand finished under the double-dummy potential ──
  if (
    typeof opts.ddTricks === "number" &&
    typeof opts.tricksMade === "number" &&
    playerPositions.includes(declarer) &&
    opts.tricksMade < opts.ddTricks
  ) {
    const planModule = trumpSuit
      ? { lessonId: 6, moduleId: "6-1" } // Il piano di gioco con l'atout
      : { lessonId: 4, moduleId: "4-1" }; // Il metodo del piano di gioco (SA)
    errors.push({
      category: "below-optimal",
      ...planModule,
      description: `Hai realizzato ${opts.tricksMade} prese, ma col gioco migliore se ne facevano ${opts.ddTricks}. Rivedi il metodo del piano di gioco.`,
    });
  }

  return errors;
}
