"use client";

import { useState, useEffect, useCallback } from "react";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useBeginnerStatus() {
  const [onboardedDate, setOnboardedDate] = useState<string | null>(null);
  const [onboardedFlag, setOnboardedFlag] = useState(false);
  const [guidedSteps, setGuidedSteps] = useState<number[]>([]);
  const [guidedModeOff, setGuidedModeOff] = useState(false);
  const [guidedHand2, setGuidedHand2] = useState(false);
  const [guidedHand3, setGuidedHand3] = useState(false);
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      setOnboardedDate(localStorage.getItem("bq_onboarded_date") || null);
      setOnboardedFlag(localStorage.getItem("bq_onboarded") === "1");
      setGuidedSteps(readJSON<number[]>("bq_guided_steps", []));
      setGuidedModeOff(localStorage.getItem("bq_guided_mode_off") === "1");
      setGuidedHand2(localStorage.getItem("bq_guided_hand_2") === "1");
      setGuidedHand3(localStorage.getItem("bq_guided_hand_3") === "1");
      setLastActivity(localStorage.getItem("bq_last_activity") || null);
    } catch {}
  }, []);

  const today = todayISO();

  // Derived state
  const daysSinceOnboard = onboardedDate ? daysBetween(onboardedDate, today) : 999;
  const isOnboarded = !!onboardedDate || onboardedFlag;
  const isNewUser = isOnboarded && daysSinceOnboard <= 7;
  const isGuidedMode = isNewUser && !guidedModeOff;
  const guidedHandsDone = (guidedHand2 ? 1 : 0) + (guidedHand3 ? 1 : 0);

  // "Stuck" = onboarded but no activity for 2+ days
  const daysSinceActivity = lastActivity ? daysBetween(lastActivity, today) : (onboardedDate ? daysBetween(onboardedDate, today) : 0);
  const isStuck = isOnboarded && daysSinceActivity >= 2;

  const markStepDone = useCallback((step: number) => {
    setGuidedSteps((prev) => {
      if (prev.includes(step)) return prev;
      const next = [...prev, step];
      try { localStorage.setItem("bq_guided_steps", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleGuidedMode = useCallback(() => {
    setGuidedModeOff((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem("bq_guided_mode_off", "1");
        } else {
          localStorage.removeItem("bq_guided_mode_off");
        }
      } catch {}
      return next;
    });
  }, []);

  return {
    /** Whether user completed onboarding */
    isOnboarded,
    /** Whether user is within first 7 days */
    isNewUser,
    /** Days since onboarding completion */
    daysSinceOnboard,
    /** Completed guided path steps (1=lesson, 2=guided hand, 3=review) */
    guidedSteps,
    /** Mark a guided path step as done */
    markStepDone,
    /** Whether simplified "guided mode" is active (first 7 days, not opted out) */
    isGuidedMode,
    /** Toggle guided mode on/off */
    toggleGuidedMode,
    /** Number of guided hands completed (0-2) */
    guidedHandsDone,
    /** Whether user seems stuck (no activity 2+ days) */
    isStuck,
    /** Whether guided hand 2 is done */
    guidedHand2Done: guidedHand2,
    /** Whether guided hand 3 is done */
    guidedHand3Done: guidedHand3,
  } as const;
}
