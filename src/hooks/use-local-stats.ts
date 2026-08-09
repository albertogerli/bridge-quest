"use client";

import { useEffect, useState } from "react";
import {
  getLevel,
  getXpInLevel,
  getLevelProgress,
  getXpForNextLevel,
  getXpToNextLevel,
} from "@/lib/xp-levels";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { useGameStore, useHasHydrated } from "@/store/use-game-store";
import { useCatalog } from "@/store/use-catalog-store";

/**
 * Canonical "player stats" reader. Subscribes to the Zustand
 * `useGameStore` and exposes:
 *  - raw store fields: xp, streak, completedModules, handsPlayed
 *  - derived display fields: level, xpInLevel, levelProgress,
 *    xpNeededForNext, xpToNext, levelName, totalModulesCompleted,
 *    totalModulesAvailable, nextModule
 *  - session-scoped UI fields: dailyDone (from `bq_daily_completed`),
 *    streakAtRisk (from `bq_last_activity`), dailyLoginAwarded
 *
 * Daily-login bonus: on a new ISO day, awards 10 XP + 5 per streak day
 * (max +50) and updates the streak via store actions. Runs once per mount
 * per day; subsequent mounts read `lastLogin` and skip the award.
 *
 * SSR safety: returns the store defaults (zeros / empty) until
 * `useHasHydrated()` flips true, so the server-rendered tree matches the
 * first client render.
 */
export function useLocalStats() {
  const hydrated = useHasHydrated();

  // Subscribe to persisted fields via granular selectors.
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const completedModules = useGameStore((s) => s.completedModules);
  const handsPlayed = useGameStore((s) => s.handsPlayed);

  // Subscribe to the catalog (kicks off the fetch on first call from any
  // consumer of `useLocalStats`).
  const { courses } = useCatalog();

  const [dailyDone, setDailyDone] = useState(false);
  const [dailyLoginAwarded, setDailyLoginAwarded] = useState(false);
  const [streakAtRisk, setStreakAtRisk] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    try {
      const today = new Date().toISOString().slice(0, 10);

      // Daily challenge completion — still in its own legacy key.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);

      // Streak at risk: >18h since last activity.
      const lastActivity = localStorage.getItem("bq_last_activity");
      const currentStreak = useGameStore.getState().streak;
      if (lastActivity && currentStreak > 0) {
        const hoursAgo =
          (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
        setStreakAtRisk(hoursAgo > 18);
      }

      // Daily login bonus — only once per ISO day.
      const { lastLogin } = useGameStore.getState();
      if (lastLogin !== today) {
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);

        const store = useGameStore.getState();
        if (lastLogin === yesterday) {
          store.incrementStreak();
        } else {
          store.resetStreak();
        }
        const newStreak = useGameStore.getState().streak;
        const streakBonus = Math.min(newStreak * 5, 50);
        const dailyXp = 10 + streakBonus;
        store.addXp(dailyXp);
        store.setLastLogin(today);
        setDailyLoginAwarded(true);
      }
    } catch {}
     
  }, [hydrated]);

  // Derived display fields. Safe to compute even pre-hydration (xp=0 ⇒ level 1).
  const level = getLevel(xp);
  const xpInLevel = getXpInLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const xpNeededForNext = getXpForNextLevel(xp);
  const xpToNext = getXpToNextLevel(xp);

  const profileKey =
    typeof window !== "undefined"
      ? (localStorage.getItem("bq_profile") as UserProfile | null)
      : null;
  const profileLevelNames = getProfileConfig(profileKey || "adulto").levelNames;
  const levelName =
    profileLevelNames[Math.min(level - 1, profileLevelNames.length - 1)];

  const totalModulesCompleted = Object.keys(completedModules).length;
  const totalModulesAvailable = courses.reduce(
    (sum, c) =>
      sum +
      c.worlds.reduce(
        (ws, w) => ws + w.lessons.reduce((ls, l) => ls + l.modules.length, 0),
        0,
      ),
    0,
  );

  // First incomplete module across all courses.
  const nextModule = (() => {
    for (const course of courses) {
      for (const w of course.worlds) {
        for (const lesson of w.lessons) {
          for (const mod of lesson.modules) {
            if (!completedModules[`${lesson.id}-${mod.id}`]) {
              return {
                lessonId: lesson.id,
                moduleId: mod.id,
                moduleTitle: mod.title,
                lessonTitle: lesson.title,
                lessonIcon: lesson.icon,
              };
            }
          }
        }
      }
    }
    return null;
  })();

  return {
    xp,
    streak,
    completedModules,
    handsPlayed,
    level,
    xpInLevel,
    levelProgress,
    xpNeededForNext,
    xpToNext,
    levelName,
    dailyDone,
    dailyLoginAwarded,
    streakAtRisk,
    totalModulesCompleted,
    totalModulesAvailable,
    nextModule,
  };
}

/**
 * Backwards-compat alias — `useStats` was a near-duplicate of
 * `useLocalStats` that lived in `use-stats.ts`. The hook has been merged;
 * this export keeps existing consumers (e.g. `desktop-sidebar.tsx`)
 * working without churn while the codebase converges on one name.
 */
export const useStats = useLocalStats;
