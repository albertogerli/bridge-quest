import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getInfographicForLesson } from "@/components/maestro-video";
import { localizeGlossary } from "./glossary-language";
import type { GlossaryEntry } from "./catalog";
describe("language and revised references", () => {
  it.each([7, 8])("uses revised image, PDF and course bundle for Fiori %s in both languages", (id) => {
    for (const lang of ["it", "en"] as const) {
      const asset = getInfographicForLesson(id, "junior", lang)!;
      for (const path of Object.values(asset)) {
        expect(path).toContain("rev2022");
        expect(existsSync(resolve("public", path.slice(1)))).toBe(true);
      }
    }
  });
  it("language changes do not mutate the shared Italian glossary", () => {
    const original = { id: "test", term: "Atout", definition: "Seme di atout", termEn: "Trump", definitionEn: "The trump suit" } as GlossaryEntry;
    expect(localizeGlossary(original, "en").term).toBe("Trump");
    expect(localizeGlossary(original, "it").term).toBe("Atout");
    expect(original.definition).toBe("Seme di atout");
  });
});
