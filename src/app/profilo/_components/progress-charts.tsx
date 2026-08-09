"use client";

import { motion } from "motion/react";
import { Clock, Flame, Gamepad2, TrendingUp } from "lucide-react";
import type { CourseCompetence, GamePerformanceStats, XpPerDay } from "../_types";

/** I tre grafici dentro l'accordion "Statistiche Avanzate". */
export function ProgressCharts({
  xpPerDay,
  courseCompetence,
  gamePerformanceStats,
}: {
  xpPerDay: XpPerDay;
  courseCompetence: CourseCompetence[];
  gamePerformanceStats: GamePerformanceStats;
}) {
  return (
    <div className="mt-4 space-y-4">

      {/* Chart 1: XP Progress Over Time (7-day bar chart) */}
      <div className="card-clean rounded-2xl bg-card p-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          XP ultimi 7 giorni
        </p>
        {xpPerDay.hasData ? (
          <div className="flex items-end gap-1 h-24">
            {xpPerDay.days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                {d.xp > 0 && (
                  <span className="text-[8px] font-bold text-muted-foreground mb-0.5">{d.xp}</span>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: Math.max((d.xp / xpPerDay.maxXp) * 80, d.xp > 0 ? 4 : 0) }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-full rounded-t bg-figb/70 dark:bg-primary/70"
                />
                <span className="text-[9px] text-muted-foreground mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 rounded-xl bg-muted">
            <p className="text-xs text-muted-foreground font-medium">
              Gioca di piu per vedere le statistiche
            </p>
          </div>
        )}
      </div>

      {/* Chart 2: Competenze (Course progress horizontal bars) */}
      <div className="card-clean rounded-2xl bg-card p-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Competenze per corso
        </p>
        <div className="space-y-3">
          {courseCompetence.map((course) => (
            <div key={course.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground/80">{course.name}</span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {course.completed}/{course.total} ({course.progress}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted border border-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: course.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 3: Game Performance (2x2 stat cards) */}
      <div className="card-clean rounded-2xl bg-card p-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Rendimento di gioco
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-3 text-center">
            <Gamepad2 className="w-5 h-5 text-figb dark:text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{gamePerformanceStats.totalGames}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Partite totali</p>
          </div>
          <div className="rounded-xl bg-muted p-3 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{gamePerformanceStats.bestStreak}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Streak migliore</p>
          </div>
          <div className="rounded-xl bg-muted p-3 text-center">
            <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{gamePerformanceStats.timeDisplay}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Tempo di gioco</p>
          </div>
          <div className="rounded-xl bg-muted p-3 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{gamePerformanceStats.avgXp}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Media XP/partita</p>
          </div>
        </div>
      </div>

    </div>
  );
}
