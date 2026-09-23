import { createClient } from "@supabase/supabase-js";
import type { GlossaryEntry } from "@/lib/catalog";

/**
 * Server-side glossary fetch for SSR/ISR of the /glossario page.
 *
 * The glossary is public, static content (49 rows, same for everyone), so we
 * read it server-side with the anon key — no cookies/session needed — and let
 * the page render its content into the initial HTML (fixes the ~5.5s client
 * LCP and makes terms indexable). Mirrors the mapping in catalog.loadGlossary.
 *
 * Never throws: on any failure returns [] and the client page falls back to
 * its existing client-side fetch (no regression).
 */
type RawGlossary = {
  id: string;
  term: string;
  definition: string;
  term_en: string | null;
  definition_en: string | null;
  example_en: string | null;
  emoji: string;
  category: GlossaryEntry["category"];
  example: string | null;
  cards: string | null;
  related_terms: string[] | null;
  quiz: GlossaryEntry["quiz"];
  quiz_en: GlossaryEntry["quiz"] | null;
};

export async function getGlossaryServer(): Promise<GlossaryEntry[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("glossary")
      .select("id, term, definition, term_en, definition_en, example_en, emoji, category, example, cards, related_terms, quiz, quiz_en");

    if (error || !data) return [];

    return (data as RawGlossary[]).map((r) => ({
      id: r.id,
      term: r.term,
      definition: r.definition,
      termEn: r.term_en ?? undefined,
      definitionEn: r.definition_en ?? undefined,
      exampleEn: r.example_en ?? undefined,
      emoji: r.emoji,
      category: r.category,
      example: r.example ?? undefined,
      cards: r.cards ?? undefined,
      relatedTerms: r.related_terms ?? [],
      quiz: r.quiz,
      quizEn: r.quiz_en ?? undefined,
    }));
  } catch {
    return [];
  }
}
