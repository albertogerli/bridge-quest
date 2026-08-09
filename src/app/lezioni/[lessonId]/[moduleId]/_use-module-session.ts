"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAppunti } from "@/hooks/use-appunti";
import { updateLastActivity } from "@/hooks/use-notifications";
import { useProfile, type ProfileConfig } from "@/hooks/use-profile";
import { useSounds } from "@/hooks/use-sounds";
import type { Course, Lesson, LessonModule } from "@/lib/catalog";
import {
  MIN_READ_SECONDS,
  READ_STEP_XP,
  buildGlossaryTermMap,
  buildShuffledQuizOptions,
  collectRuleTexts,
  computeXpMultiplier,
  countCorrectAnswers,
  countQuizzes,
  computeQuizStreakBonus,
  computeCardStreakBonus,
  isQuizBlock,
  loginStreakAction,
  needsReadTimer,
  pickFiftyFiftyEliminations,
  shouldRecordCompletion,
  todayIsoDate,
  withStepViewed,
  xpDeltaToPersist,
} from "@/lib/lesson-module";
import { getLevel as getLevelFromXp } from "@/lib/xp-levels";
import { useCatalog } from "@/store/use-catalog-store";
import { useGameStore } from "@/store/use-game-store";
import { useGlossary } from "@/store/use-glossary-store";
import { yesterdayIsoDate } from "@/lib/lesson-module";
import { clearDraft, loadDraft, saveDraft as writeDraft, setLastLessonTimestamp } from "./_storage";
import type { FloatingXp, ModuleBlockContext, ModuleDraft, Particle, Powerups } from "./_types";

/** Stato completo della sessione di studio di un modulo. */
export interface ModuleSession {
  // ── Catalogo ──
  catalogLoaded: boolean;
  courses: Course[];
  lesson: Lesson | undefined;
  mod: LessonModule | undefined;
  profile: ProfileConfig;
  isJunior: boolean;

  // ── Avanzamento ──
  currentStep: number;
  totalQuizzes: number;
  correctAnswers: number;
  canAdvance: boolean;
  handleStepAdvance: (nextStep: number) => void;
  handleSaveAndExit: () => void;

  // ── Punteggio e gamification ──
  xpEarned: number;
  bestStreak: number;
  lives: number;
  livesLost: boolean;
  powerups: Powerups;
  xpMultiplier: number;

  // ── Effetti visivi ──
  saveToast: boolean;
  showXpPop: boolean;
  xpPopAmount: number;
  achievement: string | null;
  showLevelUp: boolean;
  closeLevelUp: () => void;
  levelUpRef: React.RefObject<HTMLDivElement | null>;
  levelUpLevel: number;
  floatingXp: FloatingXp[];
  particles: Particle[];

  // ── Quiz di comprensione finale ──
  showComprehension: boolean;
  onComprehensionComplete: (score: number, total: number) => void;
  dismissComprehension: () => void;

  /** Stato e azioni passati a ogni blocco di contenuto. */
  blockContext: ModuleBlockContext;
}

/**
 * Stato, effetti e persistenza del modulo di lezione.
 *
 * Estratto da `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` senza cambi di
 * comportamento: stessa sequenza di hook (tutti prima dei return condizionali
 * della pagina, per `rules-of-hooks`), stesse dipendenze e stesse formule
 * (ora in `@/lib/lesson-module`).
 */
export function useModuleSession(lessonId: string, moduleId: string): ModuleSession {
  const router = useRouter();
  const { courses, isLoaded: catalogLoaded } = useCatalog();
  const lessonIdNum = parseInt(lessonId);
  const lesson = courses.flatMap((c) => c.lessons).find((l) => l.id === lessonIdNum);
  const mod = lesson?.modules.find((m) => m.id === moduleId);
  const content = useMemo(() => mod?.content ?? [], [mod]);

  // Load draft from localStorage (lazy, runs once on mount)
  const [draft] = useState<ModuleDraft | null>(() => loadDraft(lessonId, moduleId));
  const [currentStep, setCurrentStep] = useState(draft?.currentStep ?? 0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>(draft?.quizAnswers ?? {});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>(draft?.showExplanation ?? {});
  const [correctStreak, setCorrectStreak] = useState(draft?.correctStreak ?? 0);
  const [bestStreak, setBestStreak] = useState(draft?.bestStreak ?? 0);
  const [xpEarned, setXpEarned] = useState(draft?.xpEarned ?? 0);
  const [saveToast, setSaveToast] = useState(false);
  const [showXpPop, setShowXpPop] = useState(false);
  const [xpPopAmount, setXpPopAmount] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [stepsViewed, setStepsViewed] = useState<Set<number>>(new Set([0]));
  const [quizTimer, setQuizTimer] = useState(0);

  // Minimum reading time per step (prevents clicking "Avanti" instantly for XP)
  const [canAdvance, setCanAdvance] = useState(false);
  const stepEnteredAt = useRef(Date.now());

  // === GAMIFICATION STATE ===
  const [lives, setLives] = useState(draft?.lives ?? 3); // ❤️ lives system
  const [livesLost, setLivesLost] = useState(false); // shake animation trigger
  const [powerups, setPowerups] = useState<Powerups>({ fiftyFifty: 1, skip: 1, extraTime: 1 }); // power-ups
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({}); // 50/50: eliminated option indices per block
  const [xpMultiplier, setXpMultiplier] = useState(1); // streak multiplier
  const [showLevelUp, setShowLevelUp] = useState(false); // level up popup
  const levelUpRef = useRef<HTMLDivElement>(null);
  const closeLevelUp = useCallback(() => setShowLevelUp(false), []);
  // Popup celebrativo senza controlli: il trap serve a portarci il focus (così
  // lo screen reader lo annuncia) e a renderlo chiudibile con Escape.
  useFocusTrap(levelUpRef, showLevelUp, { onEscape: closeLevelUp });
  const [showComprehension, setShowComprehension] = useState(true); // comprehension quiz gate
  const [floatingXp, setFloatingXp] = useState<FloatingXp[]>([]); // flying XP
  const floatingXpId = useRef(0);

  const completionSaved = useRef(false);
  const prevXpRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Profile-based gamification config
  const profile = useProfile();
  const { playSound } = useSounds();
  const { saveRules } = useAppunti();

  // Minimum reading time: disable Avanti for MIN_READ_SECONDS on each new step
  useEffect(() => {
    if (!mod) return;
    // Already-viewed steps or quiz steps don't need the timer
    if (!needsReadTimer(mod.content[currentStep], stepsViewed.has(currentStep))) {
      setCanAdvance(true);
      return;
    }
    setCanAdvance(false);
    stepEnteredAt.current = Date.now();
    const readTimer = setTimeout(() => setCanAdvance(true), MIN_READ_SECONDS * 1000);
    return () => clearTimeout(readTimer);
  }, [currentStep, mod, stepsViewed]);

  // Quiz timer for "giovane" profile
  useEffect(() => {
    if (!profile.showTimer || !mod) return;
    const isQuiz = isQuizBlock(mod.content[currentStep]);
    const alreadyAnswered = quizAnswers[currentStep] !== undefined;

    if (isQuiz && !alreadyAnswered) {
      setQuizTimer(profile.timerSeconds);
      timerRef.current = setInterval(() => {
        setQuizTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setQuizTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [currentStep, profile.showTimer, profile.timerSeconds, mod, quizAnswers]);

  // Persist XP delta to the game store
  useEffect(() => {
    const delta = xpDeltaToPersist(prevXpRef.current, xpEarned);
    if (delta > 0) {
      prevXpRef.current = xpEarned;
      useGameStore.getState().addXp(delta);
    }
  }, [xpEarned]);

  // === AUTO-SAVE DRAFT ===
  const saveDraft = useCallback(() => {
    writeDraft(lessonId, moduleId, {
      currentStep,
      quizAnswers,
      showExplanation,
      xpEarned,
      lives,
      correctStreak,
      bestStreak,
      savedAt: new Date().toISOString(),
    });
  }, [currentStep, quizAnswers, showExplanation, xpEarned, lives, correctStreak, bestStreak, lessonId, moduleId]);

  // Auto-save on step change (after step 0)
  useEffect(() => {
    if (currentStep > 0) {
      saveDraft();
    }
  }, [currentStep, saveDraft]);

  // Mark module completed when reaching last step
  const contentLength = content.length;
  useEffect(() => {
    if (shouldRecordCompletion(currentStep, contentLength, completionSaved.current)) {
      completionSaved.current = true;
      useGameStore.getState().completeModule(lessonId, moduleId);
      try {
        setLastLessonTimestamp(Date.now());

        // Clear draft on completion
        clearDraft(lessonId, moduleId);

        // Update streak (home page handles daily login, but update here too as fallback)
        const today = todayIsoDate(Date.now());
        const { lastLogin } = useGameStore.getState();
        const action = loginStreakAction(lastLogin, today, yesterdayIsoDate(Date.now()));
        if (action !== "none") {
          if (action === "increment") {
            useGameStore.getState().incrementStreak();
          } else {
            useGameStore.getState().resetStreak();
          }
          useGameStore.getState().setLastLogin(today);
        }

        // Update last activity for notification reminders
        updateLastActivity();
      } catch {}

      // Auto-save rules to appunti (bloc notes) for senior users
      if (mod && lesson) {
        const ruleTexts = collectRuleTexts(mod.content);
        if (ruleTexts.length > 0) {
          saveRules({
            lessonId: lesson.id,
            moduleId: mod.id,
            lessonTitle: lesson.title,
            moduleTitle: mod.title,
            rules: ruleTexts,
          });
        }
      }
    }
  }, [currentStep, contentLength, lessonId, moduleId, mod, lesson, saveRules]);

  // Shuffle quiz options so correct answer isn't always first (Fisher-Yates)
  const shuffledQuizOptions = useMemo(
    () => (mod ? buildShuffledQuizOptions(mod.content) : {}),
    [mod]
  );

  // Count quizzes for scoring (all interactive types)
  const totalQuizzes = useMemo(() => countQuizzes(content), [content]);
  const correctAnswers = useMemo(
    () => countCorrectAnswers(content, quizAnswers),
    [quizAnswers, content]
  );

  // NOTE: tutti gli hook devono precedere i return condizionali della pagina
  // che consuma questo hook (rules-of-hooks).
  // Update XP multiplier based on streak
  useEffect(() => {
    setXpMultiplier(computeXpMultiplier(correctStreak));
  }, [correctStreak]);

  const handleStepAdvance = useCallback((nextStep: number) => {
    setCurrentStep(nextStep);
    // Scroll the newly-revealed block into view (not back to top) — previous
    // blocks stay rendered, so jumping to the top would force re-scrolling.
    requestAnimationFrame(() => {
      const target = document.querySelector(
        `[data-step-block="${nextStep}"]`
      ) as HTMLElement | null;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    if (!stepsViewed.has(nextStep)) {
      setStepsViewed((prev) => withStepViewed(prev, nextStep));
      // Award small XP for reading content
      awardXp(READ_STEP_XP);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- awardXp è una funzione di modulo-componente ricreata a ogni render: includerla vanificherebbe la memoizzazione senza cambiare il comportamento
  }, [stepsViewed]);

  // Build term→key map once (catalog-backed)
  const { glossary } = useGlossary();
  const glossaryTermMap = useMemo(() => buildGlossaryTermMap(glossary), [glossary]);

  // Save and exit handler
  const handleSaveAndExit = useCallback(() => {
    saveDraft();
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      router.push(`/lezioni/${lessonId}`);
    }, 800);
  }, [saveDraft, router, lessonId]);

  // Giovane: particles on correct answer
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  // Senior: hint system
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  // ─── Azioni (funzioni semplici, ricreate a ogni render come nell'originale) ──

  const awardXp = (baseAmount: number) => {
    const amount = baseAmount * xpMultiplier;
    setXpEarned((prev) => {
      const oldLevel = getLevelFromXp(prev);
      const newLevel = getLevelFromXp(prev + amount);
      if (newLevel > oldLevel) {
        // Level up!
        setTimeout(() => {
          playSound("levelUp");
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }, 500);
      }
      return prev + amount;
    });
    setXpPopAmount(amount);
    setShowXpPop(true);
    setTimeout(() => setShowXpPop(false), 1200);

    // Flying XP animation
    const newFloating = {
      id: floatingXpId.current++,
      amount,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 60 + Math.random() * 20,
    };
    setFloatingXp((prev) => [...prev, newFloating]);
    setTimeout(() => setFloatingXp((prev) => prev.filter((f) => f.id !== newFloating.id)), 1500);
  };

  const showAchievement = (text: string) => {
    setAchievement(text);
    setTimeout(() => setAchievement(null), 2500);
  };

  const spawnParticles = () => {
    if (profile.profile !== "giovane") return;
    const newParticles = Array.from({ length: 8 }, () => ({
      id: particleId.current++,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 30,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => !newParticles.includes(p))), 1200);
  };

  const handleQuizAnswer = (blockIndex: number, answerIndex: number) => {
    const block = content[blockIndex];
    const correct = answerIndex === block?.correctAnswer;
    setQuizAnswers((prev) => ({ ...prev, [blockIndex]: answerIndex }));
    setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));

    if (correct) {
      playSound("correct");
      const streak = correctStreak + 1;
      setCorrectStreak(streak);
      if (streak > bestStreak) setBestStreak(streak);
      awardXp(20 + computeQuizStreakBonus(streak));
      spawnParticles(); // giovane: emoji burst

      // Stop timer on answer
      if (timerRef.current) clearInterval(timerRef.current);

      // Achievement triggers
      if (streak === 3) showAchievement(profile.streak3);
      if (streak === 5) showAchievement(profile.streak5);
      if (streak === 7) showAchievement(profile.streak7);
      if (correctAnswers + 1 === totalQuizzes && totalQuizzes >= 3) {
        showAchievement(profile.perfectScore);
      }
    } else {
      playSound("wrong");
      setCorrectStreak(0);
      if (timerRef.current) clearInterval(timerRef.current);
      // Lose a life
      setLives((prev) => Math.max(0, prev - 1));
      setLivesLost(true);
      setTimeout(() => setLivesLost(false), 600);
    }
  };

  /** Risposta al quiz «scegli la carta»: +25 XP, senza vite né achievement. */
  const handleCardSelect = (blockIndex: number, cardIndex: number, correct: boolean) => {
    setQuizAnswers((prev) => ({ ...prev, [blockIndex]: cardIndex }));
    setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));
    if (correct) {
      const streak = correctStreak + 1;
      setCorrectStreak(streak);
      awardXp(25 + computeCardStreakBonus(streak));
    } else {
      setCorrectStreak(0);
    }
  };

  /** Risposta al quiz «valuta la mano»: +30 XP, senza vite né achievement. */
  const handleHandEval = (blockIndex: number, points: number, correct: boolean) => {
    setQuizAnswers((prev) => ({ ...prev, [blockIndex]: points }));
    setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));
    if (correct) {
      const streak = correctStreak + 1;
      setCorrectStreak(streak);
      awardXp(30 + computeCardStreakBonus(streak));
    } else {
      setCorrectStreak(0);
    }
  };

  // Power-up: 50/50 - eliminate 2 wrong options
  const consumeFiftyFifty = (blockIndex: number) => {
    const block = content[blockIndex];
    if (!block || !block.options || powerups.fiftyFifty <= 0) return;
    // Keep one wrong, eliminate the rest
    const toEliminate = pickFiftyFiftyEliminations(
      block.options.length,
      block.correctAnswer ?? 0
    );
    setEliminated((prev) => ({ ...prev, [blockIndex]: toEliminate }));
    setPowerups((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
  };

  // Power-up: Skip question (auto-correct)
  const consumeSkip = (blockIndex: number) => {
    const block = content[blockIndex];
    if (!block || powerups.skip <= 0) return;
    const correctIdx = block.correctAnswer ?? 0;
    setQuizAnswers((prev) => ({ ...prev, [blockIndex]: correctIdx }));
    setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));
    awardXp(5); // minimal XP for skip
    setPowerups((prev) => ({ ...prev, skip: prev.skip - 1 }));
  };

  // Power-up: Extra Time (+15s)
  const consumeExtraTime = () => {
    if (powerups.extraTime <= 0) return;
    setQuizTimer((prev) => prev + 15);
    setPowerups((prev) => ({ ...prev, extraTime: prev.extraTime - 1 }));
  };

  const isJunior = profile.profile === "junior";

  return {
    catalogLoaded,
    courses,
    lesson,
    mod,
    profile,
    isJunior,

    currentStep,
    totalQuizzes,
    correctAnswers,
    canAdvance,
    handleStepAdvance,
    handleSaveAndExit,

    xpEarned,
    bestStreak,
    lives,
    livesLost,
    powerups,
    xpMultiplier,

    saveToast,
    showXpPop,
    xpPopAmount,
    achievement,
    showLevelUp,
    closeLevelUp,
    levelUpRef,
    levelUpLevel: getLevelFromXp(xpEarned),
    floatingXp,
    particles,

    showComprehension,
    onComprehensionComplete: (score, total) => {
      setShowComprehension(false);
      if (score === total) {
        // Bonus XP for perfect comprehension
        awardXp(15);
      }
    },
    dismissComprehension: () => setShowComprehension(false),

    blockContext: {
      profile,
      isJunior,
      glossaryTermMap,
      quizAnswers,
      showExplanation,
      shuffledQuizOptions,
      eliminated,
      showHint,
      powerups,
      quizTimer,
      correctStreak,
      totalQuizzes,
      revealHint: (blockIndex) => setShowHint((prev) => ({ ...prev, [blockIndex]: true })),
      handleQuizAnswer,
      handleCardSelect,
      handleHandEval,
      consumeFiftyFifty,
      consumeSkip,
      consumeExtraTime,
    },
  };
}
