"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { GameActions } from "@/components/bridge/game-actions";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { usePlayableSmazzate } from "@/store/use-smazzate-store";
import type { Smazzata } from "@/lib/catalog";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { saveGameForAnalysis } from "@/lib/save-analysis-data";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  cardToString,
  partnershipOf,
} from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { ShareResult } from "@/components/bridge/share-result";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { updateLastActivity } from "@/hooks/use-notifications";
import { awardGameXp } from "@/lib/xp-utils";
import { useGameResults } from "@/hooks/use-game-results";
import { useDailyFieldStats } from "@/hooks/use-daily-field";
import Link from "next/link";
import { CelebrationCombo } from "@/components/celebration-effects";
import { useSound } from "@/hooks/use-sound";

// ─── Date Helpers ────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Deterministic hash: same date -> same hand for all users */
function dateToIndex(dateStr: string, poolSize: number): number {
  const hash = dateStr
    .split("-")
    .reduce((acc, n) => acc * 31 + parseInt(n), 0);
  return Math.abs(hash) % poolSize;
}

function getSmazzataForDate(dateStr: string, pool: Smazzata[]): Smazzata | null {
  if (pool.length === 0) return null;
  return pool[dateToIndex(dateStr, pool.length)];
}

// ─── localStorage Helpers ────────────────────────────────────────────────────

interface DailyResult {
  played: true;
  tricks: number;
  made: boolean;
  result: number; // +N or -N relative to contract
  stars: number;
  xpEarned: number;
}

function getDailyResult(dateStr: string): DailyResult | null {
  try {
    const raw = localStorage.getItem(`bq_daily_hand_${dateStr}`);
    if (!raw) return null;
    return JSON.parse(raw) as DailyResult;
  } catch {
    return null;
  }
}

function saveDailyResult(dateStr: string, result: DailyResult) {
  try {
    localStorage.setItem(`bq_daily_hand_${dateStr}`, JSON.stringify(result));

    // Update streak
    const yesterday = getYesterday();
    const yesterdayResult = getDailyResult(yesterday);
    const prevStreak = parseInt(
      localStorage.getItem("bq_daily_hand_streak") || "0",
      10
    );
    const newStreak = yesterdayResult ? prevStreak + 1 : 1;
    localStorage.setItem("bq_daily_hand_streak", String(newStreak));

    // Update total
    const prevTotal = parseInt(
      localStorage.getItem("bq_daily_hand_total") || "0",
      10
    );
    localStorage.setItem("bq_daily_hand_total", String(prevTotal + 1));
  } catch {}
}

function getDailyStreak(): number {
  try {
    return parseInt(
      localStorage.getItem("bq_daily_hand_streak") || "0",
      10
    );
  } catch {
    return 0;
  }
}

function getDailyTotal(): number {
  try {
    return parseInt(
      localStorage.getItem("bq_daily_hand_total") || "0",
      10
    );
  } catch {
    return 0;
  }
}

function calcStars(resultDelta: number): number {
  if (resultDelta > 0) return 3;
  if (resultDelta === 0) return 2;
  return 1;
}

// ─── Suit display helpers ────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "\u2660",
  heart: "\u2665",
  diamond: "\u2666",
  club: "\u2663",
};

const SUIT_COLORS: Record<Suit, string> = {
  spade: "text-foreground",
  heart: "text-red-600 dark:text-red-400",
  diamond: "text-orange-500 dark:text-orange-400",
  club: "text-emerald-700 dark:text-emerald-400",
};

const SUIT_ORDER: Suit[] = ["spade", "heart", "diamond", "club"];

function formatContractItalian(contract: string, declarer: Position): string {
  const posNames: Record<Position, string> = {
    north: "Nord",
    south: "Sud",
    east: "Est",
    west: "Ovest",
  };
  return `${contract} ${posNames[declarer]}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const months = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

// ─── Countdown Hook ──────────────────────────────────────────────────────────

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

// ─── Hand Fan Preview (South hand, grouped by suit) ──────────────────────────

function HandFanPreview({ cards }: { cards: Card[] }) {
  const bySuit: Record<Suit, Card[]> = {
    spade: [],
    heart: [],
    diamond: [],
    club: [],
  };
  for (const card of cards) {
    bySuit[card.suit].push(card);
  }

  return (
    <div className="space-y-1">
      {SUIT_ORDER.map((suit) => {
        const suitCards = bySuit[suit];
        if (suitCards.length === 0) return null;
        return (
          <div key={suit} className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${SUIT_COLORS[suit]}`}>
              {SUIT_SYMBOLS[suit]}
            </span>
            <span className="text-xs font-semibold text-foreground/80 tracking-wide">
              {suitCards.map((c) => c.rank).join(" ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function ManoDelGiornoPage() {
  const isMobile = useMobile();
  const profile = useProfile();
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
  const handleGameFinished = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- il compiler non garantisce l'immutabilità delle dipendenze (dati del catalogo/derivati): salta solo l'ottimizzazione, la memo manuale resta corretta
    (tricks: number, resultDelta: number, made: boolean) => {
      const stars = calcStars(resultDelta);
      const baseXp =
        30 + (resultDelta >= 0 ? 20 : 0) + Math.max(0, resultDelta) * 10;
      const dailyBonus = 50;
      const xpEarned = baseXp + dailyBonus;

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
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- il compiler non garantisce l'immutabilità delle dipendenze (dati del catalogo/derivati): salta solo l'ottimizzazione, la memo manuale resta corretta
    [today, todayResult, saveGameResult, todayHandContract]
  );

  // Need a loaded smazzate pool for everything below.
  if (!todayHand || !yesterdayHand) {
    return (
      <div className="pt-10 text-center text-muted-foreground/70 text-sm" role="status" aria-label="Caricamento mano del giorno">
        Caricamento mano del giorno…
      </div>
    );
  }

  // ── Playing view ──
  if (isPlaying) {
    return (
      <PlayingView
        smazzata={todayHand}
        isDaily
        alreadyPlayed={!!todayResult}
        onFinish={handleGameFinished}
        onBack={() => setIsPlaying(false)}
        isMobile={isMobile}
        profile={profile}
        saveGameResult={saveGameResult}
      />
    );
  }

  if (playingYesterday) {
    return (
      <PlayingView
        smazzata={yesterdayHand}
        isDaily={false}
        alreadyPlayed={false}
        onFinish={() => {}}
        onBack={() => setPlayingYesterday(false)}
        isMobile={isMobile}
        profile={profile}
        saveGameResult={saveGameResult}
      />
    );
  }

  // ── Pre-play / post-play hub ──
  const { tricksNeeded } = parseContract(todayHand.contract);
  const alreadyPlayed = !!todayResult;

  return (
    <div className="pt-6 px-5 pb-28">
      <div className="mx-auto max-w-6xl">
        {/* Back nav */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-3">
            <Link
              href="/gioca"
              className="hover:text-emerald transition-colors"
            >
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">
              Mano del Giorno
            </span>
          </div>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-900 p-6">
            {/* Decorative circle */}
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-orange-200/15 blur-2xl" />

            <div className="relative">
              {/* Date + Calendar icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Calendar icon */}
                  <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-card shadow-md shadow-amber-200/50 dark:shadow-none border border-amber-100 dark:border-amber-900">
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest leading-none">
                      {mounted
                        ? new Date().toLocaleDateString("it-IT", {
                            weekday: "short",
                          })
                        : ""}
                    </span>
                    <span className="text-2xl font-bold text-foreground leading-none mt-0.5">
                      {mounted ? new Date().getDate() : ""}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground font-display">
                      Mano del Giorno
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mounted ? formatDate(today) : ""}
                    </p>
                  </div>
                </div>
                {alreadyPlayed && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold border-0 shrink-0">
                    Completata
                  </Badge>
                )}
              </div>

              {/* Hand info + card preview */}
              <div className="flex gap-5 mt-2">
                {/* Contract and info */}
                <div className="flex-1 space-y-3">
                  {/* Contract badge */}
                  <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-amber-100 dark:border-amber-900">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                        Contratto
                      </p>
                      <p className="text-lg font-bold text-emerald-dark leading-tight">
                        {todayHand.contract}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-amber-200/60" />
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                        Dichiarante
                      </p>
                      <p className="text-lg font-bold text-foreground leading-tight">
                        {todayHand.declarer === "north"
                          ? "Nord"
                          : todayHand.declarer === "south"
                            ? "Sud"
                            : todayHand.declarer === "east"
                              ? "Est"
                              : "Ovest"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-semibold">
                      Obiettivo: {tricksNeeded} prese
                    </span>
                    <span>
                      Vul:{" "}
                      {todayHand.vulnerability === "none"
                        ? "Nessuna"
                        : todayHand.vulnerability === "ns"
                          ? "N-S"
                          : todayHand.vulnerability === "ew"
                            ? "E-O"
                            : "Tutti"}
                    </span>
                  </div>

                  <p className="text-[13px] font-semibold text-foreground/80 leading-snug">
                    {todayHand.title}
                  </p>
                </div>

                {/* South hand preview */}
                <div className="shrink-0 bg-card/70 backdrop-blur-sm rounded-2xl px-3.5 py-3 border border-amber-100 dark:border-amber-900 shadow-sm">
                  <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1.5 text-center">
                    La tua mano (Sud)
                  </p>
                  <HandFanPreview
                    cards={
                      todayHand.hands[
                        toGamePosition("south", todayHand.declarer)
                      ]
                    }
                  />
                </div>
              </div>

              {/* XP Bonus badge */}
              {!alreadyPlayed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex items-center gap-2"
                >
                  <div className="inline-flex items-center gap-1.5 bg-amber-100/80 rounded-full px-3 py-1">
                    <span className="text-xs">+50 {profile.xpLabel}</span>
                    <span className="text-[10px] font-bold text-amber-700">
                      Bonus Giornaliero
                    </span>
                  </div>
                </motion.div>
              )}

              {/* CTA Button */}
              <div className="mt-5">
                {!alreadyPlayed ? (
                  <Button
                    onClick={() => setIsPlaying(true)}
                    className="w-full rounded-2xl bg-emerald hover:bg-emerald-dark text-base font-bold h-14 shadow-lg shadow-emerald/25 transition-all hover:shadow-xl hover:shadow-emerald/30"
                  >
                    Gioca la Mano del Giorno
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsPlaying(true)}
                    variant="outline"
                    className="w-full rounded-2xl text-sm font-bold h-12 border-emerald/30 text-emerald hover:bg-emerald-50"
                  >
                    Rigioca la mano di oggi
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Result Card (after playing today) ── */}
        <AnimatePresence>
          {alreadyPlayed && todayResult && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-5"
            >
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  todayResult.made
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                {/* Star Rating */}
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3].map((star) => (
                    <motion.span
                      key={star}
                      initial={{ opacity: 0, scale: 0, rotate: -30 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.3 + star * 0.15,
                        type: "spring",
                        stiffness: 300,
                      }}
                      className={`text-3xl ${
                        star <= todayResult.stars
                          ? ""
                          : "grayscale opacity-30"
                      }`}
                    >
                      {"\u2B50"}
                    </motion.span>
                  ))}
                </div>

                <h3
                  className={`text-xl font-bold ${
                    todayResult.made ? "text-emerald-dark dark:text-emerald-300" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {todayResult.result > 0
                    ? `Fatto +${todayResult.result}!`
                    : todayResult.result === 0
                      ? "Contratto Mantenuto!"
                      : `Caduto di ${Math.abs(todayResult.result)}`}
                </h3>

                <p className="text-sm text-muted-foreground mt-2">
                  Prese: {todayResult.tricks} / {tricksNeeded} necessarie
                </p>

                {/* Tricks breakdown bar */}
                <div className="mt-4 mx-auto max-w-xs">
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((todayResult.tricks / 13) * 100, 100)}%`,
                      }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        todayResult.made
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />
                  </div>
                  {/* Target line */}
                  <div className="relative h-0">
                    <div
                      className="absolute -top-3 w-0.5 h-3 bg-foreground/40"
                      style={{
                        left: `${(tricksNeeded / 13) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* XP earned */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-4 py-2">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                      +{todayResult.xpEarned} {profile.xpLabel} guadagnati
                    </span>
                  </div>
                </div>

                {/* Come back tomorrow */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-muted-foreground/70 mt-4"
                >
                  Torna domani per una nuova mano!
                </motion.p>
              </div>

              {/* Field comparison: how the rest of today's players did */}
              {fieldStats && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 card-elevated rounded-2xl bg-card border border-border p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">👥</span>
                    <h4 className="text-sm font-bold text-foreground">
                      Il campo di oggi
                    </h4>
                    <span className="ml-auto text-[11px] font-semibold text-muted-foreground/70">
                      {fieldStats.players} giocatori
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    {fieldStats.percentile >= 50 ? (
                      <>
                        Hai fatto meglio del{" "}
                        <span className="font-bold text-emerald-600">
                          {fieldStats.percentile}%
                        </span>{" "}
                        del campo!
                      </>
                    ) : (
                      <>
                        Hai fatto meglio del{" "}
                        <span className="font-bold text-amber-600">
                          {fieldStats.percentile}%
                        </span>{" "}
                        del campo — domani andrà meglio!
                      </>
                    )}
                  </p>
                  <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, fieldStats.percentile)}%` }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        fieldStats.percentile >= 50
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-amber-400 to-amber-500"
                      }`}
                    />
                  </div>
                  {fieldStats.best > todayResult.result && (
                    <p className="mt-2 text-[11px] text-muted-foreground/70">
                      Miglior risultato del campo:{" "}
                      {fieldStats.best >= 0 ? `+${fieldStats.best}` : fieldStats.best}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Share Result */}
              <div className="mt-4">
                <ShareResult
                  contract={todayHand.contract}
                  tricksMade={todayResult.tricks}
                  tricksNeeded={tricksNeeded}
                  result={todayResult.result}
                  stars={todayResult.stars}
                />
              </div>

              {/* AI Analysis CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-4"
              >
                <Link href="/gioca/analisi">
                  <div className="card-elevated card-interactive rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-900 p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800">
                        <span className="text-lg">🤖</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">Analizza con l&apos;AI</p>
                        <p className="text-[11px] text-muted-foreground">Scopri dove potevi migliorare</p>
                      </div>
                      <svg className="h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="9,6 15,12 9,18" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Countdown to next hand ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5"
        >
          <div className="card-elevated rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                  Nuova mano tra
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                  {mounted ? countdown : "--:--:--"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30">
                <svg
                  className="h-6 w-6 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Daily Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4"
        >
          <div className="card-elevated rounded-2xl bg-card p-5">
            <h3 className="font-bold text-foreground mb-3">
              Le tue statistiche giornaliere
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald">
                  {mounted ? streak : 0}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Giorni consecutivi
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {mounted ? total : 0}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Mani giornaliere
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">
                  {alreadyPlayed && todayResult
                    ? `${todayResult.stars}/3`
                    : "--"}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Stelle oggi
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Yesterday's Hand ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <div className="card-elevated rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <svg
                    className="h-5 w-5 text-muted-foreground/70"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Mano di Ieri
                  </h3>
                  <p className="text-[11px] text-muted-foreground/70">
                    {mounted ? formatDate(yesterday) : ""}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-bold text-muted-foreground/70 border-border"
              >
                {yesterdayHand.contract}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {yesterdayHand.title}
            </p>
            {(() => {
              const yResult = mounted ? getDailyResult(yesterday) : null;
              if (yResult) {
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <span
                            key={s}
                            className={`text-sm ${
                              s <= yResult.stars
                                ? ""
                                : "grayscale opacity-30"
                            }`}
                          >
                            {"\u2B50"}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {yResult.tricks} prese
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlayingYesterday(true)}
                      className="text-xs font-bold text-emerald hover:text-emerald-dark"
                    >
                      Rigioca
                    </Button>
                  </div>
                );
              }
              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlayingYesterday(true)}
                  className="w-full rounded-xl h-10 text-xs font-bold border-border text-muted-foreground hover:text-emerald hover:border-emerald/30"
                >
                  Gioca la mano di ieri
                </Button>
              );
            })()}
          </div>
        </motion.div>

        {/* ── Maestro Fiori Tip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 mb-6"
        >
          <div className="card-elevated rounded-2xl bg-card p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-sm shadow-md shadow-emerald/30">
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="font-bold text-sm text-foreground">
                    Maestro Fiori
                  </p>
                  <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold border-0">
                    Consiglio
                  </Badge>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  La Mano del Giorno è uguale per tutti i giocatori! Gioca
                  ogni giorno per mantenere la tua serie e guadagnare bonus
                  XP. Presto potrai confrontare il tuo risultato con gli
                  altri.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Playing View - Embedded bridge game
// ═══════════════════════════════════════════════════════════════════════════════

function PlayingView({
  smazzata,
  isDaily,
  alreadyPlayed,
  onFinish,
  onBack,
  isMobile,
  profile,
  saveGameResult,
}: {
  smazzata: Smazzata;
  isDaily: boolean;
  alreadyPlayed: boolean;
  onFinish: (tricks: number, result: number, made: boolean) => void;
  onBack: () => void;
  isMobile: boolean;
  profile: import("@/hooks/use-profile").ProfileConfig;
  saveGameResult: (result: import("@/hooks/use-game-results").GameResult) => void;
}) {
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const xpSaved = useRef(false);
  const { play } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);

  const game = useBridgeGame({
    hands: smazzata.hands,
    contract: smazzata.contract,
    declarer,
    playerPositions: [declarer, dummyGamePos],
    openingLead: smazzata.openingLead,
    dealer: smazzata.bidding?.dealer,
    vulnerability: smazzata.vulnerability,
    bidding: smazzata.bidding,
  });

  const handlePlayCard = (displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    const gamePos = toGamePosition(displayPosition as Position, declarer);
    const hand = game.gameState.hands[gamePos];
    if (!hand || cardIndex >= hand.length) return;
    game.handleCardPlay(hand[cardIndex]);
  };

  const mapTrickToDisplay = (
    plays: { position: string; card: CardData }[]
  ) =>
    plays.map((tp) => ({
      position: toDisplayPosition(tp.position as Position, declarer),
      card: tp.card,
    }));

  const trickDisplay =
    game.gameState?.currentTrick.map((tp) => ({
      position: tp.position as string,
      card: tp.card as CardData,
    })) ?? [];

  const displayTrick =
    game.phase === "trick-complete" && game.lastTrick
      ? mapTrickToDisplay(
          game.lastTrick.map((tp) => ({
            position: tp.position,
            card: tp.card as CardData,
          }))
        )
      : mapTrickToDisplay(trickDisplay);

  const displayHands = (gs: typeof game.gameState) => {
    if (!gs) return null;
    return {
      north: gs.hands[toGamePosition("north", declarer)] as CardData[],
      south: gs.hands[toGamePosition("south", declarer)] as CardData[],
      east: gs.hands[toGamePosition("east", declarer)] as CardData[],
      west: gs.hands[toGamePosition("west", declarer)] as CardData[],
    };
  };

  // Report result when game finishes
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current) {
      xpSaved.current = true;
      play(game.result.result >= 0 ? 'contractMade' : 'contractFailed');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reazione a evento asincrono di fine partita (con guard anti-doppio): non derivabile durante il render
      setShowCelebration(true);
      // Save for AI analysis (both daily and yesterday)
      { const p = parseContract(smazzata.contract); saveGameForAnalysis(smazzata.hands, game.gameState?.tricks || [], { level: p.level, suit: p.trumpSuit, declarer: smazzata.declarer }, game.result); }
      if (isDaily) {
        onFinish(
          game.result.tricksMade,
          game.result.result,
          game.result.result >= 0
        );
      } else {
        // Yesterday's hand: save XP (only first time)
        const earned =
          30 +
          (game.result.result >= 0 ? 20 : 0) +
          Math.max(0, game.result.result) * 10;
        awardGameXp(`mano-${smazzata.id}`, earned);
        try { updateLastActivity(); } catch {}
        // Save for AI analysis
        const parsed = parseContract(smazzata.contract);
        saveGameForAnalysis(smazzata.hands, game.gameState?.tricks || [], { level: parsed.level, suit: parsed.trumpSuit, declarer: smazzata.declarer }, game.result);
        // Sync to Supabase
        saveGameResult({
          gameType: "mano-del-giorno",
          score: earned,
          details: {
            tricks: game.result.tricksMade,
            result: game.result.result,
            made: game.result.result >= 0,
            contract: smazzata.contract,
            smazzataId: smazzata.id,
          },
        });
      }
    }
  }, [game.phase, game.result, game.gameState?.tricks, isDaily, onFinish, play, saveGameResult, smazzata.contract, smazzata.declarer, smazzata.hands, smazzata.id]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  return (
    <div className={`pt-4 ${isMobile ? "px-2" : "px-4"}`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-0 shrink-0">
                  {isDaily ? "Mano del Giorno" : "Mano di Ieri"}
                </Badge>
                <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
              </div>
              <h1
                className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-foreground truncate`}
              >
                {smazzata.title}
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Contract bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3 flex items-center justify-center"
        >
          <div
            className={`card-elevated rounded-xl bg-card flex items-center text-sm ${isMobile ? "px-3 py-1.5 gap-3" : "px-4 py-2 gap-5"}`}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                Contratto
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-emerald-dark`}
              >
                {smazzata.contract}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                Obiettivo
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}
              >
                {tricksNeeded} prese
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                Dich. / Dif.
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}
              >
                {partnershipOf(declarer) === "ew"
                  ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                  : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Daily bonus badge (before play) */}
        {isDaily && !alreadyPlayed && game.phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-3 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-1.5">
              <span className="text-xs font-bold text-amber-700">
                +50 {profile.xpLabel} Bonus Giornaliero
              </span>
            </div>
          </motion.div>
        )}

        {/* Start button on mobile */}
        {isMobile && game.phase === "ready" && (
          <div className="mb-3 flex justify-center">
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-11 px-8 shadow-lg shadow-emerald/25"
            >
              Inizia a giocare
            </Button>
          </div>
        )}

        {/* Bridge Table + Bidding Panel */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start items-stretch justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 w-full max-w-3xl relative"
          >
            {hands ? (
              <BridgeTable
                north={hands.north}
                south={hands.south}
                east={hands.east}
                west={hands.west}
                northFaceDown={false}
                southFaceDown={false}
                eastFaceDown={true}
                westFaceDown={true}
                currentTrick={displayTrick}
                contract={smazzata.contract}
                declarer="S"
                vulnerability={smazzata.vulnerability}
                trickCount={partnershipOf(declarer) === "ew" ? { ns: game.gameState!.trickCount.ew, ew: game.gameState!.trickCount.ns } : game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <BridgeTable
                north={
                  smazzata.hands[
                    toGamePosition("north", declarer)
                  ] as CardData[]
                }
                south={
                  smazzata.hands[
                    toGamePosition("south", declarer)
                  ] as CardData[]
                }
                east={
                  smazzata.hands[
                    toGamePosition("east", declarer)
                  ] as CardData[]
                }
                west={
                  smazzata.hands[
                    toGamePosition("west", declarer)
                  ] as CardData[]
                }
                northFaceDown={false}
                southFaceDown={false}
                eastFaceDown={true}
                westFaceDown={true}
                contract={smazzata.contract}
                declarer="S"
                vulnerability={smazzata.vulnerability}
                trickCount={{ ns: 0, ew: 0 }}
                disabled={true}
                compact={isMobile}
                trumpSuit={parseContract(smazzata.contract).trumpSuit}
              />
            )}
            {game.phase === "playing" && <GameTutorial />}
          </motion.div>

          {/* Bidding Panel */}
          {smazzata.bidding && (!isMobile || game.phase === "ready") && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-48 shrink-0"
            >
              <BiddingPanel bidding={smazzata.bidding} declarer={declarer} />
            </motion.div>
          )}
        </div>

        {/* Message */}
        <div
          className={`mt-3 text-center ${isMobile ? "sticky bottom-16 z-20 bg-card/90 backdrop-blur-sm rounded-xl py-2 mx-auto max-w-xs shadow-sm" : ""}`}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={game.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-sm font-semibold ${
                game.phase === "finished"
                  ? game.result && game.result.result >= 0
                    ? "text-emerald"
                    : "text-red-500"
                  : game.isPlayerTurn
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* In-game actions: claim */}
        {(game.phase === "playing" || game.phase === "trick-complete") && (
          <GameActions
            canClaim={game.canClaim}
            claimStatus={game.claimStatus}
            onClaim={game.requestClaim}
            canUndo={game.canUndo}
            onUndo={game.undoLastPlay}
          />
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && !isMobile && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-8 shadow-lg shadow-emerald/25"
            >
              Inizia a giocare
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="rounded-xl h-12 px-6 font-bold"
              >
                Torna alla Mano del Giorno
              </Button>
              <Button
                onClick={() => {
                  xpSaved.current = false;
                  game.startGame();
                }}
                className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-6 shadow-lg shadow-emerald/25"
              >
                Rigioca
              </Button>
            </div>
          )}
        </div>

        {/* Post-game result card */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-6xl space-y-4"
            >
              <CelebrationCombo trigger={showCelebration} type={game.result.result >= 0 ? (game.result.result >= 2 ? 'epic' : 'medium') : 'small'} />
              {/* Main Result Card */}
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                {/* Star Rating */}
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3].map((star) => {
                    const stars = calcStars(game.result!.result);
                    return (
                      <motion.span
                        key={star}
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.3 + star * 0.15,
                          type: "spring",
                          stiffness: 300,
                        }}
                        className={`text-3xl ${star <= stars ? "" : "grayscale opacity-30"}`}
                      >
                        {"\u2B50"}
                      </motion.span>
                    );
                  })}
                </div>

                <h3
                  className={`text-xl font-bold ${
                    game.result.result >= 0
                      ? "text-emerald-dark"
                      : "text-red-600"
                  }`}
                >
                  {game.result.result > 0
                    ? `Fatto +${game.result.result}!`
                    : game.result.result === 0
                      ? "Contratto Mantenuto!"
                      : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>

                {/* Tricks bar */}
                <div className="mt-4 mx-auto max-w-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                    <span>Prese fatte</span>
                    <span>
                      {game.result.tricksMade} / {game.result.tricksNeeded}{" "}
                      necessarie
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((game.result.tricksMade / 13) * 100, 100)}%`,
                      }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        game.result.result >= 0
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />
                  </div>
                  <div className="relative h-0">
                    <div
                      className="absolute -top-3 w-0.5 h-3 bg-foreground/40"
                      style={{
                        left: `${(game.result.tricksNeeded / 13) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Score grid */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="bg-card/60 rounded-xl p-2.5">
                    <p className="text-lg font-bold text-foreground">
                      {game.result.tricksMade}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">
                      Prese
                    </p>
                  </div>
                  <div className="bg-card/60 rounded-xl p-2.5">
                    <p
                      className={`text-lg font-bold ${game.result.result >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {game.result.result >= 0
                        ? `+${game.result.result}`
                        : game.result.result}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">
                      Risultato
                    </p>
                  </div>
                  <div className="bg-card/60 rounded-xl p-2.5">
                    <p className="text-lg font-bold text-amber-600">
                      +
                      {isDaily && !alreadyPlayed
                        ? 30 +
                          (game.result.result >= 0 ? 20 : 0) +
                          Math.max(0, game.result.result) * 10 +
                          50
                        : 30 +
                          (game.result.result >= 0 ? 20 : 0) +
                          Math.max(0, game.result.result) * 10}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">
                      {profile.xpLabel}
                    </p>
                  </div>
                </div>

                {/* Daily bonus callout */}
                {isDaily && !alreadyPlayed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-3 inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-1.5"
                  >
                    <span className="text-xs font-bold text-amber-700">
                      +50 {profile.xpLabel} Bonus Mano del Giorno incluso!
                    </span>
                  </motion.div>
                )}

                {/* Verdict */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                    game.result.result > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : game.result.result === 0
                        ? "bg-blue-100 text-blue-700"
                        : game.result.result === -1
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                  }`}
                >
                  {game.result.result > 0
                    ? "Eccellente! Più prese del necessario"
                    : game.result.result === 0
                      ? "Ben giocato! Contratto esatto"
                      : game.result.result === -1
                        ? "Quasi! Solo una presa in meno"
                        : "Da rivedere - riprova la mano!"}
                </motion.div>
              </div>

              {/* Commentary / Maestro tip */}
              {smazzata.commentary && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="card-elevated rounded-2xl bg-card p-5 border border-border"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-xs">
                      M
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Analisi del Maestro
                    </h4>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {smazzata.commentary}
                  </p>
                </motion.div>
              )}

              {/* Hand summary */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="card-elevated rounded-2xl bg-card p-5 border border-border"
              >
                <h4 className="text-sm font-bold text-foreground mb-3">
                  Riepilogo mano
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contratto</span>
                    <span className="font-bold text-foreground">
                      {smazzata.contract}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dichiarante</span>
                    <span className="font-bold text-foreground">
                      {formatContractItalian(
                        smazzata.contract,
                        smazzata.declarer
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vulnerabilità</span>
                    <span className="font-bold text-foreground">
                      {smazzata.vulnerability === "none"
                        ? "Nessuna"
                        : smazzata.vulnerability === "ns"
                          ? "N-S"
                          : smazzata.vulnerability === "ew"
                            ? "E-O"
                            : "Tutti"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Attacco</span>
                    <span className="font-bold text-foreground">
                      {cardToString(smazzata.openingLead)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Share Result */}
              <ShareResult
                contract={smazzata.contract}
                tricksMade={game.result.tricksMade}
                tricksNeeded={game.result.tricksNeeded}
                result={game.result.result}
                stars={calcStars(game.result.result)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
