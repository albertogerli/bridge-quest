"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { impasseScenarios, type ImpasseScenario } from "@/data/impasse-data";
import { useProfile } from "@/hooks/use-profile";

// ── Types ──────────────────────────────────────────────────────
type Phase = "menu" | "playing" | "gameover";
type Difficulty = "facile" | "medio" | "difficile";

const diffConfig = {
  facile: {
    time: 8000,
    label: "Facile",
    desc: "8 secondi per decidere",
    xpMult: 0.8,
    color: "from-green-500 to-emerald-500",
    shadow: "shadow-green-400/30",
  },
  medio: {
    time: 5000,
    label: "Medio",
    desc: "5 secondi per decidere",
    xpMult: 1,
    color: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-400/30",
  },
  difficile: {
    time: 3000,
    label: "Difficile",
    desc: "3 secondi per decidere",
    xpMult: 1.5,
    color: "from-red-500 to-rose-500",
    shadow: "shadow-red-400/30",
  },
};

const TOTAL_ROUNDS = 15;

// ── Suit color helper ──────────────────────────────────────────
function colorizeCards(text: string): React.ReactNode {
  // Break text into characters, color suit symbols
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\u2660") {
      // spade
      parts.push(
        <span key={i} className="text-gray-900 font-black">
          {ch}
        </span>
      );
    } else if (ch === "\u2665") {
      // heart
      parts.push(
        <span key={i} className="text-red-500 font-black">
          {ch}
        </span>
      );
    } else if (ch === "\u2666") {
      // diamond
      parts.push(
        <span key={i} className="text-orange-500 font-black">
          {ch}
        </span>
      );
    } else if (ch === "\u2663") {
      // club
      parts.push(
        <span key={i} className="text-emerald-600 font-black">
          {ch}
        </span>
      );
    } else {
      parts.push(
        <span key={i} className="font-extrabold">
          {ch}
        </span>
      );
    }
    i++;
  }
  return <>{parts}</>;
}

// ── Shuffle utility ────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Main component ─────────────────────────────────────────────
export default function ImpassePage() {
  const profileConfig = useProfile();
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [round, setRound] = useState(0);
  const [scenarios, setScenarios] = useState<ImpasseScenario[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const roundStartRef = useRef(0);

  // Feedback state
  const [feedback, setFeedback] = useState<null | {
    correct: boolean;
    scenario: ImpasseScenario;
    answered: "impasse" | "drop" | "timeout";
  }>(null);

  // Load best score
  useEffect(() => {
    try {
      const bs = localStorage.getItem("bq_impasse_best");
      if (bs) setBestScore(parseInt(bs, 10));
    } catch {}
  }, []);

  const cfg = diffConfig[difficulty];

  // ── Pick scenarios for the game ─────────────────────────────
  const pickScenarios = useCallback(
    (diff: Difficulty) => {
      // Filter by difficulty, then fill up from others if needed
      const byDiff = impasseScenarios.filter((s) => s.difficulty === diff);
      const others = impasseScenarios.filter((s) => s.difficulty !== diff);
      const pool = shuffle([...byDiff, ...shuffle(others)]);
      return pool.slice(0, TOTAL_ROUNDS);
    },
    []
  );

  // ── Start game ──────────────────────────────────────────────
  const startGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;
      if (diff) setDifficulty(d);
      const picked = pickScenarios(d);
      setScenarios(picked);
      setPhase("playing");
      setRound(0);
      setCorrectCount(0);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setFeedback(null);
      setXpEarned(0);
      startRoundTimer(diffConfig[d].time);
    },
    [difficulty, pickScenarios]
  );

  // ── Round timer ─────────────────────────────────────────────
  const startRoundTimer = useCallback((totalMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(totalMs);
    roundStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      const remaining = Math.max(0, totalMs - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 50);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Handle timeout ──────────────────────────────────────────
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0 && !feedback && scenarios.length > 0) {
      handleAnswer("timeout");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, feedback, scenarios.length]);

  // ── Handle answer ───────────────────────────────────────────
  const handleAnswer = useCallback(
    (answer: "impasse" | "drop" | "timeout") => {
      if (feedback) return; // Already answered
      if (timerRef.current) clearInterval(timerRef.current);

      const scenario = scenarios[round];
      if (!scenario) return;

      const isCorrect = answer !== "timeout" && answer === scenario.correctAnswer;

      // Speed bonus: faster = more points (only if correct)
      let roundScore = 0;
      if (isCorrect) {
        const elapsed = Date.now() - roundStartRef.current;
        const timeRatio = Math.max(0, 1 - elapsed / cfg.time);
        const speedBonus = Math.floor(timeRatio * 80);
        const streakBonus = streak * 8;
        roundScore = 120 + speedBonus + streakBonus;
      }

      setFeedback({ correct: isCorrect, scenario, answered: answer });

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setScore((s) => s + roundScore);
        setStreak((s) => {
          const n = s + 1;
          setBestStreak((b) => Math.max(b, n));
          return n;
        });
      } else {
        setStreak(0);
      }

      // Move to next round or end game
      setTimeout(() => {
        setFeedback(null);
        if (round + 1 >= TOTAL_ROUNDS) {
          endGame(isCorrect);
        } else {
          setRound((r) => r + 1);
          startRoundTimer(cfg.time);
        }
      }, 2200);
    },
    [feedback, scenarios, round, cfg.time, streak, startRoundTimer]
  );

  // ── End game ────────────────────────────────────────────────
  const endGame = useCallback(
    (lastWasCorrect: boolean) => {
      const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);
      const earned = Math.floor(finalCorrect * 12 * cfg.xpMult);
      setXpEarned(earned);
      setPhase("gameover");

      try {
        // Save XP
        const prevXP = parseInt(localStorage.getItem("bq_xp") || "0", 10);
        localStorage.setItem("bq_xp", String(prevXP + earned));

        // Save best score
        const finalScore = score + (lastWasCorrect ? 120 : 0);
        const prevBest = parseInt(
          localStorage.getItem("bq_impasse_best") || "0",
          10
        );
        if (finalScore > prevBest) {
          localStorage.setItem("bq_impasse_best", String(finalScore));
          setBestScore(finalScore);
        }
      } catch {}
    },
    [correctCount, score, cfg.xpMult]
  );

  // ── Current scenario ────────────────────────────────────────
  const scenario = scenarios[round];
  const timerPercent = cfg.time > 0 ? (timeLeft / cfg.time) * 100 : 0;
  const timerDanger = timerPercent < 30;
  const timerWarn = timerPercent < 50 && !timerDanger;

  // ═══════════════════════════════════════════════════════════
  // MENU PHASE
  // ═══════════════════════════════════════════════════════════
  if (phase === "menu") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link
              href="/gioca"
              className="hover:text-emerald-600 transition-colors"
            >
              Gioca
            </Link>
            <span>/</span>
            <span className="text-blue-600 font-semibold">
              Impasse o Drop?
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            {/* Icon */}
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-5xl shadow-xl shadow-blue-400/30 mb-6">
              <svg
                viewBox="0 0 48 48"
                className="h-14 w-14"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 36 L24 12 L36 36" />
                <circle cx="12" cy="36" r="3" fill="white" />
                <circle cx="36" cy="36" r="3" fill="white" />
                <line x1="24" y1="12" x2="24" y2="6" />
                <circle cx="24" cy="5" r="2" fill="white" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Impasse o Drop?
            </h1>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              Vedi la combinazione di carte: decidi in fretta se fare l'impasse o
              giocare per il drop!
            </p>

            {/* Rules */}
            <div className="mt-6 bg-white card-elevated rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                Come si gioca?
              </h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>
                  Vedi la tua mano e il morto in un seme specifico
                </li>
                <li>
                  Ti manca un onore (K o Q): devi decidere la manovra
                </li>
                <li>
                  <span className="font-bold text-blue-600">IMPASSE</span>{" "}
                  = finesse verso l'onore mancante
                </li>
                <li>
                  <span className="font-bold text-amber-600">DROP</span>{" "}
                  = gioca dall'alto sperando che cada
                </li>
                <li>
                  Hai pochi secondi per decidere! 15 mani per partita
                </li>
              </ul>
            </div>

            {/* Quick reference */}
            <div className="mt-4 bg-white card-elevated rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                Regole d'oro
              </h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>
                  <span className="text-blue-600 font-bold">8 carte, manca K</span>{" "}
                  = IMPASSE (50% vs 33%)
                </li>
                <li>
                  <span className="text-amber-600 font-bold">9 carte, manca Q</span>{" "}
                  = DROP ("con 9, non finessare")
                </li>
                <li>
                  <span className="text-blue-600 font-bold">9 carte, manca K</span>{" "}
                  = IMPASSE (56% - regola diversa!)
                </li>
                <li>
                  <span className="text-amber-600 font-bold">10+ carte</span>{" "}
                  = quasi sempre DROP
                </li>
              </ul>
            </div>

            {/* Difficulty buttons */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-gray-900 text-left">
                Scegli difficoltà
              </h3>
              {(
                Object.entries(diffConfig) as [
                  Difficulty,
                  (typeof diffConfig)[Difficulty]
                ][]
              ).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${c.color} text-white shadow-lg ${c.shadow} active:scale-[0.97] transition-transform`}
                >
                  <div className="text-left">
                    <p className="font-extrabold">{c.label}</p>
                    <p className="text-white/70 text-sm">{c.desc}</p>
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
            {bestScore > 0 && (
              <div className="mt-4 text-center text-sm text-gray-400 font-bold">
                Miglior punteggio: {bestScore} pts
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GAME OVER PHASE
  // ═══════════════════════════════════════════════════════════
  if (phase === "gameover") {
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const stars =
      correctCount >= 13 ? 3 : correctCount >= 10 ? 2 : correctCount >= 6 ? 1 : 0;

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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className={`text-4xl ${i < stars ? "" : "opacity-20 grayscale"}`}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {stars === 3
                ? "Esperto di Manovre!"
                : stars === 2
                  ? "Ottimo istinto!"
                  : stars === 1
                    ? "Buon inizio!"
                    : "Ripassa la teoria!"}
            </h1>
            <p className="text-lg font-bold text-gray-500 mt-1">
              {correctCount}/{TOTAL_ROUNDS} corrette ({accuracy}%)
            </p>
            <p className="text-2xl font-black text-blue-500 mt-2">
              {score} punti
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-gray-900">
                  {correctCount}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">Corrette</p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-gray-900">
                  {bestStreak}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">
                  Streak max
                </p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-blue-500">
                  +{xpEarned}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">{profileConfig.xpLabel}</p>
              </div>
            </div>

            {/* Recap hint */}
            <div className="mt-4 card-elevated rounded-xl bg-blue-50 p-3">
              <p className="text-xs text-blue-700 font-bold">
                Ricorda: "con 8, impasse il Re" e "con 9, drop la Donna"
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
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
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 font-bold shadow-lg"
              >
                Rigioca
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYING PHASE
  // ═══════════════════════════════════════════════════════════
  if (!scenario) return null;

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
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"
                animate={{ width: `${((round + 1) / TOTAL_ROUNDS) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {round + 1}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Streak + Score row */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-black text-gray-400">
            {correctCount}/{round} corrette
          </div>
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-blue-50 rounded-full px-3 py-1"
            >
              <span className="text-sm">🔥</span>
              <span className="text-xs font-black text-blue-600">
                x{streak}
              </span>
            </motion.div>
          )}
          <span className="text-sm font-black text-blue-500">{score} pts</span>
        </div>

        {/* Timer bar */}
        <div className="mb-5 relative">
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${
                timerDanger
                  ? "bg-gradient-to-r from-red-500 to-rose-500"
                  : timerWarn
                    ? "bg-gradient-to-r from-amber-400 to-orange-500"
                    : "bg-gradient-to-r from-blue-400 to-cyan-500"
              }`}
              style={{ width: `${timerPercent}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
          <div className="absolute right-0 -top-5">
            <span
              className={`text-xs font-black tabular-nums ${
                timerDanger
                  ? "text-red-500"
                  : timerWarn
                    ? "text-amber-500"
                    : "text-gray-400"
              }`}
            >
              {(timeLeft / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Scenario card */}
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="card-elevated rounded-2xl bg-white p-5 mb-5"
        >
          {/* Missing honor badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Manca:
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-600 font-extrabold text-sm">
              {colorizeCards(scenario.missingHonor)}
            </span>
          </div>

          {/* Card fans: Your hand + Dummy */}
          <div className="grid grid-cols-2 gap-4">
            {/* Your hand */}
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                La tua mano
              </p>
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl p-3 border border-blue-100">
                <p className="text-2xl sm:text-3xl tracking-wider leading-relaxed">
                  {colorizeCards(scenario.yourHand)}
                </p>
              </div>
            </div>

            {/* Dummy */}
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Il morto
              </p>
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-xl p-3 border border-amber-100">
                <p className="text-2xl sm:text-3xl tracking-wider leading-relaxed">
                  {colorizeCards(scenario.dummy)}
                </p>
              </div>
            </div>
          </div>

          {/* Info: total cards + missing */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-xs font-bold text-gray-400">
              {scenario.totalCards} carte totali
            </span>
            <span className="text-gray-200">|</span>
            <span className="text-xs font-bold text-gray-400">
              {scenario.missingCards} mancanti
            </span>
          </div>
        </motion.div>

        {/* Decision buttons */}
        {!feedback && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* IMPASSE button */}
            <button
              onClick={() => handleAnswer("impasse")}
              className="relative overflow-hidden rounded-2xl p-5 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-400/30 active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              <svg
                className="h-8 w-8 mx-auto mb-2"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M8 24 L16 8 L24 24" />
                <path d="M12 18 L20 18" />
              </svg>
              <p className="text-xl font-extrabold">IMPASSE</p>
              <p className="text-[10px] text-white/70 font-bold mt-1">
                Finesse
              </p>
            </button>

            {/* DROP button */}
            <button
              onClick={() => handleAnswer("drop")}
              className="relative overflow-hidden rounded-2xl p-5 text-center bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-400/30 active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              <svg
                className="h-8 w-8 mx-auto mb-2"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M16 6 L16 22" />
                <path d="M10 16 L16 22 L22 16" />
                <line x1="8" y1="26" x2="24" y2="26" />
              </svg>
              <p className="text-xl font-extrabold">DROP</p>
              <p className="text-[10px] text-white/70 font-bold mt-1">
                Gioca dall'alto
              </p>
            </button>
          </motion.div>
        )}

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-4 rounded-2xl p-4 ${
                feedback.correct
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {/* Result header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {feedback.correct
                    ? "✅"
                    : feedback.answered === "timeout"
                      ? "⏰"
                      : "❌"}
                </span>
                <span
                  className={`text-lg font-extrabold ${
                    feedback.correct ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {feedback.correct
                    ? "Corretto!"
                    : feedback.answered === "timeout"
                      ? "Tempo scaduto!"
                      : "Sbagliato!"}
                </span>
              </div>

              {/* Correct answer + probability */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold ${
                    feedback.scenario.correctAnswer === "impasse"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {feedback.scenario.correctAnswer === "impasse"
                    ? "IMPASSE"
                    : "DROP"}
                </span>
                <span className="text-sm font-bold text-gray-500">
                  Probabilità: {feedback.scenario.probability}%
                </span>
              </div>

              {/* Explanation */}
              <p className="text-xs text-gray-600 leading-relaxed">
                {feedback.scenario.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
