"use client";

import { useCallback } from "react";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";

// ===== Types =====

export type GameType =
  | "mano-del-giorno"
  | "sfida"
  | "smazzata"
  | "torneo"
  | "quiz-lampo"
  | "conta-veloce"
  | "impasse"
  | "memory"
  | "trova-errore";

export interface GameResult {
  gameType: GameType;
  lessonId?: number;
  score: number;
  details?: Record<string, unknown>;
}

// localStorage key for offline queue
const LS_RESULTS_QUEUE = "bq_game_results_queue";

// ===== localStorage helpers =====

interface QueuedResult extends GameResult {
  timestamp: string;
}

function getQueue(): QueuedResult[] {
  try {
    const raw = localStorage.getItem(LS_RESULTS_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToQueue(result: GameResult) {
  try {
    const queue = getQueue();
    queue.push({ ...result, timestamp: new Date().toISOString() });
    // Keep max 200 entries to avoid localStorage bloat
    if (queue.length > 200) queue.splice(0, queue.length - 200);
    localStorage.setItem(LS_RESULTS_QUEUE, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable - silently ignore
  }
}

function clearQueue() {
  try {
    localStorage.removeItem(LS_RESULTS_QUEUE);
  } catch {}
}

// ===== Hook =====

export function useGameResults() {
  const { user } = useAuth();

  /**
   * Save a game result.
   * - Always saves to localStorage queue (for offline/guest users)
   * - If authenticated, also inserts to Supabase (fire-and-forget)
   * - On authenticated save, flushes any queued offline results too
   */
  const saveGameResult = useCallback(
    (result: GameResult) => {
      // 1. Always save to localStorage queue
      addToQueue(result);

      // 2. If authenticated, send to Supabase (fire-and-forget)
      if (user?.id) {
        const supabase = createClient();
        const userId = user.id;

        // Insert current result (fire-and-forget)
        Promise.resolve(
          supabase
            .from("game_results")
            .insert({
              user_id: userId,
              game_type: result.gameType,
              lesson_id: result.lessonId ?? null,
              score: result.score,
              details: result.details ?? null,
            })
        )
          .then(({ error }) => {
            if (error) {
              console.warn("[GameResults] Supabase insert error:", error.message);
            } else {
              // Successfully saved - flush any old queued results
              flushQueue(supabase, userId);
            }
          })
          .catch((err: unknown) => {
            console.warn("[GameResults] Supabase insert failed:", err);
          });
      }
    },
    [user]
  );

  return { saveGameResult };
}

// ===== Flush offline queue to Supabase =====

async function flushQueue(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  try {
    const queue = getQueue();
    if (queue.length <= 1) {
      // Only the result we just inserted (or empty) - clear and done
      clearQueue();
      return;
    }

    // Skip the last entry (we just inserted it directly above)
    const oldEntries = queue.slice(0, -1);
    if (oldEntries.length === 0) {
      clearQueue();
      return;
    }

    const rows = oldEntries.map((entry) => ({
      user_id: userId,
      game_type: entry.gameType,
      lesson_id: entry.lessonId ?? null,
      score: entry.score,
      details: entry.details ?? null,
      created_at: entry.timestamp,
    }));

    const { error } = await supabase.from("game_results").insert(rows);
    if (error) {
      console.warn("[GameResults] Queue flush error:", error.message);
      // Don't clear queue on error - will retry next time
      return;
    }

    // Success - clear the queue
    clearQueue();
  } catch (err) {
    console.warn("[GameResults] Queue flush failed:", err);
  }
}

// ===== Standalone function (for use outside React components) =====

/**
 * Save a game result without the hook.
 * Only saves to localStorage queue. Use for contexts where
 * the auth hook isn't available.
 */
export function saveGameResultDirect(result: GameResult) {
  addToQueue(result);
}
