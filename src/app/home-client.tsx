"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useCatalog } from "@/store/use-catalog-store";
import { useAchievementChecker, AchievementPopup } from "@/components/achievement-popup";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications, updateLastActivity } from "@/hooks/use-notifications";
import { useSharedAuth } from "@/contexts/auth-provider";
import { MarketingConsentBanner } from "@/components/marketing-consent-banner";
import { NotificationsNudge } from "@/components/notifications-nudge";
import { useBeginnerStatus } from "@/hooks/use-beginner-status";
import { LostCard } from "@/components/beginner/lost-card";
import { HeroSection } from "@/components/home/hero-section";
import { LicitaSection } from "@/components/home/licita-section";
import { HomeFooter } from "@/components/home/home-footer";
import { ReferralHandler } from "@/components/home/referral-handler";
import { HomeAllievo } from "@/components/home/home-allievo";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { corsiAttivi } from "@/lib/percorso-allievo";
import { TreasureChests } from "@/components/home/treasure-chests";
import { CollectionTeaser } from "@/components/home/collection-teaser";
import { LandingPage } from "@/components/home/landing-page";
import {
  HomeInsegnante,
  preferisceLaBacheca,
  ricordaPreferenzaBacheca,
} from "@/components/home/home-insegnante";
import { GuestLoginReminder } from "@/components/home/banners/guest-login-reminder";
import { PrimaManoBanner } from "@/components/home/banners/prima-mano-banner";
import { SuggestedNextStep } from "@/components/home/banners/suggested-next-step";
import { FindAsdBanner } from "@/components/home/banners/find-asd-banner";
import { useLocalStats } from "@/hooks/use-local-stats";
import { useGameStore, useHasHydrated } from "@/store/use-game-store";
import { GraduationCap, Zap } from "lucide-react";
import { reportError } from "@/lib/report-error";
import { InstructorCard } from "@/components/home/instructor-card";
import { useT } from "@/contexts/traduzioni-provider";

// Percorso "Prima Mano": ~16 kB gz di step interattivi che sostituiscono l'intera
// home solo per chi non è ancora onboardato. Fuori dal first load di tutti gli altri.
const PrimaManoOnboarding = dynamic(
  () => import("@/components/prima-mano-onboarding").then((m) => m.PrimaManoOnboarding),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    ),
  },
);
// Modale di riepilogo settimanale: si apre al massimo una volta a settimana.
const WeeklyRecapModal = dynamic(
  () => import("@/components/home/weekly-recap-modal").then((m) => m.WeeklyRecapModal),
  { ssr: false },
);

export function HomeClient({ serverAuthed }: { serverAuthed: boolean }) {
  const t = useT();
  const { user, profile: authProfile, loading: authLoading } = useSharedAuth();
  // Solo per chi ha fatto l'accesso: vedi `useEnrolledClasses`.
  const { classes: classiIscritte } = useEnrolledClasses(!!user);
  const { courses, isLoaded: catalogLoaded } = useCatalog();
  const stats = useLocalStats();
  const profile = useProfile();
  useSpacedReview();
  const { checkReminders, scheduleReminder } = useNotifications();
  const { isGuidedMode, isStuck, isOnboarded } = useBeginnerStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notOnboarded, setNotOnboarded] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  // Resta montato dopo la prima apertura: l'animazione di uscita di
  // AnimatePresence continua a funzionare e il chunk parte solo se serve.
  const [weeklyRecapArmed, setWeeklyRecapArmed] = useState(false);
  const [weeklyData, setWeeklyData] = useState({ xpEarned: 0, modulesCompleted: 0, handsPlayed: 0, streakDays: 0 });
  const handsPlayed = useGameStore((s) => s.handsPlayed);
  const [isGuest, setIsGuest] = useState(false);
  const [referralToast, setReferralToast] = useState(false);
  /**
   * Chi insegna ha chiesto di vedere la bacheca dell'allievo.
   *
   * Sta in `localStorage` e si legge dopo il mount come gli altri: durante il
   * primo render vale `false`, quindi l'insegnante vede per un istante la
   * propria home anche se aveva scelto la bacheca. È il compromesso già in
   * uso nel resto del file per non avere disallineamenti fra server e client.
   */
  const [vuoleLaBacheca, setVuoleLaBacheca] = useState(false);
  const hydrated = useHasHydrated();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setIsGuest(localStorage.getItem("bq_guest") === "1");
      setVuoleLaBacheca(preferisceLaBacheca());
      if (!localStorage.getItem("bq_onboarded")) {
        setShowOnboarding(true);
        setNotOnboarded(true);
      }
    } catch {}
  }, []);

  // Weekly recap — depends on hydrated store values, not stale localStorage.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const today = new Date();
      if (today.getDay() > 1) return; // Sunday or Monday only

      const weekKey = `bq_recap_${today.getFullYear()}-W${Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 604800000)}`;
      const snapshot = (): { xp: number; modules: number; hands: number } => {
        const { xp, completedModules, handsPlayed } = useGameStore.getState();
        return { xp, modules: Object.keys(completedModules).length, hands: handsPlayed };
      };

      if (!localStorage.getItem(weekKey) && localStorage.getItem("bq_onboarded")) {
        const lastSnapshot = JSON.parse(localStorage.getItem("bq_weekly_snapshot") || "{}");
        const current = snapshot();
        const currentStreak = useGameStore.getState().streak;
        if (lastSnapshot.xp !== undefined) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- confronto col precedente snapshot settimanale (localStorage), calcolabile solo sul client dopo il mount
          setWeeklyData({
            xpEarned: current.xp - (lastSnapshot.xp || 0),
            modulesCompleted: current.modules - (lastSnapshot.modules || 0),
            handsPlayed: current.hands - (lastSnapshot.hands || 0),
            streakDays: currentStreak,
          });
          if (current.xp > (lastSnapshot.xp || 0)) {
            setWeeklyRecapArmed(true);
            setShowWeeklyRecap(true);
          }
        }
        localStorage.setItem(weekKey, "1");
        localStorage.setItem("bq_weekly_snapshot", JSON.stringify(current));
      }
      if (!localStorage.getItem("bq_weekly_snapshot")) {
        localStorage.setItem("bq_weekly_snapshot", JSON.stringify(snapshot()));
      }
    } catch (e) {
      // Non è un puro accesso localStorage: c'è parsing + calcolo del recap.
      reportError("home:weekly-recap", e);
    }
  }, [hydrated]);

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

  const handleReferralBonus = useCallback(() => {
    setReferralToast(true);
    setTimeout(() => setReferralToast(false), 4000);
  }, []);

  // World summaries derived from the live catalog (Phase 3.3).
  // Memoised so the achievement checker doesn't re-trigger on unrelated state changes.
  const allWorldsData = useMemo(
    () => courses.flatMap((c) => c.worlds),
    [courses],
  );

  const worldsCompleted = useMemo(() => {
    let count = 0;
    for (const w of allWorldsData) {
      const totalModules = w.lessons.reduce(
        (sum, l) => sum + l.modules.length,
        0,
      );
      if (totalModules === 0) continue;
      let completedInWorld = 0;
      for (const lesson of w.lessons) {
        for (const mod of lesson.modules) {
          if (stats.completedModules[`${lesson.id}-${mod.id}`]) completedInWorld++;
        }
      }
      if (completedInWorld === totalModules) count++;
    }
    return count;
  }, [allWorldsData, stats.completedModules]);

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
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- il compiler non garantisce l'immutabilità delle dipendenze (dati del catalogo/derivati): salta solo l'ottimizzazione, la memo manuale resta corretta
  const nextModule = useMemo(() => {
    for (const course of courses) {
      for (const w of course.worlds) {
        for (const lesson of w.lessons) {
          for (const mod of lesson.modules) {
            if (!stats.completedModules[`${lesson.id}-${mod.id}`]) {
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
  }, [courses, stats.completedModules]);

  const hasStarted = totalModulesCompleted > 0;

  // Effective login state: fall back to the server's decision until client auth
  // resolves. This lets the server render the landing directly (no client-side
  // auth spinner) so the landing HTML is in the initial payload → fast LCP + SEO.
  const isLoggedIn = authLoading ? serverAuthed : !!user;

  // Show landing page for non-authenticated visitors (not guest, not logged in)
  if (!isLoggedIn && !isGuest) {
    return <LandingPage onContinueAsGuest={() => {
      try { localStorage.setItem("bq_guest", "1"); } catch {}
      setIsGuest(true);
    }} />;
  }

  if (showOnboarding) {
    return <PrimaManoOnboarding onDismiss={handleOnboardingComplete} />;
  }

  /**
   * IL BIVIO PER RUOLO, che prima non esisteva.
   *
   * `profiles.role` c'è da sempre e nessuno lo guardava per decidere cosa
   * mostrare: chi insegna atterrava sulla bacheca dell'allievo e il portale
   * delle classi era da cercare nel menù.
   *
   * Il ramo sta QUI e non prima: la pagina di ingresso e l'avvio guidato
   * valgono per tutti, ruolo compreso — un insegnante alla prima apertura è
   * comunque uno che deve capire dov'è.
   *
   * Non c'è un ramo per l'amministratore: chi amministra è quasi sempre anche
   * insegnante, `/admin` ha già la sua sezione nel menù, e una terza home
   * sarebbe una pagina in più da tenere allineata per due persone.
   */
  const insegna = authProfile?.role === "instructor" || authProfile?.role === "admin";
  const corsiIscritti = corsiAttivi(classiIscritte);

  /*
   * IL SECONDO RAMO: chi segue un corso.
   *
   * Sta DOPO quello dell'insegnante perché molti insegnanti sono anche iscritti
   * a un corso di aggiornamento, e in quel caso deve vincere il loro lavoro.
   *
   * Come per l'insegnante, non toglie niente: `onVaiAllaBacheca` porta al
   * portale di sempre e la scelta viene ricordata. È il vincolo che ci siamo
   * dati — chi è già dentro una classe non perde accesso a cose che vedeva —
   * e vale anche per le diciotto classi che esistevano prima di questa home.
   */
  const segueUnCorso = !insegna && corsiIscritti.length > 0;
  if (segueUnCorso && !vuoleLaBacheca) {
    return (
      <HomeAllievo
        onVaiAllaBacheca={() => {
          ricordaPreferenzaBacheca(true);
          setVuoleLaBacheca(true);
        }}
      />
    );
  }

  if (insegna && !vuoleLaBacheca) {
    return (
      <HomeInsegnante
        nome={authProfile?.display_name ?? null}
        onVaiAllaBacheca={() => {
          ricordaPreferenzaBacheca(true);
          setVuoleLaBacheca(true);
        }}
      />
    );
  }

  // Dashboard needs the lesson catalog. Show spinner until the first
  // successful Supabase fetch lands — non-authenticated visitors already
  // returned above with the landing page, so we never spin for them.
  if (!catalogLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label={t("Caricamento in corso")}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">{t("Caricamento...")}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Referral code handler (reads ?ref= from URL) */}
      <Suspense fallback={null}>
        <ReferralHandler onReferralBonus={handleReferralBonus} />
      </Suspense>

      {/*
        La strada di ritorno. Senza, «vai alla bacheca» sarebbe una porta a
        senso unico: la preferenza resta salvata, e l'insegnante si ritroverebbe
        la bacheca dell'allievo per sempre senza sapere perché.
      */}
      {insegna && (
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
          <button
            onClick={() => {
              ricordaPreferenzaBacheca(false);
              setVuoleLaBacheca(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("Torna all'area insegnanti")}
          </button>
        </div>
      )}

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
              <span className="text-sm font-bold">{t("Bonus +50 XP dal tuo amico!")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement popup */}
      <AchievementPopup badge={newBadge} onDismiss={dismiss} />

      {/* Weekly Recap Modal */}
      {weeklyRecapArmed && (
        <WeeklyRecapModal
          open={showWeeklyRecap}
          onClose={() => setShowWeeklyRecap(false)}
          data={weeklyData}
          title={profile.weeklyRecapTitle}
        />
      )}
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

      {/* ===== HUB DI NAVIGAZIONE (Impara / Gioca / Scuola) ===== */}
      <section className="px-4 sm:px-5 pt-4">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3">
          {[
            { href: "/impara", emoji: "🎓", label: "Impara", desc: "Percorso e corsi", cls: "from-[#1B5E3B] to-[#2A7A4F]" },
            { href: "/gioca", emoji: "🎮", label: "Gioca", desc: "Pratica e sfide", cls: "from-figb to-figb-light" },
            { href: "/scuola", emoji: "👨‍🏫", label: "Scuola", desc: "Le tue classi", cls: "from-[#c8a44e] to-[#a8842e]" },
          ].map((h) => (
            <Link key={h.href} href={h.href} aria-label={h.label} className="block">
              <div className={`flex h-full flex-col items-center gap-1 rounded-2xl bg-gradient-to-br ${h.cls} p-4 text-center text-white transition-all hover:translate-y-[-2px] hover:shadow-lg active:scale-[0.98]`}>
                <span className="text-2xl">{h.emoji}</span>
                <span className="text-sm font-bold">{h.label}</span>
                <span className="text-[12px] text-white/75">{h.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== LICITA — le tre porte al gioco con gli altri ===== */}
      <LicitaSection />

      {/* ===== ATTIVA PROMEMORIA ===== (logged-in; activates the reminder loop) */}
      {user && <NotificationsNudge />}

      {/* ===== "MI SONO PERSO" CARD (stuck users) ===== */}

      {/* ===== "MI SONO PERSO" CARD (stuck users) ===== */}
      {isOnboarded && isStuck && (
        <section className="mx-auto max-w-6xl px-4 mb-4">
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

      {/* ===== PROSSIMO PASSO SUGGERITO ===== */}
      {hasStarted && !isGuidedMode && <SuggestedNextStep nextModule={nextModule} />}

      {/* ===== TROVA ASD BANNER ===== (logged-in users without ASD) */}
      {user && !authProfile?.asd_code && <FindAsdBanner />}

      {/* ===== TREASURE CHESTS ===== (hidden in guided mode) */}
      {!isGuidedMode && (
        <section className="px-4 sm:px-5 pt-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-foreground">
                {t("Prossimo premio")}
              </h2>
              <span className="text-xs font-bold text-amber-600">
                {totalModulesCompleted} moduli
              </span>
            </div>
            <TreasureChests modulesCompleted={totalModulesCompleted} />
          </div>
        </section>
      )}

      {/* ===== PER L'INSEGNANTE ===== (non rende nulla se non hai classi) */}
      {!isGuidedMode && <InstructorCard />}

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
      {/* pointer-events-none: è decorativo e, essendo dentro un <main>
          che si estende, intercettava i clic sui comandi del footer
          sottostante — fra cui «Preferenze cookie». */}
      <div className="flex items-center justify-center gap-3 py-2 pointer-events-none" aria-hidden="true">
        <div className="h-px w-12 bg-foreground/10" />
        <span className="text-[12px] tracking-[0.3em] text-foreground/20 select-none">♠ ♥ ♦ ♣</span>
        <div className="h-px w-12 bg-foreground/10" />
      </div>

      {/* ===== FIGB FOOTER ===== (hidden on desktop, sidebar shows it) */}
      <HomeFooter />
    </div>
  );
}
