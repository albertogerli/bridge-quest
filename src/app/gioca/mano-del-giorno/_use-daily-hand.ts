"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlayableSmazzate } from "@/store/use-smazzate-store";
import { useDailyFieldStats, type DailyFieldStats } from "@/hooks/use-daily-field";
import { useGameResults } from "@/hooks/use-game-results";
import { updateLastActivity } from "@/hooks/use-notifications";
import type { Smazzata } from "@/lib/catalog";
import {
  calcStars,
  computeDailyXp,
  formatTimeToMidnight,
  getSmazzataForDate,
  getTodayString,
  getYesterdayString,
} from "@/lib/daily-hand";
import { awardGameXp } from "@/lib/xp-utils";
import {
  getDailyResult,
  getDailyStreak,
  getDailyTotal,
  saveDailyResult,
} from "./_storage";
import type { DailyResult } from "./_types";

function getToday(): string {
  return getTodayString(Date.now());
}

function getYesterday(): string {
  return getYesterdayString(Date.now());
}

// ─── Countdown alla mano di domani ──────────────────────────────────────────

export function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      setTimeLeft(formatTimeToMidnight(Date.now()));
    }
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

// ─── Stato della giornata ───────────────────────────────────────────────────

export interface DailyHand {
  today: string;
  yesterday: string;
  /** `null` finché la pool di smazzate non è caricata. */
  todayHand: Smazzata | null;
  yesterdayHand: Smazzata | null;
  todayResult: DailyResult | null;
  alreadyPlayed: boolean;
  streak: number;
  total: number;
  countdown: string;
  fieldStats: DailyFieldStats | null;
  /** Falso al primo render: evita mismatch di hydration sui dati client-only. */
  mounted: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playingYesterday: boolean;
  setPlayingYesterday: (playing: boolean) => void;
  onGameFinished: (tricks: number, resultDelta: number, made: boolean) => void;
  saveGameResult: ReturnType<typeof useGameResults>["saveGameResult"];
}

/**
 * Dati e stato della Mano del Giorno.
 *
 * Estratto da `src/app/gioca/mano-del-giorno/page.tsx` senza cambi di
 * comportamento: stessa sequenza di effetti, stesse dipendenze e stesse formule
 * (ora in `@/lib/daily-hand`).
 */
export function useDailyHand(): DailyHand {
  const { saveGameResult } = useGameResults();
  const today = getToday();
  const yesterday = getYesterday();
  const playable = usePlayableSmazzate();
  const todayHand = getSmazzataForDate(today, playable);
  const yesterdayHand = getSmazzataForDate(yesterday, playable);

  const [todayResult, setTodayResult] = useState<DailyResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingYesterday, setPlayingYesterday] = useState(false);
  const [mounted, setMounted] = useState(false);
  const countdown = useCountdown();
  // Field comparison (everyone plays the same hand): fetched once played
  const fieldStats = useDailyFieldStats(
    today,
    todayResult ? todayResult.result : null
  );

  // Load state from localStorage after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
    setMounted(true);
    setTodayResult(getDailyResult(today));
    setStreak(getDailyStreak());
    setTotal(getDailyTotal());
  }, [today]);

  const todayHandContract = todayHand?.contract;
  const onGameFinished = useCallback(
    (tricks: number, resultDelta: number, made: boolean) => {
      const stars = calcStars(resultDelta);
      const xpEarned = computeDailyXp(resultDelta, true);

      const result: DailyResult = {
        played: true,
        tricks,
        made,
        result: resultDelta,
        stars,
        xpEarned,
      };

      if (!todayResult) {
        saveDailyResult(today, result);
        awardGameXp(`mano-giorno-${today}`, xpEarned);
        try { updateLastActivity(); } catch {}
        // Sync to Supabase
        saveGameResult({
          gameType: "mano-del-giorno",
          score: xpEarned,
          details: { tricks, result: resultDelta, made, stars, date: today, contract: todayHandContract ?? "" },
        });
      }

      setTodayResult(result);
      setStreak(getDailyStreak());
      setTotal(getDailyTotal());
    },
    [today, todayResult, saveGameResult, todayHandContract]
  );

  return {
    today,
    yesterday,
    todayHand,
    yesterdayHand,
    todayResult,
    alreadyPlayed: !!todayResult,
    streak,
    total,
    countdown,
    fieldStats,
    mounted,
    isPlaying,
    setIsPlaying,
    playingYesterday,
    setPlayingYesterday,
    onGameFinished,
    saveGameResult,
  };
}
