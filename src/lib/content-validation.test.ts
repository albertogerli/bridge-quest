import { describe, expect, it } from "vitest";
import { validateContentBlocks, hasTranslationArtifact } from "./content-validation";
import type { ContentBlock } from "./catalog";
describe("publication gate uses the UI's numeric parser", () => {
  it("blocks the actual refused translation found for Book", () => {
    expect(hasTranslationArtifact("I'm sorry, I can't assist with that request.")).toBe(true);
    expect(hasTranslationArtifact("Partner cannot pass after a forcing bid.")).toBe(false);
  });
  it("accepts the corrected percentage exercise", () => expect(validateContentBlocks([{ type: "hand-eval", content: "Split?", correctValue: 40, numericUnit: "percent" }])).toEqual([]));
  it.each([undefined, -1, 101, 3.5, NaN])("rejects unreachable numeric solution %s", (correctValue) => {
    expect(validateContentBlocks([{ type: "hand-eval", content: "Number?", correctValue }])).not.toEqual([]);
  });
  it("enforces HCP domain separately", () => expect(validateContentBlocks([{ type: "hand-eval", content: "Points?", correctValue: 40, numericUnit: "hcp" }])).not.toEqual([]));
  it("rejects a choice index outside options", () => expect(validateContentBlocks([{ type: "quiz", content: "Choose?", options: ["A", "B"], correctAnswer: 2 }])).not.toEqual([]));
  it("fails gracefully on a null block", () => expect(validateContentBlocks([null as unknown as ContentBlock])).not.toEqual([]));
});
