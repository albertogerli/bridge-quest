"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";

// Card pairs for bridge memory - match card with its bridge concept
interface MemoryCard {
  id: number;
  content: string;
  pairId: number;
  type: "card" | "concept";
}

interface GamePair {
  card: string;
  concept: string;
}

const ALL_PAIRS: GamePair[] = [
  { card: "A♠ K♠ Q♠ J♠", concept: "100 Onori" },
  { card: "1SA", concept: "15-17 PC bilanciata" },
  { card: "2♣", concept: "Apertura forte" },
  { card: "4♠", concept: "Manche a colore M" },
  { card: "3SA", concept: "Manche a SA" },
  { card: "A K Q J 10", concept: "10 PC + 2 vincenti" },
  { card: "Stayman", concept: "Risposta 2♣ a 1SA" },
  { card: "x x x x x", concept: "Colore affrancabile" },
  { card: "A Q", concept: "Impasse" },
  { card: "Pass", concept: "0-5 PC" },
  { card: "1♥", concept: "Apertura 12+ PC 5+ cuori" },
  { card: "Contre", concept: "Punitivo o informativo" },
  { card: "6SA", concept: "Piccolo Slam" },
  { card: "7♠", concept: "Grande Slam" },
  { card: "K J 10 9", concept: "Sequenza da K" },
  { card: "2SA", concept: "Risposta 11-12 PC a 1SA" },
];

type GamePhase = "menu" | "playing" | "gameover";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryPage() {
  const prof = useProfile();
  const isSenior = prof.profile === "senior";
  const isGiovane = prof.profile === "giovane";

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<4 | 6 | 8>(6);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showMismatch, setShowMismatch] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lockRef = useRef(false);

  // Load best time
  useEffect(() => {
    try {
      const bt = localStorage.getItem("bq_memory_best");
      if (bt) setBestTime(parseInt(bt, 10));
    } catch {}
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "playing" && matched.length < cards.length) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase, matched.length, cards.length]);

  const startGame = useCallback((diff: 4 | 6 | 8) => {
    setDifficulty(diff);
    const pairs = shuffleArray(ALL_PAIRS).slice(0, diff);
    const memoryCards: MemoryCard[] = [];
    pairs.forEach((pair, i) => {
      memoryCards.push({ id: i * 2, content: pair.card, pairId: i, type: "card" });
      memoryCards.push({ id: i * 2 + 1, content: pair.concept, pairId: i, type: "concept" });
    });
    setCards(shuffleArray(memoryCards));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimer(0);
    setStreak(0);
    setMaxStreak(0);
    setShowMismatch(false);
    lockRef.current = false;
    setPhase("playing");
  }, []);

  const handleCardClick = useCallback((cardId: number) => {
    if (lockRef.current) return;
    if (flipped.includes(cardId) || matched.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves((m) => m + 1);

      const [first, second] = newFlipped;
      const card1 = cards.find((c) => c.id === first)!;
      const card2 = cards.find((c) => c.id === second)!;

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match!
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setStreak((s) => {
          const ns = s + 1;
          setMaxStreak((ms) => Math.max(ms, ns));
          return ns;
        });
        setFlipped([]);
        lockRef.current = false;

        // Check game over
        if (newMatched.length === cards.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Save XP
          try {
            const xp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
            const earned = getXP(cards.length / 2, moves + 1, timer);
            localStorage.setItem("bq_xp", String(xp + earned));
            // Save best time
            const currentBest = localStorage.getItem("bq_memory_best");
            if (!currentBest || timer < parseInt(currentBest, 10)) {
              localStorage.setItem("bq_memory_best", String(timer));
              setBestTime(timer);
            }
          } catch {}
          setTimeout(() => setPhase("gameover"), 600);
        }
      } else {
        // Mismatch
        setShowMismatch(true);
        setStreak(0);
        setTimeout(() => {
          setFlipped([]);
          setShowMismatch(false);
          lockRef.current = false;
        }, isSenior ? 1200 : 800);
      }
    }
  }, [flipped, matched, cards, moves, timer, isSenior]);

  const getXP = (pairs: number, totalMoves: number, time: number): number => {
    let xp = pairs * 10; // base
    const perfect = pairs; // minimum moves = pairs
    const efficiency = Math.max(0, 1 - (totalMoves - perfect) / (perfect * 3));
    xp += Math.round(efficiency * 30);
    // Speed bonus
    if (time < pairs * 8) xp += 20;
    else if (time < pairs * 15) xp += 10;
    return xp;
  };

  const getStars = (): number => {
    const pairs = cards.length / 2;
    const perfect = pairs;
    if (moves <= perfect + 2) return 3;
    if (moves <= perfect * 2) return 2;
    return 1;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // --- MENU ---
  if (phase === "menu") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          <Link href="/gioca" className="inline-flex items-center gap-1.5 text-sm text-gray-400 font-bold mb-4">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15,18 9,12 15,6"/></svg>
            Gioca
          </Link>

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[#003DA5] text-4xl shadow-lg shadow-[#003DA5]/20 mb-4">
                🧠
              </div>
              <h1 className={`font-bold text-gray-900 ${isSenior ? "text-3xl" : "text-2xl"}`}>
                Memory Bridge
              </h1>
              <p className={`text-gray-500 mt-2 ${isSenior ? "text-base" : "text-sm"}`}>
                Abbina le carte ai concetti del bridge!
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card-clean rounded-2xl bg-white p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Come si gioca</h3>
              <ul className={`space-y-2 text-gray-600 ${isSenior ? "text-base" : "text-sm"}`}>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">1.</span>
                  Tocca una carta per girarla
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">2.</span>
                  Trova le coppie: carta ↔ concetto
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">3.</span>
                  Meno mosse fai, più {prof.xpLabel} guadagni!
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="card-clean rounded-2xl bg-white p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Scegli difficoltà</h3>
              <div className="space-y-2">
                {([
                  { diff: 4 as const, label: "Facile", desc: "4 coppie (8 carte)", color: "from-green-500 to-emerald-500", shadow: "shadow-green-400/30" },
                  { diff: 6 as const, label: "Medio", desc: "6 coppie (12 carte)", color: "from-amber-500 to-orange-500", shadow: "shadow-amber-400/30" },
                  { diff: 8 as const, label: "Difficile", desc: "8 coppie (16 carte)", color: "from-red-500 to-rose-500", shadow: "shadow-red-400/30" },
                ]).map(({ diff, label, desc, color, shadow }) => (
                  <button
                    key={diff}
                    onClick={() => startGame(diff)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg ${shadow} active:scale-[0.97] transition-transform ${isSenior ? "text-lg" : ""}`}
                  >
                    <div className="text-left">
                      <p className="font-semibold">{label}</p>
                      <p className="text-white/70 text-sm">{desc}</p>
                    </div>
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {bestTime !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="text-center text-sm text-gray-400 font-bold">
                ⏱️ Miglior tempo: {formatTime(bestTime)}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // --- PLAYING ---
  if (phase === "playing") {
    const pairs = cards.length / 2;
    const matchedPairs = matched.length / 2;
    const cols = difficulty <= 4 ? 2 : difficulty <= 6 ? 3 : 4;

    return (
      <div className="pt-4 px-4 pb-24">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/gioca" className="inline-flex items-center gap-1 text-sm text-gray-400 font-bold">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15,18 9,12 15,6"/></svg>
              Esci
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <span>🎯</span> {matchedPairs}/{pairs}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <span>👆</span> {moves}
              </div>
              <div className={`flex items-center gap-1.5 text-sm font-bold ${timer > pairs * 20 ? "text-red-500" : "text-gray-600"}`}>
                <span>⏱️</span> {formatTime(timer)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-[#003DA5]"
              animate={{ width: `${(matchedPairs / pairs) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>

          {/* Streak indicator */}
          {streak >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-3"
            >
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-bold">
                🔥 Streak x{streak}!
              </span>
            </motion.div>
          )}

          {/* Card grid */}
          <div className={`grid gap-2 ${
            cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4"
          }`}>
            <AnimatePresence>
              {cards.map((card) => {
                const isFlipped = flipped.includes(card.id);
                const isMatched = matched.includes(card.id);
                const isWrong = showMismatch && flipped.includes(card.id) && !isMatched;
                const faceUp = isFlipped || isMatched;

                return (
                  <motion.button
                    key={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                    animate={{
                      opacity: isMatched ? 0.6 : 1,
                      scale: isMatched ? 0.95 : 1,
                      rotateY: faceUp ? 0 : 180,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={() => handleCardClick(card.id)}
                    disabled={isMatched}
                    className={`relative aspect-[3/4] rounded-xl font-bold transition-colors overflow-hidden ${
                      isSenior ? "text-sm" : "text-xs"
                    } ${
                      isMatched
                        ? "bg-emerald-50 border-2 border-emerald-300"
                        : isWrong
                          ? "bg-red-50 border-2 border-red-300"
                          : faceUp
                            ? card.type === "card"
                              ? "bg-white border-2 border-purple-300 shadow-lg shadow-purple-200/50"
                              : "bg-white border-2 border-[#003DA5]/20 shadow-lg shadow-[#003DA5]/20"
                            : "bg-[#003DA5] border-2 border-[#003DA5]/60 shadow-md cursor-pointer active:scale-95"
                    }`}
                    style={{ perspective: 1000 }}
                  >
                    {faceUp ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5 gap-1">
                        {/* Type indicator */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          card.type === "card"
                            ? "bg-purple-50 text-purple-500"
                            : "bg-[#003DA5]/10 text-[#003DA5]"
                        }`}>
                          {card.type === "card" ? "🃏 Carta" : "📖 Concetto"}
                        </span>
                        <span className={`text-center leading-tight ${
                          isSenior ? "text-sm" : "text-[11px]"
                        } ${isMatched ? "text-emerald-700" : "text-gray-800"} font-semibold`}>
                          {card.content}
                        </span>
                        {isMatched && <span className="text-lg">✓</span>}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl text-white/80">🂠</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Hint for senior */}
          {isSenior && matchedPairs === 0 && moves <= 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center text-sm text-gray-400 mt-4"
            >
              💡 Gira due carte per trovare la coppia carta-concetto
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  // --- GAME OVER ---
  const pairs = cards.length / 2;
  const earned = getXP(pairs, moves, timer);
  const stars = getStars();

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center"
        >
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2 + s * 0.15, type: "spring" }}
                className={`text-4xl ${s <= stars ? "" : "opacity-20 grayscale"}`}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`font-bold text-gray-900 mb-2 ${isSenior ? "text-3xl" : "text-2xl"}`}
          >
            {stars === 3 ? "Memoria Perfetta!" : stars === 2 ? "Ottimo lavoro!" : "Completato!"}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-50 text-purple-600 font-bold text-lg">
              +{earned} {prof.xpLabel}
            </span>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <div className="card-clean rounded-2xl bg-white p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">⏱️</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatTime(timer)}</p>
                  <p className="text-[11px] text-gray-500 font-medium">Tempo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">👆</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{moves}</p>
                  <p className="text-[11px] text-gray-500 font-medium">Mosse</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">🔥</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{maxStreak}</p>
                  <p className="text-[11px] text-gray-500 font-medium">Max streak</p>
                </div>
              </div>
              {/* Efficiency */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Efficienza</span>
                  <span className="font-bold text-gray-900">
                    {Math.round((pairs / moves) * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full bg-[#003DA5]"
                    style={{ width: `${Math.min(100, Math.round((pairs / moves) * 100))}%` }}
                  />
                </div>
              </div>
              {bestTime !== null && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-400 font-bold">
                    🏆 Miglior tempo: {formatTime(bestTime)}
                    {timer <= bestTime && timer > 0 && " — Nuovo record!"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6 space-y-3"
          >
            <button
              onClick={() => startGame(difficulty)}
              className={`w-full py-4 rounded-2xl bg-[#003DA5] text-white font-semibold shadow-lg shadow-[#003DA5]/20 active:scale-[0.97] transition-transform ${isSenior ? "text-lg" : ""}`}
            >
              Gioca ancora
            </button>
            <Link href="/gioca" className="block">
              <button className={`w-full py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold active:scale-[0.97] transition-transform ${isSenior ? "text-lg" : ""}`}>
                Torna al menu
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
