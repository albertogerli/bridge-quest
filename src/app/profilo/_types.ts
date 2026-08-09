/**
 * Tipi e costanti della pagina profilo.
 *
 * Estratti da `src/app/profilo/page.tsx` (refactoring a comportamento
 * invariato): la cartella `_types`/`_components` con underscore non produce
 * rotte in App Router, quindi resta colocata alla pagina che la usa.
 */

import type { CourseId } from "@/lib/catalog";

/** Prefisso delle chiavi localStorage dell'app (usato da logout ed eliminazione account). */
export const BQ_KEYS_PREFIX = "bq_";

/** Etichette dei giorni indicizzate come `Date.getDay()` (0 = domenica). */
export const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

// ── Chart 1: partite per giorno (ultimi 7 giorni) ───────────────────────────
//
// Fonte: `bq_game_history` (storico durevole delle mani giocate). Prima si
// usava `bq_game_results_queue`, che è la coda dei risultati NON ancora
// sincronizzati: si svuota al primo flush verso Supabase e azzerava il
// grafico. Lo storico non registra gli XP della singola partita, quindi il
// grafico conta le partite — che è ciò che quella fonte sa davvero.

export interface GamesDay {
  label: string;
  games: number;
  date: string;
}

export interface GamesPerDay {
  days: GamesDay[];
  maxGames: number;
  hasData: boolean;
}

// ── Chart 2: competenze per corso ───────────────────────────────────────────

export interface CourseCompetenceConfig {
  id: CourseId;
  name: string;
  color: string;
  bgClass: string;
}

export const COURSE_COMPETENCE_CONFIGS: CourseCompetenceConfig[] = [
  { id: "fiori", name: "Fiori", color: "#059669", bgClass: "bg-emerald-500" },
  { id: "quadri", name: "Quadri", color: "#f97316", bgClass: "bg-orange-500" },
  { id: "cuori-gioco", name: "Cuori Gioco", color: "#f43f5e", bgClass: "bg-rose-500" },
  { id: "cuori-licita", name: "Cuori Licita", color: "#ec4899", bgClass: "bg-pink-500" },
];

export type CourseCompetence = CourseCompetenceConfig & {
  progress: number;
  completed: number;
  total: number;
};

// ── Chart 3: rendimento di gioco ────────────────────────────────────────────

export interface GamePerformanceStats {
  /** Partite dello storico `bq_game_history`, la stessa fonte dell'intestazione. */
  totalGames: number;
  /**
   * Streak di accessi CORRENTE. Il progetto non conserva il record storico
   * della streak: la card diceva "Streak migliore" mostrando questo numero.
   */
  currentStreak: number;
  timeDisplay: string;
  /** Media delle prese fatte per mano (dallo storico, come `totalGames`). */
  avgTricks: number;
}

// ── Badge ───────────────────────────────────────────────────────────────────

/** Chiave dell'icona del badge: la mappa chiave → icona vive nel componente. */
export type BadgeIconKey =
  | "spade"
  | "book-open-check"
  | "target"
  | "gamepad"
  | "flame"
  | "medal"
  | "star"
  | "globe"
  | "crown"
  | "graduation-cap"
  | "trophy";

export interface ProfileBadge {
  name: string;
  icon: BadgeIconKey;
  desc: string;
  earned: boolean;
}

// ── Progresso mondi / sfide ─────────────────────────────────────────────────

export interface WorldProgress {
  modules: number;
  completed: number;
  percent: number;
}

/** Esito di una sfida IMP dal punto di vista dell'utente corrente. */
export interface ChallengeOutcome {
  isChallenger: boolean;
  opponentName: string;
  myImps: number | null;
  theirImps: number | null;
  /** Entrambi i lati hanno un punteggio: solo allora l'esito è confrontabile. */
  scored: boolean;
  won: boolean;
  drawn: boolean;
  netImp: number;
}

/** Achievement segreto in attesa di essere mostrato nel popup. */
export interface PendingAchievement {
  id: string;
  name: string;
  icon: string;
  description: string;
}
