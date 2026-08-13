/**
 * Persistenza del torneo settimanale: localStorage (risultato e progresso in
 * corso) e Supabase (`tournament_results` + classifica).
 *
 * Estratta da `src/app/gioca/torneo/page.tsx` senza cambi di comportamento: le
 * decisioni sono nelle funzioni pure di `@/lib/tournament-stats`, qui resta solo
 * l'I/O (che fallisce sempre in silenzio, come prima).
 */

import { decideProgressRestore, mergeHistory } from "@/lib/tournament-stats";
import type { Smazzata } from "@/lib/catalog";
import type {
  HandResult,
  LeaderboardEntry,
  TournamentHistoryEntry,
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

/**
 * Tutte le settimane concluse su QUESTO dispositivo.
 *
 * Serve come rete: chi ha giocato prima che i risultati finissero sul server,
 * o da sloggato, ha il proprio torneo solo qui. Meglio mostrarlo senza
 * posizione che dirgli che non ha mai giocato.
 */
export function getLocalTournamentHistory(): TournamentHistoryEntry[] {
  const out: TournamentHistoryEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Solo i risultati conclusi: `..._progress` è un torneo a metà.
      const m = key?.match(/^bq_tournament_week_(\d+)$/);
      if (!m) continue;
      const raw = localStorage.getItem(key!);
      if (!raw) continue;
      const r = JSON.parse(raw) as TournamentResult;
      if (typeof r?.totalTricks !== "number") continue;
      out.push({
        weekNum: Number(m[1]),
        totalTricks: r.totalTricks,
        totalNeeded: r.totalNeeded,
        completedAt: r.completedAt ?? null,
        posizione: null,
        partecipanti: null,
      });
    }
  } catch {}
  return out;
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

/**
 * Storico personale: le settimane già giocate, con posizione e partecipanti.
 *
 * Due sorgenti, unite: il server sa di tutti i dispositivi e sa dire «5º su
 * 49»; il localStorage copre chi ha giocato prima che il salvataggio remoto
 * esistesse. Se la funzione sul database non c'è ancora, resta il locale — la
 * schermata perde la posizione, non il risultato.
 */
export async function fetchMyTournamentHistory(
  limite = 12
): Promise<TournamentHistoryEntry[]> {
  const locali = getLocalTournamentHistory();
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("my_tournament_history", { limite });
    if (error || !data) return mergeHistory(locali, []).slice(0, limite);

    const remoti: TournamentHistoryEntry[] = (data as Record<string, unknown>[]).map((r) => ({
      weekNum: r.week_num as number,
      totalTricks: r.total_tricks as number,
      totalNeeded: r.total_needed as number,
      completedAt: (r.completed_at as string | null) ?? null,
      posizione: (r.posizione as number | null) ?? null,
      partecipanti: (r.partecipanti as number | null) ?? null,
    }));
    return mergeHistory(locali, remoti).slice(0, limite);
  } catch {
    return mergeHistory(locali, []).slice(0, limite);
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
