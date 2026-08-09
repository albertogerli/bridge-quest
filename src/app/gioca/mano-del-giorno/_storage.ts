/**
 * Persistenza su localStorage della Mano del Giorno: esito per data, serie di
 * giorni consecutivi e totale delle mani giocate.
 *
 * Estratta da `src/app/gioca/mano-del-giorno/page.tsx` senza cambi di
 * comportamento: le decisioni sono nelle funzioni pure di `@/lib/daily-hand`,
 * qui resta solo l'I/O (che fallisce sempre in silenzio, come prima).
 */

import {
  effectiveStreak,
  getTodayString,
  getYesterdayString,
  nextStreak,
} from "@/lib/daily-hand";
import type { DailyResult } from "./_types";

const STREAK_KEY = "bq_daily_hand_streak";
const TOTAL_KEY = "bq_daily_hand_total";

function resultKey(dateStr: string): string {
  return `bq_daily_hand_${dateStr}`;
}

export function getDailyResult(dateStr: string): DailyResult | null {
  try {
    const raw = localStorage.getItem(resultKey(dateStr));
    if (!raw) return null;
    return JSON.parse(raw) as DailyResult;
  } catch {
    return null;
  }
}

export function saveDailyResult(dateStr: string, result: DailyResult) {
  try {
    localStorage.setItem(resultKey(dateStr), JSON.stringify(result));

    // Update streak
    const yesterday = getYesterdayString(Date.now());
    const yesterdayResult = getDailyResult(yesterday);
    const prevStreak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
    localStorage.setItem(
      STREAK_KEY,
      String(nextStreak(prevStreak, !!yesterdayResult))
    );

    // Update total
    const prevTotal = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10);
    localStorage.setItem(TOTAL_KEY, String(prevTotal + 1));
  } catch {}
}

/**
 * Serie di giorni consecutivi, ricalcolata in lettura: il valore salvato viene
 * aggiornato solo da `saveDailyResult`, quindi dopo giorni saltati resterebbe
 * quello vecchio finché non si torna a giocare.
 */
export function getDailyStreak(nowMs: number = Date.now()): number {
  try {
    const stored = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
    return effectiveStreak(
      stored,
      !!getDailyResult(getTodayString(nowMs)),
      !!getDailyResult(getYesterdayString(nowMs))
    );
  } catch {
    return 0;
  }
}

export function getDailyTotal(): number {
  try {
    return parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10);
  } catch {
    return 0;
  }
}
