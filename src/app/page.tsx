"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { PrimaManoOnboarding } from "@/components/prima-mano-onboarding";
import { courses } from "@/data/courses";
import { useAchievementChecker, AchievementPopup } from "@/components/achievement-popup";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications, updateLastActivity } from "@/hooks/use-notifications";
import { useSharedAuth } from "@/contexts/auth-provider";
import { MarketingConsentBanner } from "@/components/marketing-consent-banner";
import { WeeklyChallengeBanner } from "@/components/weekly-challenge-banner";
import { DidactaBanner } from "@/components/didacta-banner";
import { PendingChallengesBanner } from "@/components/pending-challenges-banner";
import { useBeginnerStatus } from "@/hooks/use-beginner-status";
import { GuidedPath } from "@/components/beginner/guided-path";
import { LostCard } from "@/components/beginner/lost-card";
import { WeeklyRecapModal } from "@/components/home/weekly-recap-modal";
import { HeroSection } from "@/components/home/hero-section";
import { BentoGrid } from "@/components/home/bento-grid";
import { SpacedReviewCard } from "@/components/home/spaced-review-card";
import { GlossarioCard } from "@/components/home/glossario-card";
import { ScopriBanner } from "@/components/home/scopri-banner";
import { HomeFooter } from "@/components/home/home-footer";
import { WorldsGrid } from "@/components/home/worlds-grid";
import { InstallAppBanner } from "@/components/home/install-app-banner";
import { ReferralHandler } from "@/components/home/referral-handler";
import { DailyQuests } from "@/components/home/daily-quests";
import { TreasureChests } from "@/components/home/treasure-chests";
import { CoursesSection } from "@/components/home/courses-section";
import { WeeklyObjectivesSection } from "@/components/home/weekly-objectives-section";
import { CollectionTeaser } from "@/components/home/collection-teaser";
import { LandingPage } from "@/components/home/landing-page";
import { GuestLoginReminder } from "@/components/home/banners/guest-login-reminder";
import { PrimaManoBanner } from "@/components/home/banners/prima-mano-banner";
import { SuggestedNextStep } from "@/components/home/banners/suggested-next-step";
import { DailyChallengeStreakMobile } from "@/components/home/banners/daily-challenge-streak-mobile";
import { SurveyBanner } from "@/components/home/banners/survey-banner";
import { FindAsdBanner } from "@/components/home/banners/find-asd-banner";
import { GuidedModeToggle } from "@/components/home/banners/guided-mode-toggle";
import { useLocalStats } from "@/hooks/use-local-stats";
import { Zap, Target } from "lucide-react";

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

export default function Home() {
  const { user, profile: authProfile, loading: authLoading } = useSharedAuth();
  const stats = useLocalStats();
  const profile = useProfile();
  const { reviewCount } = useSpacedReview();
  const { checkReminders, scheduleReminder } = useNotifications();
  const { isNewUser, isGuidedMode, isStuck, toggleGuidedMode, isOnboarded } = useBeginnerStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notOnboarded, setNotOnboarded] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [weeklyData, setWeeklyData] = useState({ xpEarned: 0, modulesCompleted: 0, handsPlayed: 0, streakDays: 0 });
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [referralToast, setReferralToast] = useState(false);

  useEffect(() => {
    try {
      setIsGuest(localStorage.getItem("bq_guest") === "1");
      if (!localStorage.getItem("bq_onboarded")) {
        setShowOnboarding(true);
        setNotOnboarded(true);
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

  const handleReferralBonus = useRef(() => {
    setReferralToast(true);
    setTimeout(() => setReferralToast(false), 4000);
  }).current;

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

  // While auth is loading, show spinner (prevents dashboard flash after logout)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center" role="status" aria-label="Caricamento in corso">
        <div className="w-8 h-8 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">Caricamento...</span>
      </div>
    );
  }

  // Show landing page for non-authenticated visitors (not guest, not logged in)
  if (!user && !isGuest) {
    return <LandingPage onContinueAsGuest={() => {
      try { localStorage.setItem("bq_guest", "1"); } catch {}
      setIsGuest(true);
    }} />;
  }

  if (showOnboarding) {
    return <PrimaManoOnboarding onDismiss={handleOnboardingComplete} />;
  }

  return (
    <div>
      {/* Referral code handler (reads ?ref= from URL) */}
      <Suspense fallback={null}>
        <ReferralHandler onReferralBonus={handleReferralBonus} />
      </Suspense>

      {/* Marketing consent banner (logged-in users, shown once) */}
      <MarketingConsentBanner
        user={user}
        marketingConsent={authProfile?.marketing_consent ?? null}
      />

      {/* Referral bonus toast */}
      <AnimatePresence>
        {referralToast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-500/30">
              <Zap className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-bold">Bonus +50 XP dal tuo amico!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement popup */}
      <AchievementPopup badge={newBadge} onDismiss={dismiss} />

      {/* Weekly Recap Modal */}
      <WeeklyRecapModal
        open={showWeeklyRecap}
        onClose={() => setShowWeeklyRecap(false)}
        data={weeklyData}
        title={profile.weeklyRecapTitle}
      />
      {/* ===== HERO — compact green header with inline stats ===== */}
      <HeroSection
        stats={stats}
        totalModulesCompleted={totalModulesCompleted}
        handsPlayed={handsPlayed}
        hasStarted={hasStarted}
        nextModule={nextModule}
      />

      {/* Guest login reminder */}
      {!user && isGuest && stats.xp === 0 && Object.keys(stats.completedModules).length === 0 && <GuestLoginReminder />}

      {/* Prima Mano banner for users who skipped onboarding */}
      {notOnboarded && !showOnboarding && <PrimaManoBanner />}

      {/* ===== GUIDED PATH (new users first 7 days) ===== */}
      {isOnboarded && isNewUser && !isStuck && (
        <section className="mx-auto max-w-lg px-4 mb-4">
          <GuidedPath variant="compact" />
        </section>
      )}

      {/* ===== "MI SONO PERSO" CARD (stuck users) ===== */}
      {isOnboarded && isStuck && (
        <section className="mx-auto max-w-lg px-4 mb-4">
          <LostCard nextModule={nextModule} />
        </section>
      )}

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
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl shadow-amber/30" role="status" aria-label={`Login giornaliero: bonus ${10 + Math.min(stats.streak * 5, 50)} XP`}>
              <Zap className="w-5 h-5" aria-hidden="true" />
              Login giornaliero: +{10 + Math.min(stats.streak * 5, 50)} {profile.xpLabel}
              {stats.streak > 1 && <span className="ml-1 text-amber-100">(streak x{stats.streak})</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BENTO GRID ===== */}
      <BentoGrid dailyDone={stats.dailyDone} />

      {/* ===== PENDING IMP CHALLENGES ===== */}
      <section className="px-4 sm:px-5 -mt-2 relative z-10">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PendingChallengesBanner />
          </motion.div>
        </div>
      </section>

      {/* ===== PROSSIMO PASSO SUGGERITO ===== */}
      {hasStarted && !isGuidedMode && <SuggestedNextStep nextModule={nextModule} />}

      {/* ===== DAILY CHALLENGE + STREAK ===== (hidden on desktop, sidebar shows these) */}
      <DailyChallengeStreakMobile
        dailyDone={stats.dailyDone}
        streak={stats.streak}
        streakAtRisk={stats.streakAtRisk}
        dailyChallengeLabel={profile.dailyChallengeLabel}
      />

      {/* ===== DAILY QUESTS ===== */}
      <section className="px-4 sm:px-5 pt-5">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c8a44e]/15">
                <Target className="w-4 h-4 text-[#c8a44e]" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Obiettivi del giorno
              </h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold text-[#c8a44e] border-[#c8a44e]/30">
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

      {/* ===== SONDAGGIO BANNER ===== */}
      <SurveyBanner />

      {/* ===== TROVA ASD BANNER ===== (logged-in users without ASD) */}
      {user && !authProfile?.asd_code && <FindAsdBanner />}

      {/* ===== DIDACTA 2026 BANNER ===== */}
      <section className="px-4 sm:px-5 pt-4">
        <div className="mx-auto max-w-lg">
          <DidactaBanner />
        </div>
      </section>

      {/* ===== WEEKLY CHALLENGE BANNER ===== (hidden in guided mode) */}
      {!isGuidedMode && (
        <section className="px-4 sm:px-5 pt-4">
          <div className="mx-auto max-w-lg">
            <WeeklyChallengeBanner compact />
          </div>
        </section>
      )}

      {/* ===== WEEKLY OBJECTIVES ===== (hidden in guided mode) */}
      {!isGuidedMode && <WeeklyObjectivesSection />}

      {/* ===== INSTALL APP BANNER ===== (mobile only) */}
      <InstallAppBanner />

      {/* ===== SPACED REVIEW ===== (hidden on desktop, sidebar shows it) */}
      <SpacedReviewCard reviewCount={reviewCount} />

      {/* ===== GLOSSARIO LINK ===== */}
      <GlossarioCard />

      {/* ===== TREASURE CHESTS ===== (hidden in guided mode) */}
      {!isGuidedMode && (
        <section className="px-4 sm:px-5 pt-4">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Prossimo premio
              </h2>
              <span className="text-xs font-bold text-amber-600">
                {totalModulesCompleted} moduli
              </span>
            </div>
            <TreasureChests modulesCompleted={totalModulesCompleted} />
          </div>
        </section>
      )}

      {/* ===== COLLEZIONE CARTE ===== (hidden in guided mode) */}
      {!isGuidedMode && (
        <CollectionTeaser
          xp={stats.xp}
          streak={stats.streak}
          handsPlayed={handsPlayed}
          completedModules={totalModulesCompleted}
        />
      )}

      {/* Suit divider */}
      <div className="flex items-center justify-center gap-3 py-2" aria-hidden="true">
        <div className="h-px w-12 bg-[#1B5E3B]/10" />
        <span className="text-[10px] tracking-[0.3em] text-[#1B5E3B]/20 select-none">♠ ♥ ♦ ♣</span>
        <div className="h-px w-12 bg-[#1B5E3B]/10" />
      </div>

      {/* ===== COURSES ===== */}
      <CoursesSection completedModules={stats.completedModules} />

      {/* ===== WORLDS (All Courses) ===== */}
      <WorldsGrid completedModules={stats.completedModules} />

      {/* Suit divider */}
      <div className="flex items-center justify-center gap-3 py-2" aria-hidden="true">
        <div className="h-px w-12 bg-[#1B5E3B]/10" />
        <span className="text-[10px] tracking-[0.3em] text-[#1B5E3B]/20 select-none">♠ ♥ ♦ ♣</span>
        <div className="h-px w-12 bg-[#1B5E3B]/10" />
      </div>

      {/* ===== SCOPRI IL BRIDGE ===== */}
      <ScopriBanner />

      {/* ===== GUIDED MODE TOGGLE ===== */}
      {isGuidedMode && <GuidedModeToggle onToggle={toggleGuidedMode} />}

      {/* ===== FIGB FOOTER ===== (hidden on desktop, sidebar shows it) */}
      <HomeFooter />
    </div>
  );
}
