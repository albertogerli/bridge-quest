"use client";

/**
 * Smazzate store (Phase 4.1.3).
 *
 * Sibling to `use-catalog-store.ts`. Loads the full ~272-row practice-hand
 * catalog from Supabase once per session and serves it to client
 * components via granular hooks. Kept separate from the lesson catalog
 * because the payload is an order of magnitude bigger (~1 MB raw) and
 * most pages don't need it — only the `/gioca/*` family.
 *
 * Derived slices (`playable`, `validated`) are computed once at fetch
 * time and stored alongside the raw array. This keeps the array refs
 * stable across renders, so selectors don't trigger spurious updates.
 */

import { create } from "zustand";
import { useEffect } from "react";
import {
  getAllSmazzate,
  isPlausibleSmazzata,
  validateSmazzate,
  type Smazzata,
} from "@/lib/catalog";

// ─── State + actions ─────────────────────────────────────────────────────

interface SmazzateState {
  smazzate: Smazzata[];          // all 272, raw from DB
  validated: Smazzata[];         // post `validateSmazzate` (fix declarer + filter malformed)
  playable: Smazzata[];          // post `isPlausibleSmazzata` (HCP heuristic)
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  fetchSmazzate: () => Promise<void>;
}

export const useSmazzateStore = create<SmazzateState>((set, get) => ({
  smazzate: [],
  validated: [],
  playable: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchSmazzate: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const smazzate = await getAllSmazzate();
      const validated = validateSmazzate(smazzate);
      const playable = validated.filter(isPlausibleSmazzata);
      set({ smazzate, validated, playable, isLoading: false, isLoaded: true });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load smazzate",
      });
    }
  },
}));

// ─── Auto-fetch primitive ────────────────────────────────────────────────

function useEnsureSmazzate(): void {
  const isLoaded = useSmazzateStore((s) => s.isLoaded);
  const isLoading = useSmazzateStore((s) => s.isLoading);
  const fetchSmazzate = useSmazzateStore((s) => s.fetchSmazzate);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchSmazzate();
    }
  }, [isLoaded, isLoading, fetchSmazzate]);
}

// ─── Public hooks ────────────────────────────────────────────────────────

export function useSmazzate(): {
  smazzate: Smazzata[];
  validated: Smazzata[];
  playable: Smazzata[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureSmazzate();
  const smazzate = useSmazzateStore((s) => s.smazzate);
  const validated = useSmazzateStore((s) => s.validated);
  const playable = useSmazzateStore((s) => s.playable);
  const isLoading = useSmazzateStore((s) => s.isLoading);
  const isLoaded = useSmazzateStore((s) => s.isLoaded);
  const error = useSmazzateStore((s) => s.error);
  return { smazzate, validated, playable, isLoading, isLoaded, error };
}

/** Single smazzata by id. Returns undefined until catalog is loaded. */
export function useSmazzata(id: string | undefined): Smazzata | undefined {
  useEnsureSmazzate();
  return useSmazzateStore((s) =>
    id ? s.smazzate.find((sm) => sm.id === id) : undefined,
  );
}

/** All playable smazzate (HCP-coherent), stable ref. */
export function usePlayableSmazzate(): Smazzata[] {
  useEnsureSmazzate();
  return useSmazzateStore((s) => s.playable);
}

/** All validated smazzate (declarer-fixed + sanity-filtered), stable ref. */
export function useValidatedSmazzate(): Smazzata[] {
  useEnsureSmazzate();
  return useSmazzateStore((s) => s.validated);
}
