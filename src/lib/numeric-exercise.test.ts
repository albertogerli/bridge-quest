import { describe, expect, it } from "vitest";
import { numericAnswerDomain, parseNumericAnswer } from "./numeric-exercise";

describe("numeric exercises", () => {
  it("accepts 40 for the published 105-3 probability question", () => {
    const domain = numericAnswerDomain({ type: "hand-eval", content: "Quante volte su 100?", correctValue: 40 });
    expect(parseNumericAnswer("40", domain)).toBe(40);
  });
  it.each([0, 19, 20, 21, 37])("accepts HCP boundary %i", (n) => {
    expect(parseNumericAnswer(String(n), numericAnswerDomain({ type: "hand-eval", content: "", numericUnit: "hcp" }))).toBe(n);
  });
  it.each(["", " ", "1.5", "-1", "Infinity", "1e2", "101"])("rejects invalid input %s", (raw) => {
    expect(parseNumericAnswer(raw, { min: 0, max: 100 })).toBeNull();
  });
  it("does not leak the answer through the range", () => {
    expect(numericAnswerDomain({ type: "hand-eval", content: "", correctValue: 40 })).toEqual(
      numericAnswerDomain({ type: "hand-eval", content: "", correctValue: 8 }));
  });
});
