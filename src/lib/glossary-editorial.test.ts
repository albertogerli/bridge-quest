import { describe, expect, it } from "vitest";
import en from "../../scripts/editorial-glossary-en.json";
import changes from "../../docs/attuazione-qualita-2026-09-23/glossario-prima-dopo.json";
import definitions from "../../docs/attuazione-qualita-2026-09-23/glossario-definizioni-prima-dopo.json";
import { hasTranslationArtifact } from "./content-validation";
import { localizeGlossary } from "./glossary-language";
import type { GlossaryEntry } from "./catalog";
describe("bilingual glossary quiz revision", () => {
  it.each(changes)("$id keeps a reachable solution in both languages", (r) => {
    expect(r.after.options).toHaveLength(r.english.options.length);
    expect(r.after.correctAnswer).toBe(r.english.correctAnswer);
    expect(r.english.options[r.english.correctAnswer]).toBeTruthy();
    const entry = { id: r.id, quiz: r.after, quizEn: r.english } as GlossaryEntry;
    expect(localizeGlossary(entry, "en").quiz).toBe(r.english);
    expect(localizeGlossary(entry, "it").quiz).toBe(r.after);
  });
  it("covers every current glossary row", () => expect(Object.keys(en).sort()).toEqual(changes.map(r=>r.id).sort()));
  it("does not award HCP to the ten or make the transferring responder declarer", () => {
    expect(en.onori[2]).toContain("zero HCP");
    expect(en.transfer[2]).toContain("opener will be declarer");
    expect(en.bilanciata[2]).toContain("two doubletons");
  });
  it("uses definitions without translation refusals", () => {
    expect(definitions.find(r => r.id === "libro")?.after.term_en).toBe("Book");
    for (const row of definitions) {
      for (const text of Object.values(row.after)) {
        if (typeof text === "string") expect(hasTranslationArtifact(text)).toBe(false);
      }
    }
  });
  it.each([
    ["apertura", 13], ["punti_distribuzione", 12],
  ] as const)("%s has a complete hand with %i HCP in both languages", (id, points) => {
    const row = definitions.find(r => r.id === id)!;
    for (const text of [row.after.example, row.after.example_en]) {
      const match = text!.match(/♠([AKQJ2-9]+) ♥([AKQJ2-9]+) ♦([AKQJ2-9]+) ♣([AKQJ2-9]+)/)!;
      const cards = match.slice(1).join("");
      expect(cards).toHaveLength(13);
      expect([...cards].reduce((sum, rank) => sum + ({ A: 4, K: 3, Q: 2, J: 1 }[rank] ?? 0), 0)).toBe(points);
      for (const suit of match.slice(1)) expect(new Set(suit).size).toBe(suit.length);
    }
  });
});
