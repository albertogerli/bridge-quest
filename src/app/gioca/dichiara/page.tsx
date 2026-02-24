"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useProfile, type UserProfile } from "@/hooks/use-profile";

const suitSymbols: Record<string, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
const suitColors: Record<string, string> = {
  spade: "text-gray-900", heart: "text-red-500", diamond: "text-red-500", club: "text-gray-900",
};

type HandScenario = {
  hand: string; // Formatted: "♠ AK32 ♥ Q87 ♦ KJ5 ♣ 943"
  hcp: number;
  distribution: string; // e.g. "4-3-3-3"
  correctBid: string;
  explanation: string;
  options: string[];
};

// 24 scenarios based on FIGB bidding rules (Corso Fiori, Quadri, Cuori Licita)
// HCP: A=4, K=3, Q=2, J=1. Every hand verified for 13 cards and correct HCP total.
const scenarios: HandScenario[] = [
  // === PASS (4 scenarios, 8-11 HCP) ===
  {
    hand: "♠ Q93  ♥ K72  ♦ J84  ♣ A653",
    hcp: 10, distribution: "3-3-3-4",
    correctBid: "Passo", explanation: "10 HCP: sotto il minimo di 12 per aprire",
    options: ["Passo", "1♣", "1NT", "1♦"],
  },
  {
    hand: "♠ J842  ♥ Q73  ♦ K95  ♣ A84",
    hcp: 10, distribution: "4-3-3-3",
    correctBid: "Passo", explanation: "10 HCP: troppo debole per aprire, servono almeno 12",
    options: ["Passo", "1♠", "1♦", "1♣"],
  },
  {
    hand: "♠ K63  ♥ Q984  ♦ J72  ♣ A53",
    hcp: 10, distribution: "3-4-3-3",
    correctBid: "Passo", explanation: "10 HCP: non si apre con meno di 12 punti onori",
    options: ["1♥", "Passo", "1♣", "1NT"],
  },
  {
    hand: "♠ A72  ♥ QJ3  ♦ K984  ♣ J105",
    hcp: 11, distribution: "3-3-4-3",
    correctBid: "Passo", explanation: "11 HCP: ancora sotto il minimo di 12 per aprire",
    options: ["Passo", "1♦", "1♣", "1NT"],
  },
  // === 1NT (4 scenarios, 15-17 HCP balanced) ===
  {
    hand: "♠ KJ5  ♥ AQ83  ♦ K72  ♣ Q94",
    hcp: 15, distribution: "3-4-3-3",
    correctBid: "1NT", explanation: "15 HCP, bilanciata 3-4-3-3: apri 1NT (15-17)",
    options: ["1♥", "1NT", "1♦", "Passo"],
  },
  {
    hand: "♠ AJ62  ♥ KQ3  ♦ A84  ♣ Q75",
    hcp: 16, distribution: "4-3-3-3",
    correctBid: "1NT", explanation: "16 HCP, bilanciata 4-3-3-3: apri 1NT. La quarta di picche non conta, 1NT ha la precedenza!",
    options: ["1♠", "1NT", "1♣", "1♦"],
  },
  {
    hand: "♠ A94  ♥ KJ85  ♦ AQ3  ♣ J72",
    hcp: 15, distribution: "3-4-3-3",
    correctBid: "1NT", explanation: "15 HCP, bilanciata: con 15-17 e distribuzione bilanciata si apre sempre 1NT",
    options: ["1♥", "1NT", "1♦", "1♣"],
  },
  {
    hand: "♠ KQ84  ♥ A73  ♦ KJ5  ♣ Q92",
    hcp: 15, distribution: "4-3-3-3",
    correctBid: "1NT", explanation: "15 HCP, bilanciata 4-3-3-3: 1NT prevale sull'apertura a colore",
    options: ["1♠", "1NT", "1♣", "Passo"],
  },
  // === 1♠ (3 scenarios, 12-21 HCP, 5+ spades) ===
  {
    hand: "♠ AK832  ♥ Q74  ♦ K95  ♣ J3",
    hcp: 13, distribution: "5-3-3-2",
    correctBid: "1♠", explanation: "13 HCP, 5 picche: apri 1♠ nel seme più lungo",
    options: ["Passo", "1♠", "1NT", "1♣"],
  },
  {
    hand: "♠ AQJ74  ♥ K5  ♦ Q83  ♣ 962",
    hcp: 12, distribution: "5-2-3-3",
    correctBid: "1♠", explanation: "12 HCP, 5 picche: si apre nel seme più lungo, 1♠",
    options: ["1♠", "Passo", "1♦", "1NT"],
  },
  {
    hand: "♠ KQ9742  ♥ A5  ♦ AJ3  ♣ 84",
    hcp: 14, distribution: "6-2-3-2",
    correctBid: "1♠", explanation: "14 HCP, 6 picche: apri 1♠. Con 6 carte non bilanciata, niente 1NT",
    options: ["1♠", "2♠", "1NT", "Passo"],
  },
  // === 1♥ (3 scenarios) ===
  {
    hand: "♠ 84  ♥ AKJ63  ♦ Q72  ♣ K95",
    hcp: 13, distribution: "2-5-3-3",
    correctBid: "1♥", explanation: "13 HCP, 5 cuori: apri 1♥ nel seme più lungo",
    options: ["1♥", "1NT", "Passo", "1♣"],
  },
  {
    hand: "♠ KJ84  ♥ AQ73  ♦ K92  ♣ 65",
    hcp: 13, distribution: "4-4-3-2",
    correctBid: "1♥", explanation: "13 HCP, 4-4 nei nobili: con 4♠ e 4♥ si apre 1♥ (standard FIGB)",
    options: ["1♠", "1♥", "1♦", "1NT"],
  },
  {
    hand: "♠ 5  ♥ AQJ84  ♦ K73  ♣ AQ92",
    hcp: 16, distribution: "1-5-3-4",
    correctBid: "1♥", explanation: "16 HCP, 5 cuori: sbilanciata, si apre nel seme più lungo 1♥",
    options: ["1♥", "1♣", "1NT", "2♥"],
  },
  // === 1♦ (3 scenarios) ===
  {
    hand: "♠ K84  ♥ A53  ♦ KJ952  ♣ Q7",
    hcp: 13, distribution: "3-3-5-2",
    correctBid: "1♦", explanation: "13 HCP, 5 quadri: apri nel seme più lungo, 1♦",
    options: ["1♦", "1♣", "1NT", "Passo"],
  },
  {
    hand: "♠ AQ73  ♥ K84  ♦ QJ95  ♣ 62",
    hcp: 12, distribution: "4-3-4-2",
    correctBid: "1♦", explanation: "12 HCP, 4♠ e 4♦: con due quarti si apre nel più basso di rango, 1♦",
    options: ["1♠", "1♦", "1♣", "Passo"],
  },
  {
    hand: "♠ K83  ♥ Q5  ♦ AKJ74  ♣ 962",
    hcp: 13, distribution: "3-2-5-3",
    correctBid: "1♦", explanation: "13 HCP, 5 quadri: si apre nel seme più lungo",
    options: ["1♦", "1♣", "Passo", "1NT"],
  },
  // === 1♣ (3 scenarios) ===
  {
    hand: "♠ QJ5  ♥ K84  ♦ A73  ♣ KJ62",
    hcp: 14, distribution: "3-3-3-4",
    correctBid: "1♣", explanation: "14 HCP, bilanciata 3-3-3-4: non 15-17 per 1NT, apri nel seme più lungo 1♣",
    options: ["1♣", "1NT", "1♦", "Passo"],
  },
  {
    hand: "♠ K42  ♥ Q73  ♦ A85  ♣ KJ94",
    hcp: 13, distribution: "3-3-3-4",
    correctBid: "1♣", explanation: "13 HCP, bilanciata 3-3-3-4: con 12-14 bilanciata apri nel più lungo, 1♣",
    options: ["1♣", "1♦", "1NT", "Passo"],
  },
  {
    hand: "♠ K53  ♥ A84  ♦ Q62  ♣ AJ73",
    hcp: 14, distribution: "3-3-3-4",
    correctBid: "1♣", explanation: "14 HCP, bilanciata 3-3-3-4: con i minori di 4 carte, apri 1♣ (FIGB)",
    options: ["1♣", "1♦", "1NT", "1♥"],
  },
  // === 2NT (2 scenarios, 20-21 HCP balanced) ===
  {
    hand: "♠ AKQ5  ♥ K3  ♦ AJ84  ♣ K72",
    hcp: 20, distribution: "4-2-4-3",
    correctBid: "2NT", explanation: "20 HCP, bilanciata: apri 2NT (20-21 bilanciata)",
    options: ["1♠", "2NT", "1NT", "2♣"],
  },
  {
    hand: "♠ AJ3  ♥ KQ84  ♦ AK5  ♣ QJ7",
    hcp: 20, distribution: "3-4-3-3",
    correctBid: "2NT", explanation: "20 HCP, bilanciata 3-4-3-3: troppo forte per 1NT (max 17), apri 2NT",
    options: ["1♥", "2NT", "2♣", "1NT"],
  },
  // === 2♣ (2 scenarios, 22+ HCP) ===
  {
    hand: "♠ AKJ5  ♥ AKQ3  ♦ AK2  ♣ 84",
    hcp: 24, distribution: "4-4-3-2",
    correctBid: "2♣", explanation: "24 HCP: mano fortissima, apri 2♣ forte convenzionale (22+ HCP)",
    options: ["2♣", "2NT", "1♠", "1♥"],
  },
  {
    hand: "♠ AK3  ♥ AQJ84  ♦ AK7  ♣ A5",
    hcp: 25, distribution: "3-5-3-2",
    correctBid: "2♣", explanation: "25 HCP: con 22+ punti si apre 2♣ (forte, artificiale, forzante)",
    options: ["2♣", "2NT", "1♥", "2♥"],
  },
];

const TOTAL_ROUNDS = 10;

type DichiaraDifficulty = "facile" | "medio" | "difficile";
const dichiaraDiffConfig = {
  facile: { showHCP: true, showDist: true, label: "Facile", desc: "Vedi HCP e distribuzione", xpMult: 0.8, color: "from-green-500 to-emerald-500", shadow: "shadow-green-400/30" },
  medio: { showHCP: true, showDist: false, label: "Medio", desc: "Vedi solo i HCP", xpMult: 1, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-400/30" },
  difficile: { showHCP: false, showDist: false, label: "Difficile", desc: "Conta tutto da solo!", xpMult: 1.5, color: "from-red-500 to-rose-500", shadow: "shadow-red-400/30" },
};

export default function DichiaraPage() {
  const profileConfig = useProfile();
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const [phase, setPhase] = useState<"menu" | "playing" | "gameover">("menu");
  const [dichiaraDiff, setDichiaraDiff] = useState<DichiaraDifficulty>("facile");
  const [roundIdx, setRoundIdx] = useState(0);
  const [usedScenarios, setUsedScenarios] = useState<HandScenario[]>([]);
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

  const dCfg = dichiaraDiffConfig[dichiaraDiff];

  const startGame = useCallback((diff?: DichiaraDifficulty) => {
    if (diff) setDichiaraDiff(diff);
    // Shuffle and pick 10 scenarios
    const shuffled = [...scenarios].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    setUsedScenarios(shuffled);
    setPhase("playing");
    setRoundIdx(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setShowFeedback(false);
    startTimer();
  }, []);

  const startTimer = () => {
    setTimer(0);
    startRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startRef.current) / 100));
    }, 100);
  };

  const handleAnswer = (bid: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const scenario = usedScenarios[roundIdx];
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
        const earned = Math.floor((20 + correct * 5 + (isCorrect ? 5 : 0)) * dCfg.xpMult);
        setXpEarned(earned);
        try {
          const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
          localStorage.setItem("bq_xp", String(prev + earned));
        } catch {}
      } else {
        setRoundIdx((r) => r + 1);
        startTimer();
      }
    }, 2000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const scenario = usedScenarios[roundIdx];

  if (phase === "menu") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link href="/gioca" className="hover:text-emerald transition-colors">Gioca</Link>
            <span>/</span>
            <span className="text-emerald font-semibold">Dichiara!</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-8">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-[#003DA5] text-white text-5xl shadow-xl shadow-[#003DA5]/20 mb-6">
              🗣️
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dichiara!</h1>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              Vedi una mano e scegli l'apertura corretta. Velocità e precisione!
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge className="bg-[#003DA5]/10 text-[#003DA5] text-xs font-bold border-0">{TOTAL_ROUNDS} mani</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 text-xs font-bold border-0">+20-70 {profileConfig.xpLabel}</Badge>
            </div>

            <div className="mt-6 bg-white card-clean rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-gray-900 mb-2">Regole di apertura FIGB</h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>12+ HCP: puoi aprire</li>
                <li>15-17 HCP bilanciata: apri 1NT</li>
                <li>20-21 HCP bilanciata: apri 2NT</li>
                <li>22+ HCP: apri 2♣ (forte convenzionale)</li>
                <li>Con 5+ carte in un seme: apri a quel colore</li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-gray-900 text-left">Scegli difficoltà</h3>
              {(Object.entries(dichiaraDiffConfig) as [DichiaraDifficulty, typeof dichiaraDiffConfig.facile][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg ${cfg.shadow} active:scale-[0.97] transition-transform`}
                >
                  <div className="text-left">
                    <p className="font-semibold">{cfg.label}</p>
                    <p className="text-white/70 text-sm">{cfg.desc}</p>
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
    const accuracy = Math.round((correct / TOTAL_ROUNDS) * 100);
    const stars = correct >= 9 ? 3 : correct >= 7 ? 2 : correct >= 4 ? 1 : 0;

    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
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
              {stars === 3 ? "Maestro!" : stars === 2 ? "Ottimo!" : stars === 1 ? "Non male!" : "Studia ancora!"}
            </h1>
            <p className="text-lg font-bold text-gray-500 mt-1">{correct}/{TOTAL_ROUNDS} corrette ({accuracy}%)</p>
            <p className="text-2xl font-bold text-[#003DA5] mt-2">{score} punti</p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-gray-900">{correct}</p>
                <p className="text-[10px] text-gray-400 font-bold">Corrette</p>
              </div>
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-gray-900">{bestStreak}</p>
                <p className="text-[10px] text-gray-400 font-bold">Streak max</p>
              </div>
              <div className="card-clean rounded-xl bg-white p-3">
                <p className="text-lg font-bold text-[#003DA5]">+{xpEarned}</p>
                <p className="text-[10px] text-gray-400 font-bold">{profileConfig.xpLabel}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link href="/gioca" className="flex-1">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold">Torna a Gioca</Button>
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

  // Playing
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
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#003DA5]"
                animate={{ width: `${((roundIdx + 1) / TOTAL_ROUNDS) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">{roundIdx + 1}/{TOTAL_ROUNDS}</span>
        </div>

        {/* Timer + Streak */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold tabular-nums text-gray-400">{(timer / 10).toFixed(1)}s</span>
          {streak > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-purple-50 rounded-full px-3 py-1">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-purple-600">x{streak}</span>
            </motion.div>
          )}
          <span className="text-sm font-bold text-[#003DA5]">{score} pts</span>
        </div>

        {scenario && (
          <>
            {/* Hand display */}
            <motion.div
              key={roundIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-clean rounded-2xl bg-white p-5 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400">Che apertura fai?</p>
                {(dCfg.showHCP || dCfg.showDist) && (
                  <Badge variant="outline" className="text-[10px] font-bold text-gray-400">
                    {dCfg.showHCP ? `${scenario.hcp} HCP` : ""}
                    {dCfg.showHCP && dCfg.showDist ? " · " : ""}
                    {dCfg.showDist ? scenario.distribution : ""}
                  </Badge>
                )}
              </div>
              <p className={`font-mono font-bold leading-relaxed tracking-wide ${
                profile === "senior" ? "text-xl" : "text-lg"
              }`}>
                {scenario.hand}
              </p>
            </motion.div>

            {/* Bid options */}
            <div className="grid grid-cols-2 gap-3">
              {scenario.options.map((bid) => {
                let btnClass = "bg-white card-clean hover:shadow-lg";
                if (showFeedback) {
                  if (bid === scenario.correctBid) {
                    btnClass = "bg-emerald-50 border-2 border-emerald-400 shadow-lg";
                  } else if (bid === selectedAnswer && !lastCorrect) {
                    btnClass = "bg-red-50 border-2 border-red-300";
                  } else {
                    btnClass = "bg-gray-50 opacity-50";
                  }
                }

                return (
                  <button
                    key={bid}
                    onClick={() => !showFeedback && handleAnswer(bid)}
                    disabled={showFeedback}
                    className={`rounded-2xl p-4 text-center transition-all active:scale-95 ${btnClass} ${
                      profile === "senior" ? "py-5" : ""
                    }`}
                  >
                    <p className={`font-bold ${profile === "senior" ? "text-2xl" : "text-xl"} ${
                      bid === "Passo" ? "text-gray-600" : "text-[#003DA5]"
                    }`}>
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
                  className={`mt-4 p-3 rounded-xl ${lastCorrect ? "bg-emerald-50" : "bg-red-50"}`}
                >
                  <p className={`text-sm font-bold ${lastCorrect ? "text-emerald-700" : "text-red-600"}`}>
                    {lastCorrect ? "Corretto!" : "Sbagliato!"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{scenario.explanation}</p>
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
                <h2 className="text-2xl font-semibold text-gray-900">Pausa</h2>
                <p className="text-sm text-gray-500 mt-2">Domanda {roundIdx + 1}/{TOTAL_ROUNDS} · {score} pts</p>
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={() => {
                      setPaused(false);
                      startRef.current = Date.now() - pausedElapsedRef.current;
                      timerRef.current = setInterval(() => {
                        setTimer(Math.floor((Date.now() - startRef.current) / 100));
                      }, 100);
                    }}
                    className="w-full h-12 rounded-xl bg-[#003DA5] font-semibold shadow-lg"
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
