"use client";

import { motion } from "motion/react";
import { buildConfettiPieces, computeStars, computeTotalModuleXp } from "@/lib/lesson-module";

/** Emoji dei coriandoli, assegnate a giro sui 30 pezzi. */
const CONFETTI_EMOJI = ["🎉", "🎊", "⭐", "✨", "🏆", "💫", "🎯", "♠", "♥", "♦", "♣", "🃏", "👑", "🔥"];

/**
 * Riepilogo di fine modulo: coriandoli, stelle in base al punteggio, XP
 * totali, quiz azzeccati, miglior serie e distintivi guadagnati.
 */
export function CompletionCard({
  isLessonComplete,
  lessonNumber,
  totalQuizzes,
  correctAnswers,
  bestStreak,
  lives,
  xpEarned,
  xpReward,
  xpLabel,
}: {
  isLessonComplete: boolean;
  lessonNumber: number;
  totalQuizzes: number;
  correctAnswers: number;
  bestStreak: number;
  lives: number;
  xpEarned: number;
  xpReward: number;
  xpLabel: string;
}) {
  const stars = computeStars(correctAnswers, totalQuizzes);

  return (
    <>
      {/* === BIG CONFETTI EXPLOSION === */}
      <div className="fixed inset-0 pointer-events-none z-[55]">
        {buildConfettiPieces(30).map((piece, i) => (
          <motion.div
            key={`confetti-${i}`}
            className="absolute text-xl"
            style={{ left: `${piece.left}%`, top: "-5%" }}
            initial={{ opacity: 1, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              y: [0, window?.innerHeight ?? 800],
              x: [piece.driftFrom, piece.driftTo],
              rotate: [0, piece.rotate],
            }}
            transition={{
              delay: 0.1 + i * 0.08,
              duration: piece.duration,
              ease: "easeOut",
            }}
          >
            {CONFETTI_EMOJI[i % 14]}
          </motion.div>
        ))}
      </div>

      {/* Main completion card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-card to-amber-50/30 dark:from-emerald-950/40 dark:via-card dark:to-amber-950/20 border border-emerald-200 dark:border-emerald-900 p-6 text-center relative overflow-hidden">
        {/* Sparkle ring */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ["#059669", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"][i % 5],
              left: `${10 + (i * 7) % 80}%`,
              top: `${5 + (i * 11) % 40}%`,
            }}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0.5], y: [0, -30, 50] }}
            transition={{ delay: 0.5 + i * 0.1, duration: 1.5, repeat: 2 }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-5xl mb-3"
        >
          {isLessonComplete ? "🎓" : "🏆"}
        </motion.div>
        <h3 className="text-xl font-semibold text-emerald-dark dark:text-emerald-300">
          {isLessonComplete ? "Lezione completata!" : "Modulo completato!"}
        </h3>

        {/* Star rating based on performance */}
        {totalQuizzes > 0 && (
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 + i * 0.2, type: "spring", stiffness: 300 }}
                className="text-3xl"
              >
                {i < stars ? "⭐" : "☆"}
              </motion.span>
            ))}
          </div>
        )}

        {isLessonComplete && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
            Hai terminato tutti i moduli della Lezione {lessonNumber}!
          </p>
        )}

        {/* Lives remaining bonus */}
        {lives === 3 && totalQuizzes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-full px-3 py-1 mt-2"
          >
            <span>❤️❤️❤️</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-300">Vite intatte!</span>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className={`grid gap-3 mt-4 ${totalQuizzes > 0 && bestStreak >= 2 ? "grid-cols-3" : totalQuizzes > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{computeTotalModuleXp(xpEarned, xpReward)}</p>
            <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400/80 uppercase tracking-wider">{xpLabel} Totali</p>
          </div>
          {totalQuizzes > 0 && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correctAnswers}/{totalQuizzes}</p>
              <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400/80 uppercase tracking-wider">Quiz</p>
            </div>
          )}
          {bestStreak >= 2 && (
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 p-3">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{bestStreak}</p>
              <p className="text-[10px] font-bold text-orange-500 dark:text-orange-400/80 uppercase tracking-wider">Best Streak</p>
            </div>
          )}
        </div>

        {/* Achievement badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {correctAnswers === totalQuizzes && totalQuizzes >= 2 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 rounded-full px-3 py-1"
            >
              <span>🎯</span>
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300">Punteggio Perfetto</span>
            </motion.div>
          )}
          {bestStreak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 rounded-full px-3 py-1"
            >
              <span>🔥</span>
              <span className="text-xs font-bold text-orange-700 dark:text-orange-300">Streak {bestStreak}x</span>
            </motion.div>
          )}
          {xpEarned >= 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-full px-3 py-1"
            >
              <span>⚡</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">XP Master</span>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
