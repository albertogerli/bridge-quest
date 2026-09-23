import { describe, expect, it } from "vitest";
import { biddingScenarios } from "@/data/bidding-practice-data";
import en from "@/traduzioni/en.json";
import { normalizeReview } from "./progress-sync";
const expected = [9, 12, 10, 6, 10, 9, 14, 8, 24, 12, 15, 6, 3, 6, 16, 14, 8, 17, 19, 15];
describe("reviewed practice content", () => {
  it.each(biddingScenarios)("scenario $id has 13 distinct cards, verified HCP and an English explanation", (s) => {
    const cards = Object.entries(s.hand).flatMap(([suit, ranks]) => ranks.replace(/10/g, "T").split("").map((rank) => ({ suit, rank })));
    expect(cards).toHaveLength(13);
    expect(new Set(cards.map((c) => c.suit + c.rank)).size).toBe(13);
    expect(cards.reduce((sum, c) => sum + (({ A: 4, K: 3, Q: 2, J: 1 } as Record<string, number>)[c.rank] ?? 0), 0)).toBe(expected[s.id - 1]);
    expect((en as Record<string, string>)[s.explanation]).toBeTruthy();
    expect(s.wrongBids).not.toContain(s.correctBid);
  });
  it("makes weak twos explicit rather than presenting them as Fiori", () => {
    for (const id of [8, 9, 13, 19]) expect(biddingScenarios.find((s) => s.id === id)?.system).toBe("due-deboli");
  });
  it("normalizes database review identity and dates for local UI comparisons", () => {
    expect(normalizeReview({ lessonId: "7", moduleId: "7-2", wrongCount: 1, nextReview: "2026-09-23T00:00:00+00:00" })).toMatchObject({ lessonId: 7, nextReview: "2026-09-23" });
  });
});
