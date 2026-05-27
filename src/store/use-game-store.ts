"use client";

/**
 * Game store (Phase 2 of the state-management refactor).
 *
 * Centralizes the player-facing gamification state — xp, streak, completed
 * modules, hands played, lastLogin — that previously lived in `bq_xp`,
 * `bq_streak`, `bq_completed_modules`, `bq_hands_played`, `bq_last_login`
 * keys, scattered across the app via `localStorage.setItem` / `getItem`.
 *
 * The `persist` middleware syncs the store to a single localStorage key
 * (`bq-game-store`) and runs a one-shot migration from the legacy keys on
 * first hydration so existing users keep their progress.
 *
 * SSR/Hydration note: Next.js renders this app on the server where the
 * store starts at the defaults below. `persist` hydrates from localStorage
 * only on the client, which can cause a brief mismatch. Components that
 * render persisted values should gate on `useHasHydrated()` (see bottom of
 * file) and render a stable fallback until hydration finishes.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

// ─── Legacy localStorage keys (read-only, for one-shot migration) ────────
const LEGACY_KEYS = {
  xp: "bq_xp",
  streak: "bq_streak",
  completedModules: "bq_completed_modules",
  handsPlayed: "bq_hands_played",
  lastLogin: "bq_last_login",
} as const;

// ─── State shape ─────────────────────────────────────────────────────────

export interface GameState {
  // Persisted data
  xp: number;
  streak: number;
  completedModules: Record<string, boolean>;
  handsPlayed: number;
  /** ISO date `YYYY-MM-DD` of the last login the daily bonus was awarded for. */
  lastLogin: string | null;

  // Actions
  addXp: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  completeModule: (lessonId: number | string, moduleId: string) => void;
  recordHandPlayed: () => void;
  addHandsPlayed: (amount: number) => void;
  setLastLogin: (isoDate: string) => void;
}

const initialPersistedState: Pick<
  GameState,
  "xp" | "streak" | "completedModules" | "handsPlayed" | "lastLogin"
> = {
  xp: 0,
  streak: 0,
  completedModules: {},
  handsPlayed: 0,
  lastLogin: null,
};

// ─── Helpers for the one-shot legacy migration ───────────────────────────

function readLegacySnapshot(): typeof initialPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const xpRaw = localStorage.getItem(LEGACY_KEYS.xp);
    const streakRaw = localStorage.getItem(LEGACY_KEYS.streak);
    const modsRaw = localStorage.getItem(LEGACY_KEYS.completedModules);
    const handsRaw = localStorage.getItem(LEGACY_KEYS.handsPlayed);
    const lastLogin = localStorage.getItem(LEGACY_KEYS.lastLogin);

    // If literally nothing exists in the legacy keys, this is a fresh
    // install — nothing to migrate.
    if (
      xpRaw == null &&
      streakRaw == null &&
      modsRaw == null &&
      handsRaw == null &&
      lastLogin == null
    ) {
      return null;
    }

    return {
      xp: xpRaw ? parseInt(xpRaw, 10) || 0 : 0,
      streak: streakRaw ? parseInt(streakRaw, 10) || 0 : 0,
      completedModules: modsRaw ? safeJsonParse(modsRaw, {}) : {},
      handsPlayed: handsRaw ? parseInt(handsRaw, 10) || 0 : 0,
      lastLogin: lastLogin ?? null,
    };
  } catch {
    return null;
  }
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// ─── Store ───────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialPersistedState,

      addXp: (amount) =>
        set((s) => ({ xp: Math.max(0, s.xp + amount) })),

      incrementStreak: () =>
        set((s) => ({ streak: s.streak + 1 })),

      resetStreak: () => set({ streak: 1 }),

      completeModule: (lessonId, moduleId) =>
        set((s) => {
          const key = `${lessonId}-${moduleId}`;
          if (s.completedModules[key]) return s; // no-op, avoid pointless re-render
          return {
            completedModules: { ...s.completedModules, [key]: true },
          };
        }),

      recordHandPlayed: () =>
        set((s) => ({ handsPlayed: s.handsPlayed + 1 })),

      addHandsPlayed: (amount) =>
        set((s) => ({ handsPlayed: Math.max(0, s.handsPlayed + amount) })),

      setLastLogin: (isoDate) => set({ lastLogin: isoDate }),
    }),
    {
      name: "bq-game-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist only the data fields — actions are recreated by `create()`.
      partialize: (state) => ({
        xp: state.xp,
        streak: state.streak,
        completedModules: state.completedModules,
        handsPlayed: state.handsPlayed,
        lastLogin: state.lastLogin,
      }),
      // One-shot migration from legacy `bq_*` keys when the new store is empty.
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        const isEmpty =
          state.xp === 0 &&
          state.streak === 0 &&
          state.handsPlayed === 0 &&
          state.lastLogin == null &&
          Object.keys(state.completedModules).length === 0;
        if (!isEmpty) return;

        const legacy = readLegacySnapshot();
        if (legacy) useGameStore.setState(legacy);
      },
    },
  ),
);

// ─── Hydration hook ──────────────────────────────────────────────────────

/**
 * Returns `true` once Zustand has rehydrated the persisted state from
 * localStorage. Use this in any client component that renders persisted
 * fields to avoid SSR/client hydration mismatches:
 *
 * ```tsx
 * const hydrated = useHasHydrated();
 * const xp = useGameStore((s) => s.xp);
 * if (!hydrated) return <Skeleton />; // or render with defaults
 * return <div>{xp} XP</div>;
 * ```
 */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // If hydration already finished before this effect ran, sync immediately.
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useGameStore.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);
  return hydrated;
}
