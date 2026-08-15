"use client";

/**
 * Glossary store (Phase 4.2.3).
 *
 * Loads the 49-row glossary once per session from Supabase via
 * `getGlossary()`. Tiny payload (~30 KB), but worth a Zustand wrapper so
 * the consumer hooks subscribe to a single in-memory copy instead of
 * re-fetching from every tooltip / glossary page mount.
 */

import { create } from "zustand";
import { useEffect } from "react";
import {
  getGlossary,
  type GlossaryEntry,
} from "@/lib/catalog";

interface GlossaryState {
  glossary: Record<string, GlossaryEntry>;
  entries: GlossaryEntry[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchGlossary: () => Promise<void>;
}

export const useGlossaryStore = create<GlossaryState>((set, get) => ({
  glossary: {},
  entries: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchGlossary: async () => {
    const { isLoading, isLoaded } = get();
    if (isLoading || isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const glossary = await getGlossary();
      set({
        glossary,
        entries: Object.values(glossary),
        isLoading: false,
        isLoaded: true,
      });
    } catch (err) {
        // Anche il fallimento è uno stato finale: senza `isLoaded`, l'effetto
        // che chiama questa funzione riparte (la sua guardia è
        // `!isLoaded && !isLoading`, e il passaggio di isLoading a false la
        // rende vera) e le richieste si susseguono all'infinito con la rotella
        // che gira. `error` resta impostato, così chi legge distingue
        // «caricato» da «tentato e non riuscito».
      set({
        isLoading: false,
        isLoaded: true,
        error:
          err instanceof Error ? err.message : "Failed to load glossary",
      });
    }
  },
}));

function useEnsureGlossary(): void {
  const isLoaded = useGlossaryStore((s) => s.isLoaded);
  const isLoading = useGlossaryStore((s) => s.isLoading);
  const fetchGlossary = useGlossaryStore((s) => s.fetchGlossary);

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      void fetchGlossary();
    }
  }, [isLoaded, isLoading, fetchGlossary]);
}

export function useGlossary(): {
  glossary: Record<string, GlossaryEntry>;
  entries: GlossaryEntry[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureGlossary();
  const glossary = useGlossaryStore((s) => s.glossary);
  const entries = useGlossaryStore((s) => s.entries);
  const isLoading = useGlossaryStore((s) => s.isLoading);
  const isLoaded = useGlossaryStore((s) => s.isLoaded);
  const error = useGlossaryStore((s) => s.error);
  return { glossary, entries, isLoading, isLoaded, error };
}

export function useGlossaryEntry(id: string | undefined): GlossaryEntry | undefined {
  useEnsureGlossary();
  return useGlossaryStore((s) => (id ? s.glossary[id] : undefined));
}
