"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useProfile, type UserProfile } from "@/hooks/use-profile";
import {
  biddingScenarios,
  type BiddingScenario,
} from "@/data/bidding-practice-data";

// Suit styling for bid buttons
const bidSuitColor = (bid: string): string => {
  if (bid.includes("\u2660")) return "text-blue-900"; // spades
  if (bid.includes("\u2665")) return "text-red-500"; // hearts
  if (bid.includes("\u2666")) return "text-orange-500"; // diamonds
  if (bid.includes("\u2663")) return "text-emerald-700"; // clubs
  if (bid === "Passo") return "text-gray-500";
  if (bid === "Contro") return "text-red-600";
  return "text-[#003DA5]";
};

const bidBgGradient = (bid: string): string => {
  if (bid.includes("\u2660")) return "from-blue-50 to-slate-50";
  if (bid.includes("\u2665")) return "from-red-50 to-pink-50";
  if (bid.includes("\u2666")) return "from-orange-50 to-amber-50";
  if (bid.includes("\u2663")) return "from-emerald-50 to-green-50";
  if (bid === "Passo") return "from-gray-50 to-gray-100";
  if (bid === "Contro") return "from-red-50 to-rose-50";
  return "from-[#003DA5]/10 to-[#003DA5]/5";
};

type Difficulty = "facile" | "medio" | "difficile";

const diffConfig = {
  facile: {
    levels: [1] as (1 | 2 | 3)[],
    label: "Facile",
    desc: "Situazioni base: risposte semplici, Stayman, Texas",
    xpMult: 0.8,
    color: "from-green-500 to-emerald-500",
    shadow: "shadow-green-400/30",
  },
  medio: {
    levels: [1, 2] as (1 | 2 | 3)[],
    label: "Medio",
    desc: "Aperture deboli, interventi, 2♣ forte",
    xpMult: 1,
    color: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-400/30",
  },
  difficile: {
    levels: [2, 3] as (1 | 2 | 3)[],
    label: "Difficile",
    desc: "Cue bid, splinter, dichiarazione competitiva",
    xpMult: 1.5,
    color: "from-red-500 to-rose-500",
    shadow: "shadow-red-400/30",
  },
};

const TOTAL_ROUNDS = 10;

export default function PraticaLicitaPage() {
  const profileConfig = useProfile();
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const [phase, setPhase] = useState<"menu" | "playing" | "gameover">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("facile");
  const [roundIdx, setRoundIdx] = useState(0);
  const [scenarios, setScenarios] = useState<BiddingScenario[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timer, setTimer] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const pausedElapsedRef = useRef(0);

  useEffect(() => {
    try {
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) setProfile(p);
    } catch {}
  }, []);

  const dCfg = diffConfig[difficulty];

  const startGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff || difficulty;
      if (diff) setDifficulty(d);
      const cfg = diffConfig[d];
      // Filter by difficulty levels, shuffle, pick TOTAL_ROUNDS
      const pool = biddingScenarios.filter((s) =>
        cfg.levels.includes(s.difficulty)
      );
      const shuffled = [...pool]
        .sort(() => Math.random() - 0.5)
        .slice(0, TOTAL_ROUNDS);
      // If not enough, pad with repeats
      while (shuffled.length < TOTAL_ROUNDS && pool.length > 0) {
        shuffled.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      setScenarios(shuffled);
      setPhase("playing");
      setRoundIdx(0);
      setScore(0);
      setCorrect(0);
      setStreak(0);
      setBestStreak(0);
      setShowFeedback(false);
      startTimer();
    },
    [difficulty]
  );

  const startTimer = () => {
    setTimer(0);
    startRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startRef.current) / 100));
    }, 100);
  };

  // Shuffle options once per scenario so they don't jump around
  const shuffledOptions = useMemo(() => {
    if (!scenarios[roundIdx]) return [];
    const s = scenarios[roundIdx];
    const all = [s.correctBid, ...s.wrongBids];
    return all.sort(() => Math.random() - 0.5);
  }, [scenarios, roundIdx]);

  const handleAnswer = (bid: string) => {
    if (showFeedback) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const scenario = scenarios[roundIdx];
    const isCorrect = bid === scenario.correctBid;
    setSelectedAnswer(bid);
    setLastCorrect(isCorrect);
    setShowFeedback(true);

    if (isCorrect) {
      const speed = (Date.now() - startRef.current) / 1000;
      const speedBonus = Math.max(0, Math.floor(150 - speed * 15));
      const streakBonus = streak * 15;
      setScore((s) => s + 100 + speedBonus + streakBonus);
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const n = s + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer("");
      if (roundIdx + 1 >= TOTAL_ROUNDS) {
        setPhase("gameover");
        const earned = Math.floor(
          (20 + correct * 5 + (isCorrect ? 5 : 0)) * dCfg.xpMult
        );
        setXpEarned(earned);
        try {
          const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          localStorage.setItem("bq_xp", String(prev + earned));
        } catch {}
      } else {
        setRoundIdx((r) => r + 1);
        startTimer();
      }
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const scenario = scenarios[roundIdx];

  // ======================== MENU ========================
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
            <span className="text-[#003DA5] font-semibold">
              Pratica Licita
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-[#003DA5] text-white text-5xl shadow-xl shadow-[#003DA5]/20 mb-6">
              🗣️
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Pratica Licita
            </h1>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              Esercitati nella dichiarazione: il compagno ha aperto, quale bid
              fai tu?
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge className="bg-[#003DA5]/10 text-[#003DA5] text-xs font-bold border-0">
                {TOTAL_ROUNDS} scenari
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700 text-xs font-bold border-0">
                +20-70 {profileConfig.xpLabel}
              </Badge>
            </div>

            {/* Rules card */}
            <div className="mt-6 bg-white card-clean rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                Come funziona
              </h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>Vedi la tua mano e la storia della dichiarazione</li>
                <li>Scegli la risposta corretta tra 4 opzioni</li>
                <li>
                  Temi: Texas, Stayman, cue bid, interventi, aperture deboli
                </li>
                <li>Piu&apos; sei veloce, piu&apos; punti guadagni!</li>
              </ul>
            </div>

            {/* Topic preview */}
            <div className="mt-4 bg-white card-clean rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                Argomenti
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Texas Transfer",
                  "Stayman",
                  "Risposte a 1NT",
                  "Interventi",
                  "2♣ Forte",
                  "Aperture deboli",
                  "Cue Bid",
                  "Competitiva",
                ].map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold text-[#003DA5] bg-[#003DA5]/10 rounded-full px-2.5 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Difficulty selector */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-gray-900 text-left">
                Scegli difficolta&apos;
              </h3>
              {(
                Object.entries(diffConfig) as [
                  Difficulty,
                  (typeof diffConfig)["facile"],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg ${cfg.shadow} active:scale-[0.97] transition-transform`}
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
          </motion.div>
        </div>
      </div>
    );
  }

  // ======================== GAME OVER ========================
  if (phase === "gameover") {
    const accuracy = Math.round((correct / TOTAL_ROUNDS) * 100);
    const stars = correct >= 9 ? 3 : correct >= 7 ? 2 : correct >= 4 ? 1 : 0;

    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {stars === 3
                ? "Maestro Dichiarante!"
                : stars === 2
                  ? "Ottima licita!"
                  : stars === 1
                    ? "Buon inizio!"
                    : "Studia la licita!"}
            </h1>
            <p className="text-lg font-bold text-gray-500 mt-1">
              {correct}/{TOTAL_ROUNDS} corrette ({accuracy}%)
            </p>
            <p className="text-2xl font-bold text-[#003DA5] mt-2">
              {score} punti
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-gray-900">{correct}</p>
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
                <p className="text-lg font-bold text-[#003DA5]">
                  +{xpEarned}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">
                  {profileConfig.xpLabel}
                </p>
              </div>
            </div>

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
                className="flex-1 h-12 rounded-xl bg-[#003DA5] font-bold shadow-lg"
              >
                Rigioca
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ======================== PLAYING ========================
  return (
    <div className="pt-4 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              pausedElapsedRef.current = Date.now() - startRef.current;
              setPaused(true);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#003DA5]"
                animate={{
                  width: `${((roundIdx + 1) / TOTAL_ROUNDS) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {roundIdx + 1}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Timer + Streak + Score */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold tabular-nums text-gray-400">
            {(timer / 10).toFixed(1)}s
          </span>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-purple-50 rounded-full px-3 py-1"
            >
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-purple-600">
                x{streak}
              </span>
            </motion.div>
          )}
          <span className="text-sm font-bold text-[#003DA5]">
            {score} pts
          </span>
        </div>

        {scenario && (
          <>
            {/* Topic badge */}
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-[#003DA5]/10 text-[#003DA5] text-[10px] font-bold border-0">
                {scenario.topic}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-bold text-gray-400"
              >
                {scenario.vulnerability !== "Nessuna"
                  ? `Vuln: ${scenario.vulnerability}`
                  : "Non vulnerabili"}
              </Badge>
            </div>

            {/* Bidding history */}
            {scenario.biddingHistory.length > 0 && (
              <motion.div
                key={`hist-${roundIdx}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-clean rounded-2xl bg-white p-4 mb-3"
              >
                <p className="text-xs font-bold text-gray-400 mb-2">
                  Dichiarazione finora:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {scenario.biddingHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                        {entry.seat}
                      </span>
                      <span
                        className={`text-sm font-bold ${bidSuitColor(entry.bid)}`}
                      >
                        {entry.bid}
                      </span>
                      {i < scenario.biddingHistory.length - 1 && (
                        <span className="text-gray-300 mx-0.5">→</span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#003DA5] bg-[#003DA5]/10 rounded px-1.5 py-0.5 animate-pulse">
                      {scenario.position}
                    </span>
                    <span className="text-sm font-bold text-[#003DA5]">
                      ?
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hand display */}
            <motion.div
              key={`hand-${roundIdx}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-clean rounded-2xl bg-white p-5 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400">
                  La tua mano ({scenario.position})
                  {scenario.biddingHistory.length === 0 &&
                    " — Che apertura fai?"}
                  {scenario.biddingHistory.length > 0 && " — Che bid fai?"}
                </p>
              </div>
              {/* Four-suit layout */}
              <div
                className={`space-y-1 font-mono font-bold ${profile === "senior" ? "text-xl" : "text-lg"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-900 w-6 text-right">♠</span>
                  <span className="text-gray-900">
                    {scenario.hand.spades || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 w-6 text-right">♥</span>
                  <span className="text-gray-900">
                    {scenario.hand.hearts || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 w-6 text-right">♦</span>
                  <span className="text-gray-900">
                    {scenario.hand.diamonds || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 w-6 text-right">♣</span>
                  <span className="text-gray-900">
                    {scenario.hand.clubs || "—"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Bid options — bidding box style */}
            <div className="grid grid-cols-2 gap-3">
              {shuffledOptions.map((bid) => {
                let btnClass = `bg-gradient-to-br ${bidBgGradient(bid)} border-2 border-gray-200 hover:shadow-lg hover:border-[#003DA5]/30`;
                if (showFeedback) {
                  if (bid === scenario.correctBid) {
                    btnClass =
                      "bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-400 shadow-lg shadow-emerald-200/50";
                  } else if (bid === selectedAnswer && !lastCorrect) {
                    btnClass =
                      "bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-300 shadow-lg shadow-red-200/50";
                  } else {
                    btnClass =
                      "bg-gray-50 border-2 border-gray-100 opacity-40";
                  }
                }

                return (
                  <button
                    key={bid}
                    onClick={() => handleAnswer(bid)}
                    disabled={showFeedback}
                    className={`rounded-2xl p-4 text-center transition-all active:scale-95 ${btnClass} ${
                      profile === "senior" ? "py-5" : ""
                    }`}
                  >
                    <p
                      className={`font-bold ${profile === "senior" ? "text-2xl" : "text-xl"} ${bidSuitColor(bid)}`}
                    >
                      {bid}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-4 rounded-xl ${lastCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {lastCorrect ? "✅" : "❌"}
                    </span>
                    <p
                      className={`text-sm font-bold ${lastCorrect ? "text-emerald-700" : "text-red-600"}`}
                    >
                      {lastCorrect ? "Corretto!" : "Sbagliato!"}
                    </p>
                    {!lastCorrect && (
                      <span className="text-xs font-bold text-gray-500">
                        Era:{" "}
                        <span className="text-[#003DA5] font-bold">
                          {scenario.correctBid}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
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
                  Scenario {roundIdx + 1}/{TOTAL_ROUNDS} · {score} pts
                </p>
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={() => {
                      setPaused(false);
                      startRef.current =
                        Date.now() - pausedElapsedRef.current;
                      timerRef.current = setInterval(() => {
                        setTimer(
                          Math.floor(
                            (Date.now() - startRef.current) / 100
                          )
                        );
                      }, 100);
                    }}
                    className="w-full h-12 rounded-xl bg-[#003DA5] font-semibold shadow-lg"
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
