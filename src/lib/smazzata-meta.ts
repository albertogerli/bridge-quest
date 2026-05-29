// ============================================================================
// Smazzata teaching metadata — derived, not stored.
//
// The catalog has no difficulty field, so we derive a teaching-oriented
// difficulty from the contract level (part-score / game / slam, bumped by a
// double). Used by the assignment builder filters and the results heatmap.
// ============================================================================

import type { Smazzata } from "@/lib/catalog";

export type SmazzataDifficulty = "facile" | "medio" | "difficile";

export const DIFFICULTY_LABELS: Record<SmazzataDifficulty, string> = {
  facile: "Facile",
  medio: "Medio",
  difficile: "Difficile",
};

/** Part-score => facile, game => medio, slam => difficile. A double bumps up one. */
export function smazzataDifficulty(s: Smazzata): SmazzataDifficulty {
  const contract = s.contract ?? "";
  const level = parseInt(contract.charAt(0), 10);
  if (!level || Number.isNaN(level)) return "medio";

  const isNT = /NT/i.test(contract);
  const isMajor = contract.includes("♥") || contract.includes("♠");
  const isMinor = contract.includes("♦") || contract.includes("♣");
  const doubled = contract.includes("X");

  let game = false;
  let slam = false;
  if (level >= 6) slam = true;
  else if (isNT && level >= 3) game = true;
  else if (isMajor && level >= 4) game = true;
  else if (isMinor && level >= 5) game = true;

  if (slam) return "difficile";
  if (game) return doubled ? "difficile" : "medio";
  return doubled ? "medio" : "facile";
}

/** Tailwind classes for a difficulty chip (mirrors levelInfo palette). */
export const DIFFICULTY_CHIP: Record<SmazzataDifficulty, string> = {
  facile: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  medio: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  difficile: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};
