"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseContract } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { formatDateShort, handResultFor, tournamentCtaLabel } from "@/lib/tournament-stats";
import { TOURNAMENT_HAND_COUNT, type TournamentResult } from "../_types";

/**
 * Card principale del torneo: stato della settimana, anteprima delle mani e
 * CTA di avvio/ripresa/rigioco.
 *
 * Tutti i conteggi seguono `tournamentHands.length`, non
 * `TOURNAMENT_HAND_COUNT`: se la pool ha meno mani del previsto la sequenza ne
 * gioca meno, e la hero deve raccontare la stessa cosa.
 *
 * Il `data-testid` `torneo-hands` è usato dai test E2E: non rinominarlo.
 */
export function TournamentHero({
  mounted,
  weekNum,
  start,
  end,
  alreadyPlayed,
  totalNeeded,
  countdown,
  tournamentHands,
  existingResult,
  inProgressCount,
  xpLabel,
  onPlay,
}: {
  mounted: boolean;
  weekNum: number;
  start: Date;
  end: Date;
  alreadyPlayed: boolean;
  totalNeeded: number;
  countdown: string;
  tournamentHands: Smazzata[];
  existingResult: TournamentResult | null;
  inProgressCount: number;
  xpLabel: string;
  onPlay: () => void;
}) {
  // Mani realmente in programma questa settimana; finché la pool non è
  // arrivata (0 mani, CTA disabilitata) si mostra il numero nominale.
  const handCount = tournamentHands.length;
  const displayCount = handCount || TOURNAMENT_HAND_COUNT;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/60 dark:border-indigo-900 p-6">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-200/15 blur-2xl" />

        <div className="relative">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-card shadow-md shadow-indigo-200/50 dark:shadow-none border border-indigo-100 dark:border-indigo-900">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground font-display">
                  Torneo Settimanale
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mounted
                    ? `Settimana #${weekNum} · ${formatDateShort(start)} - ${formatDateShort(end)}`
                    : ""}
                </p>
              </div>
            </div>
            {alreadyPlayed && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold border-0 shrink-0">
                Completato
              </Badge>
            )}
          </div>

          {/* Tournament info */}
          <div className="space-y-3 mt-2">
            <div className="inline-flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-indigo-100 dark:border-indigo-900 w-full">
              <div className="text-center flex-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Mani
                </p>
                <p className="text-lg font-bold text-indigo-600 leading-tight">
                  {displayCount}
                </p>
              </div>
              <div className="h-8 w-px bg-indigo-200/60" />
              <div className="text-center flex-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Prese necessarie
                </p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {totalNeeded}
                </p>
              </div>
              <div className="h-8 w-px bg-indigo-200/60" />
              <div className="text-center flex-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Tempo rimasto
                </p>
                <p className="text-sm font-bold text-purple-600 leading-tight tabular-nums">
                  {mounted ? countdown : "--"}
                </p>
              </div>
            </div>

            <p className="text-[13px] font-semibold text-foreground/80 leading-snug">
              Gioca {displayCount} mani selezionate: la stessa sfida per tutti i
              giocatori questa settimana. Vince chi totalizza più prese!
            </p>
          </div>

          {/* Hand previews */}
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Le {displayCount} mani del torneo
            </p>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${displayCount}, minmax(0, 1fr))` }}
              data-testid="torneo-hands"
            >
              {tournamentHands.map((h, i) => {
                const { tricksNeeded } = parseContract(h.contract);
                // Accoppiamento per smazzataId: per indice, un cambio del set
                // di mani farebbe slittare gli esiti su mani diverse.
                const handResult = handResultFor(existingResult?.handResults, h.id);
                return (
                  <div
                    key={h.id}
                    className={`rounded-xl px-2 py-2.5 text-center border ${
                      handResult
                        ? handResult.result >= 0
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"
                          : "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900"
                        : "bg-card/70 border-indigo-100 dark:border-indigo-900"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-muted-foreground">
                      #{i + 1}
                    </p>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {h.contract}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {tricksNeeded}p
                    </p>
                    {handResult && (
                      <p
                        className={`text-[10px] font-bold mt-0.5 ${
                          handResult.result >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {handResult.tricksMade}/{handResult.tricksNeeded}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* XP info */}
          {!alreadyPlayed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex items-center gap-2"
            >
              <div className="inline-flex items-center gap-1.5 bg-indigo-100/80 rounded-full px-3 py-1">
                <span className="text-xs">+150 {xpLabel}</span>
                <span className="text-[10px] font-bold text-indigo-700">
                  Bonus Torneo
                </span>
              </div>
            </motion.div>
          )}

          {/* CTA Button */}
          <div className="mt-5">
            {!alreadyPlayed ? (
              <Button
                onClick={onPlay}
                disabled={tournamentHands.length === 0}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-base font-bold h-14 shadow-lg shadow-indigo-600/25 transition-all hover:shadow-xl hover:shadow-indigo-600/30"
              >
                {tournamentCtaLabel(inProgressCount, displayCount)}
              </Button>
            ) : (
              <Button
                onClick={onPlay}
                variant="outline"
                className="w-full rounded-2xl text-sm font-bold h-12 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                Rigioca il torneo (senza punti)
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
