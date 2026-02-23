/**
 * XP utility functions — prevents duplicate XP awards.
 *
 * Each completed game/hand gets tracked by a unique ID so replaying
 * the same content only awards XP the first time.
 */

const COMPLETED_KEY = "bq_completed_games";
const XP_KEY = "bq_xp";
const HANDS_KEY = "bq_hands_played";

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

    // Award XP
    const prev = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
    localStorage.setItem(XP_KEY, String(prev + xp));

    // Increment hands played
    const hp = parseInt(localStorage.getItem(HANDS_KEY) || "0", 10);
    localStorage.setItem(HANDS_KEY, String(hp + 1));

    // Mark as completed (keep max 500 entries to avoid bloat)
    completed.push(gameId);
    if (completed.length > 500) completed.splice(0, completed.length - 500);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));

    return xp;
  } catch {
    return 0;
  }
}
