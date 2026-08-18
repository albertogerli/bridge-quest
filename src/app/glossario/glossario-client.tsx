"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useProfile } from "@/hooks/use-profile";
import { useSound } from "@/hooks/use-sound";
import { CardDisplay } from "@/components/bridge/card-display";
import { useGlossary } from "@/store/use-glossary-store";
import type { GlossaryEntry } from "@/lib/catalog";
import Link from "next/link";
import { useGameStore } from "@/store/use-game-store";
import {
  Search,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Zap,
  Trophy,
  ArrowLeft,
  Shuffle,
} from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";

// ── Types ───────────────────────────────────────────────
type Phase = "browse" | "quiz-globale";
type Category = GlossaryEntry["category"] | "tutti";

interface QuizAnswer {
  termKey: string;
  question: string;
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
}

// ── Constants ───────────────────────────────────────────
const CATEGORY_LABELS: Record<Category, { label: string; emoji: string }> = {
  tutti: { label: "Tutti", emoji: "📖" },
  base: { label: "Base", emoji: "📚" },
  licita: { label: "Licita", emoji: "🗣️" },
  gioco: { label: "Gioco", emoji: "🃏" },
  difesa: { label: "Difesa", emoji: "🛡️" },
  punteggio: { label: "Punteggio", emoji: "🔢" },
};

const CATEGORY_BADGE_CLASSES: Record<GlossaryEntry["category"], string> = {
  base: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  licita: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  gioco: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  difesa: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  punteggio: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

const STORAGE_KEY = "bq_glossary_completed";
const QUIZ_GLOBALE_COUNT = 15;
const TIMER_SECONDS = 15;
const XP_PER_CORRECT = 15;
const XP_SECOND_ATTEMPT = 5;
const XP_BONUS_80 = 50;
const XP_BONUS_PERFECT = 100;

// ── Helpers ─────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleOptions(options: string[], correctIndex: number) {
  const indexed = options.map((opt, i) => ({ opt, isCorrect: i === correctIndex }));
  const shuffled = shuffleArray(indexed);
  const newCorrectIndex = shuffled.findIndex((o) => o.isCorrect);
  return {
    options: shuffled.map((o) => o.opt),
    correctIndex: newCorrectIndex,
  };
}

function loadCompleted(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompleted(data: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function awardXp(amount: number) {
  useGameStore.getState().addXp(amount);
  window.dispatchEvent(new Event("bq_stats_updated"));
}

function getStars(percentage: number): number {
  if (percentage >= 80) return 3;
  if (percentage >= 50) return 2;
  return 1;
}

// ── Component ───────────────────────────────────────────
export function GlossarioClient({ initialEntries }: { initialEntries: GlossaryEntry[] }) {
  const t = useT();
  const profile = useProfile();
  const { play } = useSound();

  // Catalog-backed glossary: alias `id` → `key` to keep existing JSX usages
  // (`.key`, `.key === ...`) working without a deeper refactor.
  // Prefer server-rendered entries (already in the SSR HTML → instant LCP);
  // fall back to the client store fetch only if the server passed nothing.
  const { entries: storeEntries } = useGlossary();
  const entries = initialEntries.length > 0 ? initialEntries : storeEntries;
  const allTerms = useMemo(
    () => entries.map((e) => ({ ...e, key: e.id })),
    [entries],
  );
  const totalCount = entries.length;

  // State
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("browse");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("tutti");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [inlineQuizKey, setInlineQuizKey] = useState<string | null>(null);

  // Inline quiz state
  const [inlineShuffled, setInlineShuffled] = useState<{
    options: string[];
    correctIndex: number;
  } | null>(null);
  const [inlineSelected, setInlineSelected] = useState<number | null>(null);
  const [inlineAttempts, setInlineAttempts] = useState(0);
  const [inlineXpAwarded, setInlineXpAwarded] = useState(0);

  // Quiz globale state
  const [quizTerms, setQuizTerms] = useState<(GlossaryEntry & { key: string })[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizShuffled, setQuizShuffled] = useState<{
    options: string[];
    correctIndex: number;
  } | null>(null);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAnswer[]>([]);
  const [quizTimer, setQuizTimer] = useState(TIMER_SECONDS);
  const [quizTimerActive, setQuizTimerActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for scrolling
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Mount
  useEffect(() => {
    setMounted(true);
    setCompleted(loadCompleted());
  }, []);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    let terms = allTerms;
    if (activeCategory !== "tutti") {
      terms = terms.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q)
      );
    }
    return terms;
  }, [allTerms, activeCategory, search]);

  const completedCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed]
  );

  // ── Inline quiz logic ─────────────────────────────────
  const openInlineQuiz = useCallback(
    (key: string) => {
      const entry = allTerms.find((t) => t.key === key);
      if (!entry) return;
      const { options, correctIndex } = shuffleOptions(
        entry.quiz.options,
        entry.quiz.correctAnswer
      );
      setInlineQuizKey(key);
      setInlineShuffled({ options, correctIndex });
      setInlineSelected(null);
      setInlineAttempts(0);
      setInlineXpAwarded(0);
    },
    [allTerms]
  );

  const handleInlineAnswer = useCallback(
    (index: number) => {
      if (inlineSelected !== null) return;
      if (!inlineShuffled || !inlineQuizKey) return;

      setInlineSelected(index);
      const isCorrect = index === inlineShuffled.correctIndex;

      if (isCorrect) {
        play("success");
        // Award XP: 15 first time, 5 on retries of already-completed terms
        if (!completed[inlineQuizKey]) {
          awardXp(XP_PER_CORRECT);
          setInlineXpAwarded(XP_PER_CORRECT);
          const newCompleted = { ...completed, [inlineQuizKey]: true };
          setCompleted(newCompleted);
          saveCompleted(newCompleted);
        } else if (inlineAttempts > 0) {
          awardXp(XP_SECOND_ATTEMPT);
          setInlineXpAwarded(XP_SECOND_ATTEMPT);
        } else {
          setInlineXpAwarded(0);
        }
      } else {
        play("error");
        setInlineAttempts((a) => a + 1);
      }
    },
    [inlineSelected, inlineShuffled, inlineQuizKey, completed, inlineAttempts, play]
  );

  const goToNextTerm = useCallback(() => {
    if (!inlineQuizKey) return;
    const currentIdx = filteredTerms.findIndex((t) => t.key === inlineQuizKey);
    if (currentIdx < filteredTerms.length - 1) {
      const nextKey = filteredTerms[currentIdx + 1].key;
      setExpandedKey(nextKey);
      setInlineQuizKey(null);
      setInlineShuffled(null);
      setInlineSelected(null);
      setInlineAttempts(0);
      // Scroll to next card
      setTimeout(() => {
        cardRefs.current[nextKey]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      // Last term: close
      setExpandedKey(null);
      setInlineQuizKey(null);
    }
  }, [inlineQuizKey, filteredTerms]);

  // ── Related term click ────────────────────────────────
  const scrollToTerm = useCallback(
    (key: string) => {
      // Reset category/search to show all
      setActiveCategory("tutti");
      setSearch("");
      setExpandedKey(key);
      setInlineQuizKey(null);
      setInlineShuffled(null);
      setInlineSelected(null);
      setTimeout(() => {
        cardRefs.current[key]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    },
    []
  );

  // ── Quiz globale logic ────────────────────────────────
  const startQuizGlobale = useCallback(() => {
    const selected = shuffleArray(allTerms).slice(0, QUIZ_GLOBALE_COUNT);
    setQuizTerms(selected);
    setQuizIndex(0);
    setQuizHistory([]);
    setQuizFinished(false);
    setShowRecap(false);
    setPhase("quiz-globale");

    // Shuffle first question
    if (selected.length > 0) {
      const { options, correctIndex } = shuffleOptions(
        selected[0].quiz.options,
        selected[0].quiz.correctAnswer
      );
      setQuizShuffled({ options, correctIndex });
      setQuizSelected(null);
      setQuizTimer(TIMER_SECONDS);
      setQuizTimerActive(true);
    }
  }, [allTerms]);

  // Timer effect
  useEffect(() => {
    if (!quizTimerActive || quizSelected !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setQuizTimer((t) => {
        if (t <= 1) {
          // Time's up - auto-wrong
          setQuizTimerActive(false);
          setQuizSelected(-1); // -1 = timed out
          play("error");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizTimerActive, quizSelected, play]);

  const handleQuizAnswer = useCallback(
    (index: number) => {
      if (quizSelected !== null) return;
      if (!quizShuffled || quizIndex >= quizTerms.length) return;

      setQuizSelected(index);
      setQuizTimerActive(false);
      const term = quizTerms[quizIndex];
      const isCorrect = index === quizShuffled.correctIndex;

      if (isCorrect) {
        play("success");
        awardXp(XP_PER_CORRECT);
        if (!completed[term.key]) {
          const newCompleted = { ...completed, [term.key]: true };
          setCompleted(newCompleted);
          saveCompleted(newCompleted);
        }
      } else {
        play("error");
      }

      setQuizHistory((prev) => [
        ...prev,
        {
          termKey: term.key,
          question: term.quiz.question,
          selectedIndex: index,
          correctIndex: quizShuffled.correctIndex,
          correct: isCorrect,
          explanation: term.quiz.explanation,
        },
      ]);
    },
    [quizSelected, quizShuffled, quizIndex, quizTerms, completed, play]
  );

  const nextQuizQuestion = useCallback(() => {
    const nextIdx = quizIndex + 1;
    if (nextIdx >= quizTerms.length) {
      // Quiz finished
      setQuizTimerActive(false);
      setQuizFinished(true);

      // Re-count from the complete history which is already updated
      // bonuses will be calculated in the results screen
      return;
    }

    setQuizIndex(nextIdx);
    const term = quizTerms[nextIdx];
    const { options, correctIndex } = shuffleOptions(
      term.quiz.options,
      term.quiz.correctAnswer
    );
    setQuizShuffled({ options, correctIndex });
    setQuizSelected(null);
    setQuizTimer(TIMER_SECONDS);
    setQuizTimerActive(true);
  }, [quizIndex, quizTerms]);

  // Quiz results calculations
  const quizResults = useMemo(() => {
    if (!quizFinished) return null;
    const total = quizHistory.length;
    const correctCount = quizHistory.filter((a) => a.correct).length;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;
    const stars = getStars(percentage);
    const baseXp = correctCount * XP_PER_CORRECT;
    const bonusXp = percentage >= 80 ? XP_BONUS_80 : 0;
    const perfectXp = percentage === 100 ? XP_BONUS_PERFECT : 0;
    const totalXp = baseXp + bonusXp + perfectXp;
    return { total, correctCount, percentage, stars, baseXp, bonusXp, perfectXp, totalXp };
  }, [quizFinished, quizHistory]);

  // Award quiz globale bonuses once
  const bonusAwarded = useRef(false);
  useEffect(() => {
    if (quizFinished && quizResults && !bonusAwarded.current) {
      bonusAwarded.current = true;
      if (quizResults.bonusXp > 0) awardXp(quizResults.bonusXp);
      if (quizResults.perfectXp > 0) awardXp(quizResults.perfectXp);
      if (quizResults.correctCount > 0) play("levelUp");
    }
  }, [quizFinished, quizResults, play]);

  const returnToBrowse = useCallback(() => {
    setPhase("browse");
    setQuizFinished(false);
    setQuizHistory([]);
    bonusAwarded.current = false;
  }, []);

  // ── Circular timer SVG ────────────────────────────────
  const TimerCircle = useCallback(
    ({ seconds }: { seconds: number }) => {
      const radius = 18;
      const circumference = 2 * Math.PI * radius;
      const progress = (seconds / TIMER_SECONDS) * circumference;
      const color =
        seconds > 10
          ? "var(--primary)"
          : seconds > 5
          ? "#f59e0b"
          : "#ef4444";

      return (
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg width="48" height="48" className="-rotate-90">
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              style={{ stroke: "var(--border)" }}
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              style={{ stroke: color }}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span
            className="absolute text-sm font-bold"
            style={{ color }}
          >
            {seconds}
          </span>
        </div>
      );
    },
    []
  );

  // ── Loading ───────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Quiz Globale Phase ────────────────────────────────
  if (phase === "quiz-globale") {
    // Results screen
    if (quizFinished && quizResults) {
      return (
        <div className="min-h-screen bg-background">
          <div className="pt-6 px-5 pb-28">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
              >
                <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <h1 className="text-3xl font-bold text-foreground font-display mb-2">
                  {t("Risultati")}
                </h1>
                <p className="text-muted-foreground">
                  {quizResults.correctCount}/{quizResults.total} risposte corrette
                </p>
              </motion.div>

              {/* Stars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center gap-3 mb-8"
              >
                {[1, 2, 3].map((star) => (
                  <motion.span
                    key={star}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                      scale: star <= quizResults.stars ? 1 : 0.5,
                      rotate: 0,
                      opacity: star <= quizResults.stars ? 1 : 0.3,
                    }}
                    transition={{ delay: 0.3 + star * 0.15, type: "spring" }}
                    className="text-5xl"
                  >
                    {star <= quizResults.stars ? "⭐" : "☆"}
                  </motion.span>
                ))}
              </motion.div>

              {/* Score bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border border-border bg-card p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("Punteggio")}
                  </span>
                  <span className="text-sm font-bold text-figb dark:text-primary">
                    {Math.round(quizResults.percentage)}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${quizResults.percentage}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        quizResults.percentage >= 80
                          ? "#10b981"
                          : quizResults.percentage >= 50
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  />
                </div>

                {/* XP breakdown — h2: primo livello sotto l'h1 «Risultati». */}
                <h2 className="text-sm font-bold text-foreground mb-3">
                  {profile.xpLabel} guadagnati
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Risposte corrette ({quizResults.correctCount} x {XP_PER_CORRECT})
                    </span>
                    <span className="font-semibold text-foreground">
                      +{quizResults.baseXp}
                    </span>
                  </div>
                  {quizResults.bonusXp > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">
                        {t("Bonus 80%+ di precisione")}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        +{quizResults.bonusXp}
                      </span>
                    </div>
                  )}
                  {quizResults.perfectXp > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-600">
                        {t("Bonus punteggio perfetto!")}
                      </span>
                      <span className="font-semibold text-amber-600">
                        +{quizResults.perfectXp}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span className="text-foreground">{t("Totale")}</span>
                    <span className="text-figb dark:text-primary">
                      +{quizResults.totalXp} {profile.xpLabel}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Answer recap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="rounded-2xl border border-border bg-card overflow-hidden mb-6"
              >
                <button
                  onClick={() => setShowRecap(!showRecap)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-bold text-foreground">
                    {t("Riepilogo risposte")}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      showRecap ? "rotate-90" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {showRecap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 space-y-3">
                        {quizHistory.map((answer, i) => {
                          const term = quizTerms.find(
                            (t) => t.key === answer.termKey
                          );
                          return (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border ${
                                answer.correct
                                  ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40"
                                  : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40"
                              }`}
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <span className="text-sm mt-0.5">
                                  {answer.correct ? "✅" : "❌"}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {i + 1}. {term?.term ?? answer.termKey}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {answer.question}
                                  </p>
                                  {!answer.correct && (
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                                      Risposta corretta:{" "}
                                      {term?.quiz.options[term.quiz.correctAnswer]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    bonusAwarded.current = false;
                    startQuizGlobale();
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-figb text-white font-semibold text-sm hover:bg-figb-dark transition-colors"
                >
                  {t("Gioca ancora")}
                </button>
                <button
                  onClick={returnToBrowse}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-figb dark:border-primary text-figb dark:text-primary font-semibold text-sm hover:bg-figb/5 dark:hover:bg-primary/10 transition-colors"
                >
                  {t("Torna al glossario")}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Active question
    const currentTerm = quizTerms[quizIndex];
    if (!currentTerm || !quizShuffled) return null;

    return (
      <div className="min-h-screen bg-background">
        <div className="pt-6 px-5 pb-28">
          <div className="mx-auto max-w-6xl">
            {/* Quiz header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={returnToBrowse}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("Esci")}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-figb dark:text-primary">
                  {quizIndex + 1}/{quizTerms.length}
                </span>
                <TimerCircle seconds={quizTimer} />
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 mb-8">
              {quizTerms.map((_, i) => {
                const answer = quizHistory[i];
                let bg = "bg-muted";
                if (i === quizIndex) bg = "bg-figb dark:bg-primary";
                else if (answer?.correct) bg = "bg-emerald-500";
                else if (answer && !answer.correct) bg = "bg-red-400";
                return (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${bg}`}
                  />
                );
              })}
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={quizIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-card p-6 mb-6"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{currentTerm.emoji}</span>
                  <span
                    className={`text-[12px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      CATEGORY_BADGE_CLASSES[currentTerm.category]
                    }`}
                  >
                    {CATEGORY_LABELS[currentTerm.category].label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  {currentTerm.term}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {currentTerm.quiz.question}
                </p>

                <div className="space-y-3">
                  {quizShuffled.options.map((opt, i) => {
                    let classes =
                      "w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ";
                    if (quizSelected === null) {
                      classes +=
                        "border-border hover:border-figb dark:hover:border-primary hover:bg-figb/5 dark:hover:bg-primary/10 text-foreground";
                    } else if (i === quizShuffled.correctIndex) {
                      classes +=
                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300";
                    } else if (i === quizSelected && quizSelected !== -1) {
                      classes += "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300";
                    } else {
                      classes += "border-border text-muted-foreground/40";
                    }
                    return (
                      <motion.button
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        disabled={quizSelected !== null}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={classes}
                      >
                        <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation after answer */}
                <AnimatePresence>
                  {quizSelected !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`mt-4 p-4 rounded-xl ${
                          quizSelected === quizShuffled.correctIndex
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900"
                            : "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {quizSelected === quizShuffled.correctIndex
                            ? profile.correctMessages[
                                quizIndex % profile.correctMessages.length
                              ]
                            : quizSelected === -1
                            ? "Tempo scaduto!"
                            : profile.wrongMessage}
                        </p>
                        <p className="text-xs text-foreground/80">
                          {currentTerm.quiz.explanation}
                        </p>
                      </div>
                      <button
                        onClick={nextQuizQuestion}
                        className="mt-4 w-full py-3 rounded-xl bg-figb text-white font-semibold text-sm hover:bg-figb-dark transition-colors flex items-center justify-center gap-2"
                      >
                        {quizIndex < quizTerms.length - 1 ? (
                          <>
                            {t("Prossima domanda")}
                            <ChevronRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {t("Vedi risultati")}
                            <Trophy className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ── Browse Phase ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-5 pb-28">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Home")}
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-figb/10 dark:bg-primary/15">
                <BookOpen className="w-6 h-6 text-figb dark:text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
                  {t("Glossario del Bridge")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("Impara i termini fondamentali")}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-2xl border border-border bg-card p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("Termini completati")}
              </span>
              <span className="text-sm font-bold text-figb dark:text-primary">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-figb dark:bg-primary rounded-full"
              />
            </div>
          </div>

          {/* Search + Quiz Globale */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca un termine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <button
              onClick={startQuizGlobale}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-figb text-white text-sm font-semibold hover:bg-figb-dark transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">{t("Quiz Globale")}</span>
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none -mx-1 px-1">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
              const { label, emoji } = CATEGORY_LABELS[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-figb text-white shadow-sm"
                      : "bg-card border border-border text-foreground/80 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xs">{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Terms count */}
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            {filteredTerms.length}{" "}
            {filteredTerms.length === 1 ? "termine" : "termini"}
          </p>

          {/* Empty state */}
          {filteredTerms.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {t("Nessun termine trovato")}
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("tutti");
                }}
                className="mt-3 text-sm text-figb dark:text-primary font-medium hover:underline"
              >
                {t("Mostra tutti")}
              </button>
            </div>
          )}

          {/* Term cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTerms.map((entry) => {
              const isExpanded = expandedKey === entry.key;
              const isCompleted = !!completed[entry.key];
              const isQuizOpen = inlineQuizKey === entry.key;

              return (
                <div
                  key={entry.key}
                  ref={(el) => {
                    cardRefs.current[entry.key] = el;
                  }}
                  className={`${
                    isExpanded ? "col-span-2 sm:col-span-3" : ""
                  }`}
                >
                  <motion.div
                    layout
                    className={`rounded-2xl border bg-card overflow-hidden transition-shadow ${
                      isExpanded
                        ? "border-figb/30 dark:border-primary/40 shadow-lg shadow-figb/5"
                        : "border-border hover:shadow-md"
                    }`}
                  >
                    {/* Card header (always visible) */}
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedKey(null);
                          setInlineQuizKey(null);
                          setInlineShuffled(null);
                          setInlineSelected(null);
                        } else {
                          setExpandedKey(entry.key);
                          setInlineQuizKey(null);
                          setInlineShuffled(null);
                          setInlineSelected(null);
                        }
                      }}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl shrink-0">{entry.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {/* h2: sono le sezioni di primo livello sotto il
                                titolo di pagina. Con h3 il salto h1→h3
                                violava `heading-order` (axe, /glossario). */}
                            <h2 className="text-sm font-bold text-foreground truncate">
                              {entry.term}
                            </h2>
                            {isCompleted && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span
                            className={`inline-block text-[12px] font-bold uppercase px-1.5 py-0.5 rounded-full mb-1.5 ${
                              CATEGORY_BADGE_CLASSES[entry.category]
                            }`}
                          >
                            {CATEGORY_LABELS[entry.category].label}
                          </span>
                          {!isExpanded && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {entry.definition}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4">
                            {/* Full definition */}
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {entry.definition}
                            </p>

                            {/* Example */}
                            {entry.example && (
                              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-4 py-3">
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-1">
                                  {t("Esempio")}
                                </p>
                                <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                                  {entry.example}
                                </p>
                              </div>
                            )}

                            {/* Cards display */}
                            {entry.cards && (
                              <div className="py-1">
                                <CardDisplay cards={entry.cards} />
                              </div>
                            )}

                            {/* Related terms */}
                            {entry.relatedTerms &&
                              entry.relatedTerms.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    {t("Termini correlati")}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {entry.relatedTerms.map((rk) => {
                                      const related = allTerms.find(
                                        (t) => t.key === rk
                                      );
                                      if (!related) return null;
                                      return (
                                        <button
                                          key={rk}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            scrollToTerm(rk);
                                          }}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-xs font-medium text-foreground/80 transition-colors"
                                        >
                                          <span>{related.emoji}</span>
                                          {related.term}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            {/* Quiz button or inline quiz */}
                            {!isQuizOpen ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInlineQuiz(entry.key);
                                }}
                                className="w-full py-3 rounded-xl bg-figb text-white font-semibold text-sm hover:bg-figb-dark transition-colors flex items-center justify-center gap-2"
                              >
                                <Zap className="w-4 h-4" />
                                {t("Mettiti alla prova")}
                              </button>
                            ) : (
                              /* Inline quiz */
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-figb/20 dark:border-primary/30 bg-figb/5 dark:bg-primary/10 p-4"
                              >
                                <p className="text-sm font-semibold text-foreground mb-4">
                                  {entry.quiz.question}
                                </p>
                                <div className="space-y-2.5">
                                  {inlineShuffled?.options.map((opt, i) => {
                                    let classes =
                                      "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ";
                                    if (inlineSelected === null) {
                                      classes +=
                                        "border-border bg-card hover:border-figb dark:hover:border-primary text-foreground";
                                    } else if (
                                      i === inlineShuffled.correctIndex
                                    ) {
                                      classes +=
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300";
                                    } else if (i === inlineSelected) {
                                      classes +=
                                        "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300";
                                    } else {
                                      classes +=
                                        "border-border bg-card text-muted-foreground/40";
                                    }
                                    return (
                                      <button
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInlineAnswer(i);
                                        }}
                                        disabled={inlineSelected !== null}
                                        className={classes}
                                      >
                                        <span className="mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[12px] font-bold text-muted-foreground">
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Explanation after answering */}
                                <AnimatePresence>
                                  {inlineSelected !== null && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div
                                        className={`mt-3 p-3 rounded-xl ${
                                          inlineSelected ===
                                          inlineShuffled?.correctIndex
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900"
                                            : "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900"
                                        }`}
                                      >
                                        <p className="text-sm font-semibold mb-1">
                                          {inlineSelected ===
                                          inlineShuffled?.correctIndex
                                            ? profile.correctMessages[
                                                Math.floor(
                                                  // eslint-disable-next-line react-hooks/purity -- messaggio di feedback pescato a caso: varietà intenzionale
                                                  Math.random() *
                                                    profile.correctMessages
                                                      .length
                                                )
                                              ]
                                            : profile.wrongMessage}
                                        </p>
                                        <p className="text-xs text-foreground/80">
                                          {entry.quiz.explanation}
                                        </p>
                                        {inlineSelected ===
                                          inlineShuffled?.correctIndex && (
                                          <p className="text-xs text-figb dark:text-primary font-semibold mt-2">
                                            +{inlineXpAwarded}{" "}
                                            {profile.xpLabel}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            inlineSelected !==
                                            inlineShuffled?.correctIndex
                                          ) {
                                            // Wrong answer: allow retry
                                            setInlineSelected(null);
                                          } else {
                                            goToNextTerm();
                                          }
                                        }}
                                        className="mt-3 w-full py-2.5 rounded-xl bg-figb text-white font-semibold text-sm hover:bg-figb-dark transition-colors flex items-center justify-center gap-2"
                                      >
                                        {inlineSelected !==
                                        inlineShuffled?.correctIndex ? (
                                          "Riprova"
                                        ) : (
                                          <>
                                            {t("Prossimo termine")}
                                            <ChevronRight className="w-4 h-4" />
                                          </>
                                        )}
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
