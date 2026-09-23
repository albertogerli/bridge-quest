"use client";

import { AnimatePresence, motion } from "motion/react";
import { CardDisplay } from "@/components/bridge/card-display";
import type { ContentBlockProps } from "../_types";
import { EnrichedText } from "./enriched-text";
import { useT } from "@/contexts/traduzioni-provider";
import { useState } from "react";
import { numericAnswerDomain, parseNumericAnswer } from "@/lib/numeric-exercise";

/** Numeric questions include HCP counts AND percentages. Never infer options from the solution. */
export function HandEvalBlock({ block, blockIndex, delay, ctx }: ContentBlockProps) {
  const t = useT();
  const { glossaryTermMap, quizAnswers, showExplanation, handleHandEval } = ctx;
  const [answer, setAnswer] = useState("");
  const domain = numericAnswerDomain(block);
  const value = parseNumericAnswer(answer, domain);
  const unit = block.numericUnit === "percent" ? "%" : block.numericUnit === "hcp" ? t("punti") : "";

  const heAnswered = quizAnswers[blockIndex] !== undefined;
  const heCorrect = quizAnswers[blockIndex] === block.correctValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card card-clean p-5 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <p className="font-bold text-foreground text-[15px]">{t("Valuta la mano")}</p>
      </div>
      <p className="text-[14px] text-foreground/80 mb-3 leading-relaxed">
        <EnrichedText text={block.content} termMap={glossaryTermMap} />
      </p>
      {block.cards && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border">
          <CardDisplay cards={block.cards} size="lg" />
        </div>
      )}
      {!heAnswered ? (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
          event.preventDefault();
          if (value !== null && !heAnswered) handleHandEval(blockIndex, value, value === block.correctValue);
        }}>
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("La tua risposta")} {unit}</span>
            <input type="number" inputMode="numeric" min={domain.min} max={domain.max} step={1}
              value={answer} onChange={(event) => setAnswer(event.target.value)}
              className="w-28 rounded-lg border border-border bg-card p-3 text-foreground" required />
          </label>
          <button type="submit" disabled={value === null}
            className="rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50">
            {t("Conferma")}
          </button>
        </form>
      ) : (
        <div className={`rounded-xl p-4 text-center ${heCorrect ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900" : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900"}`}>
          <p className={`text-2xl font-bold ${heCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {heCorrect ? "✓" : "✗"} {block.correctValue} {unit}
          </p>
          {!heCorrect && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {t("Hai risposto")} {quizAnswers[blockIndex]}
            </p>
          )}
        </div>
      )}
      <AnimatePresence>
        {showExplanation[blockIndex] && block.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3">
              <p className="text-[13px] text-blue-800 dark:text-blue-200 leading-relaxed">💡 {block.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
