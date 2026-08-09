"use client";

import { useState, useEffect, useCallback } from "react";
import {
  migrateLegacyBox,
  scheduleAfterCorrect,
  scheduleAfterWrong,
} from "@/lib/spaced-review";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewItem {
  /** Lesson number (0-12) */
  lessonId: number;
  /** Module identifier within the lesson */
  moduleId: string;
  /** The question text that was answered incorrectly */
  question: string;
  /** Scatola di Leitner corrente (1..5); guida lo scheduling. */
  box: number;
  /** How many times the user got this wrong (cumulative, statistica) */
  wrongCount: number;
  /** ISO date string of the last review (or first wrong answer) */
  lastReview: string;
  /** ISO date string of when this item is next due for review */
  nextReview: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "bq_review_items";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadItems(): ReviewItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migrazione formato pre-Leitner (item senza `box`).
    return (parsed as ReviewItem[]).map((i) => ({ ...i, box: migrateLegacyBox(i) }));
  } catch {
    return [];
  }
}

function saveItems(items: ReviewItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable - silent fail
  }
}

/** Unique key for deduplication */
function itemKey(lessonId: number, moduleId: string): string {
  return `${lessonId}::${moduleId}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpacedReview() {
  const [items, setItems] = useState<ReviewItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
    setItems(loadItems());
  }, []);

  // Persist whenever items change (skip the initial empty-array render)
  const persist = useCallback((next: ReviewItem[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  // -----------------------------------------------------------------------
  // addReviewItem - called when the user gets a wrong answer
  // -----------------------------------------------------------------------
  const addReviewItem = useCallback(
    (lessonId: number, moduleId: string, question: string) => {
      const current = loadItems(); // read fresh to avoid stale closures
      const key = itemKey(lessonId, moduleId);
      const idx = current.findIndex(
        (i) => itemKey(i.lessonId, i.moduleId) === key
      );

      const today = todayISO();

      if (idx >= 0) {
        // Errore su item già tracciato: regressione alla scatola 1 (Leitner)
        const existing = current[idx];
        current[idx] = {
          ...existing,
          question, // update to latest question text variant
          ...scheduleAfterWrong(existing, today),
        };
      } else {
        // Brand new wrong answer
        current.push({
          lessonId,
          moduleId,
          question,
          ...scheduleAfterWrong(null, today),
        });
      }

      persist(current);
    },
    [persist]
  );

  // -----------------------------------------------------------------------
  // getItemsDue - returns items whose nextReview <= today
  // -----------------------------------------------------------------------
  const getItemsDue = useCallback((): ReviewItem[] => {
    const today = todayISO();
    return items.filter((i) => i.nextReview <= today);
  }, [items]);

  // -----------------------------------------------------------------------
  // markReviewed - called after a review attempt (Leitner, @/lib/spaced-review)
  //   correct = true  -> avanza di scatola; oltre l'ultima esce dalla coda
  //   correct = false -> regressione alla scatola 1
  // -----------------------------------------------------------------------
  const markReviewed = useCallback(
    (lessonId: number, moduleId: string, correct: boolean) => {
      const current = loadItems();
      const key = itemKey(lessonId, moduleId);
      const idx = current.findIndex(
        (i) => itemKey(i.lessonId, i.moduleId) === key
      );

      if (idx < 0) return; // item not found, nothing to do

      const today = todayISO();
      const existing = current[idx];

      if (correct) {
        // Leitner: avanza di scatola; oltre l'ultima → padroneggiato, esce
        const advanced = scheduleAfterCorrect(existing, today);
        if (advanced === null) {
          current.splice(idx, 1);
        } else {
          current[idx] = { ...existing, ...advanced };
        }
      } else {
        // Sbagliato di nuovo: regressione alla scatola 1
        current[idx] = { ...existing, ...scheduleAfterWrong(existing, today) };
      }

      persist(current);
    },
    [persist]
  );

  // -----------------------------------------------------------------------
  // reviewCount - number of items due today
  // -----------------------------------------------------------------------
  const reviewCount = getItemsDue().length;

  return {
    /** All tracked review items (for debugging / profile page) */
    items,
    /** Add or update an item after a wrong answer */
    addReviewItem,
    /** Get items whose review date is today or earlier */
    getItemsDue,
    /** Mark a reviewed item as correct (mastered) or wrong (reschedule) */
    markReviewed,
    /** Number of items due for review today */
    reviewCount,
  } as const;
}
