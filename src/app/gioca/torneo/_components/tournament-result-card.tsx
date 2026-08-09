"use client";

import { AnimatePresence, motion } from "motion/react";
import { calcStars } from "@/lib/tournament-stats";
import { TOURNAMENT_HAND_COUNT, type TournamentResult } from "../_types";

/** Riepilogo del torneo già concluso questa settimana (stelle, prese, XP). */
export function TournamentResultCard({
  alreadyPlayed,
  existingResult,
  xpLabel,
}: {
  alreadyPlayed: boolean;
  existingResult: TournamentResult | null;
  xpLabel: string;
}) {
  return (
    <AnimatePresence>
      {alreadyPlayed && existingResult && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-5"
        >
          <div
            className={`card-elevated rounded-2xl p-6 text-center ${
              existingResult.totalTricks >= existingResult.totalNeeded
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
            }`}
          >
            {/* Star Rating */}
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map((star) => {
                const totalDelta =
                  existingResult.totalTricks - existingResult.totalNeeded;
                const stars = calcStars(totalDelta);
                return (
                  <motion.span
                    key={star}
                    initial={{ opacity: 0, scale: 0, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.3 + star * 0.15,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className={`text-3xl ${
                      star <= stars ? "" : "grayscale opacity-30"
                    }`}
                  >
                    {"\u2B50"}
                  </motion.span>
                );
              })}
            </div>

            <h3
              className={`text-xl font-bold ${
                existingResult.totalTricks >= existingResult.totalNeeded
                  ? "text-emerald-dark"
                  : "text-red-600"
              }`}
            >
              {existingResult.totalTricks >= existingResult.totalNeeded
                ? existingResult.totalTricks > existingResult.totalNeeded
                  ? `Torneo Vinto +${existingResult.totalTricks - existingResult.totalNeeded}!`
                  : "Torneo Completato!"
                : `Caduto di ${existingResult.totalNeeded - existingResult.totalTricks}`}
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              Prese totali: {existingResult.totalTricks} /{" "}
              {existingResult.totalNeeded} necessarie
            </p>

            {/* Tricks bar */}
            <div className="mt-4 mx-auto max-w-xs">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((existingResult.totalTricks / (TOURNAMENT_HAND_COUNT * 13)) * 100, 100)}%`,
                  }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    existingResult.totalTricks >= existingResult.totalNeeded
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                />
              </div>
              <div className="relative h-0">
                <div
                  className="absolute -top-3 w-0.5 h-3 bg-foreground/40"
                  style={{
                    left: `${(existingResult.totalNeeded / (TOURNAMENT_HAND_COUNT * 13)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Per-hand breakdown */}
            <div className="mt-5 grid grid-cols-5 gap-2">
              {existingResult.handResults.map((hr, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 ${
                    hr.result >= 0 ? "bg-emerald-100/60 dark:bg-emerald-950/40" : "bg-red-100/60 dark:bg-red-950/40"
                  }`}
                >
                  <p className="text-[9px] font-bold text-muted-foreground">
                    #{i + 1}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      hr.result >= 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {hr.tricksMade}/{hr.tricksNeeded}
                  </p>
                  <p
                    className={`text-[9px] font-bold ${
                      hr.result >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {hr.result >= 0 ? `+${hr.result}` : hr.result}
                  </p>
                </div>
              ))}
            </div>

            {/* XP earned */}
            <div className="mt-5 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl px-4 py-2">
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  +{existingResult.xpEarned} {xpLabel} guadagnati
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
