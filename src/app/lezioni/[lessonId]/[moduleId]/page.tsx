"use client";

import { use, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLessonById, getModuleById, worlds, type ContentBlock } from "@/data/lessons";
import { CardDisplay } from "@/components/bridge/card-display";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";

// SVG icons for block types
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function CardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.47 4.35l-1.34-.56v9.03l2.43-5.86c.41-1.02-.06-2.19-1.09-2.61m-19.5 3.7L6.93 20a2.01 2.01 0 0 0 1.81 1.26c.26 0 .53-.05.79-.16l7.37-3.05c.75-.31 1.21-1.05 1.23-1.79.01-.26-.04-.55-.13-.81L13 3.5a1.954 1.954 0 0 0-1.81-1.25c-.26 0-.52.06-.77.15L3.06 5.45a1.994 1.994 0 0 0-1.09 2.6m16.15-3.8a2 2 0 0 0-2-2h-1.45l3.45 8.34" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 3 3h1a4 4 0 0 0 6 0h1a3 3 0 0 0 3-3v-1a3 3 0 0 0 0-6v-1a3 3 0 0 0-3-3V6a4 4 0 0 0-4-4z" />
    </svg>
  );
}

export default function ModulePage({
  params,
}: {
  params: Promise<{ lessonId: string; moduleId: string }>;
}) {
  const { lessonId, moduleId } = use(params);
  const lesson = getLessonById(parseInt(lessonId));
  const mod = getModuleById(parseInt(lessonId), moduleId);

  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [correctStreak, setCorrectStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpPop, setShowXpPop] = useState(false);
  const [xpPopAmount, setXpPopAmount] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [stepsViewed, setStepsViewed] = useState<Set<number>>(new Set([0]));
  const [quizTimer, setQuizTimer] = useState(0);

  // === GAMIFICATION STATE ===
  const [lives, setLives] = useState(3); // ❤️ lives system
  const [livesLost, setLivesLost] = useState(false); // shake animation trigger
  const [powerups, setPowerups] = useState({ fiftyFifty: 1, skip: 1, extraTime: 1 }); // power-ups
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({}); // 50/50: eliminated option indices per block
  const [xpMultiplier, setXpMultiplier] = useState(1); // streak multiplier
  const [showLevelUp, setShowLevelUp] = useState(false); // level up popup
  const [showConfetti, setShowConfetti] = useState(false); // big confetti on completion
  const [floatingXp, setFloatingXp] = useState<{ id: number; amount: number; x: number; y: number }[]>([]); // flying XP
  const floatingXpId = useRef(0);

  const completionSaved = useRef(false);
  const prevXpRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Profile-based gamification config
  const profile = useProfile();

  // Quiz timer for "giovane" profile
  useEffect(() => {
    if (!profile.showTimer || !mod) return;
    const block = mod.content[currentStep];
    const isQuiz = block && ["quiz", "true-false", "card-select", "hand-eval", "bid-select"].includes(block.type);
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

  // Persist XP delta to localStorage
  useEffect(() => {
    if (xpEarned > prevXpRef.current) {
      const delta = xpEarned - prevXpRef.current;
      prevXpRef.current = xpEarned;
      try {
        const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
        localStorage.setItem("bq_xp", String(prev + delta));
      } catch {}
    }
  }, [xpEarned]);

  // Mark module completed when reaching last step
  const contentLength = mod?.content.length ?? 0;
  useEffect(() => {
    if (contentLength > 0 && currentStep >= contentLength - 1 && !completionSaved.current) {
      completionSaved.current = true;
      try {
        const key = "bq_completed_modules";
        const prev = JSON.parse(localStorage.getItem(key) || "{}");
        prev[`${lessonId}-${moduleId}`] = true;
        localStorage.setItem(key, JSON.stringify(prev));

        // Update streak (home page handles daily login, but update here too as fallback)
        const today = new Date().toISOString().slice(0, 10);
        const lastDay = localStorage.getItem("bq_last_login");
        if (lastDay !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const streak = parseInt(localStorage.getItem("bq_streak") || "0", 10);
          localStorage.setItem("bq_streak", String(lastDay === yesterday ? streak + 1 : 1));
          localStorage.setItem("bq_last_login", today);
        }
      } catch {}
    }
  }, [currentStep, contentLength, lessonId, moduleId]);

  // Count quizzes for scoring (all interactive types)
  const quizTypes = ["quiz", "true-false", "card-select", "hand-eval", "bid-select"];
  const totalQuizzes = useMemo(
    () => mod?.content.filter((b) => quizTypes.includes(b.type)).length ?? 0,
    [mod]
  );
  const correctAnswers = useMemo(
    () =>
      Object.entries(quizAnswers).filter(([idx]) => {
        const block = mod?.content[parseInt(idx)];
        if (!block) return false;
        if (block.type === "card-select") {
          const cards = block.cards ? parseCardSelectHand(block.cards) : [];
          const correctIdx = cards.findIndex((c) => c === block.correctCard);
          return quizAnswers[parseInt(idx)] === correctIdx;
        }
        if (block.type === "hand-eval") return quizAnswers[parseInt(idx)] === block.correctValue;
        return quizAnswers[parseInt(idx)] === block.correctAnswer;
      }).length,
    [quizAnswers, mod]
  );

  if (!lesson || !mod) {
    return (
      <div className="pt-10 px-5 text-center">
        <p className="text-gray-500">Modulo non trovato</p>
        <Link href="/lezioni" className="text-emerald font-bold text-sm mt-2 inline-block">
          Torna alle lezioni
        </Link>
      </div>
    );
  }

  const totalSteps = mod.content.length;
  const isLastStep = currentStep >= totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const moduleIndex = lesson.modules.findIndex((m) => m.id === moduleId);
  const nextModule =
    moduleIndex < lesson.modules.length - 1
      ? lesson.modules[moduleIndex + 1]
      : null;

  // Find the next lesson if all modules in this lesson are done
  const nextLesson = (() => {
    if (nextModule) return null; // Still have modules in this lesson
    for (const world of worlds) {
      const lessonIdx = world.lessons.findIndex((l) => l.id === lesson.id);
      if (lessonIdx >= 0) {
        // Next lesson in same world
        if (lessonIdx < world.lessons.length - 1) return world.lessons[lessonIdx + 1];
        // Next world's first lesson
        const worldIdx = worlds.indexOf(world);
        if (worldIdx < worlds.length - 1) return worlds[worldIdx + 1].lessons[0];
      }
    }
    return null;
  })();

  const isLessonComplete = !nextModule;

  // Update XP multiplier based on streak
  useEffect(() => {
    if (correctStreak >= 5) setXpMultiplier(3);
    else if (correctStreak >= 3) setXpMultiplier(2);
    else setXpMultiplier(1);
  }, [correctStreak]);

  const awardXp = (baseAmount: number) => {
    const amount = baseAmount * xpMultiplier;
    setXpEarned((prev) => {
      const oldLevel = Math.floor(prev / 100);
      const newLevel = Math.floor((prev + amount) / 100);
      if (newLevel > oldLevel) {
        // Level up!
        setTimeout(() => {
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

  const handleStepAdvance = useCallback((nextStep: number) => {
    setCurrentStep(nextStep);
    if (!stepsViewed.has(nextStep)) {
      setStepsViewed((prev) => new Set(prev).add(nextStep));
      // Award small XP for reading content
      awardXp(5);
    }
  }, [stepsViewed]);

  const handleQuizAnswer = (blockIndex: number, answerIndex: number) => {
    const block = mod.content[blockIndex];
    const correct = answerIndex === block.correctAnswer;
    setQuizAnswers((prev) => ({ ...prev, [blockIndex]: answerIndex }));
    setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));

    if (correct) {
      const streak = correctStreak + 1;
      setCorrectStreak(streak);
      if (streak > bestStreak) setBestStreak(streak);
      const bonus = streak >= 5 ? 25 : streak >= 3 ? 15 : streak >= 2 ? 10 : 0;
      awardXp(20 + bonus);
      spawnParticles(); // giovane: emoji burst

      // Stop timer on answer
      if (timerRef.current) clearInterval(timerRef.current);

      // Achievement triggers
      if (streak === 3) showAchievement("Tris! 3 risposte consecutive 🔥");
      if (streak === 5) showAchievement("FUOCO! 5 di fila — 3x XP! 🔥🔥🔥");
      if (streak === 7) showAchievement("LEGGENDARIO! 7 risposte perfette! 👑");
      if (correctAnswers + 1 === totalQuizzes && totalQuizzes >= 3) {
        showAchievement("PUNTEGGIO PERFETTO! Tutti i quiz corretti! 🏆");
      }
    } else {
      setCorrectStreak(0);
      if (timerRef.current) clearInterval(timerRef.current);
      // Lose a life
      setLives((prev) => Math.max(0, prev - 1));
      setLivesLost(true);
      setTimeout(() => setLivesLost(false), 600);
    }
  };

  // Power-up: 50/50 - eliminate 2 wrong options
  const useFiftyFifty = (blockIndex: number) => {
    const block = mod?.content[blockIndex];
    if (!block || !block.options || powerups.fiftyFifty <= 0) return;
    const correctIdx = block.correctAnswer ?? 0;
    const wrongIndices = block.options
      .map((_, i) => i)
      .filter((i) => i !== correctIdx);
    // Keep one wrong, eliminate the rest
    const keep = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    const toEliminate = wrongIndices.filter((i) => i !== keep);
    setEliminated((prev) => ({ ...prev, [blockIndex]: toEliminate }));
    setPowerups((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
  };

  // Power-up: Skip question (auto-correct)
  const useSkip = (blockIndex: number) => {
    const block = mod?.content[blockIndex];
    if (!block || powerups.skip <= 0) return;
    const correctIdx = block.correctAnswer ?? 0;
    setQuizAnswers((prev) => ({ ...prev, [blockIndex]: correctIdx }));
    setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));
    awardXp(5); // minimal XP for skip
    setPowerups((prev) => ({ ...prev, skip: prev.skip - 1 }));
  };

  // Power-up: Extra Time (+15s)
  const useExtraTime = () => {
    if (powerups.extraTime <= 0) return;
    setQuizTimer((prev) => prev + 15);
    setPowerups((prev) => ({ ...prev, extraTime: prev.extraTime - 1 }));
  };

  // Parse a card string into individual card tokens for card-select quiz
  function parseCardSelectHand(cards: string): string[] {
    const result: string[] = [];
    const suits = ["♠", "♥", "♦", "♣"];
    let currentSuit = "";
    let i = 0;
    while (i < cards.length) {
      const ch = cards[i];
      if (suits.includes(ch)) {
        currentSuit = ch;
        i++;
      } else if (ch === " " || ch === ",") {
        i++;
      } else if (currentSuit) {
        if (ch === "1" && i + 1 < cards.length && cards[i + 1] === "0") {
          result.push(currentSuit + "10");
          i += 2;
        } else {
          result.push(currentSuit + ch);
          i++;
        }
      } else {
        i++;
      }
    }
    return result;
  }

  // Parse card symbols in text for inline rendering
  function renderTextWithCards(text: string) {
    // Find card patterns like ♠AQ854 or ♥K9 within text
    const suitPattern = /([♠♥♦♣][AKQJ10-9876543]+)/g;
    const parts = text.split(suitPattern);

    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      if (suitPattern.test(part)) {
        suitPattern.lastIndex = 0; // reset regex
        return <CardDisplay key={i} cards={part} size="sm" />;
      }
      return <span key={i}>{part}</span>;
    });
  }

  const renderBlock = (block: ContentBlock, blockIndex: number) => {
    const delay = 0.05 * Math.min(blockIndex, 3);

    switch (block.type) {
      case "heading":
        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">
              {block.content}
            </h2>
            <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-emerald to-emerald-light" />
          </motion.div>
        );

      case "text":
        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * profile.animSpeed }}
            className={`text-gray-700 leading-relaxed mb-4 ${profile.contentClasses || "text-[15px]"}`}
          >
            {renderTextWithCards(block.content)}
          </motion.div>
        );

      case "rule":
        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * profile.animSpeed, type: "spring", stiffness: 300, damping: 25 }}
            className={`rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 p-4 mb-5 relative overflow-hidden ${profile.contentClasses}`}
          >
            <div className="absolute top-3 right-3 opacity-10">
              <ShieldIcon className="h-16 w-16 text-emerald" />
            </div>
            <div className="relative flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald text-white shadow-sm">
                <ShieldIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald uppercase tracking-widest mb-1">Regola</p>
                <p className="text-[14px] font-semibold text-emerald-900 leading-relaxed">
                  {block.content}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case "example":
        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4 mb-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
                <CardsIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Esempio</p>
                <p className="text-[14px] text-indigo-900 leading-relaxed mb-2">{block.content}</p>
                {block.cards && (
                  <div className="mt-2">
                    <CardDisplay cards={block.cards} size="md" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case "tip":
        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-4 mb-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white font-extrabold text-sm shadow-md shadow-emerald/30">
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm text-gray-900">
                    Maestro Fiori
                  </p>
                  <LightbulbIcon className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-[13px] font-medium text-gray-800 mb-1">
                  {block.content}
                </p>
                {block.explanation && (
                  <p className="text-[13px] text-amber-900/80 leading-relaxed">
                    {block.explanation}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case "quiz": {
        const answered = quizAnswers[blockIndex] !== undefined;
        const isCorrect = quizAnswers[blockIndex] === block.correctAnswer;

        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-white card-elevated p-5 mb-5 relative overflow-hidden"
          >
            {/* Timer (giovane) + Streak indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {profile.showTimer && !answered && quizTimer > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-bold ${
                    quizTimer <= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {quizTimer}s
                </motion.div>
              )}
              {profile.showCombo && correctStreak >= 2 && !answered && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 bg-amber-50 rounded-full px-2 py-0.5"
                >
                  <span className="text-xs">🔥</span>
                  <span className="text-[10px] font-bold text-amber-600">{correctStreak}x</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <BrainIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-[15px]">Quiz</p>
                {totalQuizzes > 1 && (
                  <p className="text-[10px] text-gray-400 font-medium">
                    +20 XP per risposta corretta
                  </p>
                )}
              </div>
            </div>
            <p className={`text-gray-700 mb-4 leading-relaxed ${profile.profile === "senior" ? "text-base" : "text-[14px]"}`}>
              {renderTextWithCards(block.content)}
            </p>

            {/* Power-up buttons */}
            {!answered && (
              <div className="flex items-center gap-2 mb-3">
                {powerups.fiftyFifty > 0 && block.options && block.options.length >= 4 && !eliminated[blockIndex] && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => useFiftyFifty(blockIndex)}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-100 border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-200 transition-all"
                  >
                    <span className="text-sm">✂️</span> 50/50
                  </motion.button>
                )}
                {powerups.skip > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => useSkip(blockIndex)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-100 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-200 transition-all"
                  >
                    <span className="text-sm">⏭️</span> Salta
                  </motion.button>
                )}
                {profile.showTimer && powerups.extraTime > 0 && quizTimer > 0 && quizTimer <= 5 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => useExtraTime()}
                    className="flex items-center gap-1.5 rounded-xl bg-green-100 border border-green-200 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-200 transition-all animate-pulse"
                  >
                    <span className="text-sm">⏰</span> +15s
                  </motion.button>
                )}
              </div>
            )}

            {/* Senior: hint button */}
            {profile.showHints && !answered && block.explanation && (
              <div className="mb-3">
                {!showHint[blockIndex] ? (
                  <button
                    onClick={() => setShowHint((prev) => ({ ...prev, [blockIndex]: true }))}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">💡</span>
                    Mostra suggerimento
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl bg-blue-50 border border-blue-100 p-3"
                  >
                    <p className="text-sm text-blue-700">
                      💡 Suggerimento: la risposta corretta e la {String.fromCharCode(65 + (block.correctAnswer ?? 0))}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {block.options?.map((option, optIdx) => {
                // 50/50: hide eliminated options
                if (eliminated[blockIndex]?.includes(optIdx)) return null;

                const isSelected = quizAnswers[blockIndex] === optIdx;
                const isCorrectOption = block.correctAnswer === optIdx;

                let optionClass = "bg-gray-50 border-gray-200 text-gray-700";
                if (answered) {
                  if (isCorrectOption) {
                    optionClass = "bg-emerald-50 border-emerald-300 text-emerald-800";
                  } else if (isSelected && !isCorrect) {
                    optionClass = "bg-red-50 border-red-300 text-red-800";
                  } else {
                    optionClass = "bg-gray-50 border-gray-200 text-gray-400";
                  }
                }

                return (
                  <motion.button
                    key={optIdx}
                    whileTap={!answered ? { scale: 0.98 } : undefined}
                    onClick={() => !answered && handleQuizAnswer(blockIndex, optIdx)}
                    disabled={answered}
                    className={`w-full text-left rounded-xl border-2 font-medium transition-all ${optionClass} ${
                      profile.profile === "senior" ? "p-4 text-base" : "p-3 text-[14px]"
                    } ${
                      !answered
                        ? "hover:border-emerald/50 hover:bg-emerald-50/50 cursor-pointer"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                          answered && isCorrectOption
                            ? "bg-emerald text-white border-emerald"
                            : answered && isSelected && !isCorrect
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-white border-gray-200"
                        }`}
                      >
                        {answered && isCorrectOption
                          ? "✓"
                          : answered && isSelected && !isCorrect
                            ? "✗"
                            : String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result + Explanation */}
            <AnimatePresence>
              {showExplanation[blockIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  {isCorrect ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="space-y-2"
                    >
                      {/* Giovane: big flashy correct */}
                      {profile.profile === "giovane" ? (
                        <div className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 p-3 flex items-center gap-3 shadow-lg shadow-amber-200">
                          <motion.span
                            className="text-2xl"
                            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.5 }}
                          >
                            ⚡
                          </motion.span>
                          <div>
                            <p className="text-sm font-black text-white">
                              CORRETTO! +20 {profile.xpLabel}
                            </p>
                            {correctStreak >= 2 && (
                              <p className="text-xs font-bold text-amber-100">
                                🔥 Combo x{correctStreak} — bonus +{correctStreak >= 3 ? 15 : 10}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : profile.profile === "adulto" ? (
                        /* Adulto: Maestro Fiori encouragement */
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-dark text-white font-extrabold text-sm shadow-md">
                            M
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-800">
                              {["Bravo! Ben ragionato.", "Esatto! Ottima risposta.", "Perfetto! Continua cosi.", "Giusto! Stai imparando veloce."][correctStreak % 4]} +20 {profile.xpLabel}
                            </p>
                            {correctStreak >= 2 && (
                              <p className="text-xs text-emerald-600 mt-0.5">Serie di {correctStreak} risposte!</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Senior: calm, warm congratulation */
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                          <span className="text-2xl">👏</span>
                          <div>
                            <p className="text-base font-bold text-emerald-800">
                              Ottimo lavoro!
                            </p>
                            <p className="text-sm text-emerald-600">
                              Hai guadagnato 20 {profile.xpLabel}. Continua al tuo ritmo.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ x: [-5, 5, -5, 0] }}
                      animate={{ x: 0 }}
                      className="space-y-2"
                    >
                      {profile.profile === "senior" ? (
                        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 flex items-center gap-3">
                          <span className="text-2xl">🤗</span>
                          <div>
                            <p className="text-base font-semibold text-orange-800">
                              Nessun problema!
                            </p>
                            <p className="text-sm text-orange-700">
                              Leggi la spiegazione qui sotto, e la prossima volta andra meglio.
                            </p>
                          </div>
                        </div>
                      ) : profile.profile === "giovane" ? (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                          <span className="text-lg">💥</span>
                          <p className="text-sm font-bold text-red-800">
                            Sbagliato! Streak persa. Riprova al prossimo!
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-dark text-white font-extrabold text-sm shadow-md">
                            M
                          </div>
                          <p className="text-sm font-semibold text-red-800">
                            Non preoccuparti! Il Maestro Fiori spiega tutto qui sotto.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {block.explanation && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                      <p className="text-[13px] text-blue-800 leading-relaxed">
                        💡 {block.explanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }

      case "true-false": {
        const tfAnswered = quizAnswers[blockIndex] !== undefined;
        const tfCorrect = quizAnswers[blockIndex] === block.correctAnswer;

        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-white card-elevated p-5 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-[15px]">Vero o Falso?</p>
            </div>
            <p className="text-[14px] text-gray-700 mb-4 leading-relaxed">
              {renderTextWithCards(block.content)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["Vero", "Falso"].map((label, idx) => {
                const isSelected = quizAnswers[blockIndex] === idx;
                const isCorrectOpt = block.correctAnswer === idx;
                let cls = "bg-gray-50 border-gray-200 text-gray-700";
                if (tfAnswered) {
                  if (isCorrectOpt) cls = "bg-emerald-50 border-emerald-300 text-emerald-800";
                  else if (isSelected && !tfCorrect) cls = "bg-red-50 border-red-300 text-red-800";
                  else cls = "bg-gray-50 border-gray-200 text-gray-400";
                }
                return (
                  <motion.button
                    key={idx}
                    whileTap={!tfAnswered ? { scale: 0.95 } : undefined}
                    onClick={() => !tfAnswered && handleQuizAnswer(blockIndex, idx)}
                    disabled={tfAnswered}
                    className={`rounded-xl border-2 p-4 text-center font-bold text-lg transition-all ${cls} ${
                      !tfAnswered ? "hover:border-emerald/50 hover:bg-emerald-50/50 cursor-pointer" : ""
                    }`}
                  >
                    {tfAnswered && isCorrectOpt && "✓ "}{tfAnswered && isSelected && !tfCorrect && "✗ "}{label}
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {showExplanation[blockIndex] && block.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <p className="text-[13px] text-blue-800 leading-relaxed">💡 {block.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }

      case "card-select": {
        const csAnswered = quizAnswers[blockIndex] !== undefined;
        const cardParts = block.cards ? parseCardSelectHand(block.cards) : [];
        const correctIdx = cardParts.findIndex((c) => c === block.correctCard);
        const csCorrect = quizAnswers[blockIndex] === correctIdx;

        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-white card-elevated p-5 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h10V4H7zm3 3h4v2h-4V7z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-[15px]">Scegli la carta</p>
            </div>
            <p className="text-[14px] text-gray-700 mb-4 leading-relaxed">
              {renderTextWithCards(block.content)}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {cardParts.map((card, idx) => {
                const isSelected = quizAnswers[blockIndex] === idx;
                const isCorrectCard = idx === correctIdx;
                const suitCh = card[0];
                const rank = card.slice(1);
                const color = suitCh === "♥" || suitCh === "♦" ? "text-red-600" : suitCh === "♣" ? "text-green-700" : "text-gray-900";
                let cardCls = "bg-white border-gray-200 hover:border-emerald hover:shadow-md";
                if (csAnswered) {
                  if (isCorrectCard) cardCls = "bg-emerald-50 border-emerald-400 ring-2 ring-emerald/30";
                  else if (isSelected && !csCorrect) cardCls = "bg-red-50 border-red-400";
                  else cardCls = "bg-gray-50 border-gray-200 opacity-50";
                }
                return (
                  <motion.button
                    key={idx}
                    whileTap={!csAnswered ? { scale: 0.9 } : undefined}
                    whileHover={!csAnswered ? { y: -4 } : undefined}
                    onClick={() => {
                      if (csAnswered) return;
                      const correct = idx === correctIdx;
                      setQuizAnswers((prev) => ({ ...prev, [blockIndex]: idx }));
                      setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));
                      if (correct) {
                        const streak = correctStreak + 1;
                        setCorrectStreak(streak);
                        awardXp(25 + (streak >= 3 ? 15 : streak >= 2 ? 10 : 0));
                      } else {
                        setCorrectStreak(0);
                      }
                    }}
                    disabled={csAnswered}
                    className={`w-14 h-20 rounded-xl border-2 flex flex-col items-center justify-center shadow-sm transition-all cursor-pointer ${cardCls}`}
                  >
                    <span className={`text-lg font-bold ${color}`}>{suitCh}</span>
                    <span className={`text-base font-black ${color}`}>{rank}</span>
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {showExplanation[blockIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  {csCorrect ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <p className="text-sm font-bold text-emerald-800">Carta giusta! +25 XP</p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                      <span className="text-lg">💪</span>
                      <p className="text-sm font-semibold text-red-800">
                        La carta corretta era <span className="font-black">{block.correctCard}</span>
                      </p>
                    </div>
                  )}
                  {block.explanation && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                      <p className="text-[13px] text-blue-800 leading-relaxed">💡 {block.explanation}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }

      case "hand-eval": {
        const heAnswered = quizAnswers[blockIndex] !== undefined;
        const heCorrect = quizAnswers[blockIndex] === block.correctValue;

        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-white card-elevated p-5 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-[15px]">Valuta la mano</p>
            </div>
            <p className="text-[14px] text-gray-700 mb-3 leading-relaxed">
              {renderTextWithCards(block.content)}
            </p>
            {block.cards && (
              <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <CardDisplay cards={block.cards} size="lg" />
              </div>
            )}
            {!heAnswered ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: 15 }, (_, i) => i + 5).map((pts) => (
                  <motion.button
                    key={pts}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const correct = pts === block.correctValue;
                      setQuizAnswers((prev) => ({ ...prev, [blockIndex]: pts }));
                      setShowExplanation((prev) => ({ ...prev, [blockIndex]: true }));
                      if (correct) {
                        const streak = correctStreak + 1;
                        setCorrectStreak(streak);
                        awardXp(30 + (streak >= 3 ? 15 : streak >= 2 ? 10 : 0));
                      } else {
                        setCorrectStreak(0);
                      }
                    }}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer"
                  >
                    {pts}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl p-4 text-center ${heCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-2xl font-black ${heCorrect ? "text-emerald-700" : "text-red-600"}`}>
                  {heCorrect ? "✓" : "✗"} {block.correctValue} punti
                </p>
                {!heCorrect && (
                  <p className="text-sm text-red-700 mt-1">
                    Hai risposto {quizAnswers[blockIndex]}
                  </p>
                )}
              </div>
            )}
            <AnimatePresence>
              {showExplanation[blockIndex] && block.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <p className="text-[13px] text-blue-800 leading-relaxed">💡 {block.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }

      case "bid-select": {
        const bsAnswered = quizAnswers[blockIndex] !== undefined;
        const bsCorrect = quizAnswers[blockIndex] === block.correctAnswer;
        const bidOptions = block.options ?? [];

        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-white card-elevated p-5 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 8h6M9 12h6M9 16h4" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-[15px]">Bidding Box</p>
            </div>
            <p className="text-[14px] text-gray-700 mb-3 leading-relaxed">
              {renderTextWithCards(block.content)}
            </p>
            {block.cards && (
              <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <CardDisplay cards={block.cards} size="lg" />
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {bidOptions.map((bid, idx) => {
                const isSelected = quizAnswers[blockIndex] === idx;
                const isCorrectBid = block.correctAnswer === idx;
                const bidLevel = bid[0];
                const bidSuit = bid.slice(1).toUpperCase();
                const suitSymbols: Record<string, { sym: string; color: string }> = {
                  S: { sym: "♠", color: "text-gray-900" },
                  H: { sym: "♥", color: "text-red-600" },
                  D: { sym: "♦", color: "text-orange-500" },
                  C: { sym: "♣", color: "text-green-700" },
                  NT: { sym: "SA", color: "text-gray-800" },
                  SA: { sym: "SA", color: "text-gray-800" },
                };
                const suitInfo = suitSymbols[bidSuit];
                let bidCls = "bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50";
                if (bsAnswered) {
                  if (isCorrectBid) bidCls = "bg-emerald-50 border-emerald-400 ring-2 ring-emerald/30";
                  else if (isSelected && !bsCorrect) bidCls = "bg-red-50 border-red-400";
                  else bidCls = "bg-gray-50 border-gray-200 opacity-50";
                }
                const isPasso = bid === "P" || bid === "Passo";
                return (
                  <motion.button
                    key={idx}
                    whileTap={!bsAnswered ? { scale: 0.95 } : undefined}
                    onClick={() => {
                      if (bsAnswered) return;
                      handleQuizAnswer(blockIndex, idx);
                    }}
                    disabled={bsAnswered}
                    className={`rounded-xl border-2 p-3 text-center font-bold transition-all cursor-pointer ${bidCls}`}
                  >
                    {isPasso ? (
                      <span className="text-gray-500 text-sm">Passo</span>
                    ) : suitInfo ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="text-gray-900 text-lg">{bidLevel}</span>
                        <span className={`text-lg ${suitInfo.color}`}>{suitInfo.sym}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-700">{bid}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {showExplanation[blockIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  {bsCorrect ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <p className="text-sm font-bold text-emerald-800">Licita corretta! +20 XP</p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                      <span className="text-lg">💪</span>
                      <p className="text-sm font-semibold text-red-800">
                        La risposta corretta era <span className="font-black">{bidOptions[block.correctAnswer ?? 0]}</span>
                      </p>
                    </div>
                  )}
                  {block.explanation && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                      <p className="text-[13px] text-blue-800 leading-relaxed">💡 {block.explanation}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      }

      case "sequence": {
        // Not yet interactive — show as ordered list for now
        return (
          <motion.div
            key={blockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl bg-white card-elevated p-5 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-[15px]">Metti in ordine</p>
            </div>
            <p className="text-[14px] text-gray-700 mb-4 leading-relaxed">{block.content}</p>
            <div className="space-y-2">
              {(block.correctOrder ?? []).map((origIdx, step) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-white text-xs font-bold">
                    {step + 1}
                  </span>
                  <span className="text-[14px] text-gray-700 font-medium">
                    {block.options?.[origIdx]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  // Giovane: particles on correct answer
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const particleId = useRef(0);

  const spawnParticles = () => {
    if (profile.profile !== "giovane") return;
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: particleId.current++,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 30,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => !newParticles.includes(p))), 1200);
  };

  // Senior: hint system
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  return (
    <div className="pt-6 px-5 pb-32">
      <div className="mx-auto max-w-lg">

        {/* === FLOATING XP ANIMATIONS === */}
        {floatingXp.map((f) => (
          <motion.div
            key={f.id}
            className="fixed pointer-events-none z-[70] font-black text-amber-500 text-lg"
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 1.5, y: -80 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            +{f.amount} {profile.xpLabel}
          </motion.div>
        ))}

        {/* === LEVEL UP POPUP === */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm"
              onClick={() => setShowLevelUp(false)}
            >
              <motion.div
                initial={{ y: 50, rotate: -5 }}
                animate={{ y: 0, rotate: 0 }}
                exit={{ y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/40 mx-6 max-w-sm"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8 }}
                  className="text-6xl mb-3"
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-black text-amber-900">LEVEL UP!</h3>
                <p className="text-amber-800 font-bold mt-2 text-lg">
                  Livello {Math.floor(xpEarned / 100) + 1}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {["⭐", "⭐", "⭐"].map((s, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className="text-3xl"
                    >
                      {s}
                    </motion.span>
                  ))}
                </div>
                <p className="text-sm text-amber-700 mt-3">Tocca per continuare</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating particles (giovane) */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="fixed pointer-events-none z-[60]"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0, y: -60, rotate: Math.random() * 360 }}
            transition={{ duration: 1 }}
          >
            <span className="text-2xl">{["⚡", "🔥", "💥", "✨", "🎯", "💫", "⭐", "🏆"][Math.floor(Math.random() * 8)]}</span>
          </motion.div>
        ))}

        {/* Top bar with progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-5"
        >
          <Link
            href={`/lezioni/${lessonId}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </Link>
          <div className="flex-1 relative">
            <div className={`rounded-full bg-gray-100 overflow-hidden ${profile.profile === "giovane" ? "h-3" : "h-2.5"}`}>
              <motion.div
                className={`h-full rounded-full ${
                  profile.profile === "giovane"
                    ? "bg-gradient-to-r from-orange-400 via-amber-400 to-amber-300"
                    : "bg-gradient-to-r from-emerald to-emerald-light"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {/* Giovane: fire on progress bar */}
            {profile.profile === "giovane" && correctStreak >= 2 && (
              <motion.span
                className="absolute -top-3 text-sm"
                style={{ left: `${Math.max(progress - 3, 0)}%` }}
                animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🔥
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Giovane: speed multiplier badge */}
            {profile.profile === "giovane" && correctStreak >= 2 && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-0.5 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full px-2 py-0.5 shadow-lg shadow-orange-200"
              >
                <span className="text-[10px] text-white font-black">{correctStreak}x</span>
                <span className="text-[10px]">🔥</span>
              </motion.div>
            )}
            <span className={`font-bold text-gray-400 ${profile.profile === "senior" ? "text-sm" : "text-xs"}`}>
              {currentStep + 1}/{totalSteps}
            </span>
            {xpEarned > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-0.5 bg-amber-50 rounded-full px-2 py-0.5"
              >
                <span className="text-[10px]">⚡</span>
                <span className="text-[11px] font-bold text-amber-600">{xpEarned} {profile.xpLabel}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Senior: friendly step indicator */}
        {profile.profile === "senior" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 flex items-center gap-3"
          >
            <span className="text-xl">📖</span>
            <div>
              <p className="text-sm font-bold text-blue-800">
                Passo {currentStep + 1} di {totalSteps}
              </p>
              <p className="text-xs text-blue-600">
                {isLastStep ? "Ultimo passo! Quasi finito." : "Prosegui al tuo ritmo, senza fretta."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Module badge */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2"
        >
          <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">
            Lezione {lesson.id}
          </Badge>
          <span className="text-xs text-gray-400 font-medium">{mod.title}</span>
        </motion.div>

        {/* === GAMIFICATION BAR: Hearts + Multiplier + Power-ups === */}
        {totalQuizzes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5 flex items-center justify-between"
          >
            {/* Lives (hearts) */}
            <motion.div
              animate={livesLost ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="text-xl"
                  animate={i >= lives ? { scale: [1, 0.5], opacity: [1, 0.3] } : {}}
                >
                  {i < lives ? "❤️" : "🖤"}
                </motion.span>
              ))}
            </motion.div>

            {/* XP Multiplier */}
            {xpMultiplier > 1 && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`flex items-center gap-1 rounded-full px-3 py-1 font-black text-sm shadow-lg ${
                  xpMultiplier >= 3
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-200"
                    : "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-amber-200"
                }`}
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {xpMultiplier >= 3 ? "🔥" : "⚡"}
                </motion.span>
                {xpMultiplier}x XP
              </motion.div>
            )}

            {/* Power-ups */}
            <div className="flex items-center gap-1.5">
              {powerups.fiftyFifty > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-xs font-black text-violet-700 cursor-pointer" title="50/50">
                  50
                </div>
              )}
              {powerups.skip > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm cursor-pointer" title="Salta">
                  ⏭️
                </div>
              )}
              {profile.showTimer && powerups.extraTime > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm cursor-pointer" title="+15s">
                  ⏰
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Game over (0 lives) */}
        {lives === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-5 text-center"
          >
            <span className="text-3xl">💔</span>
            <p className="text-base font-bold text-red-800 mt-2">Vite esaurite!</p>
            <p className="text-sm text-red-600 mt-1">Puoi continuare, ma non guadagnerai XP bonus.</p>
          </motion.div>
        )}

        {/* XP popup */}
        <AnimatePresence>
          {showXpPop && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="fixed top-20 right-5 z-50 bg-amber-400 text-white font-extrabold text-lg px-4 py-2 rounded-2xl shadow-xl"
            >
              ⚡ +{xpPopAmount} {profile.xpLabel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievement popup */}
        <AnimatePresence>
          {achievement && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
            >
              <span className="text-xl">🏅</span>
              {achievement}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content blocks */}
        <div>
          {mod.content.slice(0, currentStep + 1).map((block, idx) =>
            renderBlock(block, idx)
          )}
        </div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-24 left-0 right-0 px-5 z-40"
        >
          <div className="mx-auto max-w-lg">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-lg p-3 flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => handleStepAdvance(currentStep - 1)}
                  className={`flex-1 rounded-xl font-bold ${profile.profile === "senior" ? "h-14 text-base" : "h-12"}`}
                >
                  Indietro
                </Button>
              )}
              {!isLastStep ? (
                <Button
                  onClick={() => handleStepAdvance(currentStep + 1)}
                  className={`flex-1 rounded-xl bg-emerald hover:bg-emerald-dark font-bold shadow-lg shadow-emerald/25 ${profile.profile === "senior" ? "h-14 text-base" : "h-12"}`}
                >
                  {profile.profile === "senior" ? "Avanti →" : "Avanti"}
                </Button>
              ) : (
                <Link
                  href={
                    nextModule
                      ? `/lezioni/${lessonId}/${nextModule.id}`
                      : `/lezioni/${lessonId}`
                  }
                  className="flex-1"
                >
                  <Button className="w-full rounded-xl bg-emerald hover:bg-emerald-dark h-12 font-bold shadow-lg shadow-emerald/25">
                    {nextModule ? "Prossimo modulo" : "Completa lezione"} →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Completion card at the end */}
        {isLastStep && currentStep === totalSteps - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 space-y-4"
          >
            {/* === BIG CONFETTI EXPLOSION === */}
            <div className="fixed inset-0 pointer-events-none z-[55]">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute text-xl"
                  style={{ left: `${Math.random() * 100}%`, top: "-5%" }}
                  initial={{ opacity: 1, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    y: [0, window?.innerHeight ?? 800],
                    x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                    rotate: [0, Math.random() * 720],
                  }}
                  transition={{
                    delay: 0.1 + i * 0.08,
                    duration: 2 + Math.random(),
                    ease: "easeOut",
                  }}
                >
                  {["🎉", "🎊", "⭐", "✨", "🏆", "💫", "🎯", "♠", "♥", "♦", "♣", "🃏", "👑", "🔥"][i % 14]}
                </motion.div>
              ))}
            </div>

            {/* Main completion card */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 border border-emerald-200 p-6 text-center relative overflow-hidden">
              {/* Sparkle ring */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ["#059669", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"][i % 5],
                    left: `${10 + (i * 7) % 80}%`,
                    top: `${5 + (i * 11) % 40}%`,
                  }}
                  initial={{ opacity: 0, scale: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0.5], y: [0, -30, 50] }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 1.5, repeat: 2 }}
                />
              ))}

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-5xl mb-3"
              >
                {isLessonComplete ? "🎓" : "🏆"}
              </motion.div>
              <h3 className="text-xl font-extrabold text-emerald-dark">
                {isLessonComplete ? "Lezione completata!" : "Modulo completato!"}
              </h3>

              {/* Star rating based on performance */}
              {totalQuizzes > 0 && (() => {
                const pct = totalQuizzes > 0 ? correctAnswers / totalQuizzes : 0;
                const stars = pct >= 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
                return (
                  <div className="flex justify-center gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5 + i * 0.2, type: "spring", stiffness: 300 }}
                        className="text-3xl"
                      >
                        {i < stars ? "⭐" : "☆"}
                      </motion.span>
                    ))}
                  </div>
                );
              })()}

              {isLessonComplete && (
                <p className="text-sm text-emerald-600 mt-1">
                  Hai terminato tutti i moduli della Lezione {lesson.id}!
                </p>
              )}

              {/* Lives remaining bonus */}
              {lives === 3 && totalQuizzes > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="inline-flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-3 py-1 mt-2"
                >
                  <span>❤️❤️❤️</span>
                  <span className="text-xs font-bold text-red-700">Vite intatte!</span>
                </motion.div>
              )}

              {/* Stats grid */}
              <div className={`grid gap-3 mt-4 ${totalQuizzes > 0 && bestStreak >= 2 ? "grid-cols-3" : totalQuizzes > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-2xl font-black text-amber-600">{xpEarned + mod.xpReward}</p>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">{profile.xpLabel} Totali</p>
                </div>
                {totalQuizzes > 0 && (
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-2xl font-black text-emerald-600">{correctAnswers}/{totalQuizzes}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Quiz</p>
                  </div>
                )}
                {bestStreak >= 2 && (
                  <div className="rounded-xl bg-orange-50 p-3">
                    <p className="text-2xl font-black text-orange-600">{bestStreak}</p>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Best Streak</p>
                  </div>
                )}
              </div>

              {/* Achievement badges */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {correctAnswers === totalQuizzes && totalQuizzes >= 2 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="inline-flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-full px-3 py-1"
                  >
                    <span>🎯</span>
                    <span className="text-xs font-bold text-violet-700">Punteggio Perfetto</span>
                  </motion.div>
                )}
                {bestStreak >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                    className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-3 py-1"
                  >
                    <span>🔥</span>
                    <span className="text-xs font-bold text-orange-700">Streak {bestStreak}x</span>
                  </motion.div>
                )}
                {xpEarned >= 100 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: "spring" }}
                    className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1"
                  >
                    <span>⚡</span>
                    <span className="text-xs font-bold text-amber-700">XP Master</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Next module / lesson preview card */}
            {nextModule && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Link href={`/lezioni/${lessonId}/${nextModule.id}`}>
                  <div className="group card-elevated rounded-2xl bg-white p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]">
                    <p className="text-[10px] font-bold text-emerald uppercase tracking-wider mb-2">
                      Prossimo modulo
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald text-white text-lg">
                        {moduleIndex + 2}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-[15px]">{nextModule.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="text-[10px] font-bold border-0 bg-blue-50 text-blue-600">
                            {nextModule.type === "theory" ? "Teoria" : nextModule.type === "quiz" ? "Quiz" : nextModule.type === "exercise" ? "Esercizio" : "Pratica"}
                          </Badge>
                          <span className="text-[11px] text-gray-400">{nextModule.duration} min · +{nextModule.xpReward} XP</span>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-gray-300 group-hover:text-emerald group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="9,6 15,12 9,18" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Next lesson card (if all modules in lesson done) */}
            {isLessonComplete && nextLesson && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Link href={`/lezioni/${nextLesson.id}`}>
                  <div className="group card-elevated rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]">
                    <p className="text-[10px] font-bold text-emerald-dark uppercase tracking-wider mb-2">
                      Prossima lezione
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-dark text-white text-xl font-black shadow-md shadow-emerald/30">
                        {nextLesson.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-[15px]">
                          Lezione {nextLesson.id}: {nextLesson.title}
                        </h4>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          {nextLesson.modules.length} moduli · {nextLesson.subtitle}
                        </p>
                      </div>
                      <svg className="h-5 w-5 text-emerald-dark/50 group-hover:text-emerald-dark group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="9,6 15,12 9,18" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* All lessons done */}
            {isLessonComplete && !nextLesson && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 text-center"
              >
                <span className="text-3xl">🎓</span>
                <h4 className="text-lg font-extrabold text-amber-800 mt-2">Corso Fiori Completato!</h4>
                <p className="text-sm text-amber-700 mt-1">Sei pronto per il circolo FIGB!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
