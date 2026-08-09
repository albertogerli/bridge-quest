/**
 * Tipi e costanti del torneo settimanale.
 *
 * Estratti da `src/app/gioca/torneo/page.tsx` (refactoring a comportamento
 * invariato): la cartella `_types`/`_components` con underscore non produce
 * rotte in App Router, quindi resta colocata alla pagina che la usa.
 */

/** Mani giocate in un torneo settimanale. */
export const TOURNAMENT_HAND_COUNT = 5;

/** Durata di una settimana in ms. */
export const EPOCH_MS = 7 * 24 * 60 * 60 * 1000; // one week in ms

/** Epoch starts from Monday 2024-01-01 (a Monday) to align weeks */
export const EPOCH_START = new Date("2024-01-01T00:00:00Z").getTime();

/** Esito di una singola mano del torneo. */
export interface HandResult {
  smazzataId: string;
  tricksMade: number;
  tricksNeeded: number;
  result: number; // +N or -N
}

/** Torneo concluso, salvato su localStorage (`bq_tournament_week_<n>`). */
export interface TournamentResult {
  weekNum: number;
  totalTricks: number;
  totalNeeded: number;
  handResults: HandResult[];
  completedAt: string;
  xpEarned: number;
}

// ── In-progress state ──
// Su mobile la pagina viene spesso scartata (standby, cambio app): senza
// persistenza il torneo ripartiva dalla mano 1 perdendo le mani già giocate.

/** Torneo interrotto a metà (`bq_tournament_week_<n>_progress`). */
export interface TournamentProgress {
  weekNum: number;
  handIds: string[]; // per invalidare il progresso se il set di mani cambia
  handResults: HandResult[];
}

/** Riga di classifica settimanale. */
export interface LeaderboardEntry {
  displayName: string;
  totalTricks: number;
  totalNeeded: number;
}
