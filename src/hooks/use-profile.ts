"use client";

import { useState, useEffect } from "react";

export type UserProfile = "junior" | "giovane" | "adulto" | "senior";

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
  /** Level names (12 levels) */
  levelNames: string[];
  /** Correct answer messages (rotated) */
  correctMessages: string[];
  /** Wrong answer message */
  wrongMessage: string;
  /** Achievement: 3 correct in a row */
  streak3: string;
  /** Achievement: 5 correct in a row */
  streak5: string;
  /** Achievement: 7 correct in a row */
  streak7: string;
  /** Achievement: perfect score */
  perfectScore: string;
  /** Level up title text */
  levelUpTitle: string;
  /** Treasure chest unlock title */
  chestTitle: string;
  /** Celebration scale (1.0 normal, 1.5 bigger for junior) */
  celebrationScale: number;
  /** Hero subtitle on homepage */
  heroSubtitle: string;
  /** Daily challenge label */
  dailyChallengeLabel: string;
  /** Weekly recap title */
  weeklyRecapTitle: string;
}

const defaultLevelNames = [
  "Principiante", "Novizio", "Apprendista", "Giocatore",
  "Esperto", "Dichiarante", "Stratega", "Campione",
  "Agonista", "Maestro", "Grande Maestro", "Campione Azzurro",
];

const defaultCorrectMessages = [
  "Bravo! Ben ragionato.", "Esatto! Ottima risposta.",
  "Perfetto! Continua cosi.", "Giusto! Stai imparando veloce.",
];

const configs: Record<UserProfile, ProfileConfig> = {
  junior: {
    profile: "junior",
    animSpeed: 0.4,
    fontBump: 0,
    showTimer: true,
    timerSeconds: 25,
    showCombo: true,
    showEncouragement: true,
    xpLabel: "Stelle ⭐",
    contentClasses: "",
    quizTransition: "scale",
    showHints: true,
    levelNames: [
      "Piccolo Bridgista", "Esploratore", "Avventuriero", "Sfidante",
      "Tattico", "Stratega", "Campione", "Super Campione",
      "Eroe del Bridge", "Leggenda", "Mito Vivente", "Campione Galattico",
    ],
    correctMessages: [
      "SPACCA! 💥", "SEI UN MITO! 🌟", "PERFETTO! 🔥",
      "GENIALE! ⚡", "BOOM! 💣", "INCREDIBILE! 🚀",
    ],
    wrongMessage: "Oops! Non mollare, il prossimo e' tuo! 💪",
    streak3: "🔥 TRIS INFUOCATO! 3 di fila!",
    streak5: "🚀 SEI INARRESTABILE! 5 di fila! 3x Stelle!",
    streak7: "👑 LEGGENDA ASSOLUTA! 7 risposte perfette!",
    perfectScore: "⭐ STELLE PIENE! Tutti i quiz corretti! Il Maestro ti applaude!",
    levelUpTitle: "SEI SALITO DI LIVELLO!",
    chestTitle: "WOW! BAULE APERTO!",
    celebrationScale: 1.5,
    heroSubtitle: "La Tua Avventura!",
    dailyChallengeLabel: "Sfida Speciale di Oggi!",
    weeklyRecapTitle: "La Tua Settimana Pazzesca!",
  },
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
    levelNames: defaultLevelNames,
    correctMessages: defaultCorrectMessages,
    wrongMessage: "Sbagliato! Streak persa. Riprova al prossimo!",
    streak3: "Tris! 3 risposte consecutive 🔥",
    streak5: "FUOCO! 5 di fila — 3x XP! 🔥🔥🔥",
    streak7: "LEGGENDARIO! 7 risposte perfette! 👑",
    perfectScore: "PUNTEGGIO PERFETTO! Tutti i quiz corretti! 🏆",
    levelUpTitle: "LEVEL UP!",
    chestTitle: "Baule sbloccato!",
    celebrationScale: 1.0,
    heroSubtitle: "Corsi FIGB",
    dailyChallengeLabel: "Sfida del Giorno",
    weeklyRecapTitle: "Riepilogo settimanale",
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
    levelNames: defaultLevelNames,
    correctMessages: defaultCorrectMessages,
    wrongMessage: "Sbagliato! Streak persa. Riprova al prossimo!",
    streak3: "Tris! 3 risposte consecutive 🔥",
    streak5: "FUOCO! 5 di fila — 3x XP! 🔥🔥🔥",
    streak7: "LEGGENDARIO! 7 risposte perfette! 👑",
    perfectScore: "PUNTEGGIO PERFETTO! Tutti i quiz corretti! 🏆",
    levelUpTitle: "LEVEL UP!",
    chestTitle: "Baule sbloccato!",
    celebrationScale: 1.0,
    heroSubtitle: "Corsi FIGB",
    dailyChallengeLabel: "Sfida del Giorno",
    weeklyRecapTitle: "Riepilogo settimanale",
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
    levelNames: defaultLevelNames,
    correctMessages: [
      "Ottimo lavoro!", "Risposta corretta!",
      "Ben fatto!", "Esatto, complimenti!",
    ],
    wrongMessage: "Nessun problema! Leggi la spiegazione e la prossima volta andra' meglio.",
    streak3: "Tre risposte corrette di fila! 👏",
    streak5: "Cinque di fila — complimenti! 🌟",
    streak7: "Sette risposte perfette! Straordinario! 🏆",
    perfectScore: "Punteggio perfetto! Tutti i quiz corretti! 🏆",
    levelUpTitle: "Nuovo livello raggiunto!",
    chestTitle: "Baule sbloccato!",
    celebrationScale: 1.0,
    heroSubtitle: "Corsi FIGB",
    dailyChallengeLabel: "Sfida del Giorno",
    weeklyRecapTitle: "Riepilogo settimanale",
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
