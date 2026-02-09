"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UserProfile } from "@/hooks/use-profile";

// Card generation
const suits = ["spade", "heart", "diamond", "club"] as const;
const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
const hcpValues: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
const suitSymbols: Record<string, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
const suitColors: Record<string, string> = {
  spade: "text-gray-900", heart: "text-red-500", diamond: "text-red-500", club: "text-gray-900",
};

type Card = { rank: string; suit: string };

function generateHand(): Card[] {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Take 13 cards and sort by suit then rank
  const hand = deck.slice(0, 13);
  const suitOrder = { spade: 0, heart: 1, diamond: 2, club: 3 };
  const rankOrder = Object.fromEntries(ranks.map((r, i) => [r, i]));
  hand.sort((a, b) => {
    const suitDiff = suitOrder[a.suit as keyof typeof suitOrder] - suitOrder[b.suit as keyof typeof suitOrder];
    if (suitDiff !== 0) return suitDiff;
    return rankOrder[a.rank] - rankOrder[b.rank];
  });
  return hand;
}

function countHCP(hand: Card[]): number {
  return hand.reduce((sum, card) => sum + (hcpValues[card.rank] || 0), 0);
}

type Difficulty = "facile" | "medio" | "difficile";
const difficultyConfig = {
  facile: { rounds: 8, options: 4, spread: 5, label: "Facile", xpMult: 0.8, color: "from-green-500 to-emerald-500", shadow: "shadow-green-400/30" },
  medio: { rounds: 10, options: 4, spread: 3, label: "Medio", xpMult: 1, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-400/30" },
  difficile: { rounds: 12, options: 6, spread: 2, label: "Difficile", xpMult: 1.5, color: "from-red-500 to-rose-500", shadow: "shadow-red-400/30" },
};

export default function ContaVelocePage() {
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const [phase, setPhase] = useState<"menu" | "playing" | "result" | "gameover">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [hand, setHand] = useState<Card[]>([]);
  const [correctHCP, setCorrectHCP] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);

  useEffect(() => {
    try {
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) setProfile(p);
    } catch {}
  }, []);

  const config = difficultyConfig[difficulty];

  const startGame = useCallback((diff?: Difficulty) => {
    if (diff) setDifficulty(diff);
    setPhase("playing");
    setRound(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalTime(0);
    nextHand();
  }, []);

  const nextHand = useCallback(() => {
    const h = generateHand();
    setHand(h);
    setCorrectHCP(countHCP(h));
    setShowAnswer(false);
    setTimer(0);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTimeRef.current) / 100));
    }, 100);
  }, []);

  const handleAnswer = useCallback((answer: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setTotalTime((t) => t + elapsed);
    const isCorrect = answer === correctHCP;
    setLastCorrect(isCorrect);
    setShowAnswer(true);

    if (isCorrect) {
      // Score: base 100 + speed bonus (faster = more points, max 200 for < 2s)
      const speedBonus = Math.max(0, Math.floor(200 - elapsed * 20));
      const streakBonus = streak * 10;
      const roundScore = 100 + speedBonus + streakBonus;
      setScore((s) => s + roundScore);
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (round >= config.rounds) {
        setPhase("gameover");
        // Save XP
        const earned = Math.floor((Math.floor(score / 50) + (isCorrect ? 10 : 0) + 20) * config.xpMult);
        setXpEarned(earned);
        try {
          const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          localStorage.setItem("bq_xp", String(prev + earned));
        } catch {}
      } else {
        setRound((r) => r + 1);
        nextHand();
      }
    }, 1500);
  }, [correctHCP, round, score, streak, nextHand, config]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Generate answer options - memoized to avoid recalc on timer rerenders
  const options = useMemo(() => {
    const numOptions = config.options;
    const spread = config.spread;
    const opts = new Set([correctHCP]);
    let attempts = 0;
    while (opts.size < numOptions && attempts < 200) {
      attempts++;
      const offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
      const val = correctHCP + offset;
      if (val >= 0 && val <= 37 && val !== correctHCP) opts.add(val);
    }
    for (let i = 1; opts.size < numOptions; i++) {
      if (correctHCP + i <= 37) opts.add(correctHCP + i);
      if (opts.size < numOptions && correctHCP - i >= 0) opts.add(correctHCP - i);
    }
    // Fisher-Yates shuffle to randomize position of correct answer
    const arr = Array.from(opts);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [correctHCP, config]);

  // Profile-aware settings
  const timerColor = profile === "giovane" && timer > 50 ? "text-red-500" : "text-gray-400";
  const cardSize = profile === "senior" ? "text-lg" : "text-base";

  if (phase === "menu") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link href="/gioca" className="hover:text-emerald transition-colors">Gioca</Link>
            <span>/</span>
            <span className="text-emerald font-semibold">Conta Veloce</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-5xl shadow-xl shadow-amber-400/30 mb-6">
              🧮
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Conta Veloce</h1>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              Vedi una mano, conta i punti onori il piu' veloce possibile!
            </p>
            <div className="mt-6 bg-white card-elevated rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">Come si gioca?</h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>A = 4, K = 3, Q = 2, J = 1 punto</li>
                <li>Conta i punti onori (HCP) della mano</li>
                <li>Piu' sei veloce, piu' punti guadagni</li>
                <li>Mantieni la streak per bonus extra!</li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-gray-900 text-left">Scegli difficolta'</h3>
              {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.facile][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg ${cfg.shadow} active:scale-[0.97] transition-transform`}
                >
                  <div className="text-left">
                    <p className="font-extrabold">{cfg.label}</p>
                    <p className="text-white/70 text-sm">{cfg.rounds} mani · {cfg.options} opzioni</p>
                  </div>
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "gameover") {
    const avgTime = (totalTime / config.rounds).toFixed(1);
    const accuracy = Math.round((score / (config.rounds * 300)) * 100);
    const stars = score >= 2500 ? 3 : score >= 1500 ? 2 : score >= 500 ? 1 : 0;

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
              {stars === 3 ? "Perfetto!" : stars === 2 ? "Ottimo!" : stars === 1 ? "Bene!" : "Riprova!"}
            </h1>
            <p className="text-xl sm:text-2xl font-black text-amber-500 mt-2">{score} punti</p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-gray-900">{avgTime}s</p>
                <p className="text-[10px] text-gray-400 font-bold">Media</p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-gray-900">{bestStreak}</p>
                <p className="text-[10px] text-gray-400 font-bold">Streak max</p>
              </div>
              <div className="card-elevated rounded-xl bg-white p-3">
                <p className="text-lg font-black text-amber-500">+{xpEarned}</p>
                <p className="text-[10px] text-gray-400 font-bold">XP</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link href="/gioca" className="flex-1">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                  Torna a Gioca
                </Button>
              </Link>
              <Button
                onClick={() => startGame()}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold shadow-lg"
              >
                Rigioca
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Playing phase
  return (
    <div className="pt-4 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              pausedElapsedRef.current = Date.now() - startTimeRef.current;
              setPaused(true);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>

          {/* Progress */}
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                animate={{ width: `${(round / config.rounds) * 100}%` }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-gray-400">{round}/{config.rounds}</span>
        </div>

        {/* Timer + Streak */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-sm font-black tabular-nums ${timerColor}`}>
            {(timer / 10).toFixed(1)}s
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-50 rounded-full px-3 py-1"
            >
              <span className="text-sm">🔥</span>
              <span className="text-xs font-black text-orange-600">x{streak}</span>
            </motion.div>
          )}
          <div className="text-sm font-black text-amber-500">{score} pts</div>
        </div>

        {/* Hand display */}
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-elevated rounded-2xl bg-white p-4 mb-6"
        >
          <p className="text-center text-xs font-bold text-gray-400 mb-3">
            Quanti punti onori?
          </p>

          {/* Cards grouped by suit */}
          <div className="space-y-2">
            {suits.map((suit) => {
              const suitCards = hand.filter((c) => c.suit === suit);
              if (suitCards.length === 0) return null;
              return (
                <div key={suit} className="flex items-center gap-2">
                  <span className={`${suitColors[suit]} text-lg w-6 text-center font-black`}>
                    {suitSymbols[suit]}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {suitCards.map((card, i) => (
                      <span
                        key={i}
                        className={`${cardSize} font-bold ${
                          hcpValues[card.rank]
                            ? showAnswer ? "text-amber-600 bg-amber-50 rounded px-1" : "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {card.rank}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Answer feedback */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 text-center p-2 rounded-xl ${
                  lastCorrect ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                <p className={`text-sm font-bold ${lastCorrect ? "text-emerald-700" : "text-red-600"}`}>
                  {lastCorrect ? "Corretto!" : `Sbagliato! Erano ${correctHCP} HCP`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Answer buttons */}
        {!showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`grid gap-3 ${config.options <= 4 ? "grid-cols-2" : "grid-cols-3"}`}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`card-elevated rounded-2xl bg-white p-4 text-center active:scale-95 transition-transform hover:shadow-lg ${
                  profile === "senior" ? "py-5" : ""
                }`}
              >
                <p className={`font-black ${profile === "senior" ? "text-3xl" : "text-2xl"} text-gray-900`}>{opt}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">HCP</p>
              </button>
            ))}
          </motion.div>
        )}

        {/* Hint for senior */}
        {profile === "senior" && !showAnswer && (
          <p className="text-center text-[11px] text-gray-400 mt-3">
            A=4, K=3, Q=2, J=1
          </p>
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
                <h2 className="text-2xl font-extrabold text-gray-900">Pausa</h2>
                <p className="text-sm text-gray-500 mt-2">Round {round}/{config.rounds} · {score} pts</p>
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={() => {
                      setPaused(false);
                      startTimeRef.current = Date.now() - pausedElapsedRef.current;
                      timerRef.current = setInterval(() => {
                        setTimer(Math.floor((Date.now() - startTimeRef.current) / 100));
                      }, 100);
                    }}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-extrabold shadow-lg"
                  >
                    Riprendi
                  </Button>
                  <Link href="/gioca" className="block">
                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
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
