"use client";

import { AnimatePresence, motion } from "motion/react";
import { hintLetter } from "@/lib/lesson-module";
import type { ContentBlockProps } from "../_types";
import { BrainIcon } from "./block-icons";
import { EnrichedText } from "./enriched-text";
import { QuizFeedback } from "./quiz-feedback";
import { useT } from "@/contexts/traduzioni-provider";

/** Quiz a scelta multipla: timer, power-up, suggerimenti e spiegazione. */
export function QuizBlock({ block, blockIndex, delay, ctx }: ContentBlockProps) {
  const t = useT();
  const {
    isJunior,
    profile,
    glossaryTermMap,
    quizAnswers,
    showExplanation,
    shuffledQuizOptions,
    eliminated,
    showHint,
    powerups,
    quizTimer,
    correctStreak,
    totalQuizzes,
    revealHint,
    handleQuizAnswer,
    consumeFiftyFifty,
    consumeSkip,
    consumeExtraTime,
  } = ctx;

  const answered = quizAnswers[blockIndex] !== undefined;
  const isCorrect = quizAnswers[blockIndex] === block.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card card-clean p-5 mb-5 relative overflow-hidden"
    >
      {/* Timer (giovane) + Streak indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {profile.showTimer && !answered && quizTimer > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-bold ${
              quizTimer <= 5 ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse" : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
            }`}
          >
            {quizTimer}s
          </motion.div>
        )}
        {profile.showCombo && correctStreak >= 2 && !answered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 rounded-full px-2 py-0.5"
          >
            <span className="text-xs">🔥</span>
            <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400">{correctStreak}x</span>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center justify-center rounded-xl ${
          isJunior ? "h-10 w-10 bg-gradient-to-br from-pink-400 to-purple-500 text-lg" : "h-8 w-8 bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
        }`}>
          {isJunior ? "🧠" : <BrainIcon className="h-4 w-4" />}
        </div>
        <div>
          <p className={`font-bold text-foreground ${isJunior ? "text-[16px]" : "text-[15px]"}`}>
            {isJunior ? "Mettiti alla Prova!" : "Quiz"}
          </p>
          {totalQuizzes > 1 && (
            <p className="text-[12px] text-muted-foreground font-medium">
              +20 {profile.xpLabel} per risposta corretta
            </p>
          )}
        </div>
      </div>
      <p className={`text-foreground/80 mb-4 leading-relaxed ${profile.profile === "senior" ? "text-base" : "text-[14px]"}`}>
        <EnrichedText text={block.content} termMap={glossaryTermMap} />
      </p>

      {/* Power-up buttons */}
      {!answered && (
        <div className="flex items-center gap-2 mb-3">
          {powerups.fiftyFifty > 0 && block.options && block.options.length >= 4 && !eliminated[blockIndex] && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => consumeFiftyFifty(blockIndex)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-100 border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/60 transition-all"
            >
              <span className="text-sm">✂️</span> 50/50
            </motion.button>
          )}
          {powerups.skip > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => consumeSkip(blockIndex)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-100 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-all"
            >
              <span className="text-sm">⏭️</span> {t("Salta")}
            </motion.button>
          )}
          {profile.showTimer && powerups.extraTime > 0 && quizTimer > 0 && quizTimer <= 5 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => consumeExtraTime()}
              className="flex items-center gap-1.5 rounded-xl bg-green-100 border border-green-200 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/60 transition-all animate-pulse"
            >
              <span className="text-sm">⏰</span> +15s
            </motion.button>
          )}
        </div>
      )}

      {/* Senior: hint button */}
      {profile.showHints && !answered && block.explanation && (
        <div className="mb-3">
          {!showHint[blockIndex] ? (
            <button
              onClick={() => revealHint(blockIndex)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">💡</span>
              {t("Mostra suggerimento")}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Suggerimento: la risposta corretta è la {hintLetter(shuffledQuizOptions[blockIndex], block.correctAnswer)}
              </p>
            </motion.div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {(shuffledQuizOptions[blockIndex] || block.options?.map((_: string, i: number) => i) || []).map((origIdx: number, displayIdx: number) => {
          const option = block.options![origIdx];
          // 50/50: hide eliminated options (uses original indices)
          if (eliminated[blockIndex]?.includes(origIdx)) return null;

          const isSelected = quizAnswers[blockIndex] === origIdx;
          const isCorrectOption = block.correctAnswer === origIdx;

          let optionClass = "bg-muted/50 border-border text-foreground/80";
          if (answered) {
            if (isCorrectOption) {
              optionClass = "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300";
            } else if (isSelected && !isCorrect) {
              optionClass = "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-700 dark:text-red-300";
            } else {
              optionClass = "bg-muted/50 border-border text-muted-foreground";
            }
          }

          return (
            <motion.button
              key={origIdx}
              whileTap={!answered ? { scale: 0.98 } : undefined}
              onClick={() => !answered && handleQuizAnswer(blockIndex, origIdx)}
              disabled={answered}
              className={`w-full text-left rounded-xl border-2 font-medium transition-all ${optionClass} ${
                isJunior ? "p-4 text-[15px] font-semibold" : profile.profile === "senior" ? "p-4 text-base" : "p-3 text-[14px]"
              } ${
                !answered
                  ? isJunior
                    ? "hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:scale-[1.01] cursor-pointer"
                    : "hover:border-emerald/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    answered && isCorrectOption
                      ? "bg-emerald text-white border-emerald"
                      : answered && isSelected && !isCorrect
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-card border-border"
                  }`}
                >
                  {answered && isCorrectOption
                    ? "✓"
                    : answered && isSelected && !isCorrect
                      ? "✗"
                      : String.fromCharCode(65 + displayIdx)}
                </span>
                <span className="flex-1">{option}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Result + Explanation */}
      <AnimatePresence>
        {showExplanation[blockIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <QuizFeedback
              isCorrect={isCorrect}
              correctStreak={correctStreak}
              profile={profile}
              isJunior={isJunior}
            />
            {block.explanation && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3">
                <p className="text-[13px] text-blue-800 dark:text-blue-200 leading-relaxed">
                  💡 {block.explanation}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
