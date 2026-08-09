"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useAsdClubs } from "@/store/use-asd-store";
import { reportError } from "@/lib/report-error";
import { computeStats, countInstructors, mapProfilesToUsers } from "@/lib/admin-stats";
import type { GameStats, LoginRecord, ProfileRecord, Stats, UserRow } from "./_types";

export interface AdminData {
  users: UserRow[];
  stats: Stats | null;
  gameStats: GameStats | null;
  loginHistory: LoginRecord[];
  loading: boolean;
  fetchError: string | null;
  lastUpdated: Date | null;
  /** Ricarica i dati; `isBackground` evita lo spinner del refresh automatico. */
  fetchData: (isBackground?: boolean) => Promise<void>;
}

/**
 * Caricamento e derivazione dei dati della dashboard admin.
 *
 * Estratto da `src/app/admin/page.tsx` senza cambi di comportamento: stessa
 * sequenza di query, stesso fallback RPC → lettura diretta, stesso polling a
 * 30 secondi.
 */
export function useAdminData(): AdminData {
  const { user, loading: authLoading } = useSharedAuth();
  const { clubs: asdClubs } = useAsdClubs();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setFetchError(null);

    try {
      // I dati personali degli iscritti passano dalla RPC admin_list_users(),
      // protetta da is_admin() lato DB: le stesse colonne non sono più
      // leggibili dal client con la sessione dell'utente.
      // Il fallback sulla lettura diretta copre l'intervallo fra il deploy di
      // questo codice e l'esecuzione di scripts/sql/pii-columns-2026-08.sql.
      let allProfiles: ProfileRecord[] = [];
      // ATTENZIONE: PostgREST tronca OGNI risposta a 1000 righe, RPC incluse.
      // Senza questo ciclo il pannello mostrava esattamente 1000 utenti su
      // 1083 — un numero tondo e verosimile, quindi un errore che passa
      // inosservato. Si pagina finché una pagina torna incompleta.
      const RPC_PAGE = 1000;
      let rpcOk = true;
      for (let from = 0; ; from += RPC_PAGE) {
        const { data, error } = await supabase
          .rpc("admin_list_users")
          .range(from, from + RPC_PAGE - 1);

        if (error) {
          // RPC non ancora creata (o non autorizzata): si usa il fallback.
          rpcOk = false;
          allProfiles = [];
          break;
        }

        const page = (data ?? []) as ProfileRecord[];
        allProfiles = allProfiles.concat(page);
        if (page.length < RPC_PAGE) break;
      }

      if (!rpcOk) {
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, display_name, bbo_username, profile_type, xp, streak, hands_played, asd_code, asd_name, marketing_consent, total_minutes, created_at, last_login, platform, role")
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order("created_at", { ascending: false });

          if (error) {
            reportError("admin:fetch-profiles", error);
            setFetchError(`Errore DB: ${error.message}`);
            setLoading(false);
            return;
          }

          if (data && data.length > 0) {
            allProfiles = allProfiles.concat(data as ProfileRecord[]);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }
      }

      const profiles = allProfiles;

      // Fetch login history (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logins } = await supabase
        .from("login_history")
        .select("id, user_id, logged_in_at, platform")
        .gte("logged_in_at", thirtyDaysAgo)
        .order("logged_in_at", { ascending: false });
      setLoginHistory((logins as LoginRecord[]) ?? []);

      // Game stats — degrades gracefully if admin_game_stats.sql isn't installed
      try {
        const { data: gs, error: gsError } = await supabase.rpc("admin_game_stats");
        setGameStats(gsError ? null : ((gs as GameStats) ?? null));
      } catch {
        setGameStats(null);
      }

      // Instructor-portal counts: classes + distinct active students via the
      // admin-only RPC (degrades to 0 if admin_school_stats.sql isn't installed);
      // instructors counted from the profiles already loaded (role column).
      let schoolClasses = 0;
      let schoolStudents = 0;
      try {
        const { data: ss } = await supabase.rpc("admin_school_stats");
        if (ss) {
          schoolClasses = (ss as { classes?: number }).classes ?? 0;
          schoolStudents = (ss as { students?: number }).students ?? 0;
        }
      } catch {}
      const instructorsCount = countInstructors(profiles);

      if (profiles) {
        const mappedUsers = mapProfilesToUsers(profiles);
        setUsers(mappedUsers);

        setStats(
          computeStats({
            profiles,
            users: mappedUsers,
            logins: (logins as LoginRecord[]) ?? [],
            asdClubs,
            now: new Date(),
            instructors: instructorsCount,
            classes: schoolClasses,
            students: schoolStudents,
          }),
        );
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
      setFetchError(`Errore: ${err instanceof Error ? err.message : String(err)}`);
    }

    setLoading(false);
    setLastUpdated(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- asdClubs si popola async dallo store: includerlo rilancerebbe l'intero fetch admin a ogni load dei circoli
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData(false);
      const interval = setInterval(() => fetchData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user, fetchData]);

  return { users, stats, gameStats, loginHistory, loading, fetchError, lastUpdated, fetchData };
}
