"use client";

import { useState, useEffect } from "react";
import { getLevel, getXpInLevel, getLevelProgress } from "@/lib/xp-levels";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";

/**
 * Reads gamification stats (xp, streak, completed modules, daily challenge,
 * level) from localStorage. Awards the daily-login XP bonus on first visit
 * of each day and recomputes streak.
 *
 * NOTE: this hook is intentionally a thin localStorage wrapper. In a future
 * phase it will be replaced by a proper store (Zustand/Supabase), but the
 * external API (the returned object shape) should remain stable.
 */
export function useLocalStats() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [dailyDone, setDailyDone] = useState(false);
  const [dailyLoginAwarded, setDailyLoginAwarded] = useState(false);
  const [streakAtRisk, setStreakAtRisk] = useState(false);

  useEffect(() => {
    try {
      const currentXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
      const currentStreak = parseInt(localStorage.getItem("bq_streak") || "0", 10);
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedModules(JSON.parse(cm));

      // Check daily challenge
      const today = new Date().toISOString().slice(0, 10);
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);

      // Check if streak is at risk (>18h since last activity)
      const lastActivity = localStorage.getItem("bq_last_activity");
      if (lastActivity && currentStreak > 0) {
        const hoursAgo = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
        setStreakAtRisk(hoursAgo > 18);
      }

      // Daily login XP: award 10 XP + streak bonus on first visit per day
      const lastLogin = localStorage.getItem("bq_last_login");
      if (lastLogin !== today) {
        localStorage.setItem("bq_last_login", today);

        // Update streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = lastLogin === yesterday ? currentStreak + 1 : 1;
        localStorage.setItem("bq_streak", String(newStreak));

        // Award daily login XP: 10 base + 5 per streak day (max +50)
        const streakBonus = Math.min(newStreak * 5, 50);
        const dailyXp = 10 + streakBonus;
        const newXp = currentXp + dailyXp;
        localStorage.setItem("bq_xp", String(newXp));

        setXp(newXp);
        setStreak(newStreak);
        setDailyLoginAwarded(true);
      } else {
        setXp(currentXp);
        setStreak(currentStreak);
      }
    } catch {}
  }, []);

  const level = getLevel(xp);
  const xpInLevel = getXpInLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const profileKey = (typeof window !== "undefined" ? localStorage.getItem("bq_profile") : null) as UserProfile | null;
  const profileLevelNames = getProfileConfig(profileKey || "adulto").levelNames;
  const levelName = profileLevelNames[Math.min(level - 1, profileLevelNames.length - 1)];

  return { xp, streak, completedModules, level, xpInLevel, levelProgress, levelName, dailyDone, dailyLoginAwarded, streakAtRisk };
}
