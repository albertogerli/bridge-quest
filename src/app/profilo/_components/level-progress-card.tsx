"use client";

import { motion } from "motion/react";
import { Flame, Star, Zap } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";

/** Card scura con anello di progresso del livello, streak e XP totali. */
export function LevelProgressCard({
  level,
  levelName,
  nextLevelName,
  streak,
  levelProgress,
  xpInLevel,
  xpForNext,
  xp,
}: {
  level: number;
  levelName: string;
  nextLevelName: string;
  streak: number;
  levelProgress: number;
  xpInLevel: number;
  xpForNext: number;
  xp: number;
}) {
  const t = useT();
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-6 rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-xl"
      style={{ background: "linear-gradient(180deg, #1a3a4a 0%, #15302e 100%)" }}
    >
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-white">Livello {level} — {levelName}</h2>
        <p className="text-sm text-[#8da4b8] mt-0.5">Prossimo livello: {nextLevelName}</p>
      </div>
      <div className="flex items-center justify-between">
        {/* Streak */}
        <div className="flex flex-col items-center w-1/4">
          <Flame className="w-7 h-7 text-orange-500 mb-1.5" style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.7))" }} />
          <p className="text-[12px] text-gray-400 font-medium">{t("Streak")}</p>
          <p className="font-bold text-white">{streak} gg</p>
        </div>
        {/* Progress Ring */}
        <div className="relative flex items-center justify-center w-2/4">
          <svg className="w-32 h-32" viewBox="0 0 120 120">
            <circle cx="60" cy="60" fill="transparent" r="50" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" fill="transparent" r="50"
              stroke="#22c55e"
              strokeWidth="8"
              strokeDasharray="314"
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", filter: "drop-shadow(0 0 6px rgba(34,197,94,0.5))" }}
              initial={{ strokeDashoffset: 314 }}
              animate={{ strokeDashoffset: 314 * (1 - levelProgress / 100) }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <Zap className="w-3.5 h-3.5 text-gray-400 mb-0.5" />
            <span className="text-[28px] font-bold text-white leading-none">{levelProgress}%</span>
            <span className="text-xs text-gray-400 mt-0.5">{xpInLevel.toLocaleString()} / {xpForNext.toLocaleString()}</span>
          </div>
        </div>
        {/* Total XP */}
        <div className="flex flex-col items-center w-1/4">
          <Star className="w-7 h-7 text-yellow-400 mb-1.5" style={{ filter: "drop-shadow(0 0 8px rgba(250,204,21,0.7))" }} />
          <p className="text-[12px] text-gray-400 font-medium">{t("Totale XP")}</p>
          <p className="font-bold text-white">{xp.toLocaleString("it-IT")}</p>
        </div>
      </div>
    </motion.section>
  );
}
