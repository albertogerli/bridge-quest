// ============================================================================
// MiniBridge — deal analysis & contract decision (pure logic, no UI).
//
// MiniBridge is the WBF/ACBL beginner method: no auction. Count the High Card
// Points of each side, the side with more points declares, the higher-point
// hand of that side is the declarer, and the Decision Table maps combined HCP
// to the number of tricks the side can expect to take.
//
// References: WBF Bridge Course Level 1 (Decision Table).
// ============================================================================

import type { Card, Position, Suit } from "@/lib/bridge-engine";

export type Partnership = "ns" | "ew";
export type Strain = Suit | "nt";

/** Milton Work count: A=4, K=3, Q=2, J=1. */
const HCP_VALUE: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

export function countHcp(hand: Card[]): number {
  return hand.reduce((sum, c) => sum + (HCP_VALUE[c.rank] ?? 0), 0);
}

/** WBF Decision Table: combined partnership HCP -> expected number of tricks. */
export function decisionTableTricks(combinedHcp: number): number {
  if (combinedHcp >= 37) return 13;
  if (combinedHcp >= 33) return 12;
  if (combinedHcp >= 30) return 11;
  if (combinedHcp >= 27) return 10;
  if (combinedHcp >= 25) return 9;
  if (combinedHcp >= 23) return 8;
  return 7; // 20-22 (and the rare 20/20 split) -> minimum playable contract
}

/** The Decision Table as data, for rendering the reference card. */
export const DECISION_TABLE: { points: string; tricks: number }[] = [
  { points: "37-40", tricks: 13 },
  { points: "33-36", tricks: 12 },
  { points: "30-32", tricks: 11 },
  { points: "27-29", tricks: 10 },
  { points: "25-26", tricks: 9 },
  { points: "23-24", tricks: 8 },
  { points: "20-22", tricks: 7 },
];

const PAIRS: Record<Partnership, [Position, Position]> = {
  ns: ["north", "south"],
  ew: ["east", "west"],
};

const ALL_SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const MAJORS: Suit[] = ["spade", "heart"];

export interface DealFit {
  suit: Suit;
  count: number; // combined cards in the declaring side
}

export interface DealAnalysis {
  hcp: Record<Position, number>;
  partnershipHcp: Record<Partnership, number>;
  declaringSide: Partnership;
  defendingSide: Partnership;
  declarer: Position;
  dummy: Position;
  combinedHcp: number; // declaring side's combined HCP
  expectedTricks: number;
  fits: DealFit[]; // declaring side's 8+ card fits, best first
}

function countSuit(hand: Card[], suit: Suit): number {
  return hand.reduce((n, c) => (c.suit === suit ? n + 1 : n), 0);
}

/** Analyze a full deal for MiniBridge: who declares, who's declarer, expected
 *  tricks, and the declaring side's fits. */
export function analyzeDeal(hands: Record<Position, Card[]>): DealAnalysis {
  const hcp: Record<Position, number> = {
    north: countHcp(hands.north),
    south: countHcp(hands.south),
    east: countHcp(hands.east),
    west: countHcp(hands.west),
  };

  const partnershipHcp: Record<Partnership, number> = {
    ns: hcp.north + hcp.south,
    ew: hcp.east + hcp.west,
  };

  // The side with more points declares. Tie (20/20) -> N/S by convention.
  const declaringSide: Partnership = partnershipHcp.ns >= partnershipHcp.ew ? "ns" : "ew";
  const defendingSide: Partnership = declaringSide === "ns" ? "ew" : "ns";
  const [a, b] = PAIRS[declaringSide];

  // Declarer = higher-point hand of the declaring side (tie -> first seat).
  const declarer: Position = hcp[a] >= hcp[b] ? a : b;
  const dummy: Position = declarer === a ? b : a;

  // Fits: 8+ combined cards in the declaring side. Majors first, then by length.
  const fits: DealFit[] = ALL_SUITS.map((suit) => ({
    suit,
    count: countSuit(hands[declarer], suit) + countSuit(hands[dummy], suit),
  }))
    .filter((f) => f.count >= 8)
    .sort((x, y) => {
      const xMaj = MAJORS.includes(x.suit) ? 1 : 0;
      const yMaj = MAJORS.includes(y.suit) ? 1 : 0;
      if (y.count !== x.count) return y.count - x.count;
      return yMaj - xMaj;
    });

  const combinedHcp = partnershipHcp[declaringSide];

  return {
    hcp,
    partnershipHcp,
    declaringSide,
    defendingSide,
    declarer,
    dummy,
    combinedHcp,
    expectedTricks: decisionTableTricks(combinedHcp),
    fits,
  };
}

/** Recommended strain: best major fit, else best fit, else No Trump. */
export function suggestStrain(fits: DealFit[]): Strain {
  const major = fits.find((f) => MAJORS.includes(f.suit));
  if (major) return major.suit;
  if (fits.length > 0) return fits[0].suit;
  return "nt";
}

/** Strains the player may choose: No Trump plus any 8+ card fit. */
export function strainChoices(fits: DealFit[]): Strain[] {
  return ["nt", ...fits.map((f) => f.suit)];
}

const SUIT_SYMBOL: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

/** Build a contract string (e.g. "3NT", "4♠") from expected tricks + strain.
 *  Level = tricks - 6. Output matches the catalog/engine contract format. */
export function buildContract(expectedTricks: number, strain: Strain): string {
  const level = Math.max(1, Math.min(7, expectedTricks - 6));
  return strain === "nt" ? `${level}NT` : `${level}${SUIT_SYMBOL[strain]}`;
}

export const STRAIN_LABEL: Record<Strain, string> = {
  nt: "Senza Atout",
  spade: "Picche ♠",
  heart: "Cuori ♥",
  diamond: "Quadri ♦",
  club: "Fiori ♣",
};
