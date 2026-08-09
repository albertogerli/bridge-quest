"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Swords } from "lucide-react";
import type { ChallengeData, ChallengeStats } from "@/hooks/use-challenges";
import { challengeWinRate, describeChallenge } from "@/lib/profile-stats";

/** Accordion "Sfide IMP": riepilogo e ultime sfide completate. */
export function ChallengeHistorySection({
  userId,
  open,
  onToggle,
  challengeStats,
  challengeHistory,
}: {
  userId: string;
  open: boolean;
  onToggle: () => void;
  challengeStats: ChallengeStats | null;
  challengeHistory: ChallengeData[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.23 }}
      className="mt-4"
    >
      <button
        className="w-full rounded-2xl bg-card border-2 border-border p-4 text-left shadow-sm hover:shadow-lg transition-shadow"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900">
            <Swords className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Sfide IMP</p>
            <p className="text-[11px] text-muted-foreground">
              {challengeStats
                ? `${challengeStats.played} sfide · ${challengeStats.won} vinte · ${challengeWinRate(challengeStats)}%`
                : "Sfida un amico per iniziare"}
            </p>
          </div>
          <motion.svg
            className="h-5 w-5 text-muted-foreground shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            animate={{ rotate: open ? 90 : 0 }}
          >
            <polyline points="9,6 15,12 9,18" />
          </motion.svg>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {/* Stats summary */}
              {challengeStats && challengeStats.played > 0 && (
                <div className="grid grid-cols-4 gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 p-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{challengeStats.played}</p>
                    <p className="text-[10px] text-muted-foreground">Giocate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{challengeStats.won}</p>
                    <p className="text-[10px] text-muted-foreground">Vinte</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-500 dark:text-red-400">{challengeStats.lost}</p>
                    <p className="text-[10px] text-muted-foreground">Perse</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-figb dark:text-primary">{challengeStats.avg_imp_margin > 0 ? "+" : ""}{Math.round(challengeStats.avg_imp_margin)}</p>
                    <p className="text-[10px] text-muted-foreground">IMP medio</p>
                  </div>
                </div>
              )}

              {/* History list */}
              {challengeHistory.length > 0 ? (
                challengeHistory.map((ch) => {
                  const { opponentName, scored, won, drawn, netImp } = describeChallenge(ch, userId);
                  return (
                    <Link key={ch.id} href={`/gioca/sfida-imp?challengeId=${ch.id}`}>
                      <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                        {/* Sfida senza punteggi: non è un pareggio, è da finire */}
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          !scored ? "bg-muted text-muted-foreground/70" : drawn ? "bg-muted text-muted-foreground" : won ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400"
                        }`}>
                          {!scored ? "…" : drawn ? "=" : won ? "W" : "L"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">vs {opponentName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ch.board_count} mani · {ch.completed_at ? new Date(ch.completed_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {scored ? (
                            <p className={`text-sm font-bold ${netImp > 0 ? "text-emerald-600 dark:text-emerald-400" : netImp < 0 ? "text-red-500 dark:text-red-400" : "text-muted-foreground"}`}>
                              {netImp > 0 ? "+" : ""}{netImp} IMP
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-muted-foreground">
                              Da completare
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <Swords className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nessuna sfida completata</p>
                  <Link href="/amici" className="text-xs text-figb dark:text-primary font-semibold hover:underline mt-1 inline-block">
                    Sfida un amico →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
