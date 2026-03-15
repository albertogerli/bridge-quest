"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { Swords, Check, X, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: string;
  board_count: number;
  challenger_name: string;
  opponent_name: string;
  created_at: string;
  challenger_completed: boolean;
  opponent_completed: boolean;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function PendingChallengesBanner() {
  const { user } = useSharedAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchChallenges = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();

    // Try RPC first, fallback to direct query
    const { data, error } = await supabase.rpc("get_pending_challenges", {
      p_user_id: user.id,
    });

    if (error) {
      // Fallback: query directly
      const { data: fallbackData } = await supabase
        .from("challenges")
        .select(`
          id,
          challenger_id,
          opponent_id,
          status,
          board_count,
          created_at,
          challenger_completed,
          opponent_completed,
          challenger:profiles!challenges_challenger_id_fkey(display_name),
          opponent:profiles!challenges_opponent_id_fkey(display_name)
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (fallbackData) {
        const mapped = fallbackData.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          challenger_id: c.challenger_id as string,
          opponent_id: c.opponent_id as string,
          status: c.status as string,
          board_count: c.board_count as number,
          created_at: c.created_at as string,
          challenger_completed: c.challenger_completed as boolean,
          opponent_completed: c.opponent_completed as boolean,
          challenger_name:
            (c.challenger as { display_name?: string })?.display_name ??
            "Giocatore",
          opponent_name:
            (c.opponent as { display_name?: string })?.display_name ??
            "Giocatore",
        }));
        setChallenges(mapped);
      }
    } else if (data) {
      setChallenges(data as Challenge[]);
    }

    setLoading(false);
  }, [user]);

  // Initial fetch + polling
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchChallenges();
    const interval = setInterval(fetchChallenges, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, fetchChallenges]);

  const handleAccept = useCallback(
    async (challengeId: string) => {
      const supabase = createClient();
      await supabase
        .from("challenges")
        .update({ status: "accepted" })
        .eq("id", challengeId);

      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      // Refetch to get updated status
      fetchChallenges();
    },
    [fetchChallenges],
  );

  const handleDecline = useCallback(
    async (challengeId: string) => {
      const supabase = createClient();
      await supabase
        .from("challenges")
        .update({ status: "declined" })
        .eq("id", challengeId);

      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    },
    [],
  );

  // Don't render if not logged in or no challenges
  if (!user || loading || challenges.length === 0) return null;

  const visibleChallenges = challenges.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Swords className="w-4 h-4 text-violet-600" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Sfide in corso
        </h3>
        <Badge className="bg-violet-100 text-violet-700 text-[10px] font-bold border-0">
          {challenges.length}
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleChallenges.map((challenge, index) => {
          const isOpponent = challenge.opponent_id === user.id;
          const opponentName = isOpponent
            ? challenge.challenger_name
            : challenge.opponent_name;

          // Determine challenge state
          const isPending = challenge.status === "pending" && isOpponent;
          const isWaitingForOpponent =
            challenge.status === "pending" && !isOpponent;

          const isActive = challenge.status === "accepted";
          const userCompleted = isOpponent
            ? challenge.opponent_completed
            : challenge.challenger_completed;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
                    <Swords className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {isPending
                          ? `${opponentName} ti ha sfidato!`
                          : isWaitingForOpponent
                            ? `In attesa di ${opponentName}`
                            : userCompleted
                              ? `In attesa di ${opponentName}`
                              : `Sfida con ${opponentName}`}
                      </p>
                      <Badge className="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[10px] font-bold border-0 shrink-0">
                        {challenge.board_count} mani
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {isPending
                        ? "Accetta per giocare"
                        : isWaitingForOpponent
                          ? "In attesa di risposta..."
                          : userCompleted
                            ? "Hai completato la tua parte"
                            : "Punteggio IMP"}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleAccept(challenge.id)}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Accetta
                        </button>
                        <button
                          onClick={() => handleDecline(challenge.id)}
                          className="rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Rifiuta
                        </button>
                      </>
                    ) : isWaitingForOpponent ? (
                      <div className="rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Attesa
                      </div>
                    ) : isActive && !userCompleted ? (
                      <Link
                        href={`/gioca/sfida-imp?challengeId=${challenge.id}`}
                      >
                        <button className="rounded-xl bg-[#003DA5] hover:bg-[#002d7a] text-white px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1">
                          Gioca
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </Link>
                    ) : isActive && userCompleted ? (
                      <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Fatto
                      </div>
                    ) : (
                      <Link
                        href={`/gioca/sfida-imp?challengeId=${challenge.id}`}
                      >
                        <button className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1">
                          Continua
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {challenges.length > 3 && (
        <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
          +{challenges.length - 3} altre sfide
        </p>
      )}
    </div>
  );
}
