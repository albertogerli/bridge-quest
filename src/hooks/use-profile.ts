"use client";

import { useSyncExternalStore } from "react";

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
  /** Level names (36 levels) */
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
  "Principiante",            // Lv  1
  "Novizio",                 // Lv  2
  "Apprendista",             // Lv  3
  "Studente",                // Lv  4
  "Giocatore",               // Lv  5
  "Giocatore Attento",       // Lv  6
  "Dichiarante",             // Lv  7
  "Difensore",               // Lv  8
  "Stratega",                // Lv  9
  "Tattico",                 // Lv 10
  "Agonista",                // Lv 11
  "Competitore",             // Lv 12
  "Esperto",                 // Lv 13
  "Esperto di Torneo",       // Lv 14
  "Veterano",                // Lv 15
  "Professionista",          // Lv 16
  "Maestrino",               // Lv 17
  "Maestro",                 // Lv 18
  "Maestro Esperto",         // Lv 19
  "Grande Maestro",          // Lv 20
  "Maestro Nazionale",       // Lv 21
  "Maestro Federale",        // Lv 22
  "Campione di Club",        // Lv 23
  "Campione Regionale",      // Lv 24
  "Campione Nazionale",      // Lv 25
  "Internazionale",          // Lv 26
  "Maestro Internazionale",  // Lv 27
  "Grande Internazionale",   // Lv 28
  "World Class",             // Lv 29
  "Stella del Bridge",       // Lv 30
  "Leggenda",                // Lv 31
  "Mito del Bridge",         // Lv 32
  "Immortale",               // Lv 33
  "Diamante",                // Lv 34
  "Grande Campione",         // Lv 35
  "Campione Azzurro",        // Lv 36
];

const defaultCorrectMessages = [
  "Bravo! Ben ragionato.", "Esatto! Ottima risposta.",
  "Perfetto! Continua così.", "Giusto! Stai imparando veloce.",
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
      "Piccolo Bridgista",     // Lv  1
      "Esploratore",           // Lv  2
      "Avventuriero",          // Lv  3
      "Scopritore",            // Lv  4
      "Sfidante",              // Lv  5
      "Coraggioso",            // Lv  6
      "Cavaliere",             // Lv  7
      "Guerriero",             // Lv  8
      "Tattico",               // Lv  9
      "Stratega",              // Lv 10
      "Paladino",              // Lv 11
      "Campione",              // Lv 12
      "Super Campione",        // Lv 13
      "Eroe",                  // Lv 14
      "Super Eroe",            // Lv 15
      "Fenomeno",              // Lv 16
      "Prodigio",              // Lv 17
      "Genio",                 // Lv 18
      "Mago del Bridge",       // Lv 19
      "Ninja delle Carte",     // Lv 20
      "Samurai",               // Lv 21
      "Drago",                 // Lv 22
      "Fenice",                // Lv 23
      "Titano",                // Lv 24
      "Semidio",               // Lv 25
      "Dio delle Carte",       // Lv 26
      "Leggenda Vivente",      // Lv 27
      "Mito Cosmico",          // Lv 28
      "Stella Galattica",      // Lv 29
      "Supernova",             // Lv 30
      "Imperatore",            // Lv 31
      "Re del Bridge",         // Lv 32
      "Onnisciente",           // Lv 33
      "Campione Universale",   // Lv 34
      "Onnipotente",           // Lv 35
      "Campione Galattico",    // Lv 36
    ],
    correctMessages: [
      "SPACCA! 💥", "SEI UN MITO! 🌟", "PERFETTO! 🔥",
      "GENIALE! ⚡", "BOOM! 💣", "INCREDIBILE! 🚀",
    ],
    wrongMessage: "Oops! Non mollare, il prossimo è tuo! 💪",
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
    fontBump: 0.25,
    showTimer: false,
    timerSeconds: 0,
    showCombo: false,
    showEncouragement: true,
    xpLabel: "Punti",
    contentClasses: "text-[1.125rem] leading-[1.85]",
    quizTransition: "fade",
    showHints: true,
    levelNames: defaultLevelNames,
    correctMessages: [
      "Ottimo lavoro!", "Risposta corretta!",
      "Ben fatto!", "Esatto, complimenti!",
    ],
    wrongMessage: "Nessun problema! Leggi la spiegazione e la prossima volta andrà meglio.",
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

function subscribeProfile(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getProfileSnapshot(): UserProfile {
  try {
    const stored = localStorage.getItem("bq_profile") as UserProfile | null;
    if (stored && configs[stored]) return stored;
  } catch {}
  return "adulto";
}

function getProfileServerSnapshot(): UserProfile {
  return "adulto";
}

export function useProfile(): ProfileConfig {
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot,
  );
  return configs[profile];
}

export function getProfileConfig(profile: UserProfile): ProfileConfig {
  return configs[profile] || configs.adulto;
}
