// ============================================================================
// Duplicate bridge scoring (WBF Level 1 Score Table).
//
// Implemented as the standard formula, verified to reproduce every cell of the
// WBF Score Table (e.g. 3NT= -> 400, 4♥= -> 420, 5♣= -> 400, 6♠= -> 980,
// 7NT= -> 1520, 2♥= -> 110, 1NT= -> 90; defeated non-vul = 50/undertrick).
//
// v1: not vulnerable, not doubled (MiniBridge convention).
// ============================================================================

import type { Strain } from "@/lib/minibridge";

const MINORS = new Set<string>(["club", "diamond"]);

/** Points per trick for a given strain (first NT trick is worth 40). */
function trickValue(strain: Strain): number {
  if (strain === "nt") return 30; // subsequent NT tricks; first handled separately
  return MINORS.has(strain) ? 20 : 30;
}

/** Contract (bid) points for `level` tricks in `strain`. */
function contractPoints(level: number, strain: Strain): number {
  if (strain === "nt") return 40 + 30 * (level - 1);
  return trickValue(strain) * level;
}

export interface ScoreResult {
  /** Score from the declaring side's perspective: positive if made, negative if down. */
  score: number;
  made: boolean;
  tricksNeeded: number; // level + 6
  /** Overtricks (>=0) when made, or undertricks (>0) when down. */
  diff: number;
  isGame: boolean;
  isSlam: boolean;
}

export function scoreContract(input: {
  level: number; // 1-7
  strain: Strain;
  tricksMade: number; // 0-13
  vulnerable?: boolean;
}): ScoreResult {
  const { level, strain, tricksMade, vulnerable = false } = input;
  const tricksNeeded = level + 6;
  const made = tricksMade >= tricksNeeded;

  const base = contractPoints(level, strain);
  const isGame = base >= 100;
  const isSlam = level >= 6;

  if (!made) {
    const under = tricksNeeded - tricksMade;
    return {
      score: -(under * (vulnerable ? 100 : 50)),
      made: false,
      tricksNeeded,
      diff: under,
      isGame,
      isSlam,
    };
  }

  const over = tricksMade - tricksNeeded;
  const gameBonus = isGame ? (vulnerable ? 500 : 300) : 50;
  const slamBonus =
    level === 7 ? (vulnerable ? 1500 : 1000) : level === 6 ? (vulnerable ? 750 : 500) : 0;
  const overtrickPoints = over * trickValue(strain);

  return {
    score: base + gameBonus + slamBonus + overtrickPoints,
    made: true,
    tricksNeeded,
    diff: over,
    isGame,
    isSlam,
  };
}

/** The WBF Score Table as data (made contracts, non-vulnerable), for the
 *  reference card. Each entry: contract level, points by strain at "=" (just made). */
export const SCORE_TABLE_MADE: { level: number; minor: number; major: number; nt: number }[] = [
  { level: 1, minor: 70, major: 80, nt: 90 },
  { level: 2, minor: 90, major: 110, nt: 120 },
  { level: 3, minor: 110, major: 140, nt: 400 },
  { level: 4, minor: 130, major: 420, nt: 430 },
  { level: 5, minor: 400, major: 450, nt: 460 },
  { level: 6, minor: 920, major: 980, nt: 990 },
  { level: 7, minor: 1440, major: 1510, nt: 1520 },
];

/** Defenders' score for defeating a contract, non-vulnerable, undoubled. */
export const DEFEATED_NON_VUL = [50, 100, 150, 200, 250, 300, 350];
