import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getDailyResult,
  getDailyStreak,
  getDailyTotal,
  saveDailyResult,
} from "@/app/gioca/mano-del-giorno/_storage";
import { dateToIndex, getTodayString, getYesterdayString } from "@/lib/daily-hand";
import type { DailyResult } from "@/app/gioca/mano-del-giorno/_types";

/**
 * Persistenza della Mano del Giorno.
 *
 * `_storage.ts` è l'unico punto in cui le decisioni pure di `@/lib/daily-hand`
 * incontrano `localStorage`: la serie giornaliera va ricalcolata in lettura, e
 * lo stato «già giocata» deve restare indicizzato per data (non per mano),
 * altrimenti cambiare la formula di selezione lo azzererebbe.
 *
 * I test girano in node, dove `localStorage` non esiste: se ne installa uno
 * minimo in memoria.
 */

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const REAL_TZ = process.env.TZ;

beforeEach(() => {
  // Fuso fissato: le chiavi sono giorni civili locali.
  process.env.TZ = "Europe/Rome";
  (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
});

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
  if (REAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = REAL_TZ;
});

function result(overrides: Partial<DailyResult> = {}): DailyResult {
  return {
    played: true,
    tricks: 9,
    made: true,
    result: 0,
    stars: 2,
    xpEarned: 100,
    ...overrides,
  };
}

/** Mezzogiorno locale del giorno indicato (nessuna ambiguità sul cambio data). */
function noon(year: number, monthIndex: number, day: number): number {
  return new Date(year, monthIndex, day, 12, 0, 0).getTime();
}

describe("serie giornaliera ricalcolata in lettura", () => {
  it("resta viva se la mano di oggi è stata giocata", () => {
    const now = noon(2026, 7, 9);
    localStorage.setItem("bq_daily_hand_streak", "7");
    localStorage.setItem(
      `bq_daily_hand_${getTodayString(now)}`,
      JSON.stringify(result())
    );
    expect(getDailyStreak(now)).toBe(7);
  });

  it("resta viva se l'ultima giocata è di ieri", () => {
    const now = noon(2026, 7, 9);
    localStorage.setItem("bq_daily_hand_streak", "7");
    localStorage.setItem(
      `bq_daily_hand_${getYesterdayString(now)}`,
      JSON.stringify(result())
    );
    expect(getDailyStreak(now)).toBe(7);
  });

  it("torna a zero dopo un giorno saltato, anche senza rigiocare", () => {
    const now = noon(2026, 7, 9);
    localStorage.setItem("bq_daily_hand_streak", "7");
    // Ultima giocata: l'altro ieri.
    localStorage.setItem(
      `bq_daily_hand_${getTodayString(noon(2026, 7, 7))}`,
      JSON.stringify(result())
    );
    expect(getDailyStreak(now)).toBe(0);
  });

  it("senza nessuna giocata non mostra nulla", () => {
    expect(getDailyStreak(noon(2026, 7, 9))).toBe(0);
  });
});

describe("saveDailyResult", () => {
  it("registra l'esito sotto la data e incrementa il totale", () => {
    const now = noon(2026, 7, 9);
    const today = getTodayString(now);
    saveDailyResult(today, result({ result: 1 }));

    expect(getDailyResult(today)?.result).toBe(1);
    expect(getDailyTotal()).toBe(1);
    expect(getDailyStreak(now)).toBe(1);
  });

  it("prosegue la serie di chi ha giocato ieri", () => {
    const now = noon(2026, 7, 9);
    localStorage.setItem("bq_daily_hand_streak", "4");
    localStorage.setItem(
      `bq_daily_hand_${getYesterdayString(now)}`,
      JSON.stringify(result())
    );

    saveDailyResult(getTodayString(now), result());
    expect(getDailyStreak(now)).toBe(5);
  });

  it("riparte da 1 per chi aveva saltato ieri", () => {
    const now = noon(2026, 7, 9);
    localStorage.setItem("bq_daily_hand_streak", "9");
    saveDailyResult(getTodayString(now), result());
    expect(getDailyStreak(now)).toBe(1);
  });
});

describe("stato «già giocata oggi»", () => {
  /**
   * `dateToIndex` è cambiata (hash miscelato), quindi la mano associata a oggi
   * è un'altra. Lo stato «già giocata» però è indicizzato per data e non per
   * mano: chi aveva già giocato deve continuare a risultare tale, e non deve
   * poter incassare due volte il bonus giornaliero.
   */
  it("resta sulla chiave `bq_daily_hand_<data>`, che non dipende dalla mano", () => {
    const now = noon(2026, 7, 9);
    const today = getTodayString(now);

    // Chiave scritta dalla versione precedente dell'app: la formula di
    // `dateToIndex` è cambiata, quella della chiave no. Se ci finisse dentro
    // l'indice della mano, tutti risulterebbero «non ancora giocata» e il
    // bonus giornaliero si potrebbe incassare due volte.
    localStorage.setItem(`bq_daily_hand_${today}`, JSON.stringify(result()));
    expect(getDailyResult(today)).not.toBeNull();
    expect(dateToIndex(today, 40)).toBeLessThan(40);

    // E non contagia le altre date.
    expect(getDailyResult(getYesterdayString(now))).toBeNull();
  });
});
