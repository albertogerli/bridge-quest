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
  restorableHandCount,
  sumTricksNeeded,
} from "@/lib/tournament-stats";
import {
  fetchLeaderboard,
  fetchMyTournamentHistory,
  getTournamentProgress,
  getTournamentResult,
  saveTournamentResult,
  saveTournamentToSupabase,
} from "./_storage";
import {
  TOURNAMENT_HAND_COUNT,
  type LeaderboardEntry,
  type TournamentHistoryEntry,
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
  /** Settimane già giocate, dalla più recente. */
  history: TournamentHistoryEntry[];
  /** Vero finché lo storico non è stato caricato. */
  historyLoading: boolean;
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
  const [history, setHistory] = useState<TournamentHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Mani già completate di un torneo interrotto (per il CTA "Riprendi")
  const [inProgressCount, setInProgressCount] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
    setMounted(true);
    const result = getTournamentResult(weekNum);
    setExistingResult(result);
    // Stessa validazione della play view (handIds + torneo già concluso):
    // contare le mani salvate senza validarle faceva promettere alla CTA una
    // ripresa che poi ripartiva da capo.
    setInProgressCount(
      restorableHandCount(getTournamentProgress(weekNum), tournamentHands, !!result)
    );
    fetchLeaderboard(weekNum).then((lb) => setLeaderboard(lb));
    // Lo storico non dipende dalla settimana corrente, ma va riletto quando si
    // finisce un torneo: la settimana appena chiusa deve comparire subito.
    fetchMyTournamentHistory()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [weekNum, isPlaying, tournamentHands]);

  const onTournamentFinished = useCallback(
    (result: TournamentResult) => {
      setExistingResult(result);
      saveTournamentResult(result);
      saveTournamentToSupabase(result);

      // Award XP (only once per week via awardGameXp)
      awardGameXp(`torneo-week-${weekNum}`, result.xpEarned);
      // Mani effettivamente giocate (la pool può averne meno di
      // TOURNAMENT_HAND_COUNT): awardGameXp ne ha già contata 1.
      useGameStore
        .getState()
        .addHandsPlayed(Math.max(0, result.handResults.length - 1));

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
    history,
    historyLoading,
    inProgressCount,
    mounted,
    isPlaying,
    setIsPlaying,
    onTournamentFinished,
  };
}
