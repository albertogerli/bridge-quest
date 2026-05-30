/**
 * XP utility functions — prevents duplicate XP awards.
 *
 * Each completed game/hand gets tracked by a unique ID so replaying
 * the same content only awards XP the first time.
 */

import { hapticSuccess } from "@/lib/native-bridge";
import { useGameStore } from "@/store/use-game-store";

const COMPLETED_KEY = "bq_completed_games";

/** Check if a specific game/hand has already been completed and XP awarded */
export function isGameCompleted(gameId: string): boolean {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (!raw) return false;
    const completed: string[] = JSON.parse(raw);
    return completed.includes(gameId);
  } catch {
    return false;
  }
}

/**
 * Award XP for a completed game. Returns the XP actually awarded (0 if already completed).
 * Also increments the hands_played counter on first completion.
 */
export function awardGameXp(gameId: string, xp: number): number {
  try {
    // Check if already completed
    const raw = localStorage.getItem(COMPLETED_KEY);
    const completed: string[] = raw ? JSON.parse(raw) : [];

    if (completed.includes(gameId)) {
      // Already completed — no XP
      return 0;
    }

    // Check bonus mode (2x XP) — must be checked before awarding
    let xpToAward = xp;
    const bonusMode = localStorage.getItem('bq_bonus_mode') === '1';
    if (bonusMode) {
      xpToAward *= 2;
      localStorage.removeItem('bq_bonus_mode');
    }

    // Award XP + count hand via the game store
    const store = useGameStore.getState();
    store.addXp(xpToAward);
    store.recordHandPlayed();
    localStorage.setItem("bq_last_hand_ts", String(Date.now()));

    // Increment daily hand counter
    const today = new Date().toISOString().slice(0, 10);
    const ht = parseInt(localStorage.getItem(`bq_hands_today_${today}`) || "0", 10);
    localStorage.setItem(`bq_hands_today_${today}`, String(ht + 1));

    // Mark as completed (keep max 500 entries to avoid bloat)
    completed.push(gameId);
    if (completed.length > 500) completed.splice(0, completed.length - 500);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));

    hapticSuccess();
    return xpToAward;
  } catch {
    return 0;
  }
}

/**
 * Award XP for a REPEATABLE practice mode (MiniBridge, guided hands, mini-games).
 * Unlike awardGameXp, it pays out every time you play — but caps the total per
 * (mode, day) to prevent grinding. Returns the XP actually awarded.
 */
export function awardPracticeXp(gameKey: string, xp: number, dailyCapXp = 200): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const capKey = `bq_practice_xp_${gameKey}_${today}`;
    const earnedToday = parseInt(localStorage.getItem(capKey) || "0", 10);
    const remaining = Math.max(0, dailyCapXp - earnedToday);

    const store = useGameStore.getState();
    // Always count the hand played, even once the daily cap is hit.
    store.recordHandPlayed();
    localStorage.setItem("bq_last_hand_ts", String(Date.now()));
    const ht = parseInt(localStorage.getItem(`bq_hands_today_${today}`) || "0", 10);
    localStorage.setItem(`bq_hands_today_${today}`, String(ht + 1));

    if (remaining <= 0) return 0;

    let xpToAward = xp;
    const bonusMode = localStorage.getItem("bq_bonus_mode") === "1";
    if (bonusMode) {
      xpToAward *= 2;
      localStorage.removeItem("bq_bonus_mode");
    }
    xpToAward = Math.min(xpToAward, remaining);

    store.addXp(xpToAward);
    localStorage.setItem(capKey, String(earnedToday + xpToAward));
    hapticSuccess();
    return xpToAward;
  } catch {
    return 0;
  }
}
