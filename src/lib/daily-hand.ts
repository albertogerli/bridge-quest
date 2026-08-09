/**
 * Funzioni pure della Mano del Giorno (selezione deterministica per data,
 * punteggi/XP, serie giornaliera, formattazioni).
 *
 * Estratte da `src/app/gioca/mano-del-giorno/page.tsx` senza cambi di
 * comportamento: la logica è identica riga per riga, qui è solo testabile in
 * isolamento (`src/lib/daily-hand.test.ts`). Le letture di `localStorage` e
 * l'orologio di sistema restano nel chiamante e vengono passati come argomenti.
 */

import type { Position } from "@/lib/bridge-engine";
import type { Smazzata, Vulnerability } from "@/lib/catalog";

/** Bonus XP riconosciuto una sola volta al giorno sulla mano di oggi. */
export const DAILY_BONUS_XP = 50;

// ─── Date ───────────────────────────────────────────────────────────────────

/** Data odierna in formato `YYYY-MM-DD` (UTC, come `toISOString`). */
export function getTodayString(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** Data di ieri in formato `YYYY-MM-DD` (giorno civile locale, resa in UTC). */
export function getYesterdayString(nowMs: number): string {
  const d = new Date(nowMs);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Tempo mancante alla mezzanotte locale, in formato `HH:MM:SS`. */
export function formatTimeToMidnight(nowMs: number): string {
  const now = new Date(nowMs);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ─── Selezione della mano ───────────────────────────────────────────────────

/** Deterministic hash: same date -> same hand for all users */
export function dateToIndex(dateStr: string, poolSize: number): number {
  const hash = dateStr
    .split("-")
    .reduce((acc, n) => acc * 31 + parseInt(n), 0);
  return Math.abs(hash) % poolSize;
}

/** Mano associata alla data, o `null` se la pool non è ancora caricata. */
export function getSmazzataForDate(
  dateStr: string,
  pool: Smazzata[]
): Smazzata | null {
  if (pool.length === 0) return null;
  return pool[dateToIndex(dateStr, pool.length)];
}

// ─── Punteggi e XP ──────────────────────────────────────────────────────────

/** Stelle in base al bilancio prese fatte − necessarie. */
export function calcStars(resultDelta: number): number {
  if (resultDelta > 0) return 3;
  if (resultDelta === 0) return 2;
  return 1;
}

/** XP della singola mano: 30 base + 20 se mantenuto + 10 per surlevée. */
export function computeHandXp(resultDelta: number): number {
  return 30 + (resultDelta >= 0 ? 20 : 0) + Math.max(0, resultDelta) * 10;
}

/**
 * XP totale della mano: quella del giorno non ancora giocata aggiunge il bonus
 * giornaliero, il rigioco e la mano di ieri no.
 */
export function computeDailyXp(
  resultDelta: number,
  withDailyBonus: boolean
): number {
  return computeHandXp(resultDelta) + (withDailyBonus ? DAILY_BONUS_XP : 0);
}

/** Nuova serie di giorni consecutivi dopo aver giocato oggi. */
export function nextStreak(prevStreak: number, playedYesterday: boolean): number {
  return playedYesterday ? prevStreak + 1 : 1;
}

// ─── Formattazioni ──────────────────────────────────────────────────────────

const POSITION_LABELS_IT: Record<Position, string> = {
  north: "Nord",
  south: "Sud",
  east: "Est",
  west: "Ovest",
};

/** Posizione in italiano ("Nord", "Sud", "Est", "Ovest"). */
export function positionLabelIt(position: Position): string {
  return POSITION_LABELS_IT[position];
}

/** Contratto con dichiarante in italiano ("3NT Sud"). */
export function formatContractItalian(
  contract: string,
  declarer: Position
): string {
  return `${contract} ${POSITION_LABELS_IT[declarer]}`;
}

/** Vulnerabilità in italiano ("Nessuna", "N-S", "E-O", "Tutti"). */
export function formatVulnerability(vulnerability: Vulnerability): string {
  return vulnerability === "none"
    ? "Nessuna"
    : vulnerability === "ns"
      ? "N-S"
      : vulnerability === "ew"
        ? "E-O"
        : "Tutti";
}

const MONTHS_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

/** Data `YYYY-MM-DD` in forma estesa italiana ("8 Agosto 2026"). */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d)} ${MONTHS_IT[parseInt(m) - 1]} ${y}`;
}

/** Titolo dell'esito ("Fatto +1!", "Contratto Mantenuto!", "Caduto di 2"). */
export function resultHeadline(resultDelta: number): string {
  return resultDelta > 0
    ? `Fatto +${resultDelta}!`
    : resultDelta === 0
      ? "Contratto Mantenuto!"
      : `Caduto di ${Math.abs(resultDelta)}`;
}

/** Giudizio finale mostrato sotto il risultato di fine mano. */
export function resultVerdict(resultDelta: number): string {
  return resultDelta > 0
    ? "Eccellente! Più prese del necessario"
    : resultDelta === 0
      ? "Ben giocato! Contratto esatto"
      : resultDelta === -1
        ? "Quasi! Solo una presa in meno"
        : "Da rivedere - riprova la mano!";
}
