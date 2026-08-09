/**
 * Tipi del modulo di lezione.
 *
 * Estratti da `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` (refactoring a
 * comportamento invariato): le cartelle `_types`/`_components` con underscore
 * non producono rotte in App Router, quindi restano colocate alla pagina che
 * le usa. Le funzioni pure stanno in `@/lib/lesson-module`.
 */

import type { ProfileConfig } from "@/hooks/use-profile";
import type { ContentBlock } from "@/lib/catalog";

/** Modulo interrotto a metà, salvato su `bq_module_draft_<lezione>_<modulo>`. */
export interface ModuleDraft {
  currentStep: number;
  quizAnswers: Record<number, number>;
  showExplanation: Record<number, boolean>;
  xpEarned: number;
  lives: number;
  correctStreak: number;
  bestStreak: number;
  savedAt: string;
}

/** Power-up disponibili nel modulo, uno per tipo. */
export interface Powerups {
  fiftyFifty: number;
  skip: number;
  extraTime: number;
}

/** XP che vola via dal punto del tocco. */
export interface FloatingXp {
  id: number;
  amount: number;
  x: number;
  y: number;
}

/** Emoji che esplode alla risposta corretta (profilo giovane). */
export interface Particle {
  id: number;
  x: number;
  y: number;
}

/**
 * Stato e azioni condivisi da tutti i blocchi di contenuto interattivi.
 * Raccolti in un oggetto solo: i blocchi ne usano fette diverse e passarli
 * uno a uno moltiplicherebbe le prop senza aggiungere informazione.
 */
export interface ModuleBlockContext {
  profile: ProfileConfig;
  isJunior: boolean;
  glossaryTermMap: Map<string, string>;
  quizAnswers: Record<number, number>;
  showExplanation: Record<number, boolean>;
  shuffledQuizOptions: Record<number, number[]>;
  eliminated: Record<number, number[]>;
  showHint: Record<number, boolean>;
  powerups: Powerups;
  quizTimer: number;
  correctStreak: number;
  totalQuizzes: number;
  revealHint: (blockIndex: number) => void;
  handleQuizAnswer: (blockIndex: number, answerIndex: number) => void;
  handleCardSelect: (blockIndex: number, cardIndex: number, correct: boolean) => void;
  handleHandEval: (blockIndex: number, points: number, correct: boolean) => void;
  consumeFiftyFifty: (blockIndex: number) => void;
  consumeSkip: (blockIndex: number) => void;
  consumeExtraTime: () => void;
}

/** Prop uniformi di ogni componente-blocco, così lo switch resta banale. */
export interface ContentBlockProps {
  block: ContentBlock;
  blockIndex: number;
  /** Ritardo di entrata dell'animazione, saturato dopo il quarto blocco. */
  delay: number;
  ctx: ModuleBlockContext;
}
