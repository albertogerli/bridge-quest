"use client";

import { useState, useEffect, useCallback } from "react";

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
  /** How many times the user got this wrong (cumulative) */
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

/**
 * Interval schedule in days, indexed by wrongCount (1-based).
 *  - 1st wrong  -> review in 1 day
 *  - 2nd wrong  -> review in 3 days
 *  - 3rd+ wrong -> review in 7 days
 */
const INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
};
const DEFAULT_INTERVAL_DAYS = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function intervalForWrongCount(count: number): number {
  return INTERVALS_DAYS[count] ?? DEFAULT_INTERVAL_DAYS;
}

function loadItems(): ReviewItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ReviewItem[];
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
        // Item already tracked - increment wrongCount and reschedule
        const existing = current[idx];
        const newCount = existing.wrongCount + 1;
        const interval = intervalForWrongCount(newCount);
        current[idx] = {
          ...existing,
          question, // update to latest question text variant
          wrongCount: newCount,
          lastReview: today,
          nextReview: addDays(today, interval),
        };
      } else {
        // Brand new wrong answer
        const interval = intervalForWrongCount(1);
        current.push({
          lessonId,
          moduleId,
          question,
          wrongCount: 1,
          lastReview: today,
          nextReview: addDays(today, interval),
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
  // markReviewed - called after a review attempt
  //   correct = true  -> mastered, remove from list
  //   correct = false -> increment wrongCount and reschedule
  // -----------------------------------------------------------------------
  const markReviewed = useCallback(
    (lessonId: number, moduleId: string, correct: boolean) => {
      const current = loadItems();
      const key = itemKey(lessonId, moduleId);
      const idx = current.findIndex(
        (i) => itemKey(i.lessonId, i.moduleId) === key
      );

      if (idx < 0) return; // item not found, nothing to do

      if (correct) {
        // Mastered - remove from review list
        current.splice(idx, 1);
      } else {
        // Got it wrong again - bump count and reschedule
        const existing = current[idx];
        const newCount = existing.wrongCount + 1;
        const interval = intervalForWrongCount(newCount);
        const today = todayISO();
        current[idx] = {
          ...existing,
          wrongCount: newCount,
          lastReview: today,
          nextReview: addDays(today, interval),
        };
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
