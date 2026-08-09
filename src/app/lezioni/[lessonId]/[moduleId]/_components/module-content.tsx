"use client";

import type { ContentBlock } from "@/lib/catalog";
import type { ModuleBlockContext } from "../_types";
import { BidSelectBlock } from "./bid-select-block";
import { CardSelectBlock } from "./card-select-block";
import { ExampleBlock } from "./example-block";
import { HandEvalBlock } from "./hand-eval-block";
import { HeadingBlock } from "./heading-block";
import { QuizBlock } from "./quiz-block";
import { RuleBlock } from "./rule-block";
import { SequenceBlock } from "./sequence-block";
import { TextBlock } from "./text-block";
import { TipBlock } from "./tip-block";
import { TrueFalseBlock } from "./true-false-block";

/** Un componente per ogni tipo di blocco; i tipi ignoti non si rendono. */
const BLOCK_COMPONENTS = {
  heading: HeadingBlock,
  text: TextBlock,
  rule: RuleBlock,
  example: ExampleBlock,
  tip: TipBlock,
  quiz: QuizBlock,
  "true-false": TrueFalseBlock,
  "card-select": CardSelectBlock,
  "hand-eval": HandEvalBlock,
  "bid-select": BidSelectBlock,
  sequence: SequenceBlock,
} as const;

/**
 * Blocchi di contenuto rivelati finora: sono cumulativi, il passo corrente si
 * aggiunge in fondo ai precedenti invece di sostituirli.
 *
 * `data-testid="module-content"` e `data-step-block="N"` sono verificati
 * dall'E2E (`e2e/regressione-pagine.spec.ts`): non rinominarli.
 */
export function ModuleContent({
  content,
  currentStep,
  ctx,
}: {
  content: ContentBlock[];
  currentStep: number;
  ctx: ModuleBlockContext;
}) {
  return (
    <div data-testid="module-content">
      {content.slice(0, currentStep + 1).map((block, idx) => {
        const Block = BLOCK_COMPONENTS[block.type as keyof typeof BLOCK_COMPONENTS];
        return (
          <div key={idx} data-step-block={idx} style={{ scrollMarginTop: 80 }}>
            {Block && (
              <Block
                block={block}
                blockIndex={idx}
                delay={0.05 * Math.min(idx, 3)}
                ctx={ctx}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
