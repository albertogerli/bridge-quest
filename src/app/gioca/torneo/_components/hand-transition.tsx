"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { parseContract } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { computeHandTotals } from "@/lib/tournament-stats";
import { type HandResult } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Schermata fra una mano e la successiva: esito appena ottenuto e totale parziale.
 *
 * I conteggi seguono `hands.length` (pool più corta di TOURNAMENT_HAND_COUNT =
 * torneo più corto) e la mano successiva è letta in modo difensivo.
 */
export function HandTransition({
  hands,
  handResults,
  onNextHand,
  onBack,
}: {
  hands: Smazzata[];
  handResults: HandResult[];
  onNextHand: () => void;
  onBack: () => void;
}) {
  const t = useT();
  const lastResult = handResults[handResults.length - 1];
  const completedCount = handResults.length;
  const totalHands = hands.length;
  const nextHand = hands[completedCount];
  const { totalTricks, totalNeeded } = computeHandTotals(handResults);
  const delta = totalTricks - totalNeeded;

  return (
    <div className="pt-6 px-5 pb-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              {hands.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 max-w-12 rounded-full transition-colors ${
                    i < completedCount
                      ? handResults[i]?.result >= 0
                        ? "bg-emerald-400"
                        : "bg-red-400"
                      : i === completedCount
                        ? "bg-indigo-400"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-bold text-muted-foreground">
              {completedCount} / {totalHands} mani completate
            </p>
          </div>

          {/* Last hand result */}
          <div
            className={`rounded-2xl p-6 mb-6 ${
              lastResult.result >= 0
                ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"
                : "bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900"
            }`}
          >
            <p className="text-sm font-bold text-muted-foreground mb-1">
              Mano #{completedCount}
            </p>
            <p
              className={`text-2xl font-bold ${
                lastResult.result >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {lastResult.tricksMade} / {lastResult.tricksNeeded} prese
            </p>
            <p
              className={`text-sm font-bold mt-1 ${
                lastResult.result >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {lastResult.result >= 0
                ? lastResult.result === 0
                  ? "Contratto mantenuto!"
                  : `Fatto +${lastResult.result}!`
                : `Caduto di ${Math.abs(lastResult.result)}`}
            </p>
          </div>

          {/* Running total */}
          <div className="rounded-2xl bg-card p-4 border border-border mb-6">
            <p className="text-xs font-bold text-muted-foreground mb-1">
              {t("Totale parziale")}
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {totalTricks}
                </p>
                <p className="text-[12px] text-muted-foreground">{t("Prese fatte")}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {totalNeeded}
                </p>
                <p className="text-[12px] text-muted-foreground">{t("Necessarie")}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p
                  className={`text-lg font-bold ${
                    delta >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {delta >= 0 ? `+${delta}` : delta}
                </p>
                <p className="text-[12px] text-muted-foreground">{t("Bilancio")}</p>
              </div>
            </div>
          </div>

          {/* Next hand preview */}
          {nextHand && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 p-5 mb-6">
              <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-2">
                Prossima mano: #{completedCount + 1} di {totalHands}
              </p>
              <p className="text-lg font-bold text-foreground">
                {nextHand.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Contratto: {nextHand.contract} · Obiettivo:{" "}
                {parseContract(nextHand.contract).tricksNeeded} prese
              </p>
            </div>
          )}

          <Button
            onClick={onNextHand}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-base font-bold h-14 shadow-lg shadow-indigo-600/25"
          >
            Gioca Mano #{completedCount + 1}
          </Button>

          <button
            onClick={onBack}
            className="mt-3 text-sm font-semibold text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            {t("Abbandona torneo")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
