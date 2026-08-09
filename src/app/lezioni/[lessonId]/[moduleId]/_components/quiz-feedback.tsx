"use client";

import { motion } from "motion/react";
import type { ProfileConfig } from "@/hooks/use-profile";

/**
 * Esito della risposta al quiz a scelta multipla: ogni profilo ha la sua
 * celebrazione (junior sgargiante, senior pacata) e il suo incoraggiamento.
 */
export function QuizFeedback({
  isCorrect,
  correctStreak,
  profile,
  isJunior,
}: {
  isCorrect: boolean;
  correctStreak: number;
  profile: ProfileConfig;
  isJunior: boolean;
}) {
  if (isCorrect) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="space-y-2"
      >
        {/* Junior: HUGE celebration */}
        {isJunior ? (
          <div className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 flex items-center gap-3 shadow-lg shadow-purple-300">
            <motion.span
              className="text-3xl"
              animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.5, 1] }}
              transition={{ duration: 0.6, repeat: 1 }}
            >
              🌟
            </motion.span>
            <div>
              <p className="text-base font-bold text-white">
                {profile.correctMessages[correctStreak % profile.correctMessages.length]} +20 {profile.xpLabel}
              </p>
              {correctStreak >= 2 && (
                <p className="text-sm font-bold text-pink-100">
                  🔥 COMBO x{correctStreak}! +{correctStreak >= 3 ? 15 : 10} bonus!
                </p>
              )}
            </div>
          </div>
        ) : profile.profile === "giovane" ? (
          /* Giovane: big flashy correct */
          <div className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 p-3 flex items-center gap-3 shadow-lg shadow-amber-200">
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5 }}
            >
              ⚡
            </motion.span>
            <div>
              <p className="text-sm font-bold text-white">
                CORRETTO! +20 {profile.xpLabel}
              </p>
              {correctStreak >= 2 && (
                <p className="text-xs font-bold text-amber-100">
                  🔥 Combo x{correctStreak} — bonus +{correctStreak >= 3 ? 15 : 10}
                </p>
              )}
            </div>
          </div>
        ) : profile.profile === "adulto" ? (
          /* Adulto: Maestro Fiori encouragement */
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-sm shadow-md">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                {profile.correctMessages[correctStreak % profile.correctMessages.length]} +20 {profile.xpLabel}
              </p>
              {correctStreak >= 2 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Serie di {correctStreak} risposte!</p>
              )}
            </div>
          </div>
        ) : (
          /* Senior: calm, warm congratulation */
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 flex items-center gap-3">
            <span className="text-2xl">👏</span>
            <div>
              <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                Ottimo lavoro!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Hai guadagnato 20 {profile.xpLabel}. Continua al tuo ritmo.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: [-5, 5, -5, 0] }}
      animate={{ x: 0 }}
      className="space-y-2"
    >
      {isJunior ? (
        <div className="rounded-2xl bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200 p-4 flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.4 }}
          >
            💪
          </motion.span>
          <div>
            <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
              {profile.wrongMessage}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              Leggi la spiegazione — imparerai qualcosa di nuovo!
            </p>
          </div>
        </div>
      ) : profile.profile === "senior" ? (
        <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 p-4 flex items-center gap-3">
          <span className="text-2xl">🤗</span>
          <div>
            <p className="text-base font-semibold text-orange-800 dark:text-orange-300">
              {profile.wrongMessage}
            </p>
          </div>
        </div>
      ) : profile.profile === "giovane" ? (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 flex items-center gap-2">
          <span className="text-lg">💥</span>
          <p className="text-sm font-bold text-red-800 dark:text-red-300">
            {profile.wrongMessage}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-sm shadow-md">
            M
          </div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            {profile.wrongMessage}
          </p>
        </div>
      )}
    </motion.div>
  );
}
