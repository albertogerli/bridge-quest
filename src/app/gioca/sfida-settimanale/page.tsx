"use client";

/**
 * FIGB Bridge LAB - Weekly Challenge Page
 * Dedicated page for the weekly themed challenge with progress tracking
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, Trophy, Zap, Clock, Play, CheckCircle2, Target } from "lucide-react";
import {
  getCurrentWeeklyChallenge,
  getTimeRemainingInWeek,
  getWeeklyChallengeProgress,
  isCurrentWeekBadgeUnlocked,
} from "@/data/weekly-challenges";

export default function SfidaSettimanale() {
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  const challenge = getCurrentWeeklyChallenge();
  const progress = getWeeklyChallengeProgress();
  const badgeUnlocked = isCurrentWeekBadgeUnlocked();

  // Update timer every minute
  useEffect(() => {
    setMounted(true);
    const updateTimer = () => {
      setTimeRemaining(getTimeRemainingInWeek());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null; // Prevent SSR mismatch
  }

  const progressPercent = (progress.played / progress.target) * 100;

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="container-safe mx-auto max-w-4xl">
        {/* Back Button */}
        <Link href="/gioca">
          <motion.button
            whileHover={{ x: -4 }}
            className="flex items-center gap-2 text-gray-600 hover:text-[#003DA5] mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Torna al Gioco</span>
          </motion.button>
        </Link>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card-clean rounded-2xl p-8 bg-gradient-to-br ${challenge.gradient} text-white mb-8`}
        >
          <div className="flex items-start gap-6 mb-6">
            <div className="text-6xl">{challenge.icon}</div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{challenge.name}</h1>
              <p className="text-xl text-white/90 mb-4">{challenge.description}</p>

              {/* Timer + XP Multiplier */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Scade tra: {timeRemaining.days}g {timeRemaining.hours}h {timeRemaining.minutes}m
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Zap className="h-5 w-5" />
                  <span className="font-bold">{challenge.xpMultiplier}x XP questa settimana!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <span className="font-semibold text-lg">Progresso</span>
              </div>
              <span className="text-2xl font-bold">
                {progress.played}/{progress.target}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-4 overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white h-full rounded-full"
              />
            </div>

            <p className="text-sm text-white/80">
              {progress.completed
                ? "Hai completato la sfida settimanale!"
                : `Ancora ${progress.target - progress.played} ${progress.target - progress.played === 1 ? "mano" : "mani"} per completare la sfida`}
            </p>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-clean rounded-2xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            💡 Suggerimenti per questa settimana
          </h2>

          <ul className="space-y-3">
            {challenge.tips.map((tip, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex gap-3 items-start"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-[#003DA5] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <span className="text-gray-700 leading-relaxed">{tip}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Play Button */}
        {!progress.completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link href="/gioca/smazzata">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#003DA5] text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg transition-shadow flex items-center justify-center gap-3 text-lg"
              >
                <Play className="h-6 w-6" />
                Gioca una Mano
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Results Section */}
        {progress.completedHands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-clean rounded-2xl p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 Mani Completate
            </h2>

            <div className="space-y-3">
              {progress.completedHands.map((hand, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Mano #{idx + 1}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(hand.completedAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">Punteggio: {hand.score}</p>
                    <p className="text-sm text-[#003DA5] font-semibold">+{hand.xpGained} XP</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Total XP */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
              <p className="text-gray-700 mb-1">XP totali guadagnati questa settimana</p>
              <p className="text-3xl font-bold text-[#003DA5]">{progress.xpEarned} XP</p>
            </div>
          </motion.div>
        )}

        {/* Badge Preview/Unlocked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`card-clean rounded-2xl p-8 text-center ${
            badgeUnlocked
              ? `bg-gradient-to-br ${challenge.gradient} text-white`
              : "bg-gradient-to-br from-gray-100 to-gray-200"
          }`}
        >
          <Trophy className={`h-16 w-16 mx-auto mb-4 ${badgeUnlocked ? "text-yellow-300" : "text-gray-400"}`} />

          <h2 className={`text-2xl font-bold mb-2 ${badgeUnlocked ? "text-white" : "text-gray-900"}`}>
            {badgeUnlocked ? "Badge Sbloccato!" : "Badge Esclusivo"}
          </h2>

          <p className={`text-xl font-semibold mb-4 ${badgeUnlocked ? "text-white/90" : "text-gray-700"}`}>
            {challenge.badgeName}
          </p>

          {badgeUnlocked ? (
            <p className="text-white/80">
              Congratulazioni! Hai completato la sfida settimanale e sbloccato questo badge esclusivo.
            </p>
          ) : (
            <p className="text-gray-600">
              Completa 5/5 mani per sbloccare il badge "{challenge.badgeName}"
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
