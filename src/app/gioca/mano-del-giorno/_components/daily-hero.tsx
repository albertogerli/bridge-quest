"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toGamePosition } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import {
  formatDate,
  formatVulnerability,
  positionLabelIt,
} from "@/lib/daily-hand";
import { HandFanPreview } from "./hand-fan-preview";

/**
 * Scheda principale: data, contratto della mano di oggi, anteprima della mano
 * di Sud e CTA di gioco (o di rigioco, se la giornata è già stata completata).
 */
export function DailyHero({
  mounted,
  today,
  todayHand,
  tricksNeeded,
  alreadyPlayed,
  xpLabel,
  onPlay,
}: {
  mounted: boolean;
  today: string;
  todayHand: Smazzata;
  tricksNeeded: number;
  alreadyPlayed: boolean;
  xpLabel: string;
  onPlay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-900 p-6">
        {/* Decorative circle */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-orange-200/15 blur-2xl" />

        <div className="relative">
          {/* Date + Calendar icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Calendar icon */}
              <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-card shadow-md shadow-amber-200/50 dark:shadow-none border border-amber-100 dark:border-amber-900">
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest leading-none">
                  {mounted
                    ? new Date().toLocaleDateString("it-IT", {
                        weekday: "short",
                      })
                    : ""}
                </span>
                <span className="text-2xl font-bold text-foreground leading-none mt-0.5">
                  {mounted ? new Date().getDate() : ""}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground font-display">
                  Mano del Giorno
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mounted ? formatDate(today) : ""}
                </p>
              </div>
            </div>
            {alreadyPlayed && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold border-0 shrink-0">
                Completata
              </Badge>
            )}
          </div>

          {/* Hand info + card preview */}
          <div className="flex gap-5 mt-2">
            {/* Contract and info */}
            <div className="flex-1 space-y-3">
              {/* Contract badge */}
              <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-amber-100 dark:border-amber-900">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Contratto
                  </p>
                  <p className="text-lg font-bold text-emerald-dark leading-tight">
                    {todayHand.contract}
                  </p>
                </div>
                <div className="h-8 w-px bg-amber-200/60" />
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Dichiarante
                  </p>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {positionLabelIt(todayHand.declarer)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-semibold">
                  Obiettivo: {tricksNeeded} prese
                </span>
                <span>
                  Vul: {formatVulnerability(todayHand.vulnerability)}
                </span>
              </div>

              <p className="text-[13px] font-semibold text-foreground/80 leading-snug">
                {todayHand.title}
              </p>
            </div>

            {/* South hand preview */}
            <div className="shrink-0 bg-card/70 backdrop-blur-sm rounded-2xl px-3.5 py-3 border border-amber-100 dark:border-amber-900 shadow-sm">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 text-center">
                La tua mano (Sud)
              </p>
              <HandFanPreview
                cards={
                  todayHand.hands[
                    toGamePosition("south", todayHand.declarer)
                  ]
                }
              />
            </div>
          </div>

          {/* XP Bonus badge */}
          {!alreadyPlayed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex items-center gap-2"
            >
              <div className="inline-flex items-center gap-1.5 bg-amber-100/80 rounded-full px-3 py-1">
                <span className="text-xs">+50 {xpLabel}</span>
                <span className="text-[10px] font-bold text-amber-700">
                  Bonus Giornaliero
                </span>
              </div>
            </motion.div>
          )}

          {/* CTA Button */}
          <div className="mt-5">
            {!alreadyPlayed ? (
              <Button
                onClick={onPlay}
                className="w-full rounded-2xl bg-emerald hover:bg-emerald-dark text-base font-bold h-14 shadow-lg shadow-emerald/25 transition-all hover:shadow-xl hover:shadow-emerald/30"
              >
                Gioca la Mano del Giorno
              </Button>
            ) : (
              <Button
                onClick={onPlay}
                variant="outline"
                className="w-full rounded-2xl text-sm font-bold h-12 border-emerald/30 text-emerald hover:bg-emerald-50"
              >
                Rigioca la mano di oggi
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
