"use client";

/**
 * Classes store (Instructor Portal).
 *
 * Unlike the catalog stores (read-only session caches), class data is per-user
 * and mutates, so this store exposes an explicit `refresh()` instead of a
 * fetch-once guard. It tracks two lists:
 *   - myClasses:       classes the current user OWNS (instructor view)
 *   - enrolledClasses: classes the current user is a MEMBER of (student view)
 *
 * Pages call the matching `useMyClasses()` / `useEnrolledClasses()` hook which
 * auto-loads on first mount; mutations (create/join/leave) live in the DAL
 * (src/lib/instructors.ts) and callers invoke `refresh*()` afterwards.
 */

import { create } from "zustand";
import { useEffect } from "react";
import { getMyClasses, getMyEnrolledClasses, type ClassRoom } from "@/lib/instructors";

interface ClassesState {
  myClasses: ClassRoom[];
  myLoading: boolean;
  myLoaded: boolean;
  myError: string | null;

  enrolledClasses: ClassRoom[];
  enrolledLoading: boolean;
  enrolledLoaded: boolean;
  enrolledError: string | null;

  refreshMyClasses: () => Promise<void>;
  refreshEnrolledClasses: () => Promise<void>;
}

export const useClassesStore = create<ClassesState>((set) => ({
  myClasses: [],
  myLoading: false,
  myLoaded: false,
  myError: null,

  enrolledClasses: [],
  enrolledLoading: false,
  enrolledLoaded: false,
  enrolledError: null,

  refreshMyClasses: async () => {
    set({ myLoading: true, myError: null });
    try {
      const myClasses = await getMyClasses();
      set({ myClasses, myLoading: false, myLoaded: true });
    } catch (err) {
      set({
        myLoading: false,
        myError: err instanceof Error ? err.message : "Errore nel caricamento delle classi",
      });
    }
  },

  refreshEnrolledClasses: async () => {
    set({ enrolledLoading: true, enrolledError: null });
    try {
      const enrolledClasses = await getMyEnrolledClasses();
      set({ enrolledClasses, enrolledLoading: false, enrolledLoaded: true });
    } catch (err) {
      set({
        enrolledLoading: false,
        enrolledError: err instanceof Error ? err.message : "Errore nel caricamento delle classi",
      });
    }
  },
}));

export function useMyClasses() {
  const myClasses = useClassesStore((s) => s.myClasses);
  const isLoading = useClassesStore((s) => s.myLoading);
  const isLoaded = useClassesStore((s) => s.myLoaded);
  const error = useClassesStore((s) => s.myError);
  const refresh = useClassesStore((s) => s.refreshMyClasses);

  useEffect(() => {
    if (!isLoaded && !isLoading) void refresh();
  }, [isLoaded, isLoading, refresh]);

  return { classes: myClasses, isLoading, isLoaded, error, refresh };
}

export function useEnrolledClasses() {
  const enrolledClasses = useClassesStore((s) => s.enrolledClasses);
  const isLoading = useClassesStore((s) => s.enrolledLoading);
  const isLoaded = useClassesStore((s) => s.enrolledLoaded);
  const error = useClassesStore((s) => s.enrolledError);
  const refresh = useClassesStore((s) => s.refreshEnrolledClasses);

  useEffect(() => {
    if (!isLoaded && !isLoading) void refresh();
  }, [isLoaded, isLoading, refresh]);

  return { classes: enrolledClasses, isLoading, isLoaded, error, refresh };
}
