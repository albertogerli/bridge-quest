"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import {
  evaluateChannel,
  persistentFailureMessage,
  POLL_HEALTHY_MS,
} from "@/lib/realtime-health";
import { generateSeed } from "@/lib/hand-encoder";
import { calculateBoardIMP } from "@/lib/bridge-scoring";

/**
 * Rete di sicurezza dietro il Realtime: le connessioni WebSocket cadono
 * (sospensione del dispositivo, cambio rete, proxy) e gli eventi persi mentre
 * il socket è giù NON vengono ritrasmessi alla riconnessione. Il polling resta
 * come rete ma a intervallo lungo — 5 min invece di 30 s — perché la
 * reattività ora la dà il canale Realtime.
 *
 * Nota storica: fino al 2026-08-10 le tabelle avevano REPLICA IDENTITY di
 * default (sola chiave primaria), quindi il record `old` degli eventi DELETE
 * non conteneva le colonne su cui filtriamo e il server non li consegnava.
 * Risolto con `REPLICA IDENTITY FULL` (migrazione
 * `replica_identity_full_realtime_delete`): ora anche "amico rimosso" e
 * "sfida ritirata" arrivano in tempo reale. Coperto da `npm run test:realtime`.
 */

export interface BoardResult {
  boardIndex: number;
  contract: string;
  declarer: string;
  tricksMade: number;
  rawScore: number;
}

export interface ChallengeData {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  status: "pending" | "accepted" | "playing" | "completed" | "declined" | "expired";
  board_count: number;
  hands: string[]; // array of seeds
  challenger_results: BoardResult[] | null;
  opponent_results: BoardResult[] | null;
  challenger_imps: number | null;
  opponent_imps: number | null;
  created_at: string;
  completed_at: string | null;
  // Joined profile data
  challenger_name?: string;
  challenger_avatar?: string;
  opponent_name?: string;
  opponent_avatar?: string;
}

export interface ChallengeStats {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  avg_imp_margin: number;
}

export function useChallenges() {
  const [pendingChallenges, setPendingChallenges] = useState<ChallengeData[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeUserId, setRealtimeUserId] = useState<string | null>(null);
  // Quanto spesso interrogare il server: si accorcia da solo quando il canale
  // Realtime non consegna, così l'utente vede un ritardo di secondi invece di
  // minuti. Il contatore sta in un ref perché non deve far ridisegnare nulla.
  const [pollMs, setPollMs] = useState(POLL_HEALTHY_MS);
  const failuresRef = useRef(0);

  const supabase = createClient();

  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      reportError("use-challenges:getUser", error);
      return null;
    }
    return user?.id ?? null;
  }, [supabase]);

  /** `quiet` evita di rialzare `loading` sui refresh in background (Realtime,
   *  timer di sicurezza, ritorno sulla tab): la lista è già a schermo e non
   *  deve tornare a scheletro a ogni evento. */
  const fetchChallenges = useCallback(async (options?: { quiet?: boolean }) => {
    const quiet = options?.quiet === true;
    try {
      if (!quiet) setLoading(true);
      const userId = await getUserId();
      if (!userId) return;

      // La funzione richiede p_user_id: senza argomento PostgREST rispondeva
      // 404 e le sfide ricevute non comparivano mai (bug in produzione).
      const { data: pending, error: pendingError } = await supabase
        .rpc("get_pending_challenges", { p_user_id: userId });

      if (pendingError) {
        reportError("use-challenges:pending", pendingError);
      } else {
        setPendingChallenges((pending as ChallengeData[]) ?? []);
      }

      const { data: active, error: activeError } = await supabase
        .from("challenges")
        .select("*")
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .in("status", ["accepted", "playing"])
        .order("created_at", { ascending: false });

      if (activeError) {
        reportError("use-challenges:active", activeError);
      } else {
        setActiveChallenges((active as ChallengeData[]) ?? []);
      }
    } catch (err) {
      reportError("use-challenges:fetch", err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [supabase, getUserId]);

  const refreshQuiet = useCallback(async () => {
    await fetchChallenges({ quiet: true });
  }, [fetchChallenges]);

  // Fetch on mount
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Utente corrente per il canale Realtime: tenuto in stato perché il canale
  // va ricreato a ogni cambio utente (login/logout).
  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) setRealtimeUserId(data.user?.id ?? null);
      })
      .catch((err) => reportError("use-challenges:getUser", err));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setRealtimeUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Supabase Realtime, due sottoscrizioni mirate sullo stesso canale:
  //  - `opponent_id=eq.<me>`: sfide che ricevo, e sfide aperte a cui vengo
  //    agganciato (l'UPDATE che valorizza opponent_id);
  //  - `challenger_id=eq.<me>`: le mie sfide quando l'avversario accetta,
  //    rifiuta o consegna i risultati.
  // I filtri sono lato server e le RLS di `challenges` valgono anche qui.
  useEffect(() => {
    if (!realtimeUserId) return;

    const onChange = () => {
      void refreshQuiet();
    };

    const channel = supabase
      .channel(`challenges-${realtimeUserId}-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
          filter: `opponent_id=eq.${realtimeUserId}`,
        },
        onChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
          filter: `challenger_id=eq.${realtimeUserId}`,
        },
        onChange
      )
      .subscribe((status, error) => {
        // Un canale che cade su rete mobile è ordinaria amministrazione: si
        // degrada il ripiegamento invece di segnalare. Solo un guasto
        // ripetuto viene riportato, e una volta sola. Vedi realtime-health.ts.
        const esito = evaluateChannel(status, failuresRef.current);
        failuresRef.current = esito.failures;
        setPollMs(esito.pollMs);
        if (esito.shouldReport) {
          reportError(
            "use-challenges:realtime",
            error ?? new Error(persistentFailureMessage("use-challenges:realtime", status, esito.failures))
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, realtimeUserId, refreshQuiet]);

  // Rete di sicurezza: intervallo dinamico, vedi realtime-health.ts.
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshQuiet();
    }, pollMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshQuiet();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshQuiet, pollMs]);

  const createChallenge = useCallback(
    async (
      opponentId: string | null,
      boardCount: 1 | 4 | 8
    ): Promise<string | null> => {
      try {
        const userId = await getUserId();
        if (!userId) return null;

        const seeds: string[] = [];
        for (let i = 0; i < boardCount; i++) {
          seeds.push(generateSeed());
        }

        const { data, error } = await supabase
          .from("challenges")
          .insert({
            challenger_id: userId,
            opponent_id: opponentId,
            board_count: boardCount,
            hands: seeds,
            status: "pending",
          })
          .select("id")
          .single();

        if (error) {
          reportError("use-challenges:create", error);
          return null;
        }

        await fetchChallenges();
        return data.id;
      } catch (err) {
        reportError("use-challenges:create", err);
        return null;
      }
    },
    [supabase, getUserId, fetchChallenges]
  );

  const acceptChallenge = useCallback(
    async (challengeId: string) => {
      try {
        const { error } = await supabase
          .from("challenges")
          .update({ status: "accepted" })
          .eq("id", challengeId);

        if (error) {
          reportError("use-challenges:accept", error);
          return;
        }

        await fetchChallenges();
      } catch (err) {
        reportError("use-challenges:accept", err);
      }
    },
    [supabase, fetchChallenges]
  );

  const declineChallenge = useCallback(
    async (challengeId: string) => {
      try {
        const { error } = await supabase
          .from("challenges")
          .update({ status: "declined" })
          .eq("id", challengeId);

        if (error) {
          reportError("use-challenges:decline", error);
          return;
        }

        await fetchChallenges();
      } catch (err) {
        reportError("use-challenges:decline", err);
      }
    },
    [supabase, fetchChallenges]
  );

  const submitResults = useCallback(
    async (
      challengeId: string,
      results: BoardResult[],
      isChallenger: boolean
    ) => {
      try {
        // Update the appropriate results column
        const updatePayload = isChallenger
          ? { challenger_results: results }
          : { opponent_results: results };

        const { error: updateError } = await supabase
          .from("challenges")
          .update(updatePayload)
          .eq("id", challengeId);

        if (updateError) {
          reportError("use-challenges:submit", updateError);
          return;
        }

        // Re-fetch the challenge to check if both sides have submitted
        const { data: challenge, error: fetchError } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (fetchError || !challenge) {
          reportError("use-challenges:submit", fetchError);
          return;
        }

        const typed = challenge as ChallengeData;

        if (typed.challenger_results && typed.opponent_results) {
          // Both sides have submitted -- calculate IMPs and complete the match
          let challengerTotalIMPs = 0;
          let opponentTotalIMPs = 0;

          const boardScores: Array<{ challengerScore: number; opponentScore: number }> = [];
          for (let i = 0; i < typed.board_count; i++) {
            const challengerBoard = typed.challenger_results[i];
            const opponentBoard = typed.opponent_results[i];

            if (challengerBoard && opponentBoard) {
              boardScores.push({
                challengerScore: challengerBoard.rawScore,
                opponentScore: opponentBoard.rawScore,
              });
              const boardIMP = calculateBoardIMP({
                challengerScore: challengerBoard.rawScore,
                opponentScore: opponentBoard.rawScore,
              });
              challengerTotalIMPs += boardIMP.challengerIMP;
              opponentTotalIMPs += boardIMP.opponentIMP;
            }
          }

          const { error: completeError } = await supabase
            .from("challenges")
            .update({
              challenger_imps: challengerTotalIMPs,
              opponent_imps: opponentTotalIMPs,
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", challengeId);

          if (completeError) {
            reportError("use-challenges:submit", completeError);
          }
        } else {
          // Only one side has submitted so far
          const { error: playingError } = await supabase
            .from("challenges")
            .update({ status: "playing" })
            .eq("id", challengeId);

          if (playingError) {
            reportError("use-challenges:submit", playingError);
          }
        }

        await fetchChallenges();
      } catch (err) {
        reportError("use-challenges:submit", err);
      }
    },
    [supabase, fetchChallenges]
  );

  const getHistory = useCallback(
    async (limit?: number): Promise<ChallengeData[]> => {
      try {
        const userId = await getUserId();
        if (!userId) return [];
        // Firma reale: (p_user_id uuid, p_limit int). Prima passava
        // `result_limit` -> 404, storico sfide sempre vuoto.
        const { data, error } = await supabase.rpc("get_challenge_history", {
          p_user_id: userId,
          p_limit: limit ?? 50,
        });

        if (error) {
          reportError("use-challenges:history", error);
          return [];
        }

        return (data as ChallengeData[]) ?? [];
      } catch (err) {
        reportError("use-challenges:history", err);
        return [];
      }
    },
    [supabase, getUserId]
  );

  const getStats = useCallback(async (): Promise<ChallengeStats | null> => {
    try {
      const userId = await getUserId();
      if (!userId) return null;
      // Firma reale: (p_user_id uuid). Prima nessun argomento -> 404.
      const { data, error } = await supabase.rpc("get_challenge_stats", {
        p_user_id: userId,
      });

      if (error) {
        reportError("use-challenges:stats", error);
        return null;
      }

      // La funzione ritorna un set di una riga.
      const row = Array.isArray(data) ? data[0] : data;
      return (row as ChallengeStats) ?? null;
    } catch (err) {
      reportError("use-challenges:stats", err);
      return null;
    }
  }, [supabase, getUserId]);

  const findRandomOpponent = useCallback(
    async (boardCount: 1 | 4 | 8): Promise<string | null> => {
      try {
        const userId = await getUserId();
        if (!userId) return null;

        // Look for existing open challenges not created by me
        const { data: openChallenges, error: searchError } = await supabase
          .from("challenges")
          .select("*")
          .is("opponent_id", null)
          .eq("status", "pending")
          .eq("board_count", boardCount)
          .neq("challenger_id", userId)
          .order("created_at", { ascending: true })
          .limit(1);

        if (searchError) {
          reportError("use-challenges:random", searchError);
          return null;
        }

        if (openChallenges && openChallenges.length > 0) {
          // Found an open challenge -- join it
          const match = openChallenges[0] as ChallengeData;

          const { error: joinError } = await supabase
            .from("challenges")
            .update({
              opponent_id: userId,
              status: "accepted",
            })
            .eq("id", match.id);

          if (joinError) {
            reportError("use-challenges:random", joinError);
            return null;
          }

          await fetchChallenges();
          return match.id;
        }

        // No open challenge found -- create a new one waiting for an opponent
        return await createChallenge(null, boardCount);
      } catch (err) {
        reportError("use-challenges:random", err);
        return null;
      }
    },
    [supabase, getUserId, fetchChallenges, createChallenge]
  );

  return {
    pendingChallenges,
    activeChallenges,
    loading,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    submitResults,
    findRandomOpponent,
    getHistory,
    getStats,
    refresh: fetchChallenges,
  };
}
