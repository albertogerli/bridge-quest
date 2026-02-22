"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWeeklyObjectives } from "@/hooks/use-weekly-objectives";

// Sparkle particle for confetti effect
function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const colors = ["#059669", "#f59e0b", "#10b981", "#fbbf24", "#34d399", "#fcd34d"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 4 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        x: x * (0.5 + Math.random()),
        y: y * (0.5 + Math.random()) - 80,
        scale: [1, 1.2, 0],
        rotate: rotation + 360,
      }}
      transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: "easeOut" }}
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        left: "50%",
        top: "50%",
      }}
    />
  );
}

// Get current week number for display
function getWeekDisplay(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `Sett. ${week}`;
}

// Calculate time remaining until end of week (Sunday 23:59)
function getTimeRemaining(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  const diff = Math.max(0, endOfWeek.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export default function ObiettiviPage() {
  const { objectives, allCompleted, bonusClaimed, claimBonus, refreshProgress } = useWeeklyObjectives();
  const [showConfetti, setShowConfetti] = useState(false);
  const [bonusXp, setBonusXp] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);
  const weekDisplay = useMemo(() => getWeekDisplay(), []);

  useEffect(() => {
    setMounted(true);
    refreshProgress();
  }, [refreshProgress]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimBonus = useCallback(() => {
    const xp = claimBonus();
    if (xp) {
      setBonusXp(xp);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      setTimeout(() => setBonusXp(null), 3000);
    }
  }, [claimBonus]);

  // Confetti particles
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.4,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 200 - 100,
    }));
  }, []);

  const completedCount = objectives.filter((o) => o.completed).length;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f1219] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f1219]">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 pt-12 pb-10">
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm font-medium">Indietro</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl font-extrabold text-white tracking-tight"
              >
                Obiettivi Settimanali
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-emerald-100 mt-1 text-sm"
              >
                Completa tutti e 3 per il bonus
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <Badge className="bg-white/20 text-white font-extrabold text-sm px-3 py-1.5 backdrop-blur-sm border border-white/10 hover:bg-white/20">
                {weekDisplay}
              </Badge>
            </motion.div>
          </div>

          {/* Countdown timer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
              <span className="text-white/70 text-xs font-medium">Tempo rimasto:</span>
              <div className="flex items-center gap-1">
                <span className="bg-white/20 text-white font-black text-xs rounded-md px-1.5 py-0.5 min-w-[24px] text-center">
                  {timeRemaining.days}g
                </span>
                <span className="text-white/50 text-xs">:</span>
                <span className="bg-white/20 text-white font-black text-xs rounded-md px-1.5 py-0.5 min-w-[24px] text-center">
                  {timeRemaining.hours}h
                </span>
                <span className="text-white/50 text-xs">:</span>
                <span className="bg-white/20 text-white font-black text-xs rounded-md px-1.5 py-0.5 min-w-[24px] text-center">
                  {timeRemaining.minutes}m
                </span>
              </div>
            </div>
            <Badge className="bg-white/15 text-white/90 text-[10px] font-bold hover:bg-white/15 border border-white/10">
              {completedCount}/3
            </Badge>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-5 pb-28 space-y-4">
        {/* Overall progress mini bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card-elevated bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-extrabold text-gray-900">Progresso Globale</p>
            <p className="text-xs font-bold text-gray-400">
              {completedCount} di 3 completati
            </p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    i < completedCount
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      : "bg-gray-100"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: i < completedCount ? "100%" : "0%" }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Objective cards */}
        {objectives.map((obj, i) => {
          const progressPercent = obj.target > 0 ? Math.round((obj.current / obj.target) * 100) : 0;

          return (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
              className={`card-elevated rounded-2xl bg-white p-5 shadow-sm border transition-all duration-300 ${
                obj.completed
                  ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Emoji + completion indicator */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-300 ${
                      obj.completed
                        ? "bg-emerald-100 shadow-sm shadow-emerald-200/50"
                        : "bg-gray-50"
                    }`}
                  >
                    {obj.emoji}
                  </div>
                  {obj.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.3 + i * 0.1 }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-300/50"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`font-extrabold text-base ${
                        obj.completed ? "text-emerald-700" : "text-gray-900"
                      }`}
                    >
                      {obj.title}
                    </h3>
                    <Badge
                      className={`text-[10px] font-bold shrink-0 ml-2 ${
                        obj.completed
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      +{obj.xpReward} XP
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{obj.description}</p>

                  {/* Progress bar */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          obj.completed ? "text-emerald-600" : "text-gray-600"
                        }`}
                      >
                        {obj.current} / {obj.target}
                      </span>
                      <span
                        className={`text-[11px] font-bold tabular-nums ${
                          obj.completed ? "text-emerald-500" : "text-gray-400"
                        }`}
                      >
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          obj.completed
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : "bg-gradient-to-r from-amber-400 to-amber-300"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Bonus card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative"
        >
          <div
            className={`card-elevated rounded-2xl overflow-hidden transition-all duration-500 ${
              bonusClaimed
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200"
                : allCompleted
                  ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-200"
                  : "bg-white border border-gray-100"
            }`}
          >
            {/* Pulsing glow for claimable state */}
            {allCompleted && !bonusClaimed && (
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-amber-200/30 via-yellow-200/20 to-amber-200/30 rounded-2xl"
              />
            )}

            <div className="relative p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-all duration-500 ${
                    bonusClaimed
                      ? "bg-emerald-100"
                      : allCompleted
                        ? "bg-amber-100 shadow-md shadow-amber-200/50"
                        : "bg-gray-50"
                  }`}
                >
                  {bonusClaimed ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      🏆
                    </motion.span>
                  ) : allCompleted ? (
                    <motion.span
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    >
                      🎁
                    </motion.span>
                  ) : (
                    <span className="opacity-40">🎁</span>
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={`font-extrabold text-lg ${
                      bonusClaimed
                        ? "text-emerald-700"
                        : allCompleted
                          ? "text-amber-700"
                          : "text-gray-400"
                    }`}
                  >
                    {bonusClaimed ? "Bonus Riscosso!" : "Bonus Settimanale"}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      bonusClaimed
                        ? "text-emerald-600"
                        : allCompleted
                          ? "text-amber-600"
                          : "text-gray-400"
                    }`}
                  >
                    {bonusClaimed
                      ? "Complimenti, ci vediamo la prossima settimana!"
                      : allCompleted
                        ? "Tutti gli obiettivi completati! Riscuoti il premio"
                        : `Completa tutti e 3 gli obiettivi (${completedCount}/3)`}
                  </p>
                </div>
              </div>

              {/* Claim button or completed state */}
              <div className="mt-4">
                {bonusClaimed ? (
                  <div className="flex items-center justify-center gap-2 bg-emerald-100 rounded-xl py-3">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm font-bold text-emerald-700">
                      +100 XP riscossi
                    </span>
                  </div>
                ) : allCompleted ? (
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Button
                      onClick={handleClaimBonus}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-extrabold text-base shadow-lg shadow-amber-300/40 transition-all duration-200 active:scale-[0.98]"
                    >
                      <span className="mr-2">🎉</span>
                      Riscuoti +100 XP Bonus
                    </Button>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-sm font-bold text-gray-400">
                      +100 XP bloccati
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confetti overlay */}
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
              >
                {confettiParticles.map((p) => (
                  <Sparkle key={p.id} delay={p.delay} x={p.x} y={p.y} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* XP earned floating text */}
          <AnimatePresence>
            {bonusXp !== null && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -60, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.8 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10"
              >
                <span className="text-3xl font-black text-amber-500 drop-shadow-lg">
                  +{bonusXp} XP
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Motivational tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center pt-4 pb-2"
        >
          <p className="text-xs text-gray-400">
            {allCompleted && bonusClaimed
              ? "Tutti gli obiettivi completati! Torna lunedi per nuove sfide."
              : allCompleted
                ? "Incredibile! Hai completato tutto. Riscuoti il tuo premio!"
                : "Gli obiettivi si rinnovano ogni lunedi. Buona fortuna!"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
