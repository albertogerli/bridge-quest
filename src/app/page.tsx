"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import Link from "next/link";
import { courses, getAvailableCourses, getCourseStats, getGlobalStats, levelInfo, type CourseId } from "@/data/courses";
import { useAchievementChecker, AchievementPopup } from "@/components/achievement-popup";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useProfile, getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { useWeeklyObjectives } from "@/hooks/use-weekly-objectives";
import { collectibleCards, RARITY_CONFIG } from "@/data/collectible-cards";
import { useNotifications, updateLastActivity } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";

// Derive world cards from ALL courses
const allWorldsData = courses.flatMap(c => c.worlds);
const worlds = allWorldsData.map((w) => {
  const totalModules = w.lessons.reduce((sum, l) => sum + l.modules.length, 0);
  return {
    id: w.id,
    name: w.name,
    subtitle: w.subtitle,
    icon: w.icon,
    gradient: w.gradient,
    iconBg: w.iconBg,
    chapters: w.lessons.length,
    totalModules,
  };
});

const totalAllModules = worlds.reduce((s, w) => s + w.totalModules, 0);

function useLocalStats() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [dailyDone, setDailyDone] = useState(false);
  const [dailyLoginAwarded, setDailyLoginAwarded] = useState(false);

  useEffect(() => {
    try {
      const currentXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
      const currentStreak = parseInt(localStorage.getItem("bq_streak") || "0", 10);
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedModules(JSON.parse(cm));

      // Check daily challenge
      const today = new Date().toISOString().slice(0, 10);
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);

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

  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const profileKey = (typeof window !== "undefined" ? localStorage.getItem("bq_profile") : null) as UserProfile | null;
  const profileLevelNames = getProfileConfig(profileKey || "adulto").levelNames;
  const levelName = profileLevelNames[Math.min(level - 1, profileLevelNames.length - 1)];

  return { xp, streak, completedModules, level, xpInLevel, levelName, dailyDone, dailyLoginAwarded };
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const stats = useLocalStats();
  const profile = useProfile();
  const { reviewCount } = useSpacedReview();
  const { canInstall, isInstalled, isIOS, install } = usePwaInstall();
  const { checkReminders, scheduleReminder } = useNotifications();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [weeklyData, setWeeklyData] = useState({ xpEarned: 0, modulesCompleted: 0, handsPlayed: 0, streakDays: 0 });
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    try {
      setIsGuest(localStorage.getItem("bq_guest") === "1");
      if (!localStorage.getItem("bq_onboarded")) {
        setShowOnboarding(true);
      }
      setHandsPlayed(parseInt(localStorage.getItem("bq_hands_played") || "0", 10));

      // Weekly recap: show on Monday if not shown this week
      const today = new Date();
      if (today.getDay() <= 1) { // Sunday or Monday
        const weekKey = `bq_recap_${today.getFullYear()}-W${Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 604800000)}`;
        if (!localStorage.getItem(weekKey) && localStorage.getItem("bq_onboarded")) {
          // Calculate weekly stats from snapshot
          const lastSnapshot = JSON.parse(localStorage.getItem("bq_weekly_snapshot") || "{}");
          const currentXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          const currentModules = Object.keys(JSON.parse(localStorage.getItem("bq_completed_modules") || "{}")).length;
          const currentHands = parseInt(localStorage.getItem("bq_hands_played") || "0", 10);
          if (lastSnapshot.xp !== undefined) {
            setWeeklyData({
              xpEarned: currentXp - (lastSnapshot.xp || 0),
              modulesCompleted: currentModules - (lastSnapshot.modules || 0),
              handsPlayed: currentHands - (lastSnapshot.hands || 0),
              streakDays: parseInt(localStorage.getItem("bq_streak") || "0", 10),
            });
            if (currentXp > (lastSnapshot.xp || 0)) {
              setShowWeeklyRecap(true);
            }
          }
          localStorage.setItem(weekKey, "1");
          // Save new snapshot
          localStorage.setItem("bq_weekly_snapshot", JSON.stringify({ xp: currentXp, modules: currentModules, hands: currentHands }));
        }
        if (!localStorage.getItem("bq_weekly_snapshot")) {
          const currentXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          const currentModules = Object.keys(JSON.parse(localStorage.getItem("bq_completed_modules") || "{}")).length;
          const currentHands = parseInt(localStorage.getItem("bq_hands_played") || "0", 10);
          localStorage.setItem("bq_weekly_snapshot", JSON.stringify({ xp: currentXp, modules: currentModules, hands: currentHands }));
        }
      }
    } catch {}
  }, []);

  // Check notification reminders on page load and schedule future reminders
  useEffect(() => {
    checkReminders();
    updateLastActivity();
    const cleanup = scheduleReminder();
    return cleanup;
  }, [checkReminders, scheduleReminder]);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem("bq_onboarded", "1");
    } catch {}
    setShowOnboarding(false);
  };

  // Count completed modules per world (all courses)
  const worldCompletedCounts = worlds.map((w) => {
    const worldData = allWorldsData.find((wd) => wd.id === w.id);
    if (!worldData) return 0;
    let count = 0;
    for (const lesson of worldData.lessons) {
      for (const mod of lesson.modules) {
        if (stats.completedModules[`${lesson.id}-${mod.id}`]) count++;
      }
    }
    return count;
  });

  const worldsCompleted = worlds.filter((w, i) => {
    return w.totalModules > 0 && worldCompletedCounts[i] === w.totalModules;
  }).length;

  const totalModulesCompleted = Object.keys(stats.completedModules).length;

  // Achievement checker
  const { newBadge, dismiss } = useAchievementChecker({
    xp: stats.xp,
    streak: stats.streak,
    modulesCompleted: totalModulesCompleted,
    handsPlayed,
    worldsCompleted,
  });

  // Find next incomplete module for "Riprendi" CTA (search all courses)
  const nextModule = (() => {
    for (const course of courses) {
      for (const w of course.worlds) {
        for (const lesson of w.lessons) {
          for (const mod of lesson.modules) {
            if (!stats.completedModules[`${lesson.id}-${mod.id}`]) {
              return { lessonId: lesson.id, moduleId: mod.id, moduleTitle: mod.title, lessonTitle: lesson.title, lessonIcon: lesson.icon };
            }
          }
        }
      }
    }
    return null;
  })();

  const hasStarted = totalModulesCompleted > 0;

  // Show landing page for non-authenticated visitors (not guest, not logged in)
  if (!authLoading && !user && !isGuest) {
    return <LandingPage onContinueAsGuest={() => {
      try { localStorage.setItem("bq_guest", "1"); } catch {}
      setIsGuest(true);
    }} />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div>
      {/* Achievement popup */}
      <AchievementPopup badge={newBadge} onDismiss={dismiss} />

      {/* Weekly Recap Modal */}
      <AnimatePresence>
        {showWeeklyRecap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWeeklyRecap(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-white dark:bg-[#1a1f2e] rounded-3xl p-8 text-center mx-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-3">📊</div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{profile.weeklyRecapTitle}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ecco i tuoi progressi!</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-emerald-50 rounded-xl p-3 border-2 border-emerald-200">
                  <p className="text-2xl font-extrabold text-emerald-600">+{weeklyData.xpEarned}</p>
                  <p className="text-[10px] font-bold text-emerald-700">XP guadagnati</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border-2 border-amber-200">
                  <p className="text-2xl font-extrabold text-amber-600">{weeklyData.modulesCompleted}</p>
                  <p className="text-[10px] font-bold text-amber-700">Moduli completati</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 border-2 border-indigo-200">
                  <p className="text-2xl font-extrabold text-indigo-600">{weeklyData.handsPlayed}</p>
                  <p className="text-[10px] font-bold text-indigo-700">Mani giocate</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 border-2 border-orange-200">
                  <p className="text-2xl font-extrabold text-orange-600">{weeklyData.streakDays}</p>
                  <p className="text-[10px] font-bold text-orange-700">Giorni streak</p>
                </div>
              </div>

              {weeklyData.xpEarned > 200 ? (
                <p className="mt-4 text-sm font-bold text-emerald-600">Settimana fantastica! Continua cosi'!</p>
              ) : weeklyData.xpEarned > 0 ? (
                <p className="mt-4 text-sm font-bold text-amber-600">Buon lavoro! Punta piu' in alto questa settimana!</p>
              ) : (
                <p className="mt-4 text-sm font-bold text-gray-500 dark:text-gray-400">Nuova settimana, nuove sfide!</p>
              )}

              <Button
                onClick={() => setShowWeeklyRecap(false)}
                className="mt-5 w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-extrabold shadow-lg"
              >
                Andiamo!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden hero-gradient px-4 sm:px-5 pb-16 pt-14 lg:pb-12 lg:pt-8">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-lg">
          {/* Logo + Title */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Suits row */}
            <motion.div
              className="mb-4 flex items-center justify-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {(["club", "diamond", "heart", "spade"] as const).map(
                (suit, i) => (
                  <motion.div
                    key={suit}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20"
                  >
                    <SuitSymbol suit={suit} size="lg" />
                  </motion.div>
                )
              )}
            </motion.div>

            <h1 className="text-3xl sm:text-[2.5rem] font-extrabold tracking-tight text-white leading-none">
              BridgeQuest
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-white/30" />
              <p className="text-sm font-semibold tracking-widest text-white/90 uppercase">
                {profile.heroSubtitle}
              </p>
              <div className="h-px w-8 bg-white/30" />
            </div>
          </motion.div>

          {/* XP Card - hidden on desktop (sidebar shows it) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 rounded-2xl glass-dark px-5 py-4 lg:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/20">
                  <span className="text-base">⚡</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Livello {stats.level}</p>
                  <p className="text-[11px] text-white/80">{stats.levelName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-white">{stats.xpInLevel}</p>
                <p className="text-[11px] text-white/80">/ 100 XP</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-light to-amber"
                initial={{ width: 0 }}
                animate={{ width: `${stats.xpInLevel}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </div>
          </motion.div>

          {/* CTA - Riprendi or Start - hidden on desktop (sidebar shows it) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-5 lg:hidden"
          >
            {hasStarted && nextModule ? (
              <Link href={`/lezioni/${nextModule.lessonId}/${nextModule.moduleId}`}>
                <Button
                  size="lg"
                  className="w-full h-auto rounded-2xl bg-white dark:bg-[#1a1f2e] text-indigo-700 font-extrabold text-base hover:bg-white/90 shadow-xl shadow-black/10 transition-all active:scale-[0.98] btn-3d py-3.5 px-5"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{nextModule.lessonIcon}</span>
                    <div className="flex-1 text-left">
                      <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-wider">Riprendi</p>
                      <p className="text-sm font-extrabold text-indigo-700 truncate">{nextModule.moduleTitle}</p>
                    </div>
                    <svg className="h-5 w-5 text-purple-500/60 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </Button>
              </Link>
            ) : (
              <Link href="/lezioni">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl bg-white dark:bg-[#1a1f2e] text-indigo-700 font-extrabold text-base hover:bg-white/90 shadow-xl shadow-black/10 transition-all active:scale-[0.98] btn-3d"
                >
                  <span className="mr-2 text-xl">🎯</span>
                  Inizia il tuo viaggio
                </Button>
              </Link>
            )}
          </motion.div>
        </div>

        {/* Smooth gradient fade to background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#F7F5F0] dark:to-[#0f1219]" aria-hidden="true" />
      </section>

      {/* Daily login XP toast */}
      <AnimatePresence>
        {stats.dailyLoginAwarded && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ delay: 1, type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl shadow-amber/30">
              <span className="text-lg">⚡</span>
              Login giornaliero: +{10 + Math.min(stats.streak * 5, 50)} {profile.xpLabel}
              {stats.streak > 1 && <span className="ml-1 text-amber-100">(streak x{stats.streak})</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== DAILY CHALLENGE + STREAK ===== (hidden on desktop, sidebar shows these) */}
      <section className="px-4 sm:px-5 -mt-6 relative z-10 lg:hidden">
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-2 gap-3">
            {/* Daily Challenge */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/gioca/sfida" className="block">
                <div className={`rounded-2xl p-4 cursor-pointer transition-all ${
                  stats.dailyDone
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-[#1a1f2e] border-2 border-[#e5e0d5] dark:border-[#2a3040] shadow-[0_3px_0_#e5e0d5] dark:shadow-[0_3px_0_#141821]"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 border border-amber-200">
                      <span className="text-2xl">{stats.dailyDone ? "✅" : "🔥"}</span>
                    </div>
                    {!stats.dailyDone && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                        +40 XP
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                    {profile.dailyChallengeLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {stats.dailyDone ? "Completata!" : "Gioca la mano quotidiana"}
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 border-2 border-[#e5e0d5] dark:border-[#2a3040] shadow-[0_3px_0_#e5e0d5] dark:shadow-[0_3px_0_#141821]">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 border border-blue-200">
                    <span className="text-2xl">{stats.streak >= 7 ? "🔥" : "📅"}</span>
                  </div>
                  {stats.streak > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                      +{Math.min(stats.streak * 5, 50)} XP/giorno
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                  Streak: {stats.streak} {stats.streak === 1 ? "giorno" : "giorni"}
                </p>
                <div className="mt-2 flex gap-1">
                  {["L", "M", "M", "G", "V", "S", "D"].map((day, i) => (
                    <div
                      key={i}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                        i < Math.min(stats.streak, 7)
                          ? "bg-blue-500 text-white border border-blue-600"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== DAILY QUESTS ===== */}
      <section className="px-4 sm:px-5 pt-5">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
              Obiettivi del giorno
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold text-gray-400 border-gray-200 dark:border-gray-700">
              Bonus XP
            </Badge>
          </div>
          <DailyQuests
            modulesCompleted={totalModulesCompleted}
            handsPlayed={handsPlayed}
            dailyDone={stats.dailyDone}
          />
        </div>
      </section>

      {/* ===== WEEKLY OBJECTIVES ===== */}
      <WeeklyObjectivesSection />

      {/* ===== INSTALL APP BANNER ===== (mobile only) */}
      {!isInstalled && !installDismissed && (canInstall || isIOS) && (
        <section className="px-4 sm:px-5 pt-4 lg:hidden">
          <div className="mx-auto max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-purple-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                    <span className="text-2xl">📲</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                      Installa BridgeQuest
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aggiungila alla schermata Home
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canInstall ? (
                      <button
                        onClick={() => install()}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
                      >
                        Installa
                      </button>
                    ) : isIOS ? (
                      <button
                        onClick={() => setShowIOSGuide(true)}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
                      >
                        Come fare
                      </button>
                    ) : null}
                    <button
                      onClick={() => setInstallDismissed(true)}
                      aria-label="Chiudi banner installazione"
                      className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:bg-gray-800 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* iOS Install Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="bg-white dark:bg-[#1a1f2e] rounded-t-3xl p-6 w-full max-w-md shadow-2xl pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 text-center mb-4">
                Installa su iPhone/iPad
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    Tocca il pulsante <strong>Condividi</strong>{" "}
                    <span className="inline-block align-middle">
                      <svg className="w-5 h-5 inline text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>{" "}
                    in basso
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    Scorri e tocca <strong>&quot;Aggiungi a schermata Home&quot;</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    Tocca <strong>&quot;Aggiungi&quot;</strong> in alto a destra
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm"
              >
                Ho capito
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SPACED REVIEW ===== (hidden on desktop, sidebar shows it) */}
      {reviewCount > 0 && (
        <section className="px-4 sm:px-5 pt-4 lg:hidden">
          <div className="mx-auto max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Link href="/lezioni">
                <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 cursor-pointer hover:translate-y-[-2px] hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                      <span className="text-2xl">🧠</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                        Ripasso del giorno
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reviewCount} {reviewCount === 1 ? "domanda" : "domande"} da ripassare
                      </p>
                    </div>
                    <Badge className="bg-purple-500 text-white text-xs font-bold hover:bg-purple-500">
                      {reviewCount}
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== TREASURE CHESTS ===== */}
      <section className="px-4 sm:px-5 pt-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
              Prossimo premio
            </h2>
            <span className="text-xs font-bold text-amber-500">
              {totalModulesCompleted} moduli
            </span>
          </div>
          <TreasureChests modulesCompleted={totalModulesCompleted} />
        </div>
      </section>

      {/* ===== COLLEZIONE CARTE ===== */}
      <CollectionTeaser
        xp={stats.xp}
        streak={stats.streak}
        handsPlayed={handsPlayed}
        completedModules={totalModulesCompleted}
      />

      {/* ===== COURSES ===== */}
      <CoursesSection completedModules={stats.completedModules} />

      {/* ===== WORLDS (All Courses) ===== */}
      <section className="px-4 sm:px-5 pt-4 pb-6">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100">
              Il tuo percorso
            </h2>
            <Link href="/lezioni">
              <Badge
                variant="outline"
                className="text-[11px] font-semibold text-indigo-500 border-indigo-300/50 cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                Vedi tutto →
              </Badge>
            </Link>
          </div>

          <div className="space-y-6">
            {courses.map((course) => {
              const courseWorlds = worlds.filter(w =>
                course.worlds.some(cw => cw.id === w.id)
              );
              if (courseWorlds.length === 0) return null;
              return (
                <div key={course.id}>
                  <Link href={`/lezioni?corso=${course.id}`}>
                    <div className="flex items-center gap-2 mb-3 cursor-pointer group">
                      <span className="text-lg">{course.icon}</span>
                      <h3 className="text-sm font-extrabold text-gray-700 group-hover:text-indigo-600 transition-colors">
                        {course.name}
                      </h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${levelInfo[course.level].bg} ${levelInfo[course.level].color}`}>
                        {levelInfo[course.level].label}
                      </span>
                    </div>
                  </Link>
                  <div className="space-y-2.5">
                    {courseWorlds.map((world) => {
                      const globalIdx = worlds.findIndex(w => w.id === world.id);
                      return (
                        <motion.div
                          key={world.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.8 + globalIdx * 0.05,
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <WorldCard world={world} completedModules={worldCompletedCounts[globalIdx]} courseId={course.id} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FIGB FOOTER ===== (hidden on desktop, sidebar shows it) */}
      <section className="px-4 sm:px-5 pb-6 lg:hidden">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 p-5 text-center">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
              Un progetto della
            </p>
            <p className="text-lg font-extrabold text-indigo-700">
              Federazione Italiana Gioco Bridge
            </p>
            <p className="mt-2 text-xs text-indigo-700/60">
              Commissione Insegnamento · Corsi Fiori, Quadri, Cuori
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function WorldCard({ world, completedModules, courseId }: { world: (typeof worlds)[0]; completedModules: number; courseId?: string }) {
  const progress = world.totalModules > 0
    ? Math.round((completedModules / world.totalModules) * 100)
    : 0;

  // Link to first lesson of this world
  const wd = allWorldsData.find((w) => w.id === world.id);
  const firstLessonId = wd?.lessons[0]?.id;
  const href = firstLessonId != null ? `/lezioni/${firstLessonId}` : (courseId ? `/lezioni?corso=${courseId}` : "/lezioni");

  const card = (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1f2e] transition-all border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm cursor-pointer hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] active:shadow-none"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl bg-gradient-to-b ${world.gradient}`}
      />

      <div className="flex items-center gap-4 p-4 pl-5">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black ${world.iconBg}`}
        >
          {world.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-gray-900 dark:text-gray-100 truncate">
              {world.name}
            </h3>
            {progress === 100 && (
              <span className="text-emerald-500 text-lg">✓</span>
            )}
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{world.subtitle}</p>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${world.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </div>
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tabular-nums">
              {completedModules}/{world.totalModules}
            </span>
          </div>
        </div>

        <svg
          className="h-5 w-5 text-gray-300 shrink-0 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <polyline points="9,6 15,12 9,18" />
        </svg>
      </div>
    </div>
  );

  return <Link href={href}>{card}</Link>;
}

// ===== DAILY QUESTS =====
function DailyQuests({
  modulesCompleted,
  handsPlayed,
  dailyDone,
}: {
  modulesCompleted: number;
  handsPlayed: number;
  dailyDone: boolean;
}) {
  // Track daily progress in localStorage
  const [dailyModules, setDailyModules] = useState(0);
  const [dailyHands, setDailyHands] = useState(0);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem("bq_daily_quests");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === today) {
          setDailyModules(data.modules || 0);
          setDailyHands(data.hands || 0);
          return;
        }
      }
      // Reset for new day - save current counts as baseline
      localStorage.setItem("bq_daily_quests", JSON.stringify({
        date: today,
        baseModules: modulesCompleted,
        baseHands: handsPlayed,
        modules: 0,
        hands: 0,
      }));
    } catch {}
  }, [modulesCompleted, handsPlayed]);

  const quests = [
    {
      id: "study",
      icon: "📖",
      label: "Completa 2 moduli",
      progress: Math.min(dailyModules, 2),
      target: 2,
      xp: 30,
    },
    {
      id: "play",
      icon: "🃏",
      label: "Gioca 1 mano",
      progress: Math.min(dailyHands, 1),
      target: 1,
      xp: 20,
    },
    {
      id: "challenge",
      icon: "🔥",
      label: "Sfida del giorno",
      progress: dailyDone ? 1 : 0,
      target: 1,
      xp: 40,
    },
  ];

  const allDone = quests.every((q) => q.progress >= q.target);

  return (
    <div className="space-y-2">
      {quests.map((quest, i) => {
        const done = quest.progress >= quest.target;
        return (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              done ? "bg-emerald-50 border border-emerald-200" : "bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040]"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
              done ? "bg-emerald-100" : "bg-gray-50 dark:bg-gray-800/50"
            }`}>
              {done ? "✅" : quest.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${done ? "text-emerald-700 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                {quest.label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden max-w-[80px]">
                  <div
                    className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-amber-400"}`}
                    style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-400">
                  {quest.progress}/{quest.target}
                </span>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              done ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-600"
            }`}>
              +{quest.xp} XP
            </span>
          </motion.div>
        );
      })}

      {/* All quests bonus */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-center ${
          allDone
            ? "bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200"
            : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        }`}
      >
        <span className="text-lg">{allDone ? "🎁" : "🎯"}</span>
        <p className={`text-xs font-bold ${allDone ? "text-amber-700" : "text-gray-400"}`}>
          {allDone ? "Bonus completamento: +50 XP!" : "Completa tutti per +50 XP bonus"}
        </p>
      </motion.div>
    </div>
  );
}

// ===== TREASURE CHESTS =====
const chestMilestones = [
  { modules: 3, icon: "🎁", label: "Chest Bronzo", reward: "50 XP + Badge" },
  { modules: 10, icon: "📦", label: "Chest Argento", reward: "150 XP + Badge" },
  { modules: 25, icon: "🧰", label: "Chest Oro", reward: "300 XP + Dorso carte" },
  { modules: 50, icon: "👑", label: "Chest Diamante", reward: "500 XP + Feltro esclusivo" },
];

function TreasureChests({ modulesCompleted }: { modulesCompleted: number }) {
  const profile = useProfile();
  const [showChestPopup, setShowChestPopup] = useState<typeof chestMilestones[0] | null>(null);

  // Check for newly earned chest
  useEffect(() => {
    try {
      const claimed = JSON.parse(localStorage.getItem("bq_chests_claimed") || "[]") as number[];
      for (const chest of chestMilestones) {
        if (modulesCompleted >= chest.modules && !claimed.includes(chest.modules)) {
          setShowChestPopup(chest);
          // Award XP
          const xpReward = chest.modules === 3 ? 50 : chest.modules === 10 ? 150 : chest.modules === 25 ? 300 : 500;
          const prevXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          localStorage.setItem("bq_xp", String(prevXp + xpReward));
          localStorage.setItem("bq_chests_claimed", JSON.stringify([...claimed, chest.modules]));
          break;
        }
      }
    } catch {}
  }, [modulesCompleted]);

  // Find the next unopened chest
  const nextIdx = chestMilestones.findIndex((c) => modulesCompleted < c.modules);
  const nextChest = nextIdx >= 0 ? chestMilestones[nextIdx] : null;

  return (
    <>
    {/* Chest unlock popup */}
    <AnimatePresence>
      {showChestPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowChestPopup(null)}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-white dark:bg-[#1a1f2e] rounded-3xl p-8 text-center mx-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8 }}
              className="text-7xl mb-4"
            >
              {showChestPopup.icon}
            </motion.div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{profile.chestTitle}</h2>
            <p className="text-lg font-bold text-amber-600 mt-2">{showChestPopup.label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{showChestPopup.reward}</p>
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-2xl"
                >
                  ✨
                </motion.span>
              ))}
            </div>
            <Button
              onClick={() => setShowChestPopup(null)}
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-extrabold shadow-lg"
            >
              Fantastico!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 border border-[#e5e0d5] dark:border-[#2a3040]">
      {/* Chest progress bar */}
      <div className="flex items-center gap-2 mb-4">
        {chestMilestones.map((chest, i) => {
          const isEarned = modulesCompleted >= chest.modules;
          const isCurrent = i === nextIdx;
          return (
            <div key={chest.modules} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all ${
                  isEarned
                    ? "bg-amber-100 shadow-sm"
                    : isCurrent
                      ? "bg-amber-50 ring-2 ring-amber-300"
                      : "bg-gray-50 dark:bg-gray-800/50"
                }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
              >
                {isEarned ? "✅" : chest.icon}
              </motion.div>
              <span className={`text-[9px] font-bold ${
                isEarned ? "text-amber-600" : isCurrent ? "text-amber-500" : "text-gray-400"
              }`}>
                {chest.modules} mod
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress to next chest */}
      {nextChest && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-700">
              {nextChest.icon} {nextChest.label}
            </p>
            <p className="text-[11px] font-bold text-amber-500">
              {modulesCompleted}/{nextChest.modules}
            </p>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((modulesCompleted / nextChest.modules) * 100, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Premio: {nextChest.reward}
          </p>
        </div>
      )}

      {!nextChest && (
        <div className="text-center py-2">
          <p className="text-sm font-bold text-amber-700">Tutti i bauli aperti! 👑</p>
          <p className="text-xs text-amber-500 mt-0.5">Sei un vero campione</p>
        </div>
      )}
    </div>
    </>
  );
}

// ===== COURSES SECTION =====
function CoursesSection({ completedModules }: { completedModules: Record<string, boolean> }) {
  const availableCourses = getAvailableCourses();

  if (availableCourses.length <= 1) return null; // Don't show if only Fiori

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
            I Corsi FIGB
          </h2>
          <Badge variant="outline" className="text-[10px] font-bold text-gray-400 border-gray-200 dark:border-gray-700">
            {availableCourses.length} corsi
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {availableCourses.map((course, i) => {
            const stats = getCourseStats(course.id, completedModules);
            const info = levelInfo[course.level];
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                <Link href={`/lezioni?corso=${course.id}`}>
                  <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 cursor-pointer border border-[#e5e0d5] dark:border-[#2a3040] hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${course.gradient} text-white font-black text-lg`}>
                        {course.icon}
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${info.bg} ${info.color}`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100 truncate">
                      {course.name.replace("Corso ", "")}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {course.lessonCount} lezioni
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${course.gradient}`}
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{stats.progress}%</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===== WEEKLY OBJECTIVES SECTION =====
function WeeklyObjectivesSection() {
  const { objectives, allCompleted, bonusClaimed, claimBonus } = useWeeklyObjectives();
  const [showBonus, setShowBonus] = useState(false);

  if (objectives.length === 0) return null;

  const completedCount = objectives.filter((o) => o.completed).length;

  const handleClaimBonus = () => {
    const bonus = claimBonus();
    if (bonus) {
      setShowBonus(true);
      setTimeout(() => setShowBonus(false), 3000);
    }
  };

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
              Obiettivi settimanali
            </h2>
            <Badge className="bg-indigo-50 text-indigo-600 text-[10px] font-bold border-0">
              {completedCount}/3
            </Badge>
          </div>
          <Link href="/obiettivi">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-indigo-500 border-indigo-200 cursor-pointer hover:bg-indigo-50 transition-colors"
            >
              Dettagli →
            </Badge>
          </Link>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 border border-[#e5e0d5] dark:border-[#2a3040]">
          <div className="space-y-2.5">
            {objectives.map((obj, i) => (
              <div
                key={obj.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${
                  obj.completed ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
                  obj.completed ? "bg-emerald-100" : "bg-white"
                }`}>
                  {obj.completed ? "✅" : obj.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
                    obj.completed ? "text-emerald-700 line-through" : "text-gray-900 dark:text-gray-100"
                  }`}>
                    {obj.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2.5 rounded-full bg-gray-200 border border-gray-300 overflow-hidden max-w-[100px]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          obj.completed ? "bg-emerald" : "bg-indigo-400"
                        }`}
                        style={{ width: `${Math.min((obj.current / obj.target) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {obj.current}/{obj.target}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  obj.completed ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-600"
                }`}>
                  +{obj.xpReward} XP
                </span>
              </div>
            ))}
          </div>

          {/* Bonus bar */}
          {allCompleted && !bonusClaimed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleClaimBonus}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-300/30 active:scale-[0.98] transition-transform"
            >
              🎁 Riscuoti bonus +100 XP!
            </motion.button>
          )}

          {bonusClaimed && (
            <div className="mt-3 py-2.5 rounded-xl bg-indigo-50 text-center">
              <p className="text-xs font-bold text-indigo-600">✅ Bonus riscosso! Torna la prossima settimana</p>
            </div>
          )}
        </div>

        {/* Bonus awarded toast */}
        <AnimatePresence>
          {showBonus && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl">
                🎁 +100 XP Bonus settimanale!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ===== COLLECTION TEASER =====
function CollectionTeaser({ xp, streak, handsPlayed, completedModules }: {
  xp: number; streak: number; handsPlayed: number; completedModules: number;
}) {
  const playerStats = {
    xp,
    streak,
    handsPlayed,
    completedModules,
    badges: [],
    quizLampoBest: 0,
    memoryBest: 0,
    dailyHandsTotal: 0,
  };

  const unlocked = collectibleCards.filter((c) => c.checkUnlock(playerStats));
  const total = collectibleCards.length;
  const nextCard = collectibleCards.find((c) => !c.checkUnlock(playerStats));

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
              Collezione Carte
            </h2>
            <Badge className="bg-amber-50 text-amber-600 text-[10px] font-bold border-0">
              {unlocked.length}/{total}
            </Badge>
          </div>
          <Link href="/collezione">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-amber-500 border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              Vedi tutte →
            </Badge>
          </Link>
        </div>

        <Link href="/collezione">
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 cursor-pointer border border-[#e5e0d5] dark:border-[#2a3040] hover:translate-y-[-2px] hover:shadow-md transition-all">
            {/* Mini card preview - show last 4 unlocked or first 4 locked */}
            <div className="flex items-center gap-2 mb-3">
              {(unlocked.length > 0 ? unlocked.slice(-4) : collectibleCards.slice(0, 4)).map((card) => {
                const isUnlocked = unlocked.includes(card);
                const rarityConf = RARITY_CONFIG[card.rarity];
                return (
                  <div
                    key={card.id}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
                      isUnlocked
                        ? `bg-gradient-to-br ${card.gradient} shadow-sm`
                        : "bg-gray-100 dark:bg-gray-800 grayscale opacity-40"
                    }`}
                  >
                    {isUnlocked ? card.emoji : "❓"}
                  </div>
                );
              })}
              <div className="flex-1 text-right">
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{unlocked.length}</p>
                <p className="text-[10px] text-gray-400 font-bold">sbloccate</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                style={{ width: `${(unlocked.length / total) * 100}%` }}
              />
            </div>

            {nextCard && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                Prossima: <span className="font-bold text-gray-700">{nextCard.emoji} {nextCard.name}</span>
                <span className="text-gray-400"> — {nextCard.unlockCondition}</span>
              </p>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}

// ===== USER PROFILE OPTIONS =====
const profileOptions: { id: UserProfile; emoji: string; label: string; age: string; desc: string }[] = [
  { id: "junior", emoji: "🎮", label: "Explorer", age: "8–17", desc: "Super divertente! Animazioni pazze, tanti premi e sfide" },
  { id: "giovane", emoji: "⚡", label: "Dinamico", age: "18–35", desc: "Ritmo veloce, sfide competitive, animazioni rapide" },
  { id: "adulto", emoji: "🃏", label: "Classico", age: "36–55", desc: "Equilibrato, giochi 2D, progressione graduale" },
  { id: "senior", emoji: "☕", label: "Rilassato", age: "55+", desc: "Testi grandi, ritmo calmo, guida passo-passo" },
];

// ===== ONBOARDING FLOW =====
const onboardingSteps: { id: string; emoji: string; title: string; subtitle: string; description: string; video?: string }[] = [
  {
    id: "welcome",
    emoji: "♠ ♥ ♦ ♣",
    title: "Benvenuto in BridgeQuest",
    subtitle: "Il tuo viaggio nel bridge inizia qui",
    description:
      "Il bridge è il gioco di carte più bello e stimolante del mondo. Con BridgeQuest imparerai a giocare divertendoti, passo dopo passo.",
  },
  {
    id: "profile",
    emoji: "👤",
    title: "Come preferisci imparare?",
    subtitle: "Personalizziamo la tua esperienza",
    description:
      "Scegli lo stile che fa per te. Potrai cambiarlo in qualsiasi momento dal profilo.",
  },
  {
    id: "how",
    emoji: "🎯",
    title: "Come funziona?",
    subtitle: "Impara, gioca, migliora",
    description:
      "4 corsi, 16 mondi, 49 lezioni e centinaia di mani da giocare. Teoria breve, tanti quiz e pratica al tavolo. Guadagni XP ad ogni passo!",
  },
  {
    id: "maestro",
    emoji: "🎓",
    title: "Il Maestro Fiori",
    subtitle: "La tua guida personale",
    description:
      "Il Maestro Fiori ti accompagnerà in ogni lezione con la sua simpatia e i suoi consigli. È il tuo amico bridgista personale!",
    video: "/videos/maestro-fiori-intro.mp4",
  },
  {
    id: "ready",
    emoji: "🚀",
    title: "Pronto a partire?",
    subtitle: "Il ponte verso una nuova passione",
    description:
      "Completa le lezioni, scala la classifica e diventa un vero bridgista. Il Corso Fiori della FIGB ti aspetta!",
  },
];

function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = onboardingSteps[step];
  const isLast = step === onboardingSteps.length - 1;
  const isProfileStep = current.id === "profile";

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfile(profile);
    try {
      localStorage.setItem("bq_profile", profile);
    } catch {}
  };

  const handleNext = () => {
    if (isProfileStep && !selectedProfile) return; // Must select profile
    setStep(step + 1);
  };

  const handleSkip = () => {
    // Default to "adulto" if skipping
    if (!selectedProfile) {
      try { localStorage.setItem("bq_profile", "adulto"); } catch {}
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-gradient-to-br from-indigo-700 via-purple-600 to-fuchsia-700 overflow-y-auto py-12">
      {/* Animated background suits */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["♠", "♥", "♦", "♣", "♠", "♥", "♦", "♣"].map((suit, i) => (
          <motion.span
            key={i}
            className="absolute text-white/[0.04] font-black select-none"
            style={{
              fontSize: `${60 + i * 20}px`,
              left: `${(i * 13) % 90}%`,
              top: `${(i * 17 + 5) % 85}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, i % 2 === 0 ? 10 : -10, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {suit}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6 my-auto">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {onboardingSteps.map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "bg-white dark:bg-[#1a1f2e] w-8"
                  : i < step
                    ? "bg-white/50 w-2"
                    : "bg-white/20 w-2"
              }`}
              layout
            />
          ))}
        </div>

        {/* Content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Icon/Emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="mb-6"
            >
              {step === 0 ? (
                <div className="flex items-center justify-center gap-3">
                  {(["club", "heart", "diamond", "spade"] as const).map((suit, i) => (
                    <motion.div
                      key={suit}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
                    >
                      <SuitSymbol suit={suit} size="lg" />
                    </motion.div>
                  ))}
                </div>
              ) : current.video ? (
                <div className="relative mx-auto w-56 h-56 rounded-3xl overflow-hidden bg-white/10 shadow-2xl shadow-black/20">
                  <video
                    ref={videoRef}
                    src={current.video}
                    autoPlay
                    playsInline
                    muted={videoMuted}
                    loop
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-3xl ring-2 ring-white/20" />
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    onClick={() => {
                      setVideoMuted(!videoMuted);
                      if (videoRef.current) {
                        videoRef.current.muted = !videoMuted;
                        if (videoMuted) videoRef.current.currentTime = 0;
                      }
                    }}
                    className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                      videoMuted
                        ? "bg-white/90 text-indigo-700 shadow-lg animate-pulse"
                        : "bg-white/30 text-white"
                    }`}
                  >
                    {videoMuted ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
                  <span className="text-4xl">{current.emoji}</span>
                </div>
              )}
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              {current.title}
            </h1>
            <p className="text-sm font-semibold text-white/60 mt-2 tracking-wide uppercase">
              {current.subtitle}
            </p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-base text-white/80 leading-relaxed max-w-sm mx-auto"
            >
              {current.description}
            </motion.p>

            {/* Profile selection cards */}
            {isProfileStep && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 space-y-3"
              >
                {profileOptions.map((opt, i) => (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    onClick={() => handleProfileSelect(opt.id)}
                    className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                      selectedProfile === opt.id
                        ? "bg-white dark:bg-[#1a1f2e] shadow-xl shadow-white/20 ring-2 ring-white"
                        : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                        selectedProfile === opt.id ? "bg-purple-100" : "bg-white/10"
                      }`}>
                        {opt.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-extrabold text-lg ${
                            selectedProfile === opt.id ? "text-indigo-700" : "text-white"
                          }`}>
                            {opt.label}
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            selectedProfile === opt.id
                              ? "bg-purple-100 text-purple-700"
                              : "bg-white/10 text-white/60"
                          }`}>
                            {opt.age}
                          </span>
                        </div>
                        <p className={`text-sm mt-0.5 ${
                          selectedProfile === opt.id ? "text-gray-600" : "text-white/60"
                        }`}>
                          {opt.desc}
                        </p>
                      </div>
                      {selectedProfile === opt.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 space-y-3"
        >
          {isLast ? (
            <Button
              onClick={onComplete}
              size="lg"
              className="w-full h-14 rounded-2xl bg-white dark:bg-[#1a1f2e] text-indigo-700 font-extrabold text-base hover:bg-white/90 shadow-xl shadow-black/15 transition-all active:scale-[0.98]"
            >
              <span className="mr-2 text-xl">🎯</span>
              Inizia il viaggio!
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="lg"
              disabled={isProfileStep && !selectedProfile}
              className={`w-full h-14 rounded-2xl font-extrabold text-base shadow-xl shadow-black/15 transition-all active:scale-[0.98] ${
                isProfileStep && !selectedProfile
                  ? "bg-white/30 text-white/80 cursor-not-allowed"
                  : "bg-white dark:bg-[#1a1f2e] text-indigo-700 hover:bg-white/90"
              }`}
            >
              Continua
            </Button>
          )}

          {!isLast && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm font-semibold text-white/80 hover:text-white/80 transition-colors py-2"
            >
              Salta introduzione
            </button>
          )}
        </motion.div>

        {/* FIGB badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <p className="text-[11px] text-white/30 font-semibold tracking-wider uppercase">
            Un progetto della FIGB · Corso Fiori
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ===== LANDING PAGE =====
function LandingPage({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  const features = [
    { icon: "🎓", title: "49 Lezioni", desc: "4 corsi FIGB completi, dalla base all'avanzato" },
    { icon: "🃏", title: "Gioca Subito", desc: "Mani interattive con AI avversaria intelligente" },
    { icon: "🧠", title: "Quiz & Mini-giochi", desc: "6 tipi di quiz, 9 mini-giochi, ripasso intelligente" },
    { icon: "🏆", title: "Tornei & Sfide", desc: "Torneo settimanale, sfida amici, classifica" },
    { icon: "📊", title: "Analisi DDS", desc: "Analisi double-dummy post-mano professionale" },
    { icon: "🔥", title: "Gamification", desc: "XP, streak, badge, premi e collezionabili" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F5F0] overflow-y-auto">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 px-5 pt-16 pb-20">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

        {/* Floating suits */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {["♠", "♥", "♦", "♣", "♠", "♥"].map((suit, i) => (
            <motion.span
              key={i}
              className="absolute text-white/[0.05] font-black select-none"
              style={{
                fontSize: `${50 + i * 15}px`,
                left: `${(i * 18) % 90}%`,
                top: `${(i * 15 + 5) % 80}%`,
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, i % 2 === 0 ? 8 : -8, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {suit}
            </motion.span>
          ))}
        </div>

        <div className="relative mx-auto max-w-lg text-center">
          {/* Suit icons */}
          <motion.div
            className="mb-5 flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {(["club", "diamond", "heart", "spade"] as const).map((suit, i) => (
              <motion.div
                key={suit}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20"
              >
                <SuitSymbol suit={suit} size="lg" />
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
          >
            BridgeQuest
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-base sm:text-lg text-white/80 max-w-md mx-auto"
          >
            Impara il bridge giocando. Il corso ufficiale della Federazione Italiana Gioco Bridge, gamificato.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3 max-w-xs mx-auto"
          >
            <Link href="/login">
              <Button className="w-full h-14 rounded-2xl bg-white text-indigo-700 font-extrabold text-base hover:bg-white/90 shadow-xl shadow-black/15 active:scale-[0.98] transition-all">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Accedi o Registrati
              </Button>
            </Link>
            <button
              onClick={onContinueAsGuest}
              className="w-full h-12 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/25 border border-white/20 active:scale-[0.98] transition-all"
            >
              Prova senza account
            </button>
          </motion.div>
        </div>

        {/* Fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#F7F5F0]" />
      </section>

      {/* Features */}
      <section className="px-5 -mt-4 pb-8 relative z-10">
        <div className="mx-auto max-w-lg">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg font-extrabold text-gray-900 mb-4 text-center"
          >
            Tutto quello che serve per imparare il bridge
          </motion.h2>

          <div className="grid grid-cols-2 gap-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.07 }}
                className="rounded-2xl bg-white p-4 border border-[#e5e0d5] shadow-sm"
              >
                <div className="text-2xl mb-2">{feat.icon}</div>
                <p className="text-sm font-extrabold text-gray-900">{feat.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-8">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 p-6 text-center"
          >
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-extrabold text-indigo-700">49</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Lezioni</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-purple-700">4</p>
                <p className="text-[10px] font-bold text-purple-500 uppercase">Corsi</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-fuchsia-700">200+</p>
                <p className="text-[10px] font-bold text-fuchsia-500 uppercase">Mani</p>
              </div>
            </div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
              Un progetto della
            </p>
            <p className="text-lg font-extrabold text-indigo-700">
              Federazione Italiana Gioco Bridge
            </p>
            <p className="mt-1 text-xs text-indigo-700/60">
              Commissione Insegnamento
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-12">
        <div className="mx-auto max-w-xs">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex flex-col gap-3"
          >
            <Link href="/login">
              <Button className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/30">
                Inizia gratis
              </Button>
            </Link>
            <button
              onClick={onContinueAsGuest}
              className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Continua senza account
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
