import type { GlossaryEntry } from "@/lib/catalog";
import type { Lingua } from "@/lib/lingua";

export function localizeGlossary(entry: GlossaryEntry, lingua: Lingua): GlossaryEntry {
  if (lingua === "it") return entry;
  return { ...entry, term: entry.termEn || entry.term, definition: entry.definitionEn || entry.definition,
    example: entry.exampleEn || entry.example, quiz: entry.quizEn ?? entry.quiz };
}
