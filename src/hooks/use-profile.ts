"use client";

import { useState, useEffect } from "react";

export type UserProfile = "giovane" | "adulto" | "senior";

export interface ProfileConfig {
  profile: UserProfile;
  /** Animation speed multiplier (1 = normal, 0.6 = faster, 1.5 = slower) */
  animSpeed: number;
  /** Base font size bump for quiz content (rem) */
  fontBump: number;
  /** Show timer on quizzes */
  showTimer: boolean;
  /** Timer seconds per quiz question */
  timerSeconds: number;
  /** Show combo/streak counter during quizzes */
  showCombo: boolean;
  /** Show encouraging messages after correct answers */
  showEncouragement: boolean;
  /** XP multiplier label */
  xpLabel: string;
  /** Extra CSS classes for module content area */
  contentClasses: string;
  /** Quiz transition style */
  quizTransition: "slide" | "fade" | "scale";
  /** Show step-by-step hints */
  showHints: boolean;
}

const configs: Record<UserProfile, ProfileConfig> = {
  giovane: {
    profile: "giovane",
    animSpeed: 0.6,
    fontBump: 0,
    showTimer: true,
    timerSeconds: 15,
    showCombo: true,
    showEncouragement: false,
    xpLabel: "XP",
    contentClasses: "",
    quizTransition: "slide",
    showHints: false,
  },
  adulto: {
    profile: "adulto",
    animSpeed: 1,
    fontBump: 0,
    showTimer: false,
    timerSeconds: 30,
    showCombo: true,
    showEncouragement: true,
    xpLabel: "XP",
    contentClasses: "",
    quizTransition: "fade",
    showHints: false,
  },
  senior: {
    profile: "senior",
    animSpeed: 1.5,
    fontBump: 0.125,
    showTimer: false,
    timerSeconds: 0,
    showCombo: false,
    showEncouragement: true,
    xpLabel: "Punti",
    contentClasses: "text-[1.0625rem] leading-relaxed",
    quizTransition: "fade",
    showHints: true,
  },
};

export function useProfile(): ProfileConfig {
  const [profile, setProfile] = useState<UserProfile>("adulto");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bq_profile") as UserProfile | null;
      if (stored && configs[stored]) {
        setProfile(stored);
      }
    } catch {}
  }, []);

  return configs[profile];
}

export function getProfileConfig(profile: UserProfile): ProfileConfig {
  return configs[profile] || configs.adulto;
}
