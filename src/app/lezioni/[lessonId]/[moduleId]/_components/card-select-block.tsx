"use client";

import { AnimatePresence, motion } from "motion/react";
import { parseCardSelectHand } from "@/lib/lesson-module";
import type { ContentBlockProps } from "../_types";
import { EnrichedText } from "./enriched-text";

/** Quiz «Scegli la carta»: si tocca una carta della mano mostrata. */
export function CardSelectBlock({ block, blockIndex, delay, ctx }: ContentBlockProps) {
  const { glossaryTermMap, quizAnswers, showExplanation, handleCardSelect } = ctx;

  const csAnswered = quizAnswers[blockIndex] !== undefined;
  const cardParts = block.cards ? parseCardSelectHand(block.cards) : [];
  const correctIdx = cardParts.findIndex((c) => c === block.correctCard);
  const csCorrect = quizAnswers[blockIndex] === correctIdx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card card-clean p-5 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h10V4H7zm3 3h4v2h-4V7z" />
          </svg>
        </div>
        <p className="font-bold text-foreground text-[15px]">Scegli la carta</p>
      </div>
      <p className="text-[14px] text-foreground/80 mb-4 leading-relaxed">
        <EnrichedText text={block.content} termMap={glossaryTermMap} />
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {cardParts.map((card, idx) => {
          const isSelected = quizAnswers[blockIndex] === idx;
          const isCorrectCard = idx === correctIdx;
          const suitCh = card[0];
          const rank = card.slice(1);
          const color = suitCh === "♥" || suitCh === "♦" ? "text-red-600" : suitCh === "♣" ? "text-green-700" : "text-gray-900";
          let cardCls = "bg-white border-gray-200 hover:border-emerald hover:shadow-md";
          if (csAnswered) {
            if (isCorrectCard) cardCls = "bg-emerald-50 border-emerald-400 ring-2 ring-emerald/30";
            else if (isSelected && !csCorrect) cardCls = "bg-red-50 border-red-400";
            else cardCls = "bg-gray-50 border-gray-200 opacity-50";
          }
          return (
            <motion.button
              key={idx}
              whileTap={!csAnswered ? { scale: 0.9 } : undefined}
              whileHover={!csAnswered ? { y: -4 } : undefined}
              onClick={() => {
                if (csAnswered) return;
                handleCardSelect(blockIndex, idx, idx === correctIdx);
              }}
              disabled={csAnswered}
              className={`w-14 h-20 rounded-xl border-2 flex flex-col items-center justify-center shadow-sm transition-all cursor-pointer ${cardCls}`}
            >
              <span className={`text-lg font-bold ${color}`}>{suitCh}</span>
              <span className={`text-base font-bold ${color}`}>{rank}</span>
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
            {csCorrect ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Carta giusta! +25 XP</p>
              </div>
            ) : (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 flex items-center gap-2">
                <span className="text-lg">💪</span>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  La carta corretta era <span className="font-bold">{block.correctCard}</span>
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
