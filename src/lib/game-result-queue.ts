import type { GameResult } from "@/hooks/use-game-results";
import type { Platform } from "@/lib/native-bridge";

export const RESULT_PREFIX = "bq_game_result_v2:";
export interface PendingGameResult extends GameResult {
  id: string;
  owner: string | null;
  timestamp: string;
  platform: Platform;
}

/** One key per event: concurrent tabs cannot overwrite a shared queue array. */
export function createResultQueue(storage: Storage, send: (entry: PendingGameResult) => Promise<void>) {
  const flights = new Map<string, Promise<void>>();
  function pending(owner: string | null): PendingGameResult[] {
    const entries: PendingGameResult[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(RESULT_PREFIX)) continue;
      try {
        const entry = JSON.parse(storage.getItem(key) ?? "null") as PendingGameResult | null;
        if (entry && entry.owner === owner && key === RESULT_PREFIX + entry.id
          && typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp))
          && typeof entry.gameType === "string" && typeof entry.score === "number" && Number.isFinite(entry.score)) entries.push(entry);
      } catch { /* Malformed local data is preserved, never sent or deleted. */ }
    }
    return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  return {
    pending,
    enqueue(result: GameResult, owner: string | null, platform: Platform): PendingGameResult {
      const entry = { ...result, id: crypto.randomUUID(), owner, timestamp: new Date().toISOString(), platform };
      // Never silently discard old events to make room. The caller reports storage failure.
      storage.setItem(RESULT_PREFIX + entry.id, JSON.stringify(entry));
      return entry;
    },
    flush(owner: string): Promise<void> {
      const active = flights.get(owner);
      if (active) return active;
      const job = (async () => {
        while (true) {
          const entry = pending(owner)[0];
          if (!entry) break;
          // A lost response keeps exactly the same UUID for the next retry.
          await send(entry);
          storage.removeItem(RESULT_PREFIX + entry.id);
        }
      })().finally(() => flights.delete(owner));
      flights.set(owner, job);
      return job;
    },
  };
}
