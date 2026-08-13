"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Sparkles } from "lucide-react";
import type { GameStats } from "@/hooks/use-game-history";
import { ProgressCharts } from "./progress-charts";
import type { CourseCompetence, GamePerformanceStats, GamesPerDay } from "../_types";

// Statistiche avanzate: vivono dentro un accordion chiuso di default, quindi
// non fanno parte del primo paint del profilo.
const StatsDashboard = dynamic(
  () => import("@/components/stats-dashboard").then((m) => m.StatsDashboard),
  { ssr: false },
);

/** Accordion "Statistiche Avanzate" + link a Bridge Wrapped. */
export function AdvancedStatsSection({
  open,
  onToggle,
  gameStats,
  gamesPerDay,
  courseCompetence,
  gamePerformanceStats,
}: {
  open: boolean;
  onToggle: () => void;
  gameStats: GameStats;
  gamesPerDay: GamesPerDay;
  courseCompetence: CourseCompetence[];
  gamePerformanceStats: GamePerformanceStats;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="mt-4"
    >
      <button
        onClick={onToggle}
        className="w-full rounded-2xl bg-card p-4 text-left border-2 border-border shadow-sm hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-figb text-white text-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Statistiche Avanzate</p>
            <p className="text-[12px] text-muted-foreground">
              {gameStats.totalGames > 0
                ? `${gameStats.totalGames} partite · ${gameStats.winRate}% vittorie`
                : "Gioca per sbloccare le statistiche"}
            </p>
          </div>
          <motion.svg
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <polyline points="9,6 15,12 9,18" />
          </motion.svg>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <StatsDashboard stats={gameStats} />

              {/* ===== Visual Progress Charts ===== */}
              <ProgressCharts
                gamesPerDay={gamesPerDay}
                courseCompetence={courseCompetence}
                gamePerformanceStats={gamePerformanceStats}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bridge Wrapped link */}
      <Link
        href="/profilo/wrapped"
        className="mt-3 w-full rounded-2xl bg-gradient-to-r from-gold-dark to-gold p-4 flex items-center gap-3 hover:shadow-lg transition-shadow"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Bridge Wrapped</p>
          <p className="text-[12px] text-white/70">Le tue statistiche del mese</p>
        </div>
        <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9,6 15,12 9,18" /></svg>
      </Link>
    </motion.div>
  );
}
