"use client";

/**
 * Weekly-challenge local progress (localStorage) — orthogonal to the
 * Supabase-backed `WeeklyChallenge` catalog. Helpers take the current
 * challenge as an argument instead of resolving it themselves, because
 * the catalog is async and these helpers must stay sync (read inside
 * effects, called from event handlers).
 */

import type { WeeklyChallenge } from "@/lib/catalog";

export interface WeeklyChallengeProgress {
  weekId: number;
  played: number;
  xpEarned: number;
  completedHands: Array<{
    handId: string;
    score: number;
    xpGained: number;
    completedAt: string;
  }>;
}

export interface WeeklyChallengeProgressView {
  played: number;
  target: number;
  completed: boolean;
  xpEarned: number;
  completedHands: WeeklyChallengeProgress["completedHands"];
}

const TARGET = 5;
const STORAGE_KEY = "bq_weekly_challenge_progress";
const BADGES_KEY = "bq_weekly_badges";

function emptyProgress(): WeeklyChallengeProgressView {
  return { played: 0, target: TARGET, completed: false, xpEarned: 0, completedHands: [] };
}

export function getWeeklyChallengeProgress(
  currentChallenge: WeeklyChallenge | undefined,
): WeeklyChallengeProgressView {
  if (typeof window === "undefined" || !currentChallenge) return emptyProgress();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyProgress();

    const progress: WeeklyChallengeProgress = JSON.parse(stored);
    if (progress.weekId !== currentChallenge.id) {
      localStorage.removeItem(STORAGE_KEY);
      return emptyProgress();
    }
    return {
      played: progress.played || 0,
      target: TARGET,
      completed: (progress.played || 0) >= TARGET,
      xpEarned: progress.xpEarned || 0,
      completedHands: progress.completedHands || [],
    };
  } catch (e) {
    console.error("Error reading weekly challenge progress:", e);
    return emptyProgress();
  }
}

export function updateWeeklyChallengeProgress(
  currentChallenge: WeeklyChallenge,
  handId: string,
  score: number,
  baseXp: number,
): void {
  if (typeof window === "undefined") return;
  const current = getWeeklyChallengeProgress(currentChallenge);
  if (current.played >= TARGET) return;

  const xpGained = Math.round(baseXp * currentChallenge.xpMultiplier);
  const updated: WeeklyChallengeProgress = {
    weekId: currentChallenge.id,
    played: current.played + 1,
    xpEarned: current.xpEarned + xpGained,
    completedHands: [
      ...current.completedHands,
      { handId, score, xpGained, completedAt: new Date().toISOString() },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (updated.played >= TARGET) {
    unlockWeeklyBadge(currentChallenge.id, currentChallenge.badgeName);
  }
}

function unlockWeeklyBadge(weekId: number, badgeName: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(BADGES_KEY);
    const badges = stored ? JSON.parse(stored) : [];
    if (badges.some((b: { weekId: number }) => b.weekId === weekId)) return;
    badges.push({ weekId, badgeName, unlockedAt: new Date().toISOString() });
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
  } catch (e) {
    console.error("Error unlocking weekly badge:", e);
  }
}

export function getUnlockedWeeklyBadges(): Array<{
  weekId: number;
  badgeName: string;
  unlockedAt: string;
}> {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(BADGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error reading weekly badges:", e);
    return [];
  }
}
