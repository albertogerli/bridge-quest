"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import type { GameStats, ContractType } from "@/hooks/use-game-history";

// ===== Color helpers =====

function winRateColor(rate: number): string {
  if (rate >= 60) return "#059669"; // emerald-600
  if (rate >= 40) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

function contractTypeLabel(type: ContractType): string {
  switch (type) {
    case "SA": return "SA";
    case "♠": return "♠";
    case "♥": return "♥";
    case "♦": return "♦";
    case "♣": return "♣";
  }
}

function contractTypeColor(type: ContractType): string {
  switch (type) {
    case "SA": return "#6366f1"; // indigo
    case "♠": return "#3b82f6"; // blue
    case "♥": return "#ef4444"; // red
    case "♦": return "#f97316"; // orange
    case "♣": return "#059669"; // emerald
  }
}

function contractTypeName(type: ContractType): string {
  switch (type) {
    case "SA": return "Senza Atout";
    case "♠": return "Picche";
    case "♥": return "Cuori";
    case "♦": return "Quadri";
    case "♣": return "Fiori";
  }
}

// ===== Win Rate Ring (SVG) =====

function WinRateRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 42;
  const filled = (rate / 100) * circumference;
  const color = winRateColor(rate);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 100 100" className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <motion.circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {rate}%
        </span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          vittorie
        </span>
      </div>
    </div>
  );
}

// ===== Last 10 Games Bar Chart =====

function Last10Chart({ stats }: { stats: GameStats }) {
  const last10 = stats.last10;
  if (last10.length === 0) return null;

  const maxTricks = 13;

  return (
    <div className="flex items-end gap-1.5 h-24 px-1">
      {last10.map((game, i) => {
        const won = game.result >= 0;
        const height = Math.max((game.tricksMade / maxTricks) * 100, 8);
        const neededHeight = (game.tricksNeeded / maxTricks) * 100;

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 relative h-full justify-end">
            {/* Needed line indicator */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-gray-300"
              style={{ bottom: `${neededHeight}%` }}
            />
            {/* Bar */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
              className={`w-full rounded-t-sm ${
                won
                  ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-t from-red-400 to-red-300"
              }`}
              style={{ minHeight: 4 }}
            />
            {/* Trick count label */}
            <span className="text-[8px] font-bold text-gray-400">{game.tricksMade}</span>
          </div>
        );
      })}
    </div>
  );
}

// ===== Contract Stats Bars =====

function ContractBars({ stats }: { stats: GameStats }) {
  if (stats.contractStats.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {stats.contractStats.map((cs) => {
        const color = contractTypeColor(cs.type);
        return (
          <div key={cs.type}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-base font-black leading-none"
                  style={{ color }}
                >
                  {contractTypeLabel(cs.type)}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">
                  {cs.played} partite
                </span>
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: winRateColor(cs.winRate) }}
              >
                {cs.winRate}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cs.winRate}%` }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Main Dashboard =====

interface StatsDashboardProps {
  stats: GameStats;
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const trendDisplay = useMemo(() => {
    switch (stats.recentTrend) {
      case "improving":
        return { label: "In miglioramento", icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50" };
      case "declining":
        return { label: "In calo", icon: "📉", color: "text-red-600", bg: "bg-red-50" };
      default:
        return { label: "Stabile", icon: "➡️", color: "text-gray-600", bg: "bg-gray-50" };
    }
  }, [stats.recentTrend]);

  if (stats.totalGames === 0) {
    return (
      <div className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-6 text-center">
        <span className="text-4xl mb-3 block">🃏</span>
        <p className="text-sm font-bold text-gray-900 mb-1">
          Nessuna partita registrata
        </p>
        <p className="text-xs text-gray-500">
          Gioca delle smazzate per vedere le tue statistiche avanzate!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Win Rate Ring + Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Win Rate Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-4 flex flex-col items-center justify-center"
        >
          <WinRateRing rate={stats.winRate} />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
            Percentuale vittorie
          </p>
        </motion.div>

        {/* Quick Stats Stack */}
        <div className="flex flex-col gap-3">
          {/* Average Tricks */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-3.5 flex-1 flex flex-col justify-center"
          >
            <p className="text-2xl font-bold text-[#003DA5]">{stats.avgTricks}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Prese medie
            </p>
          </motion.div>

          {/* Best Streak */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-3.5 flex-1 flex flex-col justify-center"
          >
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-bold text-amber-600">{stats.bestStreak}</p>
              {stats.currentStreak > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  ora {stats.currentStreak}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Miglior serie
            </p>
          </motion.div>
        </div>
      </div>

      {/* Row 2: Contract Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-4"
      >
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Per tipo di contratto
        </h4>
        <ContractBars stats={stats} />
      </motion.div>

      {/* Row 3: Last 10 Games */}
      {stats.last10.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Ultime {stats.last10.length} partite
            </h4>
            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />
                Vinto
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-red-400" />
                Perso
              </span>
            </div>
          </div>
          <Last10Chart stats={stats} />
        </motion.div>
      )}

      {/* Row 4: Trend + Weak Suits */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trend */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`rounded-2xl border-2 border-[#e5e7eb] shadow-sm p-4 ${trendDisplay.bg}`}
        >
          <span className="text-3xl block mb-1">{trendDisplay.icon}</span>
          <p className={`text-sm font-semibold ${trendDisplay.color}`}>
            {trendDisplay.label}
          </p>
          <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
            Tendenza recente
          </p>
        </motion.div>

        {/* Weak Suits or All Good */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white border-2 border-[#e5e7eb] shadow-sm p-4"
        >
          {stats.weakSuits.length > 0 ? (
            <>
              <span className="text-xl block mb-1">⚠️</span>
              <p className="text-[10px] font-semibold text-gray-900 uppercase tracking-wider mb-1.5">
                Punti deboli
              </p>
              <div className="space-y-1">
                {stats.weakSuits.map((suit) => (
                  <p key={suit} className="text-[11px] text-red-600 font-semibold leading-tight">
                    Difficolta con {contractTypeName(suit)} {suit !== "SA" ? suit : ""}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className="text-3xl block mb-1">💪</span>
              <p className="text-sm font-semibold text-emerald-600">
                Ottimo lavoro!
              </p>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Nessun punto debole
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Total Games counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-center py-2"
      >
        <p className="text-[11px] text-gray-400 font-semibold">
          Basato su {stats.totalGames} {stats.totalGames === 1 ? "partita" : "partite"} registrate
        </p>
      </motion.div>
    </div>
  );
}
