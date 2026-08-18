"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry, TournamentResult } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Classifica settimanale (o messaggio di attesa quando non c'è ancora). */
export function TournamentLeaderboard({
  weekNum,
  leaderboard,
  alreadyPlayed,
  existingResult,
}: {
  weekNum: number;
  leaderboard: LeaderboardEntry[] | null;
  alreadyPlayed: boolean;
  existingResult: TournamentResult | null;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mt-5"
    >
      <div className="card-elevated rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">{t("Classifica")}</h3>
          <Badge
            variant="outline"
            className="text-[12px] font-bold text-muted-foreground border-border"
          >
            Settimana #{weekNum}
          </Badge>
        </div>

        {leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => {
              const delta = entry.totalTricks - entry.totalNeeded;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    i === 0
                      ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900"
                      : i === 1
                        ? "bg-muted border border-border"
                        : i === 2
                          ? "bg-orange-50 border border-orange-200 dark:bg-orange-950/40 dark:border-orange-900"
                          : "bg-muted/50"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-sm font-bold text-foreground/80 shadow-sm dark:shadow-none">
                    {i === 0
                      ? "\uD83E\uDD47"
                      : i === 1
                        ? "\uD83E\uDD48"
                        : i === 2
                          ? "\uD83E\uDD49"
                          : `${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {entry.displayName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {entry.totalTricks}/{entry.totalNeeded}
                    </p>
                    <p
                      className={`text-[12px] font-bold ${
                        delta >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {delta >= 0 ? `+${delta}` : delta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : leaderboard === null ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              {alreadyPlayed
                ? "Il tuo risultato è stato registrato!"
                : "Gioca il torneo per entrare in classifica"}
            </p>
            {alreadyPlayed && existingResult && (
              <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl px-4 py-2">
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {existingResult.totalTricks}/{existingResult.totalNeeded}{" "}
                  prese
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              {t("Nessun partecipante ancora questa settimana")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
