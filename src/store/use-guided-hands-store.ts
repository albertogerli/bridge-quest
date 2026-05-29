"use client";

/**
 * Guided hands store (Phase 4.3.3).
 *
 * Tiny payload (2 hands today) — fetched once per session so the
 * selector page and the gameplay route share a single reference and
 * the gameplay screen does not flicker on remount.
 */

import { create } from "zustand";
import { useEffect } from "react";
import { getGuidedHands, type GuidedHand } from "@/lib/catalog";

interface GuidedHandsState {
  hands: GuidedHand[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchHands: () => Promise<void>;
}

export const useGuidedHandsStore = create<GuidedHandsState>((set, get) => ({
  hands: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchHands: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const hands = await getGuidedHands();
      set({ hands, isLoading: false, isLoaded: true });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load guided hands",
      });
    }
  },
}));

function useEnsureGuidedHands(): void {
  const isLoaded = useGuidedHandsStore((s) => s.isLoaded);
  const isLoading = useGuidedHandsStore((s) => s.isLoading);
  const fetchHands = useGuidedHandsStore((s) => s.fetchHands);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchHands();
    }
  }, [isLoaded, isLoading, fetchHands]);
}

export function useGuidedHands(): {
  hands: GuidedHand[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureGuidedHands();
  const hands = useGuidedHandsStore((s) => s.hands);
  const isLoading = useGuidedHandsStore((s) => s.isLoading);
  const isLoaded = useGuidedHandsStore((s) => s.isLoaded);
  const error = useGuidedHandsStore((s) => s.error);
  return { hands, isLoading, isLoaded, error };
}
