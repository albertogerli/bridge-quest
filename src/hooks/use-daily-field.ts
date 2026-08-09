"use client";

/**
 * Field comparison for the Mano del Giorno: everyone plays the same hand, so
 * after finishing we can show how the user's result stacks up against the
 * rest of today's field ("hai fatto meglio del 72% dei giocatori").
 *
 * Reads the anonymous, per-result distribution from the `get_daily_field_stats`
 * RPC (see scripts/sql/daily_field_stats.sql) and computes the percentile
 * client-side. Requires login; silently returns null otherwise.
 */

import { useEffect, useState } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { createClient } from "@/lib/supabase/client";

export interface DailyFieldStats {
  /** Distinct users who played this date (first attempts only) */
  players: number;
  /** 0..100 — share of the rest of the field you beat (ties count half) */
  percentile: number;
  /** Best contract delta in the field */
  best: number;
}

interface FieldRow {
  result: number;
  players: number;
}

export function useDailyFieldStats(
  date: string,
  myResult: number | null
): DailyFieldStats | null {
  const { user } = useSharedAuth();
  const [stats, setStats] = useState<DailyFieldStats | null>(null);

  useEffect(() => {
    if (!user?.id || myResult === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset dello stato prima del fetch asincrono dei dati di campo
      setStats(null);
      return;
    }
    let active = true;
    const supabase = createClient();
    supabase
      .rpc("get_daily_field_stats", { p_date: date })
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const rows = data as FieldRow[];
        const total = rows.reduce((sum, r) => sum + r.players, 0);
        // A field of one (just you) isn't a comparison
        if (total < 2) return;

        const beaten = rows
          .filter((r) => r.result < myResult)
          .reduce((sum, r) => sum + r.players, 0);
        // Players tied with you, excluding yourself; ties count half
        const tied = Math.max(
          0,
          (rows.find((r) => r.result === myResult)?.players ?? 0) - 1
        );
        const others = total - 1;
        const percentile = Math.round(((beaten + tied * 0.5) / others) * 100);
        const best = Math.max(...rows.map((r) => r.result));

        setStats({ players: total, percentile, best });
      });
    return () => {
      active = false;
    };
  }, [user?.id, date, myResult]);

  return stats;
}
