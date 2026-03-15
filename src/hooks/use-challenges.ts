"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateSeed, dealFromSeed } from "@/lib/hand-encoder";
import { calculateBoardIMP, calculateMatchIMP, getIMPVerdict } from "@/lib/bridge-scoring";

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

  const supabase = createClient();

  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Failed to get user:", error);
      return null;
    }
    return user?.id ?? null;
  }, [supabase]);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      if (!userId) return;

      const { data: pending, error: pendingError } = await supabase
        .rpc("get_pending_challenges");

      if (pendingError) {
        console.error("Failed to fetch pending challenges:", pendingError);
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
        console.error("Failed to fetch active challenges:", activeError);
      } else {
        setActiveChallenges((active as ChallengeData[]) ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, getUserId]);

  // Fetch on mount
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchChallenges, 30_000);
    return () => clearInterval(interval);
  }, [fetchChallenges]);

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
          console.error("Failed to create challenge:", error);
          return null;
        }

        await fetchChallenges();
        return data.id;
      } catch (err) {
        console.error("Failed to create challenge:", err);
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
          console.error("Failed to accept challenge:", error);
          return;
        }

        await fetchChallenges();
      } catch (err) {
        console.error("Failed to accept challenge:", err);
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
          console.error("Failed to decline challenge:", error);
          return;
        }

        await fetchChallenges();
      } catch (err) {
        console.error("Failed to decline challenge:", err);
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
          console.error("Failed to submit results:", updateError);
          return;
        }

        // Re-fetch the challenge to check if both sides have submitted
        const { data: challenge, error: fetchError } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (fetchError || !challenge) {
          console.error("Failed to re-fetch challenge:", fetchError);
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

          const matchResult = calculateMatchIMP(boardScores);

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
            console.error("Failed to complete challenge:", completeError);
          }
        } else {
          // Only one side has submitted so far
          const { error: playingError } = await supabase
            .from("challenges")
            .update({ status: "playing" })
            .eq("id", challengeId);

          if (playingError) {
            console.error("Failed to update status to playing:", playingError);
          }
        }

        await fetchChallenges();
      } catch (err) {
        console.error("Failed to submit results:", err);
      }
    },
    [supabase, fetchChallenges]
  );

  const getHistory = useCallback(
    async (limit?: number): Promise<ChallengeData[]> => {
      try {
        const { data, error } = await supabase.rpc("get_challenge_history", {
          result_limit: limit ?? 50,
        });

        if (error) {
          console.error("Failed to get challenge history:", error);
          return [];
        }

        return (data as ChallengeData[]) ?? [];
      } catch (err) {
        console.error("Failed to get challenge history:", err);
        return [];
      }
    },
    [supabase]
  );

  const getStats = useCallback(async (): Promise<ChallengeStats | null> => {
    try {
      const { data, error } = await supabase.rpc("get_challenge_stats");

      if (error) {
        console.error("Failed to get challenge stats:", error);
        return null;
      }

      return (data as ChallengeStats) ?? null;
    } catch (err) {
      console.error("Failed to get challenge stats:", err);
      return null;
    }
  }, [supabase]);

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
          console.error("Failed to search for open challenges:", searchError);
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
            console.error("Failed to join open challenge:", joinError);
            return null;
          }

          await fetchChallenges();
          return match.id;
        }

        // No open challenge found -- create a new one waiting for an opponent
        return await createChallenge(null, boardCount);
      } catch (err) {
        console.error("Failed to find random opponent:", err);
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
