"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  xp: number;
  streak: number;
  modulesCompleted: number;
  handsPlayed: number;
  worldsCompleted: number;
}

export const allBadges: BadgeDef[] = [
  { id: "first_module", name: "Prima Presa", icon: "🃏", desc: "Completa il primo modulo", check: (s) => s.modulesCompleted >= 1 },
  { id: "student", name: "Studente", icon: "📖", desc: "Completa 5 moduli", check: (s) => s.modulesCompleted >= 5 },
  { id: "finesse", name: "Impasse Riuscita", icon: "🎯", desc: "Completa 10 moduli", check: (s) => s.modulesCompleted >= 10 },
  { id: "player_10", name: "Praticante", icon: "🎴", desc: "Gioca 10 mani", check: (s) => s.handsPlayed >= 10 },
  { id: "streak_7", name: "Streak 7gg", icon: "🔥", desc: "7 giorni di fila", check: (s) => s.streak >= 7 },
  { id: "advanced", name: "Colpo in Bianco", icon: "🎱", desc: "Completa 20 moduli", check: (s) => s.modulesCompleted >= 20 },
  { id: "veteran", name: "Veterano", icon: "🎖️", desc: "Gioca 50 mani", check: (s) => s.handsPlayed >= 50 },
  { id: "small_slam", name: "Piccolo Slam", icon: "⭐", desc: "Raggiungi 500 XP", check: (s) => s.xp >= 500 },
  { id: "world_done", name: "Mondo Completo", icon: "🌍", desc: "Completa un mondo intero", check: (s) => s.worldsCompleted >= 1 },
  { id: "grand_slam", name: "Grande Slam", icon: "👑", desc: "Raggiungi 2000 XP", check: (s) => s.xp >= 2000 },
];

function getEarnedBadgeIds(): Set<string> {
  try {
    const raw = localStorage.getItem("bq_badges");
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveEarnedBadgeIds(ids: Set<string>) {
  try {
    localStorage.setItem("bq_badges", JSON.stringify([...ids]));
  } catch {}
}

export function useAchievementChecker(stats: AchievementStats) {
  const [newBadge, setNewBadge] = useState<BadgeDef | null>(null);
  const [queue, setQueue] = useState<BadgeDef[]>([]);

  useEffect(() => {
    if (stats.xp === 0 && stats.modulesCompleted === 0 && stats.handsPlayed === 0) return;

    const earned = getEarnedBadgeIds();
    const newlyEarned: BadgeDef[] = [];

    for (const badge of allBadges) {
      if (!earned.has(badge.id) && badge.check(stats)) {
        earned.add(badge.id);
        newlyEarned.push(badge);
      }
    }

    if (newlyEarned.length > 0) {
      saveEarnedBadgeIds(earned);
      setQueue(newlyEarned);
    }
  }, [stats]);

  // Show badges one at a time from queue
  useEffect(() => {
    if (queue.length > 0 && !newBadge) {
      const [first, ...rest] = queue;
      setNewBadge(first);
      setQueue(rest);
    }
  }, [queue, newBadge]);

  const dismiss = useCallback(() => {
    setNewBadge(null);
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (newBadge) {
      const timer = setTimeout(dismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [newBadge, dismiss]);

  return { newBadge, dismiss };
}

export function AchievementPopup({
  badge,
  onDismiss,
}: {
  badge: BadgeDef | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]"
          onClick={onDismiss}
        >
          <div className="flex items-center gap-3 bg-white rounded-2xl card-clean px-5 py-3.5 cursor-pointer border border-amber-200">
            {/* Badge icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-2xl">
                {badge.icon}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Nuovo Achievement!
              </p>
              <p className="text-sm font-bold text-gray-900">{badge.name}</p>
              <p className="text-[11px] text-gray-500">{badge.desc}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
