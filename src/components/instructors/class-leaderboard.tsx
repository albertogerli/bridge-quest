"use client";

import { useEffect, useState } from "react";
import { getClassLeaderboard, type LeaderboardRow } from "@/lib/instructors";

function fmtTime(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

/** Class-wide leaderboard: hands kept on the 1st attempt → tricks → speed.
 *  Pass highlightUserId to highlight the viewing student's own row. */
export function ClassLeaderboard({
  classId,
  highlightUserId,
}: {
  classId: string;
  highlightUserId?: string;
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const r = await getClassLeaderboard(classId);
        if (active) setRows(r);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Errore nel caricamento della classifica");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [classId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }
  if (error) return <p className="py-4 text-center text-sm text-destructive">{error}</p>;
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nessun risultato ancora — giocate qualche compito per entrare in classifica! 🏆
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Allievo</th>
            <th className="px-2 py-2 text-center font-semibold">Mantenute</th>
            <th className="px-2 py-2 text-center font-semibold">Prese</th>
            <th className="px-2 py-2 text-center font-semibold">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const me = !!highlightUserId && r.student_id === highlightUserId;
            return (
              <tr
                key={r.student_id}
                className={`border-b border-border last:border-0 ${me ? "bg-primary/5 font-semibold" : ""}`}
              >
                <td className="px-3 py-2 text-left text-base">{medal(i)}</td>
                <td className="px-3 py-2">
                  {r.student_name ?? "Allievo"}
                  {me && <span className="ml-1 text-xs text-primary">(tu)</span>}
                </td>
                <td className="px-2 py-2 text-center">
                  <span className="font-bold text-emerald-600">{r.hands_made}</span>
                  <span className="text-muted-foreground">/{r.hands_played}</span>
                </td>
                <td className="px-2 py-2 text-center">{r.total_tricks}</td>
                <td className="px-2 py-2 text-center text-muted-foreground">{fmtTime(r.total_ms)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
        Ordine: mani mantenute al 1° tentativo → prese totali → velocità.
      </p>
    </div>
  );
}
