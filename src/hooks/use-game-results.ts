"use client";

import { useCallback, useEffect } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { getPlatform } from "@/lib/native-bridge";
import { createResultQueue } from "@/lib/game-result-queue";
import { reportError } from "@/lib/report-error";

export type GameType =
  | "mano-del-giorno" | "sfida" | "smazzata" | "torneo" | "quiz-lampo"
  | "conta-veloce" | "impasse" | "memory" | "trova-errore" | "mano-guidata"
  | "dichiara" | "pratica-licita" | "sfida-settimanale" | "segnali";

export interface GameResult {
  gameType: GameType;
  lessonId?: number;
  score: number;
  details?: Record<string, unknown>;
}

let queue: ReturnType<typeof createResultQueue> | undefined;
function resultQueue() {
  return queue ??= createResultQueue(localStorage, async (entry) => {
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !entry.owner || data.user?.id !== entry.owner) {
      throw new Error("Sessione non valida per il salvataggio del risultato");
    }
    // Existing UUID primary key + DO NOTHING: no new schema or UPDATE privilege.
    const { error } = await supabase.from("game_results").upsert({
      id: entry.id, user_id: entry.owner, game_type: entry.gameType,
      lesson_id: entry.lessonId ?? null, score: entry.score,
      details: entry.details ?? null, created_at: entry.timestamp, platform: entry.platform,
    }, { onConflict: "id", ignoreDuplicates: true });
    // Never log payload, user ID, or database details that could contain them.
    if (error) throw new Error("Salvataggio risultato rifiutato (" + (error.code ?? "database") + ")");
  });
}

async function flushResults(owner: string) {
  try {
    await resultQueue().flush(owner);
    window.dispatchEvent(new Event("bq_results_synced"));
  } catch (error) {
    reportError("game-results:sync", error);
    window.dispatchEvent(new Event("bq_results_pending"));
  }
}

/** Mounted once in the shell: pending events retry even after leaving a game. */
export function useResultQueueSync() {
  const { user } = useSharedAuth();
  const owner = user?.id ?? null;
  useEffect(() => {
    if (!owner) return;
    const retry = () => { void flushResults(owner); };
    retry();
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    window.addEventListener("bq_sync_retry", retry);
    const timer = setInterval(retry, 30_000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      window.removeEventListener("bq_sync_retry", retry);
    };
  }, [owner]);
}

export function useGameResults() {
  const { user } = useSharedAuth();
  const owner = user?.id ?? null;
  const saveGameResult = useCallback((result: GameResult) => {
    try {
      resultQueue().enqueue(result, owner, getPlatform());
      if (owner) void flushResults(owner);
    } catch {
      reportError("game-results:queue", new Error("Memoria locale non disponibile: risultato non accodato"));
      window.dispatchEvent(new Event("bq_results_pending"));
    }
  }, [owner]);
  return { saveGameResult };
}

/** Guest results stay on this device; never attribute an unknown legacy owner to the next login. */
export function saveGameResultDirect(result: GameResult) {
  try {
    resultQueue().enqueue(result, null, getPlatform());
  } catch {
    reportError("game-results:queue", new Error("Memoria locale non disponibile: risultato non accodato"));
  }
}
