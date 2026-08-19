"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { CelebrationCombo } from "@/components/celebration-effects";
import type { BridgeGameHook } from "@/hooks/use-bridge-game";
import { cardToString } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import {
  calcStars,
  computeDailyXp,
  formatContractItalian,
  formatVulnerability,
  resultHeadline,
  resultVerdict,
} from "@/lib/daily-hand";
import { useT } from "@/contexts/traduzioni-provider";
import { useCommento } from "@/hooks/use-commento";

// Pannello di condivisione: esiste solo nella schermata di fine mano.
const ShareResult = dynamic(
  () => import("@/components/bridge/share-result").then((m) => m.ShareResult),
  { ssr: false },
);

type GameOutcome = NonNullable<BridgeGameHook["result"]>;

/** Schermata di fine partita: esito, XP, commento del Maestro e riepilogo mano. */
export function DailyGameResult({
  smazzata,
  result,
  isDaily,
  alreadyPlayed,
  showCelebration,
  xpLabel,
}: {
  smazzata: Smazzata;
  result: GameOutcome;
  isDaily: boolean;
  alreadyPlayed: boolean;
  showCelebration: boolean;
  xpLabel: string;
}) {
  const t = useT();
  /**
   * Il commento della mano non viaggia più con il catalogo: lo si chiede, e
   * arriva solo se spetta. Vedi `src/lib/commenti-smazzate.ts`.
   */
  const commento = useCommento(smazzata);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mt-6 mx-auto max-w-6xl space-y-4"
    >
      <CelebrationCombo trigger={showCelebration} type={result.result >= 0 ? (result.result >= 2 ? 'epic' : 'medium') : 'small'} />
      {/* Main Result Card */}
      <div
        className={`card-elevated rounded-2xl p-6 text-center ${
          result.result >= 0
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900"
            : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-900"
        }`}
      >
        {/* Star Rating */}
        <div className="flex justify-center gap-1 mb-3">
          {[1, 2, 3].map((star) => {
            const stars = calcStars(result.result);
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
                className={`text-3xl ${star <= stars ? "" : "grayscale opacity-30"}`}
              >
                {"⭐"}
              </motion.span>
            );
          })}
        </div>

        <h3
          className={`text-xl font-bold ${
            result.result >= 0
              ? "text-emerald-dark dark:text-emerald-300"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {resultHeadline(result.result)}
        </h3>

        {/* Tricks bar */}
        <div className="mt-4 mx-auto max-w-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
            <span>{t("Prese fatte")}</span>
            <span>
              {result.tricksMade} / {result.tricksNeeded}{" "}
              necessarie
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((result.tricksMade / 13) * 100, 100)}%`,
              }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={`h-full rounded-full ${
                result.result >= 0
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-red-400 to-red-500"
              }`}
            />
          </div>
          <div className="relative h-0">
            <div
              className="absolute -top-3 w-0.5 h-3 bg-foreground/40"
              style={{
                left: `${(result.tricksNeeded / 13) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="bg-card/60 rounded-xl p-2.5">
            <p className="text-lg font-bold text-foreground">
              {result.tricksMade}
            </p>
            <p className="text-[12px] font-bold text-muted-foreground uppercase">
              {t("Prese")}
            </p>
          </div>
          <div className="bg-card/60 rounded-xl p-2.5">
            <p
              className={`text-lg font-bold ${result.result >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {result.result >= 0
                ? `+${result.result}`
                : result.result}
            </p>
            <p className="text-[12px] font-bold text-muted-foreground uppercase">
              {t("Risultato")}
            </p>
          </div>
          <div className="bg-card/60 rounded-xl p-2.5">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              +{computeDailyXp(result.result, isDaily && !alreadyPlayed)}
            </p>
            <p className="text-[12px] font-bold text-muted-foreground uppercase">
              {xpLabel}
            </p>
          </div>
        </div>

        {/* Daily bonus callout */}
        {isDaily && !alreadyPlayed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-3 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 rounded-full px-4 py-1.5"
          >
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              +50 {xpLabel} Bonus Mano del Giorno incluso!
            </span>
          </motion.div>
        )}

        {/* Verdict */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
            result.result > 0
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : result.result === 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                : result.result === -1
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
          }`}
        >
          {resultVerdict(result.result)}
        </motion.div>
      </div>

      {/* Commentary / Maestro tip */}
      {commento && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-elevated rounded-2xl bg-card p-5 border border-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-xs">
              M
            </div>
            <h4 className="text-sm font-bold text-foreground">
              {t("Analisi del Maestro")}
            </h4>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {commento}
          </p>
        </motion.div>
      )}

      {/* Hand summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card-elevated rounded-2xl bg-card p-5 border border-border"
      >
        <h4 className="text-sm font-bold text-foreground mb-3">
          {t("Riepilogo mano")}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("Contratto")}</span>
            <span className="font-bold text-foreground">
              {smazzata.contract}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("Dichiarante")}</span>
            <span className="font-bold text-foreground">
              {formatContractItalian(
                smazzata.contract,
                smazzata.declarer
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("Vulnerabilità")}</span>
            <span className="font-bold text-foreground">
              {formatVulnerability(smazzata.vulnerability)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("Attacco")}</span>
            <span className="font-bold text-foreground">
              {cardToString(smazzata.openingLead)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Share Result */}
      <ShareResult
        contract={smazzata.contract}
        tricksMade={result.tricksMade}
        tricksNeeded={result.tricksNeeded}
        result={result.result}
        stars={calcStars(result.result)}
      />
    </motion.div>
  );
}
