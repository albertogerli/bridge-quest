/**
 * Progressive XP level system — 36 levels
 * Early levels are fast, later levels require exponentially more XP.
 * Level 36 "Campione Azzurro" requires 200,000 XP.
 */

/** XP threshold to reach each level (index 0 = level 1, etc.) */
export const LEVEL_THRESHOLDS = [
  0,        // Lv  1
  100,      // Lv  2
  250,      // Lv  3
  450,      // Lv  4
  700,      // Lv  5
  1_000,    // Lv  6
  1_400,    // Lv  7
  1_900,    // Lv  8
  2_500,    // Lv  9
  3_200,    // Lv 10
  4_000,    // Lv 11
  5_000,    // Lv 12
  6_200,    // Lv 13
  7_600,    // Lv 14
  9_200,    // Lv 15
  11_000,   // Lv 16
  13_000,   // Lv 17
  15_500,   // Lv 18
  18_500,   // Lv 19
  22_000,   // Lv 20
  26_000,   // Lv 21
  30_500,   // Lv 22
  35_500,   // Lv 23
  41_000,   // Lv 24
  47_500,   // Lv 25
  55_000,   // Lv 26
  63_000,   // Lv 27
  72_000,   // Lv 28
  82_000,   // Lv 29
  90_000,   // Lv 30
  100_000,  // Lv 31
  112_000,  // Lv 32
  126_000,  // Lv 33
  145_000,  // Lv 34
  170_000,  // Lv 35
  200_000,  // Lv 36
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length; // 36

/** Get the current level (1-36) for a given XP total */
export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/** XP earned within the current level (for progress bar) */
export function getXpInLevel(xp: number): number {
  const lvl = getLevel(xp);
  return xp - LEVEL_THRESHOLDS[lvl - 1];
}

/** Total XP needed to go from current level to next (for progress bar width) */
export function getXpForNextLevel(xp: number): number {
  const lvl = getLevel(xp);
  if (lvl >= MAX_LEVEL) return 1; // max level — bar stays full
  return LEVEL_THRESHOLDS[lvl] - LEVEL_THRESHOLDS[lvl - 1];
}

/** Progress percentage (0-100) within current level */
export function getLevelProgress(xp: number): number {
  const lvl = getLevel(xp);
  if (lvl >= MAX_LEVEL) return 100;
  const inLevel = getXpInLevel(xp);
  const needed = getXpForNextLevel(xp);
  return Math.min(100, Math.round((inLevel / needed) * 100));
}

/** XP remaining to reach the next level */
export function getXpToNextLevel(xp: number): number {
  const lvl = getLevel(xp);
  if (lvl >= MAX_LEVEL) return 0;
  return LEVEL_THRESHOLDS[lvl] - xp;
}
