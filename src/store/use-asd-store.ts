"use client";

/**
 * ASD clubs store (Phase 4.2.3).
 *
 * Loads the 260-row ASD roster once per session from Supabase. ~65 KB
 * payload — small enough that we eagerly populate both the full list and
 * the "active" slice at fetch time, so selectors return stable refs.
 */

import { create } from "zustand";
import { useEffect } from "react";
import { getAsdClubs, type AsdClub } from "@/lib/catalog";
import { asdNameToSlug } from "@/lib/asd-utils";

interface AsdState {
  clubs: AsdClub[];
  active: AsdClub[];                    // pre-filtered c.active === true
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchClubs: () => Promise<void>;
}

export const useAsdStore = create<AsdState>((set, get) => ({
  clubs: [],
  active: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchClubs: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const clubs = await getAsdClubs();
      const active = clubs.filter((c) => c.active);
      set({ clubs, active, isLoading: false, isLoaded: true });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load ASD clubs",
      });
    }
  },
}));

function useEnsureAsd(): void {
  const isLoaded = useAsdStore((s) => s.isLoaded);
  const isLoading = useAsdStore((s) => s.isLoading);
  const fetchClubs = useAsdStore((s) => s.fetchClubs);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchClubs();
    }
  }, [isLoaded, isLoading, fetchClubs]);
}

export function useAsdClubs(): {
  clubs: AsdClub[];
  active: AsdClub[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureAsd();
  const clubs = useAsdStore((s) => s.clubs);
  const active = useAsdStore((s) => s.active);
  const isLoading = useAsdStore((s) => s.isLoading);
  const isLoaded = useAsdStore((s) => s.isLoaded);
  const error = useAsdStore((s) => s.error);
  return { clubs, active, isLoading, isLoaded, error };
}

export function useActiveAsdClubs(): AsdClub[] {
  useEnsureAsd();
  return useAsdStore((s) => s.active);
}

export function useAsdClub(code: string | null | undefined): AsdClub | undefined {
  useEnsureAsd();
  return useAsdStore((s) =>
    code ? s.clubs.find((c) => c.code === code) : undefined,
  );
}

export function useAsdClubBySlug(slug: string | null | undefined): AsdClub | undefined {
  useEnsureAsd();
  return useAsdStore((s) => {
    if (!slug) return undefined;
    return (
      s.active.find((c) => asdNameToSlug(c.name) === slug) ??
      s.clubs.find((c) => asdNameToSlug(c.name) === slug)
    );
  });
}
