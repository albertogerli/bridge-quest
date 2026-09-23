import type { ContentBlock } from "./catalog";
import { numericAnswerDomain, parseNumericAnswer } from "./numeric-exercise";
export type ContentIssue = { block: number; code: string };

/** Generation artefacts are content defects, never instructions or valid translations. */
export function hasTranslationArtifact(text: string): boolean {
  return /i['’]m sorry.{0,40}(?:can't|cannot) assist|as an ai language model|<\/?think>|^```(?:json|markdown)/i.test(text);
}

/** Mechanical publication gate. Does not certify the bridge reasoning or approve partial hands. */
export function validateContentBlocks(blocks: ContentBlock[]): ContentIssue[] {
  const issues: ContentIssue[] = [];
  blocks.forEach((b, block) => {
    const flag = (code: string) => issues.push({ block, code });
    if (!b || typeof b.content !== "string" || !b.content.trim()) { flag("missing-content"); return; }
    if ([b.content, b.explanation, ...(b.options ?? [])].some(s => typeof s === "string" && hasTranslationArtifact(s))) flag("translation-artifact");
    if (["quiz", "bid-select"].includes(b.type)) {
      if (!b.options || b.options.length < 2) flag("missing-options");
      if (!Number.isInteger(b.correctAnswer) || !b.options || b.correctAnswer! < 0 || b.correctAnswer! >= b.options.length) flag("unreachable-choice");
    }
    if (b.type === "true-false" && b.correctAnswer !== 0 && b.correctAnswer !== 1) flag("unreachable-boolean");
    if (b.type === "hand-eval") {
      const domain = numericAnswerDomain(b);
      if (typeof b.correctValue !== "number" || parseNumericAnswer(String(b.correctValue), domain) === null) flag("unreachable-number");
      if (b.numericUnit === "percent" && (b.correctValue! < 0 || b.correctValue! > 100)) flag("invalid-percentage");
    }
  });
  return issues;
}
