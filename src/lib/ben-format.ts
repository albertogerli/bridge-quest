/**
 * BEN (Bridge Engine Neural) format conversion utilities
 * Converts between FIGB Bridge LAB's internal types and BEN's PBN-style notation
 */

import type { Card, Suit, Rank, Position, GameState } from "./bridge-engine";
import type { Vulnerability, BiddingData } from "@/data/smazzate";

// --- Suit mapping ---

const SUIT_TO_BEN: Record<Suit, string> = {
  spade: "S",
  heart: "H",
  diamond: "D",
  club: "C",
};

const BEN_TO_SUIT: Record<string, Suit> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
};

// --- Rank mapping (our "10" ↔ BEN "T") ---

const RANK_TO_BEN: Record<Rank, string> = {
  A: "A", K: "K", Q: "Q", J: "J", "10": "T",
  "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
};

const BEN_TO_RANK: Record<string, Rank> = {
  A: "A", K: "K", Q: "Q", J: "J", T: "10",
  "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
};

// Rank order for sorting within a suit (high to low)
const RANK_ORDER = "AKQJT98765432";

// --- Card conversion ---

/** Convert a single Card to BEN notation: "SA" = Spade Ace */
export function cardToPBN(card: Card): string {
  return SUIT_TO_BEN[card.suit] + RANK_TO_BEN[card.rank];
}

/** Convert BEN card notation "SA" back to Card */
export function pbnCardToCard(pbn: string): Card {
  const suitChar = pbn[0];
  const rankChar = pbn[1];
  const suit = BEN_TO_SUIT[suitChar];
  const rank = BEN_TO_RANK[rankChar];
  if (!suit || !rank) throw new Error(`Invalid PBN card: ${pbn}`);
  return { suit, rank };
}

// --- Hand conversion ---

/** Convert Card[] to BEN PBN hand string: "AK97.KQ.T32.AK7" (S.H.D.C) */
export function handToPBN(cards: Card[]): string {
  const suits: Record<string, string[]> = { S: [], H: [], D: [], C: [] };
  for (const card of cards) {
    suits[SUIT_TO_BEN[card.suit]].push(RANK_TO_BEN[card.rank]);
  }
  // Sort each suit by rank order (high to low)
  for (const s of ["S", "H", "D", "C"]) {
    suits[s].sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));
  }
  return `${suits.S.join("")}.${suits.H.join("")}.${suits.D.join("")}.${suits.C.join("")}`;
}

// --- Position conversion ---

const POS_TO_BEN: Record<Position, string> = {
  north: "N", east: "E", south: "S", west: "W",
};

const BEN_TO_POS: Record<string, Position> = {
  N: "north", E: "east", S: "south", W: "west",
};

export function positionToBEN(pos: Position): string {
  return POS_TO_BEN[pos];
}

export function benToPosition(ben: string): Position {
  return BEN_TO_POS[ben] ?? "north";
}

// --- Vulnerability conversion ---

export function vulToBEN(vul: Vulnerability): string {
  switch (vul) {
    case "none": return "";
    case "ns": return "@V@v";   // NS vulnerable
    case "ew": return "@v@V";   // EW vulnerable
    case "both": return "@V@V"; // Both vulnerable
    default: return "";
  }
}

// --- Bidding context conversion ---

/** Convert our BiddingData to BEN's ctx parameter format */
export function biddingToCTX(bidding?: BiddingData): string {
  if (!bidding || !bidding.bids || bidding.bids.length === 0) return "";
  return bidding.bids.map(bidToBEN).join("");
}

/** Convert a single bid to BEN's 2-char format */
function bidToBEN(bid: string): string {
  const b = bid.trim().toUpperCase();
  // Pass
  if (b === "P" || b === "PASS" || b === "-") return "--";
  // Double
  if (b === "X" || b === "DBL" || b === "DOUBLE") return "Db";
  // Redouble
  if (b === "XX" || b === "RDBL" || b === "REDOUBLE") return "Rd";

  // Contract bids: "1NT" → "1N", "2SA" → "2N", "3♠" → "3S", etc.
  // Handle Unicode suit symbols
  let normalized = b
    .replace("♠", "S").replace("♥", "H").replace("♦", "D").replace("♣", "C")
    .replace("NT", "N").replace("SA", "N");

  // Should be 2 chars: level + suit letter
  if (normalized.length === 2 && /^[1-7][SHDCN]$/.test(normalized)) {
    return normalized;
  }

  // Fallback: return as-is (shouldn't happen with well-formed data)
  return normalized.slice(0, 2);
}

// --- Contract conversion ---

/** Convert our contract string "3NT" to BEN format "3N" */
export function contractToBEN(contract: string): string {
  return contract.toUpperCase()
    .replace("♠", "S").replace("♥", "H").replace("♦", "D").replace("♣", "C")
    .replace("NT", "N").replace("SA", "N");
}

// --- Game state to played cards string ---

/** Convert completed tricks + current trick to BEN's played cards string */
export function gameStateToPBNPlayed(state: GameState): string {
  let played = "";
  // All completed tricks (plays are in order: leader first)
  for (const trick of state.tricks) {
    for (const play of trick.plays) {
      played += cardToPBN(play.card);
    }
  }
  // Current incomplete trick
  for (const play of state.currentTrick) {
    played += cardToPBN(play.card);
  }
  return played;
}

// --- Deal format for autoplay ---

/** Convert all 4 hands to BEN deal string: "N:AK97.KQ.T32.AK7 QJT.J93.98.JT4 75.875.AJT52.952 84.KQT2.7643.KQ7" */
export function dealToPBN(hands: Record<Position, Card[]>): string {
  return `N:${handToPBN(hands.north)} ${handToPBN(hands.east)} ${handToPBN(hands.south)} ${handToPBN(hands.west)}`;
}
