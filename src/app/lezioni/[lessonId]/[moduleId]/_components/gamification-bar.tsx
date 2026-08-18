"use client";

import { motion } from "motion/react";
import type { Powerups } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Vite, moltiplicatore XP e power-up disponibili. Compare solo nei moduli con
 * almeno un blocco interattivo; sotto, l'avviso di vite esaurite.
 */
export function GamificationBar({
  totalQuizzes,
  lives,
  livesLost,
  xpMultiplier,
  powerups,
  showTimer,
}: {
  totalQuizzes: number;
  lives: number;
  livesLost: boolean;
  xpMultiplier: number;
  powerups: Powerups;
  showTimer: boolean;
}) {
  const t = useT();
  return (
    <>
      {/* === GAMIFICATION BAR: Hearts + Multiplier + Power-ups === */}
      {totalQuizzes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5 flex items-center justify-between"
        >
          {/* Lives (hearts) */}
          <motion.div
            animate={livesLost ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="text-xl"
                animate={i >= lives ? { scale: [1, 0.5], opacity: [1, 0.3] } : {}}
              >
                {i < lives ? "❤️" : "🖤"}
              </motion.span>
            ))}
          </motion.div>

          {/* XP Multiplier */}
          {xpMultiplier > 1 && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`flex items-center gap-1 rounded-full px-3 py-1 font-bold text-sm shadow-lg ${
                xpMultiplier >= 3
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-200"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-amber-200"
              }`}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {xpMultiplier >= 3 ? "🔥" : "⚡"}
              </motion.span>
              {xpMultiplier}x XP
            </motion.div>
          )}

          {/* Power-ups */}
          <div className="flex items-center gap-1.5">
            {powerups.fiftyFifty > 0 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 cursor-pointer" title="50/50">
                50
              </div>
            )}
            {powerups.skip > 0 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-sm cursor-pointer" title="Salta">
                ⏭️
              </div>
            )}
            {showTimer && powerups.extraTime > 0 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 text-sm cursor-pointer" title="+15s">
                ⏰
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Game over (0 lives) */}
      {lives === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-900 p-5 text-center"
        >
          <span className="text-3xl">💔</span>
          <p className="text-base font-bold text-red-800 dark:text-red-300 mt-2">{t("Vite esaurite!")}</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{t("Puoi continuare, ma non guadagnerai XP bonus.")}</p>
        </motion.div>
      )}
    </>
  );
}
