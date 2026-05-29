"use client";

/**
 * Trova-errore scenarios store (Phase 4.3.3).
 *
 * ~50-row scenario bank. Single consumer (the trova-errore page), but
 * the store keeps it in memory across menu/playing/gameover transitions
 * without re-fetching when the user replays.
 */

import { create } from "zustand";
import { useEffect } from "react";
import { getErrorScenarios, type ErrorScenario } from "@/lib/catalog";

interface ErrorScenariosState {
  scenarios: ErrorScenario[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchScenarios: () => Promise<void>;
}

export const useErrorScenariosStore = create<ErrorScenariosState>((set, get) => ({
  scenarios: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchScenarios: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const scenarios = await getErrorScenarios();
      set({ scenarios, isLoading: false, isLoaded: true });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load error scenarios",
      });
    }
  },
}));

function useEnsureErrorScenarios(): void {
  const isLoaded = useErrorScenariosStore((s) => s.isLoaded);
  const isLoading = useErrorScenariosStore((s) => s.isLoading);
  const fetchScenarios = useErrorScenariosStore((s) => s.fetchScenarios);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchScenarios();
    }
  }, [isLoaded, isLoading, fetchScenarios]);
}

export function useErrorScenarios(): {
  scenarios: ErrorScenario[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureErrorScenarios();
  const scenarios = useErrorScenariosStore((s) => s.scenarios);
  const isLoading = useErrorScenariosStore((s) => s.isLoading);
  const isLoaded = useErrorScenariosStore((s) => s.isLoaded);
  const error = useErrorScenariosStore((s) => s.error);
  return { scenarios, isLoading, isLoaded, error };
}
