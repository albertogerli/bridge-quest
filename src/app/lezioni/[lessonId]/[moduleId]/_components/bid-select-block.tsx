"use client";

import { AnimatePresence, motion } from "motion/react";
import { CardDisplay } from "@/components/bridge/card-display";
import type { ContentBlockProps } from "../_types";
import { EnrichedText } from "./enriched-text";

/** Simboli e colore di ogni seme nella bidding box. */
const suitSymbols: Record<string, { sym: string; color: string }> = {
  S: { sym: "♠", color: "text-foreground" },
  H: { sym: "♥", color: "text-red-600 dark:text-red-400" },
  D: { sym: "♦", color: "text-orange-500" },
  C: { sym: "♣", color: "text-green-700 dark:text-green-500" },
  NT: { sym: "SA", color: "text-foreground/80" },
  SA: { sym: "SA", color: "text-foreground/80" },
};

/** Quiz «Bidding Box»: si sceglie la dichiarazione corretta. */
export function BidSelectBlock({ block, blockIndex, delay, ctx }: ContentBlockProps) {
  const {
    glossaryTermMap,
    quizAnswers,
    showExplanation,
    shuffledQuizOptions,
    handleQuizAnswer,
  } = ctx;

  const bsAnswered = quizAnswers[blockIndex] !== undefined;
  const bsCorrect = quizAnswers[blockIndex] === block.correctAnswer;
  const bidOptions = block.options ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card card-clean p-5 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </svg>
        </div>
        <p className="font-bold text-foreground text-[15px]">Bidding Box</p>
      </div>
      <p className="text-[14px] text-foreground/80 mb-3 leading-relaxed">
        <EnrichedText text={block.content} termMap={glossaryTermMap} />
      </p>
      {block.cards && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border">
          <CardDisplay cards={block.cards} size="lg" />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {(shuffledQuizOptions[blockIndex] || bidOptions.map((_: string, i: number) => i)).map((origIdx: number) => {
          const bid = bidOptions[origIdx];
          const isSelected = quizAnswers[blockIndex] === origIdx;
          const isCorrectBid = block.correctAnswer === origIdx;
          const bidLevel = bid[0];
          const bidSuit = bid.slice(1).toUpperCase();
          const suitInfo = suitSymbols[bidSuit];
          let bidCls = "bg-card border-border hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30";
          if (bsAnswered) {
            if (isCorrectBid) bidCls = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald/30";
            else if (isSelected && !bsCorrect) bidCls = "bg-red-50 dark:bg-red-950/40 border-red-400";
            else bidCls = "bg-muted/50 border-border opacity-50";
          }
          const isPasso = bid === "P" || bid === "Passo";
          return (
            <motion.button
              key={origIdx}
              whileTap={!bsAnswered ? { scale: 0.95 } : undefined}
              onClick={() => {
                if (bsAnswered) return;
                handleQuizAnswer(blockIndex, origIdx);
              }}
              disabled={bsAnswered}
              className={`rounded-xl border-2 p-3 text-center font-bold transition-all cursor-pointer ${bidCls}`}
            >
              {isPasso ? (
                <span className="text-muted-foreground text-sm">Passo</span>
              ) : suitInfo ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="text-foreground text-lg">{bidLevel}</span>
                  <span className={`text-lg ${suitInfo.color}`}>{suitInfo.sym}</span>
                </span>
              ) : (
                <span className="text-sm text-foreground/80">{bid}</span>
              )}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {showExplanation[blockIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {bsCorrect ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Licita corretta! +20 XP</p>
              </div>
            ) : (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 flex items-center gap-2">
                <span className="text-lg">💪</span>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  La risposta corretta era <span className="font-bold">{bidOptions[block.correctAnswer ?? 0]}</span>
                </p>
              </div>
            )}
            {block.explanation && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3">
                <p className="text-[13px] text-blue-800 dark:text-blue-200 leading-relaxed">💡 {block.explanation}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
