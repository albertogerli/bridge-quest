"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Snowflake, Shield, Coins } from "lucide-react";

interface StreakFreezeCardProps {
  streak: number;
  xp: number;
  onFreeze?: () => void;
}

const FREEZE_COST = 30;
const MAX_FREEZES_PER_WEEK = 3;

export function isStreakFrozenToday(): boolean {
  if (typeof window === "undefined") return false;
  const frozenDate = localStorage.getItem("bq_streak_freeze_date");
  if (!frozenDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return frozenDate === today;
}

function getAvailableFiches(xp: number): number {
  const storedFiches = localStorage.getItem("bq_fiches");
  if (storedFiches) {
    return parseInt(storedFiches, 10);
  }
  return Math.floor(xp / 10);
}

function getFreezesRemaining(): number {
  const stored = localStorage.getItem("bq_streak_freezes_remaining");
  const lastReset = localStorage.getItem("bq_streak_freezes_reset_date");
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // Get this week's Monday
  const mondayStr = monday.toISOString().split("T")[0];

  // Reset if it's a new week
  if (lastReset !== mondayStr) {
    localStorage.setItem("bq_streak_freezes_remaining", MAX_FREEZES_PER_WEEK.toString());
    localStorage.setItem("bq_streak_freezes_reset_date", mondayStr);
    return MAX_FREEZES_PER_WEEK;
  }

  return stored ? parseInt(stored, 10) : MAX_FREEZES_PER_WEEK;
}

function decrementFreezes(): void {
  const current = getFreezesRemaining();
  localStorage.setItem("bq_streak_freezes_remaining", Math.max(0, current - 1).toString());
}

export function StreakFreezeCard({ streak, xp, onFreeze }: StreakFreezeCardProps) {
  const [isFrozen, setIsFrozen] = useState(false);
  const [availableFiches, setAvailableFiches] = useState(0);
  const [freezesRemaining, setFreezesRemaining] = useState(MAX_FREEZES_PER_WEEK);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setIsFrozen(isStreakFrozenToday());
    setAvailableFiches(getAvailableFiches(xp));
    setFreezesRemaining(getFreezesRemaining());
  }, [xp]);

  const handleFreeze = () => {
    const fiches = getAvailableFiches(xp);
    const freezes = getFreezesRemaining();

    if (fiches < FREEZE_COST) return;
    if (freezes <= 0) return;
    if (isFrozen) return;

    // Deduct fiches
    const newFiches = fiches - FREEZE_COST;
    localStorage.setItem("bq_fiches", newFiches.toString());
    setAvailableFiches(newFiches);

    // Set freeze date
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("bq_streak_freeze_date", today);
    setIsFrozen(true);

    // Decrement freezes
    decrementFreezes();
    setFreezesRemaining(getFreezesRemaining());

    // Show success animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Call callback
    onFreeze?.();
  };

  const canAfford = availableFiches >= FREEZE_COST;
  const hasFreezesLeft = freezesRemaining > 0;
  const canFreeze = canAfford && hasFreezesLeft && !isFrozen;

  return (
    <motion.div
      className="card-clean rounded-2xl p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Gradient border effect */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-20 blur-xl transition-colors duration-500 ${
          isFrozen
            ? "bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500"
            : "bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500"
        }`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {isFrozen ? (
                <motion.div
                  key="frozen"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-blue-500"
                >
                  <Snowflake className="w-8 h-8" />
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.8, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-orange-500"
                  >
                    <Flame className="w-8 h-8" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <h3 className="font-bold text-lg">Streak Attuale</h3>
              <p className="text-2xl font-bold text-[#003DA5]">
                {streak} {streak === 1 ? "giorno" : "giorni"} 🔥
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Congeli rimasti</p>
            <p className="text-lg font-bold text-[#003DA5]">
              {freezesRemaining}/{MAX_FREEZES_PER_WEEK}
            </p>
          </div>
        </div>

        {/* Status / Action */}
        <AnimatePresence mode="wait">
          {isFrozen ? (
            <motion.div
              key="frozen-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200"
            >
              <Shield className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">
                  Streak protetto per oggi ❄️
                </p>
                <p className="text-sm text-blue-700">
                  Puoi saltare oggi senza perdere la tua serie
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="freeze-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {!hasFreezesLeft && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    Hai esaurito i congeli settimanali. Riprova lunedì!
                  </p>
                </div>
              )}

              <button
                onClick={handleFreeze}
                disabled={!canFreeze}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  canFreeze
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Snowflake className="w-5 h-5" />
                <span>Congela Streak</span>
                <span className="flex items-center gap-1">
                  {FREEZE_COST} <Coins className="w-4 h-4" />
                </span>
              </button>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Le tue fiches:</span>
                <span
                  className={`font-bold ${
                    canAfford ? "text-[#003DA5]" : "text-red-500"
                  }`}
                >
                  {availableFiches} 🪙
                </span>
              </div>

              {!canAfford && hasFreezesLeft && (
                <p className="text-sm text-red-600 text-center">
                  Fiches insufficienti! Ti servono ancora{" "}
                  {FREEZE_COST - availableFiches} fiches.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center"
              >
                <Snowflake className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-blue-900">
                  Streak Congelato! ❄️
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
