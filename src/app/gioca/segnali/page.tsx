"use client";

/**
 * Segnali in Difesa — drill on defensive signaling, the most neglected
 * beginner skill: half the hands you play, you defend.
 *
 * Three scenario families (standard Italian methods):
 *  - gradimento: partner leads an honor → high card = "continua", low = "cambia"
 *  - conto:      declarer plays the suit → high-low = even, low-high = odd
 *  - lettura:    READ partner's signal and choose the right defense
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { CelebrationCombo } from "@/components/celebration-effects";
import { useSound } from "@/hooks/use-sound";
import { useGameStore } from "@/store/use-game-store";
import { useGameResults } from "@/hooks/use-game-results";

// ─── Card helpers (suit display identical to the other mini-games) ────────

type SuitKey = "spade" | "heart" | "diamond" | "club";
const SUITS: SuitKey[] = ["spade", "heart", "diamond", "club"];
const suitSymbols: Record<SuitKey, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};
const suitColors: Record<SuitKey, string> = {
  spade: "text-foreground",
  heart: "text-red-500 dark:text-red-400",
  diamond: "text-red-500 dark:text-red-400",
  club: "text-foreground",
};

const SPOTS = ["9", "8", "7", "6", "5", "4", "3", "2"] as const;
const rankOrder = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** n distinct spot cards (9..2), sorted high→low */
function randomSpots(n: number): string[] {
  const pool = [...SPOTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).sort((a, b) => rankOrder.indexOf(a) - rankOrder.indexOf(b));
}

// ─── Round model + generators ──────────────────────────────────────────────

type SignalKind = "gradimento" | "conto" | "lettura";

const KIND_LABELS: Record<SignalKind, string> = {
  gradimento: "Gradimento",
  conto: "Conto",
  lettura: "Leggi il segnale",
};

interface DrillRound {
  kind: SignalKind;
  /** Scenario lines shown above the question */
  scenario: string[];
  question: string;
  /** Your cards in the suit (shown big); card drills answer by tapping one */
  holding: { suit: SuitKey; ranks: string[] } | null;
  /** Text answers (lettura rounds); card rounds answer via holding */
  textOptions: string[] | null;
  /** Correct rank (card rounds) or option index (text rounds) */
  correctRank: string | null;
  correctIdx: number | null;
  explanation: string;
}

function genGradimento(): DrillRound {
  const suit = randomOf(SUITS);
  const sym = suitSymbols[suit];
  const positive = Math.random() < 0.5;

  if (positive) {
    const honor = randomOf(["K", "Q"] as const);
    const spots = randomSpots(2);
    const ranks = [honor, ...spots];
    return {
      kind: "gradimento",
      scenario: [
        `Difendi contro 4${suit === "spade" ? "♥" : "♠"}.`,
        `Il compagno attacca con l'A${sym}.`,
      ],
      question: `Quale carta giochi per dare il segnale giusto?`,
      holding: { suit, ranks },
      textOptions: null,
      correctRank: spots[0],
      correctIdx: null,
      explanation: `Con ${honor}${sym} in mano vuoi la continuazione: gioca la carta più alta che puoi permetterti (${spots[0]}${sym}). Carta alta = gradimento. L'onore non si gioca mai sotto l'Asso del compagno!`,
    };
  }

  const spots = randomSpots(3);
  return {
    kind: "gradimento",
    scenario: [
      `Difendi contro 4${suit === "spade" ? "♥" : "♠"}.`,
      `Il compagno attacca con l'A${sym}.`,
    ],
    question: `Quale carta giochi per dare il segnale giusto?`,
    holding: { suit, ranks: spots },
    textOptions: null,
    correctRank: spots[spots.length - 1],
    correctIdx: null,
    explanation: `Senza onori in ${sym} non vuoi la continuazione: gioca la carta più bassa (${spots[spots.length - 1]}${sym}). Carta bassa = non gradimento, il compagno cambierà colore.`,
  };
}

function genConto(): DrillRound {
  const suit = randomOf(SUITS);
  const sym = suitSymbols[suit];
  const even = Math.random() < 0.5;
  const spots = randomSpots(even ? 4 : 3);
  const correct = even ? spots[0] : spots[spots.length - 1];

  return {
    kind: "conto",
    scenario: [
      `Difendi contro 3NT.`,
      `Il dichiarante gioca ${sym} dal morto: tocca a te, non puoi vincere la presa.`,
    ],
    question: `Quale carta giochi per dare il conto al compagno?`,
    holding: { suit, ranks: spots },
    textOptions: null,
    correctRank: correct,
    correctIdx: null,
    explanation: even
      ? `Hai ${spots.length} carte (numero PARI): inizia con la carta alta (${correct}${sym}), poi la più bassa. Alto-basso = pari.`
      : `Hai ${spots.length} carte (numero DISPARI): inizia con la carta più bassa (${correct}${sym}). Basso-alto = dispari.`,
  };
}

function genLettura(): DrillRound {
  const suit = randomOf(SUITS);
  const sym = suitSymbols[suit];
  const variant = Math.floor(Math.random() * 4);

  if (variant === 0 || variant === 1) {
    // Attitude reading: partner plays high (continue) or low (switch)
    const likes = variant === 0;
    const card = likes ? randomOf(["9", "8"] as const) : randomOf(["2", "3"] as const);
    return {
      kind: "lettura",
      scenario: [
        `Attacchi con l'A${sym} da A-K-7-3-2.`,
        `Il compagno gioca il ${card}${sym}, il dichiarante segue basso.`,
      ],
      question: `Come continui la difesa?`,
      holding: null,
      textOptions: [`Continuo con il K${sym}`, `Cambio colore`],
      correctRank: null,
      correctIdx: likes ? 0 : 1,
      explanation: likes
        ? `Il ${card}${sym} è una carta alta: gradimento! Il compagno ha un onore o vuole tagliare. Continua con il K${sym}.`
        : `Il ${card}${sym} è una carta bassa: non gradimento. Insistere regala una presa: meglio cambiare colore.`,
    };
  }

  // Count reading: high-low = even, low-high = odd
  const even = variant === 2;
  const high = randomOf(["8", "7"] as const);
  const first = even ? high : "2";
  const second = even ? "2" : high;
  return {
    kind: "lettura",
    scenario: [
      `Il dichiarante incassa A e K di ${sym}.`,
      `Il compagno gioca prima il ${first}${sym}, poi il ${second}${sym}.`,
    ],
    question: `Quante carte di ${sym} aveva il compagno?`,
    holding: null,
    textOptions: [`Un numero pari (alto-basso)`, `Un numero dispari (basso-alto)`],
    correctRank: null,
    correctIdx: even ? 0 : 1,
    explanation: even
      ? `${first} poi ${second}: alto-basso = numero PARI di carte. Conta la distribuzione del colore prima di decidere cosa tenere!`
      : `${first} poi ${second}: basso-alto = numero DISPARI di carte. Il conto ti dice quante carte ha il dichiarante.`,
  };
}

type Difficulty = "facile" | "medio" | "difficile";
const difficultyConfig: Record<
  Difficulty,
  { rounds: number; kinds: SignalKind[]; label: string; sub: string; xpMult: number; color: string; shadow: string }
> = {
  facile: {
    rounds: 8,
    kinds: ["gradimento"],
    label: "Facile",
    sub: "Solo gradimento",
    xpMult: 0.8,
    color: "from-green-500 to-emerald-500",
    shadow: "shadow-green-400/30",
  },
  medio: {
    rounds: 10,
    kinds: ["gradimento", "conto"],
    label: "Medio",
    sub: "Gradimento + conto",
    xpMult: 1,
    color: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-400/30",
  },
  difficile: {
    rounds: 12,
    kinds: ["gradimento", "conto", "lettura"],
    label: "Difficile",
    sub: "Anche leggere i segnali del compagno",
    xpMult: 1.5,
    color: "from-red-500 to-rose-500",
    shadow: "shadow-red-400/30",
  },
};

function genRound(kinds: SignalKind[]): DrillRound {
  const kind = randomOf(kinds);
  if (kind === "gradimento") return genGradimento();
  if (kind === "conto") return genConto();
  return genLettura();
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SegnaliPage() {
  const profileConfig = useProfile();
  const { play } = useSound();
  const { saveGameResult } = useGameResults();
  const [showCelebration, setShowCelebration] = useState(false);
  const [phase, setPhase] = useState<"menu" | "playing" | "gameover">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [current, setCurrent] = useState<DrillRound | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState<string | number | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const config = difficultyConfig[difficulty];

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setPhase("playing");
    setRound(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setAnswered(null);
    setCurrent(genRound(difficultyConfig[diff].kinds));
  }, []);

  const finishGame = useCallback(
    (finalScore: number, finalCorrect: number, finalBestStreak: number) => {
      setPhase("gameover");
      play("success");
      setShowCelebration(true);
      const cfg = difficultyConfig[difficulty];
      const earned = Math.floor((Math.floor(finalScore / 50) + 20) * cfg.xpMult);
      setXpEarned(earned);
      useGameStore.getState().addXp(earned);
      saveGameResult({
        gameType: "segnali",
        score: earned,
        details: {
          rounds: cfg.rounds,
          correct: finalCorrect,
          bestStreak: finalBestStreak,
          difficulty,
        },
      });
    },
    [difficulty, play, saveGameResult]
  );

  const handleAnswer = useCallback(
    (answer: string | number) => {
      if (!current || answered !== null) return;
      setAnswered(answer);
      const isCorrect =
        current.correctRank !== null
          ? answer === current.correctRank
          : answer === current.correctIdx;
      setLastCorrect(isCorrect);

      let newScore = score;
      let newStreak = streak;
      let newBest = bestStreak;
      let newCorrect = correctCount;
      if (isCorrect) {
        play("trickWon");
        newStreak = streak + 1;
        newBest = Math.max(bestStreak, newStreak);
        newScore = score + 100 + streak * 15;
        newCorrect = correctCount + 1;
      } else {
        play("error");
        newStreak = 0;
      }
      setScore(newScore);
      setStreak(newStreak);
      setBestStreak(newBest);
      setCorrectCount(newCorrect);

      // Reveal the explanation, then advance after a beat (longer when wrong)
      setTimeout(
        () => {
          if (round >= config.rounds) {
            finishGame(newScore, newCorrect, newBest);
          } else {
            setRound((r) => r + 1);
            setAnswered(null);
            setCurrent(genRound(config.kinds));
          }
        },
        isCorrect ? 2400 : 3600
      );
    },
    [current, answered, score, streak, bestStreak, correctCount, round, config, play, finishGame]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset della celebrazione sincronizzato al cambio di fase di gioco: non derivabile senza duplicare lo stato
    setShowCelebration(false);
  }, [phase]);

  // ── Menu ──
  if (phase === "menu") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link href="/gioca" className="hover:text-emerald transition-colors">
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">Segnali in Difesa</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-5xl shadow-xl shadow-violet-400/30 mb-6">
              📡
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Segnali in Difesa</h1>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
              In difesa si parla con le carte: impara a dare (e leggere) i segnali del compagno.
            </p>
            <div className="mt-6 bg-card card-clean rounded-2xl p-4 text-left">
              <h3 className="font-bold text-sm text-foreground mb-2">Le regole d&apos;oro</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>
                  <span className="font-bold text-foreground/80">Gradimento:</span> carta alta = «continua», carta bassa = «cambia colore»
                </li>
                <li>
                  <span className="font-bold text-foreground/80">Conto:</span> alto-basso = numero pari, basso-alto = dispari
                </li>
                <li>
                  <span className="font-bold text-foreground/80">Mai</span> sprecare un onore per segnalare
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm text-foreground text-left">Scegli difficoltà</h3>
              {(Object.entries(difficultyConfig) as [Difficulty, (typeof difficultyConfig)["facile"]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => startGame(key)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg ${cfg.shadow} active:scale-[0.97] transition-transform`}
                  >
                    <div className="text-left">
                      <p className="font-semibold">{cfg.label}</p>
                      <p className="text-white/70 text-sm">
                        {cfg.rounds} situazioni · {cfg.sub}
                      </p>
                    </div>
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="9,6 15,12 9,18" />
                    </svg>
                  </button>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Game over ──
  if (phase === "gameover") {
    const accuracy = Math.round((correctCount / config.rounds) * 100);
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
    return (
      <div className="pt-6 px-5 pb-24">
        <CelebrationCombo trigger={showCelebration} type={stars >= 3 ? "epic" : stars >= 2 ? "medium" : "small"} />
        <div className="mx-auto max-w-6xl text-center">
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

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {stars === 3 ? "Difensore d'élite!" : stars === 2 ? "Ottima intesa!" : stars === 1 ? "Buon inizio!" : "Riprova!"}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-violet-500 mt-2">{score} punti</p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="card-clean rounded-xl bg-card p-3">
                <p className="text-lg font-bold text-foreground">
                  {correctCount}/{config.rounds}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold">Corrette</p>
              </div>
              <div className="card-clean rounded-xl bg-card p-3">
                <p className="text-lg font-bold text-foreground">{bestStreak}</p>
                <p className="text-[10px] text-muted-foreground font-bold">Streak max</p>
              </div>
              <div className="card-clean rounded-xl bg-card p-3">
                <p className="text-lg font-bold text-violet-500">+{xpEarned}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{profileConfig.xpLabel}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link href="/gioca" className="flex-1">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold">
                  Torna a Gioca
                </Button>
              </Link>
              <Button
                onClick={() => startGame(difficulty)}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 font-bold shadow-lg"
              >
                Rigioca
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (!current) return null;
  const showFeedback = answered !== null;

  return (
    <div className="pt-4 px-5 pb-24">
      <div className="mx-auto max-w-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/gioca"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            aria-label="Esci dal gioco"
          >
            ✕
          </Link>
          <div className="flex-1 mx-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                animate={{ width: `${(round / config.rounds) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {round}/{config.rounds}
          </span>
        </div>

        {/* Streak + score */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-[11px] font-bold text-violet-600 dark:text-violet-400">
            {KIND_LABELS[current.kind]}
          </span>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 rounded-full px-3 py-1"
            >
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">x{streak}</span>
            </motion.div>
          )}
          <div className="text-sm font-bold text-violet-500">{score} pts</div>
        </div>

        {/* Scenario card */}
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-clean rounded-2xl bg-card p-5 mb-4"
        >
          <div className="space-y-1">
            {current.scenario.map((line, i) => (
              <p key={i} className="text-sm text-foreground/80">
                {line}
              </p>
            ))}
          </div>

          {current.holding && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`${suitColors[current.holding.suit]} text-2xl font-bold`}>
                {suitSymbols[current.holding.suit]}
              </span>
              <span className="text-2xl font-bold tracking-[0.3em] text-foreground">
                {current.holding.ranks.join(" ")}
              </span>
            </div>
          )}

          <p className="mt-4 text-center text-xs font-bold text-muted-foreground">{current.question}</p>
        </motion.div>

        {/* Answers: cards or text */}
        {current.holding && (
          <div className="grid grid-cols-3 gap-3">
            {current.holding.ranks.map((rank) => {
              const isCorrect = rank === current.correctRank;
              const isPicked = answered === rank;
              return (
                <button
                  key={rank}
                  onClick={() => handleAnswer(rank)}
                  disabled={showFeedback}
                  className={`card-clean rounded-2xl p-4 text-center transition-all ${
                    showFeedback
                      ? isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-400"
                        : isPicked
                          ? "bg-red-50 dark:bg-red-950/40 ring-2 ring-red-400"
                          : "bg-card opacity-50"
                      : "bg-card active:scale-95 hover:shadow-lg"
                  }`}
                >
                  <p className={`text-2xl font-bold ${suitColors[current.holding!.suit]}`}>
                    {rank}
                    {suitSymbols[current.holding!.suit]}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {current.textOptions && (
          <div className="space-y-2">
            {current.textOptions.map((opt, i) => {
              const isCorrect = i === current.correctIdx;
              const isPicked = answered === i;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showFeedback}
                  className={`card-clean w-full rounded-2xl p-4 text-left text-sm font-semibold transition-all ${
                    showFeedback
                      ? isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-400 text-emerald-800 dark:text-emerald-300"
                        : isPicked
                          ? "bg-red-50 dark:bg-red-950/40 ring-2 ring-red-400 text-red-700 dark:text-red-300"
                          : "bg-card opacity-50 text-muted-foreground"
                      : "bg-card text-foreground/80 active:scale-[0.98] hover:shadow-lg"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback + explanation */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 rounded-2xl border p-4 ${
                lastCorrect ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900" : "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900"
              }`}
            >
              <p className={`text-sm font-bold ${lastCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>
                {lastCorrect ? "Segnale perfetto!" : "Segnale sbagliato"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{current.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
