"use client";

/**
 * FIGB Bridge LAB - Weekly Challenge Banner Component
 * Shows current weekly challenge with progress, timer, and CTA
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Clock, Trophy, Zap } from "lucide-react";
import {
  getCurrentWeeklyChallenge,
  getTimeRemainingInWeek,
  getWeeklyChallengeProgress,
} from "@/data/weekly-challenges";

interface WeeklyChallengeBannerProps {
  compact?: boolean;
}

export function WeeklyChallengeBanner({ compact = false }: WeeklyChallengeBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  const challenge = getCurrentWeeklyChallenge();
  const progress = getWeeklyChallengeProgress();

  // Update timer every minute
  useEffect(() => {
    setMounted(true);
    const updateTimer = () => {
      setTimeRemaining(getTimeRemainingInWeek());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null; // Prevent SSR mismatch
  }

  const progressPercent = (progress.played / progress.target) * 100;

  // Compact version for homepage
  if (compact) {
    return (
      <Link href="/gioca/sfida-settimanale">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card-clean rounded-2xl p-4 bg-gradient-to-r ${challenge.gradient} text-white hover:shadow-lg transition-shadow cursor-pointer`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-3xl flex-shrink-0">{challenge.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{challenge.name}</h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span>{progress.played}/{progress.target} mani</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeRemaining.days}g {timeRemaining.hours}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Multiplier Badge */}
            <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              {challenge.xpMultiplier}x XP
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-white h-full rounded-full"
            />
          </div>
        </motion.div>
      </Link>
    );
  }

  // Full version for /gioca page
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-clean rounded-2xl p-6 bg-gradient-to-br ${challenge.gradient} text-white`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{challenge.icon}</div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{challenge.name}</h2>
            <p className="text-white/90 text-base">{challenge.description}</p>
          </div>
        </div>

        {/* XP Multiplier Badge */}
        <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {challenge.xpMultiplier}x XP
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">Progresso settimanale</span>
          </div>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {progress.played}/{progress.target} mani completate
          </span>
        </div>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white h-full rounded-full"
          />
        </div>

        {progress.completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2"
          >
            <Trophy className="h-5 w-5 text-yellow-300" />
            <span className="font-semibold">Sfida completata! Badge "{challenge.badgeName}" sbloccato!</span>
          </motion.div>
        )}
      </div>

      {/* Timer + CTA */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
          <Clock className="h-4 w-4" />
          <span>
            Scade tra: {timeRemaining.days}g {timeRemaining.hours}h {timeRemaining.minutes}m
          </span>
        </div>

        <Link href="/gioca/sfida-settimanale" className="flex-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white text-gray-900 font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-shadow"
          >
            {progress.played === 0 ? "Inizia la Sfida" : progress.completed ? "Rivedi le Mani" : "Continua"}
          </motion.button>
        </Link>
      </div>

      {/* Tips Section (collapsible) */}
      <div className="border-t border-white/20 pt-4">
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold flex items-center gap-2">
            💡 Suggerimenti per questa settimana
          </span>
          {showTips ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showTips && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 text-sm text-white/90"
          >
            {challenge.tips.map((tip, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-white/60">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>

      {/* XP Earned Display */}
      {progress.xpEarned > 0 && (
        <div className="mt-4 text-center text-sm bg-white/10 backdrop-blur-sm rounded-lg py-2">
          <span className="opacity-90">XP guadagnati questa settimana: </span>
          <span className="font-bold text-lg">{progress.xpEarned} XP</span>
        </div>
      )}
    </motion.div>
  );
}
