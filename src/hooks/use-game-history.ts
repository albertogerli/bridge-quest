"use client";

import { useState, useEffect, useCallback } from "react";

// ===== Types =====

export interface GameRecord {
  date: string;          // ISO date string
  contract: string;      // e.g. "4♠", "3SA"
  declarer: string;      // "north" | "south" | "east" | "west"
  tricksMade: number;
  tricksNeeded: number;
  result: number;        // positive = made, negative = down
  course: string;        // course name or lesson group
  lessonId: string;      // lesson identifier
}

export type ContractType = "SA" | "♠" | "♥" | "♦" | "♣";

export interface ContractStats {
  type: ContractType;
  played: number;
  won: number;
  winRate: number;
}

export interface GameStats {
  totalGames: number;
  winRate: number;          // 0-100
  avgTricks: number;
  bestStreak: number;
  currentStreak: number;
  contractStats: ContractStats[];
  recentTrend: "improving" | "stable" | "declining";
  weakSuits: ContractType[];
  last10: GameRecord[];
}

const STORAGE_KEY = "bq_game_history";
const MAX_RECORDS = 100;

// ===== Contract type extraction =====

function getContractType(contract: string): ContractType {
  const upper = contract.toUpperCase();
  if (upper.includes("NT") || upper.includes("SA")) return "SA";
  if (upper.includes("♠") || upper.includes("S")) return "♠";
  if (upper.includes("♥") || upper.includes("H")) return "♥";
  if (upper.includes("♦") || upper.includes("D")) return "♦";
  if (upper.includes("♣") || upper.includes("C")) return "♣";
  return "SA"; // fallback
}

// ===== Compute stats from records =====

function computeStats(records: GameRecord[]): GameStats {
  const totalGames = records.length;

  if (totalGames === 0) {
    return {
      totalGames: 0,
      winRate: 0,
      avgTricks: 0,
      bestStreak: 0,
      currentStreak: 0,
      contractStats: [],
      recentTrend: "stable",
      weakSuits: [],
      last10: [],
    };
  }

  // Win rate
  const wins = records.filter((r) => r.result >= 0).length;
  const winRate = Math.round((wins / totalGames) * 100);

  // Average tricks
  const avgTricks =
    Math.round(
      (records.reduce((sum, r) => sum + r.tricksMade, 0) / totalGames) * 10
    ) / 10;

  // Best streak & current streak
  let bestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < records.length; i++) {
    if (records[i].result >= 0) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }
  // Current streak (from most recent)
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].result >= 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Contract stats by type
  const contractMap: Record<string, { played: number; won: number }> = {};
  const allTypes: ContractType[] = ["SA", "♠", "♥", "♦", "♣"];
  for (const type of allTypes) {
    contractMap[type] = { played: 0, won: 0 };
  }
  for (const r of records) {
    const type = getContractType(r.contract);
    contractMap[type].played++;
    if (r.result >= 0) contractMap[type].won++;
  }
  const contractStats: ContractStats[] = allTypes
    .map((type) => ({
      type,
      played: contractMap[type].played,
      won: contractMap[type].won,
      winRate:
        contractMap[type].played > 0
          ? Math.round((contractMap[type].won / contractMap[type].played) * 100)
          : 0,
    }))
    .filter((cs) => cs.played > 0);

  // Recent trend: compare last 10 vs overall
  const last10 = records.slice(-10);
  const last10WinRate =
    last10.length > 0
      ? Math.round(
          (last10.filter((r) => r.result >= 0).length / last10.length) * 100
        )
      : 0;

  let recentTrend: "improving" | "stable" | "declining" = "stable";
  if (totalGames >= 5) {
    if (last10WinRate > winRate + 10) {
      recentTrend = "improving";
    } else if (last10WinRate < winRate - 10) {
      recentTrend = "declining";
    }
  }

  // Weak suits: contracts with <40% success rate and at least 3 games
  const weakSuits = contractStats
    .filter((cs) => cs.winRate < 40 && cs.played >= 3)
    .map((cs) => cs.type);

  return {
    totalGames,
    winRate,
    avgTricks,
    bestStreak,
    currentStreak,
    contractStats,
    recentTrend,
    weakSuits,
    last10,
  };
}

// ===== Hook =====

export function useGameHistory() {
  const [records, setRecords] = useState<GameRecord[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameRecord[];
        setRecords(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Add a new game record
  const addGameRecord = useCallback((record: GameRecord) => {
    setRecords((prev) => {
      const updated = [...prev, record].slice(-MAX_RECORDS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage full, etc.
      }
      return updated;
    });
  }, []);

  // Get all records
  const getGameHistory = useCallback(() => records, [records]);

  // Compute stats
  const getStats = useCallback((): GameStats => computeStats(records), [records]);

  return {
    records,
    addGameRecord,
    getGameHistory,
    getStats,
  };
}

// ===== Standalone functions (for use outside React) =====

export function addGameRecordDirect(record: GameRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: GameRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [...existing, record].slice(-MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function getGameHistoryDirect(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStatsDirect(): GameStats {
  return computeStats(getGameHistoryDirect());
}
