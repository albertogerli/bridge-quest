"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayableSmazzate } from "@/store/use-smazzate-store";
import { useGameStore } from "@/store/use-game-store";
import type { Smazzata } from "@/lib/catalog";
import { awardGameXp } from "@/lib/xp-utils";
import {
  formatCountdown,
  getTournamentHands,
  getWeekDates,
  getWeekNum,
  sumTricksNeeded,
} from "@/lib/tournament-stats";
import {
  fetchLeaderboard,
  getTournamentProgress,
  getTournamentResult,
  saveTournamentResult,
  saveTournamentToSupabase,
} from "./_storage";
import {
  TOURNAMENT_HAND_COUNT,
  type LeaderboardEntry,
  type TournamentResult,
} from "./_types";

function getCurrentWeekNum(): number {
  return getWeekNum(Date.now());
}

// ─── Countdown to end of week ───────────────────────────────────────────────

export function useWeekCountdown(weekNum: number) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const { end } = getWeekDates(weekNum);
    const endMs = end.getTime() + 1; // end is last ms of week

    function calc() {
      setTimeLeft(formatCountdown(endMs - Date.now()));
    }

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [weekNum]);

  return timeLeft;
}

// ─── Stato della settimana di torneo ────────────────────────────────────────

export interface TournamentWeek {
  weekNum: number;
  start: Date;
  end: Date;
  countdown: string;
  tournamentHands: Smazzata[];
  totalNeeded: number;
  existingResult: TournamentResult | null;
  alreadyPlayed: boolean;
  leaderboard: LeaderboardEntry[] | null;
  /** Mani già completate di un torneo interrotto (per il CTA "Riprendi"). */
  inProgressCount: number;
  /** Falso al primo render: evita mismatch di hydration sui dati client-only. */
  mounted: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onTournamentFinished: (result: TournamentResult) => void;
}

/**
 * Dati e stato del torneo della settimana corrente.
 *
 * Estratto da `src/app/gioca/torneo/page.tsx` senza cambi di comportamento:
 * stessa sequenza di effetti, stesse dipendenze e stesse formule (ora in
 * `@/lib/tournament-stats`).
 */
export function useTournamentWeek(): TournamentWeek {
  const weekNum = getCurrentWeekNum();
  const { start, end } = getWeekDates(weekNum);
  const countdown = useWeekCountdown(weekNum);
  const playable = usePlayableSmazzate();
  const tournamentHands = useMemo(
    () => getTournamentHands(playable, weekNum, TOURNAMENT_HAND_COUNT),
    [playable, weekNum]
  );

  const [existingResult, setExistingResult] =
    useState<TournamentResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  // Mani già completate di un torneo interrotto (per il CTA "Riprendi")
  const [inProgressCount, setInProgressCount] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
    setMounted(true);
    setExistingResult(getTournamentResult(weekNum));
    setInProgressCount(getTournamentProgress(weekNum)?.handResults.length ?? 0);
    fetchLeaderboard(weekNum).then((lb) => setLeaderboard(lb));
  }, [weekNum, isPlaying]);

  const onTournamentFinished = useCallback(
    (result: TournamentResult) => {
      setExistingResult(result);
      saveTournamentResult(result);
      saveTournamentToSupabase(result);

      // Award XP (only once per week via awardGameXp)
      awardGameXp(`torneo-week-${weekNum}`, result.xpEarned);
      // Tournament plays 5 hands — awardGameXp already counted 1, add remaining 4
      useGameStore.getState().addHandsPlayed(TOURNAMENT_HAND_COUNT - 1);

      // Refresh leaderboard
      fetchLeaderboard(weekNum).then((lb) => setLeaderboard(lb));
    },
    [weekNum]
  );

  return {
    weekNum,
    start,
    end,
    countdown,
    tournamentHands,
    totalNeeded: sumTricksNeeded(tournamentHands),
    existingResult,
    alreadyPlayed: !!existingResult,
    leaderboard,
    inProgressCount,
    mounted,
    isPlaying,
    setIsPlaying,
    onTournamentFinished,
  };
}
