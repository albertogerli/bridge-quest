"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { courses } from "@/data/courses";
import type { ContentBlock } from "@/data/courses";
import { useProfile, type UserProfile } from "@/hooks/use-profile";

// ===== Types =====

interface QuizQuestion {
  type: "quiz" | "true-false" | "bid-select" | "hand-eval";
  content: string;
  options: string[];
  correctIndex: number; // unified: always an index into options[]
  cards?: string;
  explanation?: string;
  courseName: string;
}

type Difficulty = "facile" | "medio" | "difficile";
type Phase = "menu" | "playing" | "gameover";

const difficultyConfig = {
  facile: {
    rounds: 8,
    label: "Facile",
    desc: "8 domande, 30s ciascuna",
    xpMult: 0.8,
    color: "from-green-500 to-emerald-500",
    shadow: "shadow-green-400/30",
  },
  medio: {
    rounds: 12,
    label: "Medio",
    desc: "12 domande, 30s ciascuna",
    xpMult: 1.0,
    color: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-400/30",
  },
  difficile: {
    rounds: 16,
    label: "Difficile",
    desc: "16 domande, 30s ciascuna",
    xpMult: 1.5,
    color: "from-red-500 to-rose-500",
    shadow: "shadow-red-400/30",
  },
};

const TIMER_SECONDS = 30;

// ===== Extract all quiz-type questions from courses =====

function extractAllQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const course of courses) {
    for (const world of course.worlds) {
      for (const lesson of world.lessons) {
        for (const mod of lesson.modules) {
          for (const block of mod.content) {
            const q = blockToQuestion(block, course.name);
            if (q) questions.push(q);
          }
        }
      }
    }
  }

  return questions;
}

function blockToQuestion(
  block: ContentBlock,
  courseName: string
): QuizQuestion | null {
  switch (block.type) {
    case "quiz": {
      if (!block.options || block.correctAnswer === undefined) return null;
      return {
        type: "quiz",
        content: block.content,
        options: block.options,
        correctIndex: block.correctAnswer,
        cards: block.cards,
        explanation: block.explanation,
        courseName,
      };
    }
    case "true-false": {
      if (block.correctAnswer === undefined) return null;
      return {
        type: "true-false",
        content: block.content,
        options: ["Vero", "Falso"],
        correctIndex: block.correctAnswer, // 0=vero, 1=falso
        cards: block.cards,
        explanation: block.explanation,
        courseName,
      };
    }
    case "bid-select": {
      if (!block.options || block.correctAnswer === undefined) return null;
      return {
        type: "bid-select",
        content: block.content,
        options: block.options,
        correctIndex: block.correctAnswer,
        cards: block.cards,
        explanation: block.explanation,
        courseName,
      };
    }
    case "hand-eval": {
      if (block.correctValue === undefined) return null;
      // Generate numeric options around the correct value
      const correct = block.correctValue;
      const optSet = new Set<number>([correct]);
      const offsets = [-3, -2, -1, 1, 2, 3];
      for (const off of offsets) {
        const val = correct + off;
        if (val >= 0 && val <= 40) optSet.add(val);
        if (optSet.size >= 4) break;
      }
      // Ensure exactly 4 options
      for (let i = 1; optSet.size < 4; i++) {
        if (correct + i <= 40) optSet.add(correct + i);
        if (optSet.size < 4 && correct - i >= 0) optSet.add(correct - i);
      }
      const optArr = Array.from(optSet);
      // Shuffle
      for (let i = optArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optArr[i], optArr[j]] = [optArr[j], optArr[i]];
      }
      const correctIdx = optArr.indexOf(correct);
      return {
        type: "hand-eval",
        content: block.content,
        options: optArr.map(String),
        correctIndex: correctIdx,
        cards: block.cards,
        explanation: block.explanation,
        courseName,
      };
    }
    default:
      return null;
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== Type badge styling =====

function getTypeBadge(type: QuizQuestion["type"]) {
  switch (type) {
    case "quiz":
      return { label: "Quiz", bg: "bg-blue-50", text: "text-blue-600" };
    case "true-false":
      return { label: "Vero/Falso", bg: "bg-violet-50", text: "text-violet-600" };
    case "bid-select":
      return { label: "Dichiarazione", bg: "bg-indigo-50", text: "text-indigo-600" };
    case "hand-eval":
      return { label: "Valutazione", bg: "bg-amber-50", text: "text-amber-700" };
  }
}

// ===== Component =====

export default function QuizLampoPage() {
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const profileConfig = useProfile();
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");

  // Game state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalComboPoints, setTotalComboPoints] = useState(0);
  const [totalSpeedBonus, setTotalSpeedBonus] = useState(0);

  // Per-question state
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  // Gameover state
  const [xpEarned, setXpEarned] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const questionStartRef = useRef(0);
  const lockedRef = useRef(false);

  // All available questions - memoized
  const allQuestions = useMemo(() => extractAllQuestions(), []);

  // Load profile + best score
  useEffect(() => {
    try {
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) setProfile(p);
      const b = localStorage.getItem("bq_quiz_lampo_best");
      if (b) setBestScore(parseInt(b, 10));
    } catch {}
  }, []);

  const config = difficultyConfig[difficulty];

  // ===== Timer countdown =====

  const startTimer = useCallback(() => {
    setTimeLeft(TIMER_SECONDS);
    questionStartRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const remaining = Math.max(0, TIMER_SECONDS - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Time's up - treat as wrong answer
        handleTimeout();
      }
    }, 50);
  }, []);

  // Timeout handler (wrapped in ref to avoid stale closures)
  const handleTimeoutRef = useRef<() => void>(() => {});

  const handleTimeout = () => {
    handleTimeoutRef.current();
  };

  useEffect(() => {
    handleTimeoutRef.current = () => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setShowResult(true);
      setWasCorrect(false);
      setCombo(0);
      setTimeLeft(0);

      setTimeout(() => {
        advanceQuestion(false, 0);
      }, 1800);
    };
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ===== Start game =====

  const startGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff || difficulty;
      if (diff) setDifficulty(d);
      const cfg = difficultyConfig[d];

      // Pick random questions
      const shuffled = shuffleArray(allQuestions);
      const picked = shuffled.slice(0, cfg.rounds);

      // If we don't have enough questions, repeat some
      while (picked.length < cfg.rounds && allQuestions.length > 0) {
        const extra = shuffleArray(allQuestions);
        picked.push(...extra.slice(0, cfg.rounds - picked.length));
      }

      setQuestions(picked);
      setCurrentIdx(0);
      setScore(0);
      setCorrectCount(0);
      setCombo(0);
      setMaxCombo(0);
      setTotalComboPoints(0);
      setTotalSpeedBonus(0);
      setSelectedIdx(null);
      setShowResult(false);
      setXpEarned(0);
      setIsNewBest(false);
      lockedRef.current = false;
      setPhase("playing");

      // Start timer for first question after a brief delay
      setTimeout(() => {
        setTimeLeft(TIMER_SECONDS);
        questionStartRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const elapsed = (Date.now() - questionStartRef.current) / 1000;
          const remaining = Math.max(0, TIMER_SECONDS - elapsed);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeout();
          }
        }, 50);
      }, 300);
    },
    [difficulty, allQuestions]
  );

  // ===== Handle answer =====

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      if (lockedRef.current || showResult) return;
      lockedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const question = questions[currentIdx];
      const isCorrect = optionIdx === question.correctIndex;
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const remaining = Math.max(0, TIMER_SECONDS - elapsed);

      setSelectedIdx(optionIdx);
      setShowResult(true);
      setWasCorrect(isCorrect);

      let roundComboPoints = 0;
      let roundSpeedBonus = 0;

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));

        // Combo bonus: (combo - 1) * 10 for each combo level above 1
        roundComboPoints = Math.max(0, (newCombo - 1) * 10);
        setTotalComboPoints((t) => t + roundComboPoints);

        // Speed bonus
        roundSpeedBonus = Math.max(0, Math.floor(remaining * 2));
        setTotalSpeedBonus((t) => t + roundSpeedBonus);

        // Round score: base 100 + speed + combo
        const roundScore = 100 + roundSpeedBonus + roundComboPoints;
        setScore((s) => s + roundScore);
      } else {
        setCombo(0);
      }

      setTimeout(() => {
        advanceQuestion(isCorrect, remaining);
      }, 1800);
    },
    [questions, currentIdx, combo, showResult]
  );

  // ===== Advance to next question or game over =====

  const advanceQuestion = useCallback(
    (wasCorrectAnswer: boolean, timeRemainingAtAnswer: number) => {
      const cfg = difficultyConfig[difficulty];
      const nextIdx = currentIdx + 1;

      if (nextIdx >= cfg.rounds || nextIdx >= questions.length) {
        // Game over - calculate XP
        // We need final tallies. Use functional state to get latest values.
        setPhase("gameover");

        // Calculate XP from current accumulated state
        // We'll compute it in a useEffect that watches phase === 'gameover'
      } else {
        setCurrentIdx(nextIdx);
        setSelectedIdx(null);
        setShowResult(false);
        lockedRef.current = false;

        // Start timer for next question
        setTimeout(() => {
          setTimeLeft(TIMER_SECONDS);
          questionStartRef.current = Date.now();
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - questionStartRef.current) / 1000;
            const remaining = Math.max(0, TIMER_SECONDS - elapsed);
            setTimeLeft(remaining);
            if (remaining <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              handleTimeout();
            }
          }, 50);
        }, 200);
      }
    },
    [difficulty, currentIdx, questions.length]
  );

  // ===== Calculate XP when game ends =====

  useEffect(() => {
    if (phase !== "gameover") return;
    if (timerRef.current) clearInterval(timerRef.current);

    const cfg = difficultyConfig[difficulty];
    const baseXP = correctCount * 15;
    const finalXP = Math.floor(
      (baseXP + totalComboPoints + totalSpeedBonus) * cfg.xpMult
    );
    setXpEarned(finalXP);

    // Save to localStorage
    try {
      const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
      localStorage.setItem("bq_xp", String(prev + finalXP));
    } catch {}

    // Check/save best score
    try {
      const prevBest = localStorage.getItem("bq_quiz_lampo_best");
      const prevBestNum = prevBest ? parseInt(prevBest, 10) : 0;
      if (score > prevBestNum) {
        localStorage.setItem("bq_quiz_lampo_best", String(score));
        setBestScore(score);
        setIsNewBest(true);
      }
    } catch {}
  }, [phase]);

  // ===== Current question =====

  const currentQuestion = questions[currentIdx];
  const isSenior = profile === "senior";

  // Timer bar color
  const timerFraction = timeLeft / TIMER_SECONDS;
  const timerBarColor =
    timerFraction > 0.5
      ? "from-emerald-400 to-emerald-500"
      : timerFraction > 0.2
        ? "from-amber-400 to-orange-500"
        : "from-red-500 to-rose-500";

  // Stars calculation
  const getStars = () => {
    const cfg = difficultyConfig[difficulty];
    const pct = correctCount / cfg.rounds;
    if (pct >= 0.9) return 3;
    if (pct >= 0.65) return 2;
    if (pct >= 0.4) return 1;
    return 0;
  };

  // =====================================================
  // RENDER: MENU
  // =====================================================

  if (phase === "menu") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link
              href="/gioca"
              className="hover:text-emerald transition-colors"
            >
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">Quiz Lampo</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            {/* Icon */}
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white text-5xl shadow-xl shadow-amber-400/30 mb-6">
              <svg
                className="h-12 w-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>

            <h1
              className={`font-extrabold text-gray-900 ${isSenior ? "text-3xl" : "text-2xl sm:text-3xl"}`}
            >
              Quiz Lampo
            </h1>
            <p
              className={`text-gray-500 mt-2 max-w-xs mx-auto ${isSenior ? "text-base" : "text-sm"}`}
            >
              Domande a raffica da tutti i corsi. Velocita' e precisione per
              scalare la classifica!
            </p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge className="bg-amber-50 text-amber-700 text-xs font-bold border-0">
                {allQuestions.length} domande
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 text-xs font-bold border-0">
                30s a domanda
              </Badge>
            </div>

            {/* How to play */}
            <div className="mt-6 bg-white card-elevated rounded-2xl p-4 text-left">
              <h3
                className={`font-bold text-gray-900 mb-2 ${isSenior ? "text-base" : "text-sm"}`}
              >
                Come si gioca?
              </h3>
              <ul
                className={`text-gray-500 space-y-1.5 ${isSenior ? "text-sm" : "text-xs"}`}
              >
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">1.</span>
                  Domande random da tutti i corsi Bridge
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">2.</span>
                  30 secondi per rispondere a ciascuna
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">3.</span>
                  {`Combo: risposte consecutive corrette = bonus ${profileConfig.xpLabel}`}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">4.</span>
                  Più rispondi veloce, più punti guadagni!
                </li>
              </ul>
            </div>

            {/* Best score */}
            {bestScore !== null && bestScore > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-bold"
              >
                <span>🏆</span>
                <span>Record: {bestScore} punti</span>
              </motion.div>
            )}

            {/* Difficulty selection */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-gray-900 text-left">
                Scegli difficoltà
              </h3>
              {(
                Object.entries(difficultyConfig) as [
                  Difficulty,
                  (typeof difficultyConfig)[Difficulty],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg ${cfg.shadow} active:scale-[0.97] transition-transform`}
                >
                  <div className="text-left">
                    <p className="font-extrabold">{cfg.label}</p>
                    <p className="text-white/70 text-sm">{cfg.desc}</p>
                  </div>
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: GAME OVER
  // =====================================================

  if (phase === "gameover") {
    const stars = getStars();
    const cfg = difficultyConfig[difficulty];
    const pct = Math.round((correctCount / cfg.rounds) * 100);

    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
                  className={`text-4xl ${i < stars ? "" : "opacity-20 grayscale"}`}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <h1
              className={`font-extrabold text-gray-900 ${isSenior ? "text-3xl" : "text-2xl sm:text-3xl"}`}
            >
              {stars === 3
                ? "Fulmine!"
                : stars === 2
                  ? "Ottimo!"
                  : stars === 1
                    ? "Non male!"
                    : "Riprova!"}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl sm:text-2xl font-black text-amber-500 mt-2"
            >
              {score} punti
            </motion.p>

            {isNewBest && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-extrabold shadow-lg shadow-amber-300/40"
              >
                <span>🏆</span> Nuovo record!
              </motion.div>
            )}

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-4 gap-2 mt-6"
            >
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-gray-900">
                  {correctCount}/{cfg.rounds}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">Corrette</p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-gray-900">{pct}%</p>
                <p className="text-[10px] text-gray-400 font-bold">
                  Precisione
                </p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-orange-500">
                  x{maxCombo}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">
                  Max combo
                </p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-emerald-600">
                  +{xpEarned}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">{profileConfig.xpLabel}</p>
              </div>
            </motion.div>

            {/* XP breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="mt-4 card-elevated rounded-2xl bg-white p-4"
            >
              <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">
                {`Dettaglio ${profileConfig.xpLabel}`}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Risposte corrette ({correctCount} x 15)
                  </span>
                  <span className="font-bold text-gray-900">
                    {correctCount * 15}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bonus combo</span>
                  <span className="font-bold text-orange-500">
                    +{totalComboPoints}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bonus velocità</span>
                  <span className="font-bold text-blue-500">
                    +{totalSpeedBonus}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="text-gray-500">
                    Moltiplicatore ({cfg.label})
                  </span>
                  <span className="font-bold text-gray-900">
                    x{cfg.xpMult}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-base">
                  <span className="font-extrabold text-gray-900">Totale</span>
                  <span className="font-extrabold text-emerald-600">
                    +{xpEarned} {profileConfig.xpLabel}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex gap-3 mt-6"
            >
              <Link href="/gioca" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold"
                >
                  Torna a Gioca
                </Button>
              </Link>
              <Button
                onClick={() => startGame()}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold shadow-lg shadow-amber-300/30"
              >
                Rigioca
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: PLAYING
  // =====================================================

  if (!currentQuestion) return null;

  const badge = getTypeBadge(currentQuestion.type);

  return (
    <div className="pt-4 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Top bar: back + progress + round counter */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/gioca"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </Link>

          {/* Progress bar */}
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                animate={{
                  width: `${((currentIdx + 1) / config.rounds) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-gray-400">
            {currentIdx + 1}/{config.rounds}
          </span>
        </div>

        {/* Timer bar */}
        <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden mb-4">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${timerBarColor}`}
            style={{ width: `${timerFraction * 100}%` }}
            transition={{ duration: 0.05 }}
          />
          {/* Pulsing glow when low */}
          {timerFraction <= 0.2 && timerFraction > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400/30"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </div>

        {/* Score + Timer + Combo row */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`text-sm font-black tabular-nums ${
              timerFraction <= 0.2 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {Math.ceil(timeLeft)}s
          </div>

          {/* Combo badge */}
          <AnimatePresence mode="wait">
            {combo > 1 && (
              <motion.div
                key={`combo-${combo}`}
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-full px-3 py-1"
              >
                <span className="text-sm">🔥</span>
                <span className="text-xs font-black text-orange-600">
                  x{combo}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-sm font-black text-amber-500">{score} pts</div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="card-elevated rounded-2xl bg-white p-5 mb-4"
          >
            {/* Type badge + course */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
              <span className="text-[10px] font-medium text-gray-300 truncate ml-2">
                {currentQuestion.courseName}
              </span>
            </div>

            {/* Cards display (if any) */}
            {currentQuestion.cards && (
              <div className="mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p
                  className={`font-mono font-bold tracking-wide leading-relaxed ${
                    isSenior ? "text-lg" : "text-base"
                  } text-gray-800`}
                >
                  {currentQuestion.cards}
                </p>
              </div>
            )}

            {/* Question text */}
            <p
              className={`font-bold text-gray-900 leading-relaxed ${
                isSenior ? "text-lg" : "text-base"
              }`}
            >
              {currentQuestion.content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Answer options */}
        <motion.div
          key={`options-${currentIdx}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`grid gap-2.5 ${
            currentQuestion.options.length <= 2
              ? "grid-cols-2"
              : currentQuestion.options.length <= 4
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {currentQuestion.options.map((option, idx) => {
            let btnStyle =
              "bg-white card-elevated hover:shadow-lg active:scale-[0.96]";
            let textColor = "text-gray-900";
            let borderExtra = "";

            if (showResult) {
              if (idx === currentQuestion.correctIndex) {
                btnStyle =
                  "bg-emerald-50 border-2 border-emerald-400 shadow-lg shadow-emerald-200/40";
                textColor = "text-emerald-700";
              } else if (idx === selectedIdx && !wasCorrect) {
                btnStyle =
                  "bg-red-50 border-2 border-red-300 shadow-lg shadow-red-200/30";
                textColor = "text-red-600";
              } else {
                btnStyle = "bg-gray-50 opacity-40";
                textColor = "text-gray-400";
              }
            }

            return (
              <motion.button
                key={idx}
                whileTap={!showResult ? { scale: 0.95 } : undefined}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                className={`rounded-2xl p-4 text-center transition-all ${btnStyle} ${borderExtra} ${
                  isSenior ? "py-5" : ""
                }`}
              >
                <p
                  className={`font-extrabold ${
                    isSenior ? "text-xl" : "text-lg"
                  } ${textColor}`}
                >
                  {option}
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Feedback toast */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-4 p-3 rounded-xl ${
                wasCorrect ? "bg-emerald-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {wasCorrect ? "✓" : "✗"}
                </span>
                <p
                  className={`text-sm font-bold ${
                    wasCorrect ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {wasCorrect
                    ? combo > 2
                      ? `Perfetto! Combo x${combo}!`
                      : "Corretto!"
                    : timeLeft <= 0
                      ? "Tempo scaduto!"
                      : profileConfig.wrongMessage}
                </p>
              </div>
              {currentQuestion.explanation && !wasCorrect && (
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  {currentQuestion.explanation}
                </p>
              )}
              {wasCorrect && (
                <div className="flex items-center gap-3 mt-1 ml-7">
                  {Math.max(0, Math.floor((timeLeft > 0 ? timeLeft : 0) * 2)) >
                    0 && (
                    <span className="text-[10px] font-bold text-blue-500">
                      +
                      {Math.floor(
                        Math.max(0, timeLeft) * 2
                      )}{" "}
                      velocità
                    </span>
                  )}
                  {combo > 1 && (
                    <span className="text-[10px] font-bold text-orange-500">
                      +{(combo - 1) * 10} combo
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating combo animation */}
        <AnimatePresence>
          {showResult && wasCorrect && combo >= 3 && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="fixed left-1/2 top-1/3 -translate-x-1/2 pointer-events-none z-50"
            >
              <span className="text-4xl font-black text-orange-500 drop-shadow-lg">
                🔥 x{combo}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
