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

/**
 * Contro e surcontro.
 *
 * Servono da quando gli avversari sono una rete neurale che dichiara davvero:
 * BEN contra, e un 4♠ contrato caduto di due segnato come se fosse passato
 * liscio (-100 invece di -300) falsa il voto proprio nelle mani dove la
 * dichiarazione è andata peggio.
 */
export type Doppio = 1 | 2 | 4;

/** Sottoprese contrate: prima, seconda e terza, poi 300 ciascuna. */
function undertrickPoints(under: number, vulnerable: boolean, doppio: Doppio): number {
  if (doppio === 1) return under * (vulnerable ? 100 : 50);
  const scala = vulnerable
    ? (n: number) => 200 + (n - 1) * 300
    : (n: number) => (n === 1 ? 100 : n <= 3 ? 100 + (n - 1) * 200 : 500 + (n - 3) * 300);
  return scala(under) * (doppio === 4 ? 2 : 1);
}

export function scoreContract(input: {
  level: number; // 1-7
  strain: Strain;
  tricksMade: number; // 0-13
  vulnerable?: boolean;
  /** 1 nessun contro, 2 contrato, 4 surcontrato. */
  doppio?: Doppio;
}): ScoreResult {
  const { level, strain, tricksMade, vulnerable = false, doppio = 1 } = input;
  const tricksNeeded = level + 6;
  const made = tricksMade >= tricksNeeded;

  const base = contractPoints(level, strain) * doppio;
  const isGame = base >= 100;
  const isSlam = level >= 6;

  if (!made) {
    const under = tricksNeeded - tricksMade;
    return {
      score: -undertrickPoints(under, vulnerable, doppio),
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
  // Contrato le prese in più valgono 100 (200 in zona) l'una, non il valore
  // del seme; e il contro vale 50 di «insulto», 100 il surcontro.
  const overtrickPoints =
    doppio === 1
      ? over * trickValue(strain)
      : over * (vulnerable ? 200 : 100) * (doppio === 4 ? 2 : 1);
  const insulto = doppio === 2 ? 50 : doppio === 4 ? 100 : 0;

  return {
    score: base + gameBonus + slamBonus + overtrickPoints + insulto,
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
