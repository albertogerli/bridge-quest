"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useProfile, type UserProfile } from "@/hooks/use-profile";
import { errorScenarios, type ErrorScenario } from "@/data/trova-errore-data";

type Difficulty = "facile" | "medio" | "difficile";
type Phase = "menu" | "playing" | "gameover";

const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 45; // seconds

const difficultyConfig = {
  facile: {
    label: "Facile",
    desc: "Errori di regole base",
    xpMult: 0.8,
    color: "from-green-500 to-emerald-500",
    shadow: "shadow-green-400/30",
    accent: "emerald",
  },
  medio: {
    label: "Medio",
    desc: "Errori in licita e gioco",
    xpMult: 1,
    color: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-400/30",
    accent: "amber",
  },
  difficile: {
    label: "Difficile",
    desc: "Difesa avanzata e slam",
    xpMult: 1.5,
    color: "from-red-500 to-rose-500",
    shadow: "shadow-red-400/30",
    accent: "red",
  },
};

const categoryConfig = {
  licita: { label: "Licita", icon: "🗣️", bg: "bg-[#003DA5]/10", text: "text-[#003DA5]" },
  gioco: { label: "Gioco", icon: "🃏", bg: "bg-emerald-50", text: "text-emerald-700" },
  difesa: { label: "Difesa", icon: "🛡️", bg: "bg-rose-50", text: "text-rose-700" },
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TrovaErrorePage() {
  const profileConfig = useProfile();
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("facile");
  const [scenarios, setScenarios] = useState<ErrorScenario[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timer, setTimer] = useState(TIME_LIMIT);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [paused, setPaused] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const pausedTimeRef = useRef(0);

  // Load profile and best score
  useEffect(() => {
    try {
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) setProfile(p);
      const bs = localStorage.getItem("bq_trova_errore_best");
      if (bs) setBestScore(parseInt(bs, 10));
    } catch {}
  }, []);

  const config = difficultyConfig[difficulty];

  const startTimer = useCallback(() => {
    setTimer(TIME_LIMIT);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff || difficulty;
      if (diff) setDifficulty(d);
      // Filter by difficulty and shuffle, pick TOTAL_ROUNDS
      const filtered = errorScenarios.filter((s) => s.difficulty === d);
      const extra = errorScenarios.filter((s) => s.difficulty !== d);
      // If not enough of the target difficulty, fill with others
      const pool = [...shuffleArray(filtered), ...shuffleArray(extra)];
      setScenarios(pool.slice(0, TOTAL_ROUNDS));
      setPhase("playing");
      setRound(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setBestStreak(0);
      setShowFeedback(false);
      setSelectedAnswer(null);
      startTimer();
    },
    [difficulty, startTimer]
  );

  // Handle time running out
  useEffect(() => {
    if (phase === "playing" && timer === 0 && !showFeedback) {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, phase, showFeedback]);

  const handleTimeout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowFeedback(true);
    setLastCorrect(false);
    setSelectedAnswer(null);
    setStreak(0);

    setTimeout(() => {
      advanceRound(false);
    }, 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, scenarios]);

  const handleAnswer = useCallback(
    (answerIdx: number) => {
      if (showFeedback) return;
      if (timerRef.current) clearInterval(timerRef.current);

      const scenario = scenarios[round];
      const isCorrect = answerIdx === scenario.correctAnswer;
      setSelectedAnswer(answerIdx);
      setShowFeedback(true);
      setLastCorrect(isCorrect);

      if (isCorrect) {
        const timeBonus = Math.max(0, Math.floor(timer * 2));
        const streakBonus = streak * 15;
        const diffMult =
          scenario.difficulty === "difficile"
            ? 1.5
            : scenario.difficulty === "medio"
              ? 1.2
              : 1;
        const roundScore = Math.floor((100 + timeBonus + streakBonus) * diffMult);
        setScore((s) => s + roundScore);
        setCorrectCount((c) => c + 1);
        setStreak((s) => {
          const n = s + 1;
          setBestStreak((b) => Math.max(b, n));
          return n;
        });
      } else {
        setStreak(0);
      }

      setTimeout(() => {
        advanceRound(isCorrect);
      }, 2500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showFeedback, scenarios, round, timer, streak]
  );

  const advanceRound = useCallback(
    (wasCorrect: boolean) => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      if (round + 1 >= TOTAL_ROUNDS) {
        // Game over
        setPhase("gameover");
        const finalCorrect = correctCount + (wasCorrect ? 1 : 0);
        const earned = Math.floor(
          (finalCorrect * 20 + 10) * config.xpMult
        );
        setXpEarned(earned);
        try {
          const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          localStorage.setItem("bq_xp", String(prev + earned));
          // Save best score
          const currentBest = localStorage.getItem("bq_trova_errore_best");
          const finalScore = score + (wasCorrect ? 100 : 0); // approximate
          if (!currentBest || finalScore > parseInt(currentBest, 10)) {
            localStorage.setItem("bq_trova_errore_best", String(finalScore));
            setBestScore(finalScore);
          }
        } catch {}
      } else {
        setRound((r) => r + 1);
        startTimer();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round, correctCount, score, config.xpMult, startTimer]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const scenario = scenarios[round];
  const isSenior = profile === "senior";

  // ==================== MENU ====================
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
            <span className="text-rose-600 font-semibold">Trova l&apos;Errore</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white text-5xl shadow-xl shadow-rose-400/30 mb-6">
              🔍
            </div>
            <h1
              className={`font-bold text-gray-900 ${isSenior ? "text-3xl" : "text-2xl sm:text-3xl"}`}
            >
              Trova l&apos;Errore
            </h1>
            <p
              className={`text-gray-500 mt-2 max-w-xs mx-auto ${isSenior ? "text-base" : ""}`}
            >
              Ogni scenario ha un errore. Riesci a trovarlo?
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge className="bg-rose-50 text-rose-700 text-xs font-bold border-0">
                {TOTAL_ROUNDS} domande
              </Badge>
              <Badge className="bg-amber-50 text-amber-700 text-xs font-bold border-0">
                {TIME_LIMIT}s per domanda
              </Badge>
            </div>

            {/* How to play */}
            <div className="mt-6 bg-white card-clean rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                Come si gioca?
              </h3>
              <ul
                className={`text-gray-500 space-y-1.5 ${isSenior ? "text-sm" : "text-xs"}`}
              >
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">1.</span>
                  Leggi lo scenario di bridge presentato
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">2.</span>
                  Identifica l&apos;errore tra le 4 opzioni
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">3.</span>
                  Più veloce rispondi, più punti guadagni
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">4.</span>
                  Leggi la spiegazione per imparare!
                </li>
              </ul>
            </div>

            {/* Difficulty selection */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-gray-900 text-left">
                Scegli difficoltà
              </h3>
              {(
                Object.entries(difficultyConfig) as [
                  Difficulty,
                  (typeof difficultyConfig)["facile"],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg ${cfg.shadow} active:scale-[0.97] transition-transform ${isSenior ? "text-lg" : ""}`}
                >
                  <div className="text-left">
                    <p className="font-semibold">{cfg.label}</p>
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

            {/* Best score */}
            {bestScore !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-center text-sm text-gray-400 font-bold"
              >
                🏆 Miglior punteggio: {bestScore}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ==================== GAME OVER ====================
  if (phase === "gameover") {
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const stars =
      correctCount >= 9 ? 3 : correctCount >= 7 ? 2 : correctCount >= 4 ? 1 : 0;

    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20, rotate: -180 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
                  className={`text-4xl ${i < stars ? "" : "opacity-20 grayscale"}`}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`font-bold text-gray-900 ${isSenior ? "text-3xl" : "text-2xl sm:text-3xl"}`}
            >
              {stars === 3
                ? "Detective perfetto!"
                : stars === 2
                  ? "Ottimo fiuto!"
                  : stars === 1
                    ? "Non male!"
                    : "Riprova!"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg font-bold text-gray-500 mt-1"
            >
              {correctCount}/{TOTAL_ROUNDS} errori trovati ({accuracy}%)
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-2xl font-bold text-rose-500 mt-2"
            >
              {score} punti
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="grid grid-cols-3 gap-3 mt-6"
            >
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-gray-900">
                  {correctCount}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">Corrette</p>
              </div>
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-gray-900">
                  {bestStreak}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">
                  Streak max
                </p>
              </div>
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-rose-500">
                  +{xpEarned}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">{profileConfig.xpLabel}</p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
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
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 font-bold shadow-lg shadow-rose-400/30"
              >
                Rigioca
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==================== PLAYING ====================
  const timerPercentage = (timer / TIME_LIMIT) * 100;
  const timerUrgent = timer <= 10;
  const catCfg = scenario ? categoryConfig[scenario.category] : categoryConfig.licita;

  return (
    <div className="pt-4 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              pausedTimeRef.current = timer;
              setPaused(true);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>

          {/* Progress bar */}
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500"
                animate={{
                  width: `${((round + 1) / TOTAL_ROUNDS) * 100}%`,
                }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-gray-400">
            {round + 1}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Timer bar + Streak + Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Circular timer */}
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={timerUrgent ? "#ef4444" : "#f43f5e"}
                  strokeWidth="3"
                  strokeDasharray={`${timerPercentage}, 100`}
                  strokeLinecap="round"
                  animate={{
                    strokeDasharray: `${timerPercentage}, 100`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums ${
                  timerUrgent ? "text-red-500" : "text-gray-700"
                }`}
              >
                {timer}
              </span>
            </div>
            {timerUrgent && !showFeedback && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold text-red-500"
              >
                Sbrigati!
              </motion.span>
            )}
          </div>

          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-rose-50 rounded-full px-3 py-1"
            >
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-rose-600">
                x{streak}
              </span>
            </motion.div>
          )}

          <span className="text-sm font-bold text-rose-500">
            {score} pts
          </span>
        </div>

        {scenario && (
          <>
            {/* Scenario card */}
            <motion.div
              key={round}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-clean rounded-2xl bg-white p-5 mb-4"
            >
              {/* Category + Difficulty badges */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${catCfg.bg} ${catCfg.text}`}
                >
                  {catCfg.icon} {catCfg.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    scenario.difficulty === "facile"
                      ? "bg-green-50 text-green-700"
                      : scenario.difficulty === "medio"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {scenario.difficulty.charAt(0).toUpperCase() +
                    scenario.difficulty.slice(1)}
                </span>
              </div>

              {/* Situation text */}
              <p
                className={`font-bold text-gray-900 leading-relaxed ${
                  isSenior ? "text-base" : "text-sm"
                }`}
              >
                {scenario.situation}
              </p>

              {/* Cards display */}
              {scenario.cards && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Carte
                  </p>
                  <p
                    className={`font-mono font-bold tracking-wide ${
                      isSenior ? "text-lg" : "text-base"
                    }`}
                  >
                    {scenario.cards.split("").map((char, i) => {
                      if (char === "♠" || char === "♣")
                        return (
                          <span key={i} className="text-gray-900">
                            {char}
                          </span>
                        );
                      if (char === "♥" || char === "♦")
                        return (
                          <span key={i} className="text-red-500">
                            {char}
                          </span>
                        );
                      return <span key={i}>{char}</span>;
                    })}
                  </p>
                </div>
              )}

              {/* Bidding sequence */}
              {scenario.sequence && scenario.sequence.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Sequenza di licita
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {scenario.sequence.map((bid, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          bid === "Passo"
                            ? "bg-gray-200 text-gray-600"
                            : bid.includes("♥") || bid.includes("♦")
                              ? "bg-red-100 text-red-700"
                              : bid.includes("♠") || bid.includes("♣")
                                ? "bg-gray-800 text-white"
                                : bid.includes("NT")
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {bid}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Answer options */}
            <div className="space-y-2">
              {scenario.options.map((option, idx) => {
                let btnClass =
                  "bg-white card-clean hover:shadow-lg border-2 border-transparent";
                if (showFeedback) {
                  if (idx === scenario.correctAnswer) {
                    btnClass =
                      "bg-emerald-50 border-2 border-emerald-400 shadow-lg shadow-emerald-100";
                  } else if (idx === selectedAnswer && !lastCorrect) {
                    btnClass = "bg-red-50 border-2 border-red-300";
                  } else {
                    btnClass = "bg-gray-50 opacity-50 border-2 border-transparent";
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleAnswer(idx)}
                    disabled={showFeedback}
                    className={`w-full rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${btnClass} ${
                      isSenior ? "py-4" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          showFeedback && idx === scenario.correctAnswer
                            ? "bg-emerald-500 text-white"
                            : showFeedback &&
                                idx === selectedAnswer &&
                                !lastCorrect
                              ? "bg-red-500 text-white"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {showFeedback && idx === scenario.correctAnswer
                          ? "✓"
                          : showFeedback &&
                              idx === selectedAnswer &&
                              !lastCorrect
                            ? "✗"
                            : String.fromCharCode(65 + idx)}
                      </span>
                      <span
                        className={`font-semibold leading-snug ${
                          isSenior ? "text-base" : "text-sm"
                        } ${
                          showFeedback && idx === scenario.correctAnswer
                            ? "text-emerald-800"
                            : showFeedback &&
                                idx === selectedAnswer &&
                                !lastCorrect
                              ? "text-red-700"
                              : "text-gray-800"
                        }`}
                      >
                        {option}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback / Explanation */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`mt-4 p-4 rounded-xl ${
                    lastCorrect ? "bg-emerald-50" : timer === 0 && selectedAnswer === null ? "bg-amber-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {lastCorrect ? "✅" : timer === 0 && selectedAnswer === null ? "⏰" : "❌"}
                    </span>
                    <p
                      className={`font-bold ${
                        lastCorrect
                          ? "text-emerald-700"
                          : timer === 0 && selectedAnswer === null
                            ? "text-amber-700"
                            : "text-red-600"
                      } ${isSenior ? "text-base" : "text-sm"}`}
                    >
                      {lastCorrect
                        ? "Corretto! Hai trovato l'errore!"
                        : timer === 0 && selectedAnswer === null
                          ? "Tempo scaduto!"
                          : "Sbagliato!"}
                    </p>
                  </div>
                  <p
                    className={`text-gray-600 leading-relaxed ${
                      isSenior ? "text-sm" : "text-xs"
                    }`}
                  >
                    {scenario.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Pause overlay */}
        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="bg-white rounded-3xl p-8 text-center mx-6 max-w-sm w-full shadow-2xl"
              >
                <div className="text-5xl mb-4">⏸️</div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Pausa
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Domanda {round + 1}/{TOTAL_ROUNDS} · {score} pts
                </p>
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={() => {
                      setPaused(false);
                      // Resume timer from where it was
                      setTimer(pausedTimeRef.current);
                      timerRef.current = setInterval(() => {
                        setTimer((prev) => {
                          if (prev <= 1) {
                            if (timerRef.current)
                              clearInterval(timerRef.current);
                            return 0;
                          }
                          return prev - 1;
                        });
                      }, 1000);
                    }}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 font-semibold shadow-lg"
                  >
                    Riprendi
                  </Button>
                  <Link href="/gioca" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-xl font-bold"
                    >
                      Esci dal gioco
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
