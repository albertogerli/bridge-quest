import type { ContentBlock } from "@/lib/catalog";

export function numericAnswerDomain(block: ContentBlock): { min: number; max: number } {
  // No range derived from correctValue: that would disclose the solution.
  return { min: block.numericMin ?? 0, max: block.numericMax ?? (block.numericUnit === "hcp" ? 37 : 100) };
}

export function parseNumericAnswer(raw: string, domain: { min: number; max: number }): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= domain.min && value <= domain.max ? value : null;
}
