"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { Smazzata } from "@/lib/catalog";
import { calcStars, computeHandTotals, computeTournamentXp } from "@/lib/tournament-stats";
import { type HandResult } from "../_types";

/** Massimo di prese ottenibili in una mano di bridge. */
const TRICKS_PER_HAND = 13;

/**
 * Schermata finale del torneo appena giocato (stelle, prese totali, XP).
 *
 * Tutti i totali usano le mani effettivamente giocate: con una pool più corta
 * di TOURNAMENT_HAND_COUNT la barra e il riepilogo davano numeri sbagliati.
 */
export function TournamentSummary({
  weekNum,
  hands,
  handResults,
  alreadyPlayed,
  xpLabel,
  onBack,
}: {
  weekNum: number;
  hands: Smazzata[];
  handResults: HandResult[];
  alreadyPlayed: boolean;
  xpLabel: string;
  onBack: () => void;
}) {
  const { totalTricks, totalNeeded } = computeHandTotals(handResults);
  const totalDelta = totalTricks - totalNeeded;
  const stars = calcStars(totalDelta);
  const playedCount = handResults.length;
  const maxTricks = Math.max(playedCount, 1) * TRICKS_PER_HAND;

  const { handXp, tournamentBonus, xpEarned } = computeTournamentXp(
    handResults,
    alreadyPlayed,
  );

  return (
    <div className="pt-6 px-5 pb-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className={`card-elevated rounded-3xl p-7 text-center ${
              totalDelta >= 0
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
            }`}
          >
            {/* Trophy / emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
              }}
              className="text-5xl mb-3"
            >
              {totalDelta >= 3 ? "🏆" : totalDelta >= 0 ? "🎉" : "😔"}
            </motion.div>

            {/* Star Rating */}
            <div className="flex justify-center gap-1.5 mb-4">
              {[1, 2, 3].map((star) => (
                <motion.span
                  key={star}
                  initial={{ opacity: 0, scale: 0, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.4 + star * 0.15,
                    type: "spring",
                    stiffness: 300,
                  }}
                  className={`text-3xl ${
                    star <= stars ? "" : "grayscale opacity-30"
                  }`}
                >
                  {"\u2B50"}
                </motion.span>
              ))}
            </div>

            <h2
              className={`text-2xl font-bold ${
                totalDelta >= 0 ? "text-emerald-dark" : "text-red-600"
              }`}
            >
              {totalDelta >= 3
                ? "Torneo Dominato!"
                : totalDelta > 0
                  ? `Torneo Vinto +${totalDelta}!`
                  : totalDelta === 0
                    ? "Torneo Completato!"
                    : `Caduto di ${Math.abs(totalDelta)}`}
            </h2>

            <p className="text-sm text-muted-foreground mt-2">
              Settimana #{weekNum} · {playedCount} mani giocate
            </p>

            {/* Total tricks */}
            <div className="mt-5 mx-auto max-w-xs">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                <span>Prese totali</span>
                <span>
                  {totalTricks} / {totalNeeded}
                </span>
              </div>
              <div className="h-4 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((totalTricks / maxTricks) * 100, 100)}%`,
                  }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className={`h-full rounded-full ${
                    totalDelta >= 0
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                />
              </div>
              <div className="relative h-0">
                <div
                  className="absolute -top-4 w-0.5 h-4 bg-foreground/40"
                  style={{
                    left: `${Math.min((totalNeeded / maxTricks) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Per-hand breakdown */}
            <div
              className="mt-6 grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.max(playedCount, 1)}, minmax(0, 1fr))` }}
            >
              {handResults.map((hr, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className={`rounded-xl p-2.5 ${
                    hr.result >= 0
                      ? "bg-emerald-100/80 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"
                      : "bg-red-100/80 border border-red-200 dark:bg-red-950/40 dark:border-red-900"
                  }`}
                >
                  <p className="text-[9px] font-bold text-muted-foreground">
                    #{i + 1}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {/* per id, non per indice: le mani possono non allinearsi */}
                    {hands.find((h) => h.id === hr.smazzataId)?.contract ?? "—"}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      hr.result >= 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {hr.tricksMade}/{hr.tricksNeeded}
                  </p>
                  <p
                    className={`text-[10px] font-bold ${
                      hr.result >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {hr.result >= 0 ? `+${hr.result}` : hr.result}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* XP Earned */}
            {!alreadyPlayed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="mt-6 space-y-2"
              >
                <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl px-5 py-2.5">
                  <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                    +{xpEarned} {xpLabel}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  ({handXp} gioco + {tournamentBonus} bonus torneo)
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-6 flex justify-center"
        >
          <Button
            onClick={onBack}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold h-12 px-8 shadow-lg shadow-indigo-600/25"
          >
            Torna al Torneo
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
