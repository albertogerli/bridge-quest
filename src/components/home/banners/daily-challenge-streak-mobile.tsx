"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { CheckCircle2, Flame, CalendarDays } from "lucide-react";
import { DailyCountdown } from "@/components/daily-countdown";

interface DailyChallengeStreakMobileProps {
  dailyDone: boolean;
  streak: number;
  streakAtRisk: boolean;
  dailyChallengeLabel: string;
}

export function DailyChallengeStreakMobile({
  dailyDone,
  streak,
  streakAtRisk,
  dailyChallengeLabel,
}: DailyChallengeStreakMobileProps) {
  return (
    <section className="px-4 sm:px-5 mt-4 relative z-10 lg:hidden">
      <div className="mx-auto max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          {/* Daily Challenge */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/gioca/sfida" className="block">
              <div className={`btn-squishy rounded-2xl p-4 cursor-pointer transition-colors ${
                dailyDone
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                  : "bg-card border border-border"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 border border-amber-200 dark:bg-amber-900/40 dark:border-amber-800" role="img" aria-label="Sfida del giorno">
                    {dailyDone ? <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" /> : <Flame className="w-5 h-5 text-amber-600" aria-hidden="true" />}
                  </div>
                  {!dailyDone && (
                    <span className="text-[12px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 rounded-full px-2 py-0.5">
                      +40 XP
                    </span>
                  )}
                </div>
                <p className="mt-2.5 text-sm font-bold text-foreground">
                  {dailyChallengeLabel}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {dailyDone ? "Completata!" : "Mano quotidiana"}
                </p>
                <div className="mt-2">
                  <DailyCountdown variant="compact" dailyDone={dailyDone} />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className={`btn-squishy rounded-2xl bg-card p-4 ${
              streakAtRisk
                ? "border-2 border-red-400 dark:border-red-500 animate-pulse"
                : "border border-border"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B5E3B]/10 dark:bg-emerald-900/40 border border-[#1B5E3B]/15 dark:border-emerald-800" role="img" aria-label="Streak giornaliero">
                  {streak >= 7 ? <Flame className="w-5 h-5 text-[#1B5E3B] dark:text-emerald-400" aria-hidden="true" /> : <CalendarDays className="w-5 h-5 text-[#1B5E3B] dark:text-emerald-400" aria-hidden="true" />}
                </div>
                {streak > 0 && (
                  <span className="text-[12px] font-bold text-[#1B5E3B] dark:text-emerald-400 bg-[#1B5E3B]/8 dark:bg-emerald-900/40 rounded-full px-2 py-0.5">
                    +{Math.min(streak * 5, 50)} XP
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-sm font-bold text-foreground">
                {streak} {streak === 1 ? "giorno" : "giorni"}
              </p>
              {streakAtRisk && (
                <p className="mt-1 text-[12px] font-semibold text-red-600 dark:text-red-400">
                  Streak a rischio!
                </p>
              )}
              <div className="mt-2 flex gap-1">
                {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
                  <div
                    key={i}
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold ${
                      i < Math.min(streak, 7)
                        ? "bg-[#1B5E3B] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
