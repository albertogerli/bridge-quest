/**
 * Persistenza del torneo settimanale: localStorage (risultato e progresso in
 * corso) e Supabase (`tournament_results` + classifica).
 *
 * Estratta da `src/app/gioca/torneo/page.tsx` senza cambi di comportamento: le
 * decisioni sono nelle funzioni pure di `@/lib/tournament-stats`, qui resta solo
 * l'I/O (che fallisce sempre in silenzio, come prima).
 */

import { decideProgressRestore } from "@/lib/tournament-stats";
import type { Smazzata } from "@/lib/catalog";
import type {
  HandResult,
  LeaderboardEntry,
  TournamentProgress,
  TournamentResult,
} from "./_types";

// ─── localStorage: risultato della settimana ────────────────────────────────

export function getTournamentResult(weekNum: number): TournamentResult | null {
  try {
    const raw = localStorage.getItem(`bq_tournament_week_${weekNum}`);
    if (!raw) return null;
    return JSON.parse(raw) as TournamentResult;
  } catch {
    return null;
  }
}

export function saveTournamentResult(result: TournamentResult) {
  try {
    localStorage.setItem(
      `bq_tournament_week_${result.weekNum}`,
      JSON.stringify(result)
    );
  } catch {}
}

// ─── localStorage: torneo in corso ──────────────────────────────────────────

function progressKey(weekNum: number): string {
  return `bq_tournament_week_${weekNum}_progress`;
}

export function getTournamentProgress(weekNum: number): TournamentProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(weekNum));
    if (!raw) return null;
    return JSON.parse(raw) as TournamentProgress;
  } catch {
    return null;
  }
}

export function saveTournamentProgress(progress: TournamentProgress) {
  try {
    localStorage.setItem(progressKey(progress.weekNum), JSON.stringify(progress));
  } catch {}
}

export function clearTournamentProgress(weekNum: number) {
  try {
    localStorage.removeItem(progressKey(weekNum));
  } catch {}
}

/**
 * Restore saved hand results if they match the current hand set.
 * Nel rigioco senza punti (`alreadyPlayed`) non si riprende nulla.
 */
export function restoreProgress(
  weekNum: number,
  hands: Smazzata[],
  alreadyPlayed = false,
): HandResult[] {
  const decision = decideProgressRestore(getTournamentProgress(weekNum), hands, alreadyPlayed);
  if (decision.action === "clear") {
    clearTournamentProgress(weekNum);
    return [];
  }
  return decision.action === "restore" ? decision.handResults : [];
}

// ─── Supabase ───────────────────────────────────────────────────────────────

/** Try to save to Supabase (gracefully fail if table doesn't exist) */
export async function saveTournamentToSupabase(result: TournamentResult) {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from("tournament_results").upsert(
      {
        user_id: session.user.id,
        week_num: result.weekNum,
        total_tricks: result.totalTricks,
        total_needed: result.totalNeeded,
        completed_at: result.completedAt,
      },
      { onConflict: "user_id,week_num" }
    );
  } catch {
    // Gracefully handle: table may not exist yet
  }
}

/** Try to fetch leaderboard from Supabase */
export async function fetchLeaderboard(
  weekNum: number
): Promise<LeaderboardEntry[] | null> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tournament_results")
      .select("total_tricks, total_needed, profiles(display_name)")
      .eq("week_num", weekNum)
      .order("total_tricks", { ascending: false })
      .limit(20);

    if (error || !data) return null;

    return data.map((row: Record<string, unknown>) => ({
      displayName:
        (row.profiles as Record<string, string> | null)?.display_name ||
        "Giocatore",
      totalTricks: row.total_tricks as number,
      totalNeeded: row.total_needed as number,
    }));
  } catch {
    return null;
  }
}
