"use client";

import { GlossaryTooltip } from "@/components/beginner/glossary-tooltip";
import { CardDisplay } from "@/components/bridge/card-display";
import { splitTextByCards, splitTextByGlossaryTerms } from "@/lib/lesson-module";

/** Testo con i gruppi di carte (`♠AQ854`) resi come mini-carte disegnate. */
export function TextWithCards({ text }: { text: string }) {
  const parts = splitTextByCards(text);
  if (parts.length === 1) return parts[0].text;

  return (
    <>
      {parts.map((part, i) =>
        part.isCard ? (
          <CardDisplay key={i} cards={part.text} size="sm" />
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

/**
 * Testo del contenuto didattico con tooltip di glossario e carte inline.
 * Solo la prima occorrenza di ogni termine riceve il tooltip.
 */
export function EnrichedText({
  text,
  termMap,
}: {
  text: string;
  termMap: Map<string, string>;
}) {
  if (!text) return null;

  const parts = splitTextByGlossaryTerms(text, termMap);
  if (parts.length === 1) return <TextWithCards text={text} />;

  return (
    <>
      {parts.map((part, i) =>
        part.glossaryKey ? (
          <GlossaryTooltip key={i} term={part.glossaryKey}>
            <TextWithCards text={part.text} />
          </GlossaryTooltip>
        ) : (
          <span key={i}>
            <TextWithCards text={part.text} />
          </span>
        )
      )}
    </>
  );
}
