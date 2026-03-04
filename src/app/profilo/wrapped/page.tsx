"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { shareContent } from "@/lib/share";

interface GameRecord {
  date: string;
  contract: string;
  declarer: string;
  tricksMade: number;
  tricksNeeded: number;
  result: number;
  course: string;
  lessonId: string;
}

interface MonthStats {
  handsPlayed: number;
  winRate: number;
  favoriteContract: string;
  bestScore: { score: number; date: string; contract: string };
  xpGained: number;
  streakBest: number;
  favoriteDay: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

const GRADIENTS = [
  "from-indigo-600 to-indigo-800",
  "from-purple-600 to-purple-800",
  "from-blue-600 to-blue-800",
  "from-amber-600 to-amber-800",
  "from-emerald-600 to-emerald-800",
  "from-rose-600 to-rose-800",
  "from-cyan-600 to-cyan-800",
];

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const DAY_NAMES = [
  "Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"
];

function getContractType(contract: string): string {
  const upper = contract.toUpperCase();
  if (upper.includes("NT") || upper.includes("SA")) return "SA";
  if (upper.includes("♠") || upper.includes("S")) return "♠";
  if (upper.includes("♥") || upper.includes("H")) return "♥";
  if (upper.includes("♦") || upper.includes("D")) return "♦";
  if (upper.includes("♣") || upper.includes("C")) return "♣";
  return "SA";
}

function calculateMonthStats(records: GameRecord[]): MonthStats | null {
  if (records.length === 0) return null;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Filter current month
  const currentMonthRecords = records.filter((r) => {
    const date = new Date(r.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Filter last month for comparison
  const lastMonthRecords = records.filter((r) => {
    const date = new Date(r.date);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });

  if (currentMonthRecords.length === 0) return null;

  const handsPlayed = currentMonthRecords.length;

  // Win rate
  const wins = currentMonthRecords.filter((r) => r.result >= 0).length;
  const winRate = Math.round((wins / handsPlayed) * 100);

  // Trend vs last month
  let trend: "up" | "down" | "stable" = "stable";
  let trendValue = 0;
  if (lastMonthRecords.length > 0) {
    const lastMonthWins = lastMonthRecords.filter((r) => r.result >= 0).length;
    const lastMonthWinRate = Math.round((lastMonthWins / lastMonthRecords.length) * 100);
    trendValue = winRate - lastMonthWinRate;
    if (trendValue > 5) trend = "up";
    else if (trendValue < -5) trend = "down";
  }

  // Favorite contract (most played type)
  const contractCounts: Record<string, number> = {};
  for (const r of currentMonthRecords) {
    const type = getContractType(r.contract);
    contractCounts[type] = (contractCounts[type] || 0) + 1;
  }
  const favoriteContract = Object.keys(contractCounts).reduce((a, b) =>
    contractCounts[a] > contractCounts[b] ? a : b
  );

  // Best score
  const sorted = [...currentMonthRecords].sort((a, b) => b.result - a.result);
  const best = sorted[0];
  const bestScore = {
    score: best.result,
    date: best.date,
    contract: best.contract,
  };

  // XP gained (estimate: 10 per hand played + 5 bonus per win)
  const xpGained = handsPlayed * 10 + wins * 5;

  // Streak (from localStorage or compute)
  let streakBest = 0;
  try {
    const stored = localStorage.getItem("bq_streak_best");
    if (stored) streakBest = parseInt(stored, 10);
    else {
      const currentStreak = localStorage.getItem("bq_streak");
      if (currentStreak) streakBest = parseInt(currentStreak, 10);
    }
  } catch {}

  // Favorite day (most active weekday)
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of currentMonthRecords) {
    const date = new Date(r.date);
    dayCounts[date.getDay()]++;
  }
  const favDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const favoriteDay = DAY_NAMES[favDayIndex];

  return {
    handsPlayed,
    winRate,
    favoriteContract,
    bestScore,
    xpGained,
    streakBest,
    favoriteDay,
    trend,
    trendValue,
  };
}

export default function WrappedPage() {
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bq_game_history");
      if (raw) {
        const records: GameRecord[] = JSON.parse(raw);
        const computed = calculateMonthStats(records);
        setStats(computed);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasStarted || currentCard >= 7) return;

    const timer = setTimeout(() => {
      setCurrentCard((prev) => prev + 1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentCard, hasStarted]);

  const handleShare = async () => {
    if (!stats) return;
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];
    const text = `🃏 Il mio Bridge Wrapped - ${monthName} ${now.getFullYear()}\n${stats.handsPlayed} mani giocate\n${stats.winRate}% vittorie\n${stats.xpGained} XP guadagnati\nGioca anche tu su bridgelab.it`;

    const outcome = await shareContent("Bridge Wrapped", text);

    // Show feedback
    if (outcome === "clipboard") {
      alert("Statistiche copiate negli appunti!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 p-6 text-white">
        <div className="card-clean max-w-md rounded-2xl bg-white/10 p-8 text-center backdrop-blur">
          <div className="mb-4 text-6xl">🃏</div>
          <h1 className="mb-4 text-3xl font-bold">Nessuna Statistica</h1>
          <p className="mb-6 text-lg text-white/80">
            Gioca qualche mano per sbloccare il tuo Wrapped!
          </p>
          <Link
            href="/gioca"
            className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600 transition hover:bg-white/90"
          >
            Inizia a Giocare
          </Link>
        </div>
        <Link
          href="/profilo"
          className="mt-8 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al Profilo
        </Link>
      </div>
    );
  }

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  // Opening screen
  if (!hasStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 p-6 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-6 text-7xl">🃏</div>
          <h1 className="mb-4 text-5xl font-bold">Il Tuo Mese di Bridge</h1>
          <p className="mb-8 text-2xl text-white/80">{monthName} {now.getFullYear()}</p>
          <button
            onClick={() => setHasStarted(true)}
            className="rounded-xl bg-white px-8 py-4 text-xl font-semibold text-indigo-600 transition hover:bg-white/90"
          >
            Scopri le Statistiche
          </button>
        </motion.div>
        <Link
          href="/profilo"
          className="mt-12 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al Profilo
        </Link>
      </div>
    );
  }

  // Card content definitions
  const cards = [
    {
      title: "Hai giocato",
      value: stats.handsPlayed,
      suffix: stats.handsPlayed === 1 ? "mano" : "mani",
      subtitle: `questo mese`,
      gradient: GRADIENTS[0],
    },
    {
      title: "Percentuale di vittoria",
      value: stats.winRate,
      suffix: "%",
      subtitle: stats.trend === "up"
        ? `+${stats.trendValue}% rispetto al mese scorso`
        : stats.trend === "down"
        ? `${stats.trendValue}% rispetto al mese scorso`
        : "Stabile rispetto al mese scorso",
      gradient: GRADIENTS[1],
      icon: stats.trend === "up" ? "up" : stats.trend === "down" ? "down" : "stable",
    },
    {
      title: "Il tuo contratto preferito",
      value: stats.favoriteContract,
      suffix: "",
      subtitle: "Il tipo di contratto più giocato",
      gradient: GRADIENTS[2],
    },
    {
      title: "Miglior punteggio",
      value: stats.bestScore.score > 0 ? `+${stats.bestScore.score}` : stats.bestScore.score,
      suffix: "",
      subtitle: `${stats.bestScore.contract} - ${new Date(stats.bestScore.date).toLocaleDateString("it-IT")}`,
      gradient: GRADIENTS[3],
    },
    {
      title: "XP guadagnati",
      value: stats.xpGained,
      suffix: "",
      subtitle: "Punti esperienza del mese",
      gradient: GRADIENTS[4],
    },
    {
      title: "Streak record",
      value: stats.streakBest,
      suffix: stats.streakBest === 1 ? "giorno" : "giorni",
      subtitle: "La tua serie migliore",
      gradient: GRADIENTS[5],
    },
    {
      title: "Il tuo giorno preferito",
      value: stats.favoriteDay,
      suffix: "",
      subtitle: "Giorno della settimana più attivo",
      gradient: GRADIENTS[6],
    },
  ];

  const isLastCard = currentCard >= 7;

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-indigo-600 to-purple-800">
      {/* Back button */}
      <div className="absolute left-4 top-4 z-10">
        <Link
          href="/profilo"
          className="flex items-center gap-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Profilo</span>
        </Link>
      </div>

      {/* Progress dots */}
      <div className="absolute left-1/2 top-6 z-10 flex -translate-x-1/2 gap-2">
        {cards.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 w-2 rounded-full transition-all ${
              idx === currentCard
                ? "w-8 bg-white"
                : idx < currentCard
                ? "bg-white/60"
                : "bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-1 items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!isLastCard && currentCard < cards.length && (
            <motion.div
              key={currentCard}
              initial={{ opacity: 0, x: 100, rotateY: -90 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -100, rotateY: 90 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="relative w-full max-w-lg"
              onClick={() => setCurrentCard((prev) => Math.min(prev + 1, 7))}
            >
              <div
                className={`card-clean relative overflow-hidden rounded-2xl bg-gradient-to-br ${cards[currentCard].gradient} p-12 text-white shadow-2xl`}
              >
                {/* Decorative suits background */}
                {SUIT_SYMBOLS.map((suit, idx) => (
                  <div
                    key={idx}
                    className="absolute text-white/10"
                    style={{
                      fontSize: "8rem",
                      left: `${15 + idx * 25}%`,
                      top: `${20 + (idx % 2) * 40}%`,
                      transform: `rotate(${idx * 30}deg)`,
                    }}
                  >
                    {suit}
                  </div>
                ))}

                <div className="relative z-10">
                  <h2 className="mb-6 text-2xl font-semibold text-white/90">
                    {cards[currentCard].title}
                  </h2>

                  {cards[currentCard].icon && (
                    <div className="mb-4">
                      {cards[currentCard].icon === "up" && (
                        <TrendingUp className="h-12 w-12 text-green-300" />
                      )}
                      {cards[currentCard].icon === "down" && (
                        <TrendingDown className="h-12 w-12 text-red-300" />
                      )}
                      {cards[currentCard].icon === "stable" && (
                        <Minus className="h-12 w-12 text-white/60" />
                      )}
                    </div>
                  )}

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                    className="mb-4"
                  >
                    <div className="text-7xl font-bold">
                      <CountUp value={cards[currentCard].value} />
                      {cards[currentCard].suffix && (
                        <span className="ml-2 text-5xl">{cards[currentCard].suffix}</span>
                      )}
                    </div>
                  </motion.div>

                  <p className="text-lg text-white/80">
                    {cards[currentCard].subtitle}
                  </p>
                </div>

                {/* Tap hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.5 }}
                  className="absolute bottom-6 right-6 text-sm text-white/60"
                >
                  Tocca per continuare
                </motion.div>
              </div>
            </motion.div>
          )}

          {isLastCard && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="w-full max-w-lg"
            >
              <div className="card-clean rounded-2xl bg-white p-8 shadow-2xl">
                <div className="mb-6 text-center text-4xl">🏆</div>
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
                  Il Tuo {monthName} in Numeri
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Mani giocate</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {stats.handsPlayed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Percentuale vittoria</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {stats.winRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Contratto preferito</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.favoriteContract}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600">XP guadagnati</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {stats.xpGained}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Streak record</span>
                    <span className="text-2xl font-bold text-amber-600">
                      {stats.streakBest}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-gray-600">Giorno preferito</span>
                    <span className="text-xl font-bold text-rose-600">
                      {stats.favoriteDay}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Share2 className="h-5 w-5" />
                  Condividi
                </button>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setCurrentCard(0);
                      setHasStarted(false);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Guarda di nuovo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Count-up animation component
function CountUp({ value }: { value: string | number }) {
  const [count, setCount] = useState(0);
  const isNumeric = typeof value === "number";

  useEffect(() => {
    if (!isNumeric) {
      setCount(0);
      return;
    }

    const target = value;
    const duration = 1000; // ms
    const steps = 30;
    const increment = target / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isNumeric]);

  if (!isNumeric) {
    return <span>{value}</span>;
  }

  return <span>{count}</span>;
}
