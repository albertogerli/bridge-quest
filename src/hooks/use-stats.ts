"use client";

import { useState, useEffect } from "react";
import { courses } from "@/data/courses";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";

export function useStats() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [dailyDone, setDailyDone] = useState(false);

  const readStats = () => {
    try {
      setXp(parseInt(localStorage.getItem("bq_xp") || "0", 10));
      setStreak(parseInt(localStorage.getItem("bq_streak") || "0", 10));
      setHandsPlayed(parseInt(localStorage.getItem("bq_hands_played") || "0", 10));
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedModules(JSON.parse(cm));
      const today = new Date().toISOString().slice(0, 10);
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);
    } catch {}
  };

  useEffect(() => {
    readStats();
    // Re-read when Supabase sync updates localStorage
    const handleSyncUpdate = () => readStats();
    window.addEventListener("bq_stats_updated", handleSyncUpdate);
    return () => window.removeEventListener("bq_stats_updated", handleSyncUpdate);
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const profileKey = (typeof window !== "undefined" ? localStorage.getItem("bq_profile") : null) as UserProfile | null;
  const profileLevelNames = getProfileConfig(profileKey || "adulto").levelNames;
  const levelName = profileLevelNames[Math.min(level - 1, profileLevelNames.length - 1)];
  const totalModulesCompleted = Object.keys(completedModules).length;
  const totalModulesAvailable = courses.reduce(
    (sum, c) => sum + c.worlds.reduce(
      (ws, w) => ws + w.lessons.reduce((ls, l) => ls + l.modules.length, 0), 0), 0);

  const nextModule = (() => {
    for (const course of courses) {
      for (const w of course.worlds) {
        for (const lesson of w.lessons) {
          for (const mod of lesson.modules) {
            if (!completedModules[`${lesson.id}-${mod.id}`]) {
              return { lessonId: lesson.id, moduleId: mod.id, moduleTitle: mod.title, lessonTitle: lesson.title, lessonIcon: lesson.icon };
            }
          }
        }
      }
    }
    return null;
  })();

  return {
    xp, streak, handsPlayed, completedModules, dailyDone,
    level, xpInLevel, levelName,
    totalModulesCompleted, totalModulesAvailable, nextModule,
  };
}
