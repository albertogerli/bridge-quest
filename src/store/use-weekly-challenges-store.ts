"use client";

/**
 * Weekly challenges store (Phase 4.3.3).
 *
 * Loads the 12-row rotating-challenge catalog once per session. The
 * "current" challenge is derived deterministically from the ISO week,
 * so consumers can call `useCurrentWeeklyChallenge()` and get a stable
 * reference until the week rolls over (page re-mount).
 */

import { create } from "zustand";
import { useEffect } from "react";
import {
  getWeeklyChallenges,
  pickCurrentChallenge,
  type WeeklyChallenge,
} from "@/lib/catalog";

interface WeeklyChallengesState {
  challenges: WeeklyChallenge[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchChallenges: () => Promise<void>;
}

export const useWeeklyChallengesStore = create<WeeklyChallengesState>((set, get) => ({
  challenges: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchChallenges: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const challenges = await getWeeklyChallenges();
      set({ challenges, isLoading: false, isLoaded: true });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load weekly challenges",
      });
    }
  },
}));

function useEnsureWeeklyChallenges(): void {
  const isLoaded = useWeeklyChallengesStore((s) => s.isLoaded);
  const isLoading = useWeeklyChallengesStore((s) => s.isLoading);
  const fetchChallenges = useWeeklyChallengesStore((s) => s.fetchChallenges);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchChallenges();
    }
  }, [isLoaded, isLoading, fetchChallenges]);
}

export function useWeeklyChallenges(): {
  challenges: WeeklyChallenge[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureWeeklyChallenges();
  const challenges = useWeeklyChallengesStore((s) => s.challenges);
  const isLoading = useWeeklyChallengesStore((s) => s.isLoading);
  const isLoaded = useWeeklyChallengesStore((s) => s.isLoaded);
  const error = useWeeklyChallengesStore((s) => s.error);
  return { challenges, isLoading, isLoaded, error };
}

export function useCurrentWeeklyChallenge(): WeeklyChallenge | undefined {
  useEnsureWeeklyChallenges();
  return useWeeklyChallengesStore((s) => pickCurrentChallenge(s.challenges));
}
