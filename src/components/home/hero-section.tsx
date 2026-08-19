"use client";

import { motion } from "motion/react";
import { useT } from "@/contexts/traduzioni-provider";
import Link from "next/link";
import { Zap, Target } from "lucide-react";

interface HeroStats {
  level: number;
  levelName: string;
  xp: number;
  streak: number;
  xpInLevel: number;
  levelProgress: number;
}

interface NextModule {
  lessonId: number;
  moduleId: string;
  moduleTitle: string;
  lessonIcon: string;
}

interface HeroSectionProps {
  stats: HeroStats;
  totalModulesCompleted: number;
  handsPlayed: number;
  hasStarted: boolean;
  nextModule: NextModule | null;
}

export function HeroSection({
  stats,
  totalModulesCompleted,
  handsPlayed,
  hasStarted,
  nextModule,
}: HeroSectionProps) {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1B5E3B] via-[#14472D] to-[#0D3321] px-4 sm:px-5 pb-20 pt-10 lg:pb-14 lg:pt-6">
      <div className="relative mx-auto max-w-lg">
        {/* Top row: brand + level badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/10 text-lg">🃏</div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight font-display">BridgeLab</h1>
              <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">FIGB</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-[#c8a44e]" aria-hidden="true" />
            <span className="text-xs font-bold text-white">Lv. {stats.level}</span>
            <span className="text-[12px] text-white/60">{stats.levelName}</span>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-5 grid grid-cols-4 gap-2 lg:hidden"
        >
          <div className="rounded-xl bg-white/10 border border-white/8 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-white leading-none">{stats.xp.toLocaleString()}</p>
            <p className="text-[12px] font-semibold text-white/50 uppercase mt-1">XP</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/8 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-white leading-none">{stats.streak}</p>
            <p className="text-[12px] font-semibold text-white/50 uppercase mt-1">{t("Streak")}</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/8 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-white leading-none">{totalModulesCompleted}</p>
            <p className="text-[12px] font-semibold text-white/50 uppercase mt-1">{t("Moduli")}</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/8 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-white leading-none">{handsPlayed}</p>
            <p className="text-[12px] font-semibold text-white/50 uppercase mt-1">Mani</p>
          </div>
        </motion.div>

        {/* XP progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-3 lg:hidden"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-semibold text-white/60">Livello {stats.level} → {stats.level + 1}</p>
            <p className="text-[12px] font-bold text-[#c8a44e]">{stats.xpInLevel} XP</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#c8a44e] to-[#e8c86e]"
              initial={{ width: 0 }}
              animate={{ width: `${stats.levelProgress}%` }}
              transition={{ delay: 0.4, duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Main CTA — squishy button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-5 lg:hidden"
        >
          {hasStarted && nextModule ? (
            <Link href={`/lezioni/${nextModule.lessonId}/${nextModule.moduleId}`}>
              <div className="btn-squishy btn-squishy-white w-full rounded-2xl bg-white px-5 py-3.5 cursor-pointer">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{nextModule.lessonIcon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[12px] font-bold text-[#1B5E3B]/60 uppercase tracking-wider">{t("Riprendi")}</p>
                    <p className="text-sm font-bold text-[#1B5E3B] truncate">{nextModule.moduleTitle}</p>
                  </div>
                  <svg className="h-5 w-5 text-[#1B5E3B]/40 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/lezioni">
              <div className="btn-squishy btn-squishy-white w-full h-14 rounded-2xl bg-white flex items-center justify-center gap-2 font-semibold text-base text-[#1B5E3B] cursor-pointer">
                <Target className="w-5 h-5" aria-hidden="true" />
                {t("Inizia il tuo viaggio")}
              </div>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Smooth gradient fade to background */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-background" aria-hidden="true" />
    </section>
  );
}
