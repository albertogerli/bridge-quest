"use client";

/**
 * Catalog store (Phase 3.3.1).
 *
 * Client-side Zustand store on top of `src/lib/catalog.ts`. Holds the full
 * course/world/lesson/module tree fetched from Supabase, plus loading and
 * error flags. Components consume it via the hooks below — never via
 * direct `useEffect(() => getCourses())` calls, which would cause
 * duplicate fetches and waterfall renders.
 *
 * Lifecycle:
 *   - first hook call triggers `fetchCatalog()` exactly once
 *   - subsequent hook calls subscribe to the cached state with granular
 *     selectors (one re-render per accessed slice, not per state change)
 *   - on error the in-flight flag resets, so a remount can retry
 *
 * No `persist` middleware — catalog data is fetched fresh on every
 * session. We don't want stale content from yesterday's seed shown to
 * the user after a CMS update.
 */

import { create } from "zustand";
import { useEffect } from "react";
import type { Lingua } from "@/lib/lingua";
import { useLingua } from "@/hooks/use-lingua";
import {
  getCourses,
  type Course,
  type CourseId,
  type Lesson,
  type LessonModule,
} from "@/lib/catalog";

// ─── State + actions ─────────────────────────────────────────────────────

interface CatalogState {
  courses: Course[];
  isLoading: boolean;
  isLoaded: boolean;          // true once the first successful fetch lands
  error: string | null;

  /**
   * Fires the underlying Supabase load. No-op if already loading or
   * already loaded; idempotent on re-call after success. On error,
   * leaves `isLoaded` false so the next call retries.
   */
  fetchCatalog: (lingua?: Lingua) => Promise<void>;
  /** La lingua del catalogo in memoria: cambiandola si ricarica. */
  lingua: Lingua;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  courses: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  lingua: "it",

  fetchCatalog: async (lingua = "it") => {
    const { isLoading, isLoaded, lingua: inMemoria } = get();
    // Cambiare lingua ricarica anche se il catalogo era già pronto: è l'unico
    // modo perché i contenuti seguano il selettore invece di restare nella
    // lingua in cui la pagina è stata aperta la prima volta.
    if (lingua !== inMemoria) {
      set({ isLoaded: false, isLoading: false, lingua });
    } else if (isLoading || isLoaded) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const courses = await getCourses(lingua);
      set({ courses, isLoading: false, isLoaded: true });
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
        error: err instanceof Error ? err.message : "Failed to load catalog",
      });
    }
  },
}));

// ─── Auto-fetch primitive ────────────────────────────────────────────────

/**
 * Side-effect hook that ensures the catalog is fetched exactly once when
 * any component starts subscribing to the store. Every public hook below
 * calls this so consumers don't need to remember to "kick off" the load.
 */
function useEnsureCatalog(): void {
  const isLoaded = useCatalogStore((s) => s.isLoaded);
  const isLoading = useCatalogStore((s) => s.isLoading);
  const inMemoria = useCatalogStore((s) => s.lingua);
  const fetchCatalog = useCatalogStore((s) => s.fetchCatalog);
  const { lingua } = useLingua();

  useEffect(() => {
    if (lingua !== inMemoria || (!isLoaded && !isLoading)) {
      void fetchCatalog(lingua);
    }
  }, [isLoaded, isLoading, inMemoria, lingua, fetchCatalog]);
}

// ─── Public hooks ────────────────────────────────────────────────────────

/**
 * Full catalog + loading flags. Use in orchestrator components (root pages)
 * that need the entire tree or want to render a top-level loading state.
 *
 * For point queries (one course, one lesson, one module), prefer the more
 * granular hooks below — they subscribe to a smaller slice and avoid
 * re-rendering the whole consumer on unrelated changes.
 */
export function useCatalog(): {
  courses: Course[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
} {
  useEnsureCatalog();
  const courses = useCatalogStore((s) => s.courses);
  const isLoading = useCatalogStore((s) => s.isLoading);
  const isLoaded = useCatalogStore((s) => s.isLoaded);
  const error = useCatalogStore((s) => s.error);
  return { courses, isLoading, isLoaded, error };
}

export function useCourse(id: CourseId | undefined): Course | undefined {
  useEnsureCatalog();
  return useCatalogStore((s) =>
    id ? s.courses.find((c) => c.id === id) : undefined,
  );
}

export function useLesson(id: number | undefined): Lesson | undefined {
  useEnsureCatalog();
  return useCatalogStore((s) => {
    if (id == null) return undefined;
    for (const c of s.courses) {
      const lesson = c.lessons.find((l) => l.id === id);
      if (lesson) return lesson;
    }
    return undefined;
  });
}

export function useLessonModule(
  lessonId: number | undefined,
  moduleId: string | undefined,
): LessonModule | undefined {
  useEnsureCatalog();
  return useCatalogStore((s) => {
    if (lessonId == null || !moduleId) return undefined;
    for (const c of s.courses) {
      const lesson = c.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.modules.find((m) => m.id === moduleId);
    }
    return undefined;
  });
}
