"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { DailyFieldStats } from "@/hooks/use-daily-field";
import { resultHeadline } from "@/lib/daily-hand";
import type { DailyResult } from "../_types";

// Pannello di condivisione: esiste solo nella schermata di fine mano.
const ShareResult = dynamic(
  () => import("@/components/bridge/share-result").then((m) => m.ShareResult),
  { ssr: false },
);

/**
 * Esito della mano di oggi: stelle, prese, XP, confronto con il campo,
 * condivisione e rimando all'analisi AI.
 */
export function DailyResultCard({
  alreadyPlayed,
  todayResult,
  tricksNeeded,
  contract,
  fieldStats,
  xpLabel,
}: {
  alreadyPlayed: boolean;
  todayResult: DailyResult | null;
  tricksNeeded: number;
  contract: string;
  fieldStats: DailyFieldStats | null;
  xpLabel: string;
}) {
  return (
    <AnimatePresence>
      {alreadyPlayed && todayResult && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-5"
        >
          <div
            className={`card-elevated rounded-2xl p-6 text-center ${
              todayResult.made
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900"
                : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-900"
            }`}
          >
            {/* Star Rating */}
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map((star) => (
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
                    star <= todayResult.stars
                      ? ""
                      : "grayscale opacity-30"
                  }`}
                >
                  {"⭐"}
                </motion.span>
              ))}
            </div>

            <h3
              className={`text-xl font-bold ${
                todayResult.made ? "text-emerald-dark dark:text-emerald-300" : "text-red-600 dark:text-red-400"
              }`}
            >
              {resultHeadline(todayResult.result)}
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              Prese: {todayResult.tricks} / {tricksNeeded} necessarie
            </p>

            {/* Tricks breakdown bar */}
            <div className="mt-4 mx-auto max-w-xs">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((todayResult.tricks / 13) * 100, 100)}%`,
                  }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    todayResult.made
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                />
              </div>
              {/* Target line */}
              <div className="relative h-0">
                <div
                  className="absolute -top-3 w-0.5 h-3 bg-foreground/40"
                  style={{
                    left: `${(tricksNeeded / 13) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* XP earned */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-4 py-2">
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  +{todayResult.xpEarned} {xpLabel} guadagnati
                </span>
              </div>
            </div>

            {/* Come back tomorrow */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-muted-foreground mt-4"
            >
              Torna domani per una nuova mano!
            </motion.p>
          </div>

          {/* Field comparison: how the rest of today's players did */}
          {fieldStats && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 card-elevated rounded-2xl bg-card border border-border p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👥</span>
                <h4 className="text-sm font-bold text-foreground">
                  Il campo di oggi
                </h4>
                <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
                  {fieldStats.players} giocatori
                </span>
              </div>
              <p className="text-sm text-foreground/80">
                {fieldStats.percentile >= 50 ? (
                  <>
                    Hai fatto meglio del{" "}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {fieldStats.percentile}%
                    </span>{" "}
                    del campo!
                  </>
                ) : (
                  <>
                    Hai fatto meglio del{" "}
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {fieldStats.percentile}%
                    </span>{" "}
                    del campo — domani andrà meglio!
                  </>
                )}
              </p>
              <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, fieldStats.percentile)}%` }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    fieldStats.percentile >= 50
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-amber-400 to-amber-500"
                  }`}
                />
              </div>
              {fieldStats.best > todayResult.result && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Miglior risultato del campo:{" "}
                  {fieldStats.best >= 0 ? `+${fieldStats.best}` : fieldStats.best}
                </p>
              )}
            </motion.div>
          )}

          {/* Share Result */}
          <div className="mt-4">
            <ShareResult
              contract={contract}
              tricksMade={todayResult.tricks}
              tricksNeeded={tricksNeeded}
              result={todayResult.result}
              stars={todayResult.stars}
            />
          </div>

          {/* AI Analysis CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4"
          >
            <Link href="/gioca/analisi">
              <div className="card-elevated card-interactive rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-900 p-4 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Analizza con l&apos;AI</p>
                    <p className="text-[11px] text-muted-foreground">Scopri dove potevi migliorare</p>
                  </div>
                  <svg className="h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
