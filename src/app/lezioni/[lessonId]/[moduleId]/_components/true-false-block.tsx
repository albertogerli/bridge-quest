"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ContentBlockProps } from "../_types";
import { EnrichedText } from "./enriched-text";

/** Quiz «Vero o Falso?». */
export function TrueFalseBlock({ block, blockIndex, delay, ctx }: ContentBlockProps) {
  const { glossaryTermMap, quizAnswers, showExplanation, handleQuizAnswer } = ctx;

  const tfAnswered = quizAnswers[blockIndex] !== undefined;
  const tfCorrect = quizAnswers[blockIndex] === block.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card card-clean p-5 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </div>
        <p className="font-bold text-foreground text-[15px]">Vero o Falso?</p>
      </div>
      <p className="text-[14px] text-foreground/80 mb-4 leading-relaxed">
        <EnrichedText text={block.content} termMap={glossaryTermMap} />
      </p>
      <div className="grid grid-cols-2 gap-3">
        {["Vero", "Falso"].map((label, idx) => {
          const isSelected = quizAnswers[blockIndex] === idx;
          const isCorrectOpt = block.correctAnswer === idx;
          let cls = "bg-muted/50 border-border text-foreground/80";
          if (tfAnswered) {
            if (isCorrectOpt) cls = "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300";
            else if (isSelected && !tfCorrect) cls = "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300";
            else cls = "bg-muted/50 border-border text-muted-foreground";
          }
          return (
            <motion.button
              key={idx}
              whileTap={!tfAnswered ? { scale: 0.95 } : undefined}
              onClick={() => !tfAnswered && handleQuizAnswer(blockIndex, idx)}
              disabled={tfAnswered}
              className={`rounded-xl border-2 p-4 text-center font-bold text-lg transition-all ${cls} ${
                !tfAnswered ? "hover:border-emerald/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer" : ""
              }`}
            >
              {tfAnswered && isCorrectOpt && "✓ "}{tfAnswered && isSelected && !tfCorrect && "✗ "}{label}
            </motion.button>
          );
        })}
      </div>
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
