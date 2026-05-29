"use client";

/**
 * Collectible cards store (Phase 4.3.3).
 *
 * Loads the ~22-row collectible-card catalog once per session from
 * Supabase. The DB row already includes the JSONB DSL for `unlock`;
 * consumers compose `evaluateUnlock(card.unlock, playerStats)` to derive
 * the unlocked set.
 */

import { create } from "zustand";
import { useEffect } from "react";
import { getCollectibleCards, type CollectibleCard } from "@/lib/catalog";

interface CollectibleCardsState {
  cards: CollectibleCard[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
}

export const useCollectibleCardsStore = create<CollectibleCardsState>((set, get) => ({
  cards: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchCards: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const cards = await getCollectibleCards();
      set({ cards, isLoading: false, isLoaded: true });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load collectible cards",
      });
    }
  },
}));

function useEnsureCollectibleCards(): void {
  const isLoaded = useCollectibleCardsStore((s) => s.isLoaded);
  const isLoading = useCollectibleCardsStore((s) => s.isLoading);
  const fetchCards = useCollectibleCardsStore((s) => s.fetchCards);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchCards();
    }
  }, [isLoaded, isLoading, fetchCards]);
}

export function useCollectibleCards(): {
  cards: CollectibleCard[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureCollectibleCards();
  const cards = useCollectibleCardsStore((s) => s.cards);
  const isLoading = useCollectibleCardsStore((s) => s.isLoading);
  const isLoaded = useCollectibleCardsStore((s) => s.isLoaded);
  const error = useCollectibleCardsStore((s) => s.error);
  return { cards, isLoading, isLoaded, error };
}
