"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { allSmazzate, type Smazzata } from "@/data/all-smazzate";
import type { Position } from "@/lib/bridge-engine";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
} from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";

// ─── Tournament Helpers ─────────────────────────────────────────────────────

const TOURNAMENT_HAND_COUNT = 5;
const EPOCH_MS = 7 * 24 * 60 * 60 * 1000; // one week in ms
// Epoch starts from Monday 2024-01-01 (a Monday) to align weeks
const EPOCH_START = new Date("2024-01-01T00:00:00Z").getTime();

function getCurrentWeekNum(): number {
  return Math.floor((Date.now() - EPOCH_START) / EPOCH_MS);
}

function getWeekDates(weekNum: number): { start: Date; end: Date } {
  const startMs = EPOCH_START + weekNum * EPOCH_MS;
  const start = new Date(startMs);
  const end = new Date(startMs + EPOCH_MS - 1);
  return { start, end };
}

function formatDateShort(d: Date): string {
  const day = d.getDate();
  const months = [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
  ];
  return `${day} ${months[d.getMonth()]}`;
}

/**
 * Deterministic selection of tournament hands using the week number as seed.
 * Same week = same 5 hands for all users.
 */
function getTournamentHands(weekNum: number, count: number): Smazzata[] {
  if (allSmazzate.length === 0) return [];
  const ids = allSmazzate.map((_, i) => i);
  const selected: number[] = [];
  const used = new Set<number>();
  let seed = weekNum * 2654435761; // large prime for spreading

  for (let i = 0; i < count && i < ids.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    let idx = seed % ids.length;
    // Avoid duplicates
    let attempts = 0;
    while (used.has(idx) && attempts < ids.length) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      idx = seed % ids.length;
      attempts++;
    }
    used.add(idx);
    selected.push(idx);
  }

  return selected.map((i) => allSmazzate[i]);
}

// ─── localStorage Helpers ───────────────────────────────────────────────────

interface TournamentResult {
  weekNum: number;
  totalTricks: number;
  totalNeeded: number;
  handResults: HandResult[];
  completedAt: string;
  xpEarned: number;
}

interface HandResult {
  smazzataId: string;
  tricksMade: number;
  tricksNeeded: number;
  result: number; // +N or -N
}

function getTournamentResult(weekNum: number): TournamentResult | null {
  try {
    const raw = localStorage.getItem(`bq_tournament_week_${weekNum}`);
    if (!raw) return null;
    return JSON.parse(raw) as TournamentResult;
  } catch {
    return null;
  }
}

function saveTournamentResult(result: TournamentResult) {
  try {
    localStorage.setItem(
      `bq_tournament_week_${result.weekNum}`,
      JSON.stringify(result)
    );
  } catch {}
}

/** Try to save to Supabase (gracefully fail if table doesn't exist) */
async function saveTournamentToSupabase(result: TournamentResult) {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from("tournament_results").upsert(
      {
        user_id: session.user.id,
        week_num: result.weekNum,
        total_tricks: result.totalTricks,
        total_needed: result.totalNeeded,
        completed_at: result.completedAt,
      },
      { onConflict: "user_id,week_num" }
    );
  } catch {
    // Gracefully handle: table may not exist yet
  }
}

/** Try to fetch leaderboard from Supabase */
async function fetchLeaderboard(
  weekNum: number
): Promise<
  { displayName: string; totalTricks: number; totalNeeded: number }[] | null
> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tournament_results")
      .select("total_tricks, total_needed, profiles(display_name)")
      .eq("week_num", weekNum)
      .order("total_tricks", { ascending: false })
      .limit(20);

    if (error || !data) return null;

    return data.map((row: Record<string, unknown>) => ({
      displayName:
        (row.profiles as Record<string, string> | null)?.display_name ||
        "Giocatore",
      totalTricks: row.total_tricks as number,
      totalNeeded: row.total_needed as number,
    }));
  } catch {
    return null;
  }
}

function calcStars(totalResult: number): number {
  if (totalResult >= 3) return 3;
  if (totalResult >= 0) return 2;
  return 1;
}

// ─── Countdown to end of week ───────────────────────────────────────────────

function useWeekCountdown(weekNum: number) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const { end } = getWeekDates(weekNum);
    const endMs = end.getTime() + 1; // end is last ms of week

    function calc() {
      const diff = endMs - Date.now();
      if (diff <= 0) {
        setTimeLeft("Scaduto");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) {
        setTimeLeft(`${days}g ${hours}h ${minutes}m`);
      } else {
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      }
    }

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [weekNum]);

  return timeLeft;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function TorneoSettimanale() {
  const isMobile = useMobile();
  const profile = useProfile();
  const weekNum = getCurrentWeekNum();
  const { start, end } = getWeekDates(weekNum);
  const countdown = useWeekCountdown(weekNum);
  const tournamentHands = useMemo(
    () => getTournamentHands(weekNum, TOURNAMENT_HAND_COUNT),
    [weekNum]
  );

  const [existingResult, setExistingResult] =
    useState<TournamentResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    { displayName: string; totalTricks: number; totalNeeded: number }[] | null
  >(null);

  useEffect(() => {
    setMounted(true);
    setExistingResult(getTournamentResult(weekNum));
    fetchLeaderboard(weekNum).then((lb) => setLeaderboard(lb));
  }, [weekNum]);

  const handleTournamentFinished = useCallback(
    (result: TournamentResult) => {
      setExistingResult(result);
      saveTournamentResult(result);
      saveTournamentToSupabase(result);

      // Award XP
      try {
        const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
        localStorage.setItem("bq_xp", String(prev + result.xpEarned));
        const hp = parseInt(
          localStorage.getItem("bq_hands_played") || "0",
          10
        );
        localStorage.setItem("bq_hands_played", String(hp + TOURNAMENT_HAND_COUNT));
      } catch {}

      // Refresh leaderboard
      fetchLeaderboard(weekNum).then((lb) => setLeaderboard(lb));
    },
    [weekNum]
  );

  // ── Playing view ──
  if (isPlaying) {
    return (
      <TournamentPlayView
        weekNum={weekNum}
        hands={tournamentHands}
        alreadyPlayed={!!existingResult}
        onFinish={handleTournamentFinished}
        onBack={() => setIsPlaying(false)}
        isMobile={isMobile}
        profile={profile}
      />
    );
  }

  const alreadyPlayed = !!existingResult;
  const totalNeeded = tournamentHands.reduce(
    (sum, h) => sum + parseContract(h.contract).tricksNeeded,
    0
  );

  return (
    <div className="pt-6 px-5 pb-28">
      <div className="mx-auto max-w-lg">
        {/* Back nav */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link
              href="/gioca"
              className="hover:text-emerald transition-colors"
            >
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">
              Torneo Settimanale
            </span>
          </div>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 p-6">
            {/* Decorative circles */}
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-200/20 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-200/15 blur-2xl" />

            <div className="relative">
              {/* Title row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-white shadow-md shadow-indigo-200/50 border border-indigo-100">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-gray-900">
                      Torneo Settimanale
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {mounted
                        ? `Settimana #${weekNum} · ${formatDateShort(start)} - ${formatDateShort(end)}`
                        : ""}
                    </p>
                  </div>
                </div>
                {alreadyPlayed && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold border-0 shrink-0">
                    Completato
                  </Badge>
                )}
              </div>

              {/* Tournament info */}
              <div className="space-y-3 mt-2">
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-indigo-100 w-full">
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Mani
                    </p>
                    <p className="text-lg font-black text-indigo-600 leading-tight">
                      {TOURNAMENT_HAND_COUNT}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-indigo-200/60" />
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Prese necessarie
                    </p>
                    <p className="text-lg font-black text-gray-900 leading-tight">
                      {totalNeeded}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-indigo-200/60" />
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Tempo rimasto
                    </p>
                    <p className="text-sm font-black text-purple-600 leading-tight tabular-nums">
                      {mounted ? countdown : "--"}
                    </p>
                  </div>
                </div>

                <p className="text-[13px] font-semibold text-gray-700 leading-snug">
                  Gioca 5 mani selezionate: la stessa sfida per tutti i
                  giocatori questa settimana. Vince chi totalizza piu prese!
                </p>
              </div>

              {/* Hand previews */}
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Le 5 mani del torneo
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {tournamentHands.map((h, i) => {
                    const { tricksNeeded } = parseContract(h.contract);
                    const handResult = existingResult?.handResults[i];
                    return (
                      <div
                        key={h.id}
                        className={`rounded-xl px-2 py-2.5 text-center border ${
                          handResult
                            ? handResult.result >= 0
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-red-50 border-red-200"
                            : "bg-white/70 border-indigo-100"
                        }`}
                      >
                        <p className="text-[10px] font-bold text-gray-400">
                          #{i + 1}
                        </p>
                        <p className="text-sm font-black text-gray-900 leading-tight">
                          {h.contract}
                        </p>
                        <p className="text-[9px] text-gray-500">
                          {tricksNeeded}p
                        </p>
                        {handResult && (
                          <p
                            className={`text-[10px] font-bold mt-0.5 ${
                              handResult.result >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {handResult.tricksMade}/{handResult.tricksNeeded}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* XP info */}
              {!alreadyPlayed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex items-center gap-2"
                >
                  <div className="inline-flex items-center gap-1.5 bg-indigo-100/80 rounded-full px-3 py-1">
                    <span className="text-xs">+150 {profile.xpLabel}</span>
                    <span className="text-[10px] font-bold text-indigo-700">
                      Bonus Torneo
                    </span>
                  </div>
                </motion.div>
              )}

              {/* CTA Button */}
              <div className="mt-5">
                {!alreadyPlayed ? (
                  <Button
                    onClick={() => setIsPlaying(true)}
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-base font-extrabold h-14 shadow-lg shadow-indigo-600/25 transition-all hover:shadow-xl hover:shadow-indigo-600/30"
                  >
                    Gioca il Torneo
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsPlaying(true)}
                    variant="outline"
                    className="w-full rounded-2xl text-sm font-bold h-12 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    Rigioca il torneo (senza punti)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Result Card (after playing) ── */}
        <AnimatePresence>
          {alreadyPlayed && existingResult && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-5"
            >
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  existingResult.totalTricks >= existingResult.totalNeeded
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                {/* Star Rating */}
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3].map((star) => {
                    const totalDelta =
                      existingResult.totalTricks - existingResult.totalNeeded;
                    const stars = calcStars(totalDelta);
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
                        className={`text-3xl ${
                          star <= stars ? "" : "grayscale opacity-30"
                        }`}
                      >
                        {"\u2B50"}
                      </motion.span>
                    );
                  })}
                </div>

                <h3
                  className={`text-xl font-extrabold ${
                    existingResult.totalTricks >= existingResult.totalNeeded
                      ? "text-emerald-dark"
                      : "text-red-600"
                  }`}
                >
                  {existingResult.totalTricks >= existingResult.totalNeeded
                    ? existingResult.totalTricks > existingResult.totalNeeded
                      ? `Torneo Vinto +${existingResult.totalTricks - existingResult.totalNeeded}!`
                      : "Torneo Completato!"
                    : `Caduto di ${existingResult.totalNeeded - existingResult.totalTricks}`}
                </h3>

                <p className="text-sm text-gray-600 mt-2">
                  Prese totali: {existingResult.totalTricks} /{" "}
                  {existingResult.totalNeeded} necessarie
                </p>

                {/* Tricks bar */}
                <div className="mt-4 mx-auto max-w-xs">
                  <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((existingResult.totalTricks / (TOURNAMENT_HAND_COUNT * 13)) * 100, 100)}%`,
                      }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        existingResult.totalTricks >= existingResult.totalNeeded
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />
                  </div>
                  <div className="relative h-0">
                    <div
                      className="absolute -top-3 w-0.5 h-3 bg-gray-900/40"
                      style={{
                        left: `${(existingResult.totalNeeded / (TOURNAMENT_HAND_COUNT * 13)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Per-hand breakdown */}
                <div className="mt-5 grid grid-cols-5 gap-2">
                  {existingResult.handResults.map((hr, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-2 ${
                        hr.result >= 0 ? "bg-emerald-100/60" : "bg-red-100/60"
                      }`}
                    >
                      <p className="text-[9px] font-bold text-gray-400">
                        #{i + 1}
                      </p>
                      <p
                        className={`text-sm font-extrabold ${
                          hr.result >= 0
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {hr.tricksMade}/{hr.tricksNeeded}
                      </p>
                      <p
                        className={`text-[9px] font-bold ${
                          hr.result >= 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {hr.result >= 0 ? `+${hr.result}` : hr.result}
                      </p>
                    </div>
                  ))}
                </div>

                {/* XP earned */}
                <div className="mt-5 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2">
                    <span className="text-sm font-bold text-indigo-700">
                      +{existingResult.xpEarned} {profile.xpLabel} guadagnati
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Leaderboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-5"
        >
          <div className="card-elevated rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">Classifica</h3>
              <Badge
                variant="outline"
                className="text-[10px] font-bold text-gray-400 border-gray-200"
              >
                Settimana #{weekNum}
              </Badge>
            </div>

            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const delta = entry.totalTricks - entry.totalNeeded;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                        i === 0
                          ? "bg-amber-50 border border-amber-200"
                          : i === 1
                            ? "bg-gray-50 border border-gray-200"
                            : i === 2
                              ? "bg-orange-50 border border-orange-200"
                              : "bg-gray-50/50"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-extrabold text-gray-700 shadow-sm">
                        {i === 0
                          ? "\uD83E\uDD47"
                          : i === 1
                            ? "\uD83E\uDD48"
                            : i === 2
                              ? "\uD83E\uDD49"
                              : `${i + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {entry.displayName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-gray-900">
                          {entry.totalTricks}/{entry.totalNeeded}
                        </p>
                        <p
                          className={`text-[10px] font-bold ${
                            delta >= 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {delta >= 0 ? `+${delta}` : delta}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : leaderboard === null ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">
                  {alreadyPlayed
                    ? "Il tuo risultato e stato registrato!"
                    : "Gioca il torneo per entrare in classifica"}
                </p>
                {alreadyPlayed && existingResult && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2">
                    <span className="text-sm font-bold text-indigo-700">
                      {existingResult.totalTricks}/{existingResult.totalNeeded}{" "}
                      prese
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">
                  Nessun partecipante ancora questa settimana
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Maestro Fiori Tip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 mb-6"
        >
          <div className="card-elevated rounded-2xl bg-white p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white font-extrabold text-sm shadow-md shadow-emerald/30">
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="font-bold text-sm text-gray-900">
                    Maestro Fiori
                  </p>
                  <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-0">
                    Consiglio
                  </Badge>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  Il Torneo Settimanale ti permette di sfidare tutti i
                  giocatori sulle stesse 5 mani. Ogni settimana nuove mani
                  e una nuova classifica. Concentrati su ogni presa!
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
// Tournament Play View - Sequential 5 hands
// ═══════════════════════════════════════════════════════════════════════════════

function TournamentPlayView({
  weekNum,
  hands,
  alreadyPlayed,
  onFinish,
  onBack,
  isMobile,
  profile,
}: {
  weekNum: number;
  hands: Smazzata[];
  alreadyPlayed: boolean;
  onFinish: (result: TournamentResult) => void;
  onBack: () => void;
  isMobile: boolean;
  profile: import("@/hooks/use-profile").ProfileConfig;
}) {
  const [currentHandIdx, setCurrentHandIdx] = useState(0);
  const [handResults, setHandResults] = useState<HandResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const currentHand = hands[currentHandIdx];

  const handleHandFinished = useCallback(
    (tricksMade: number, resultDelta: number) => {
      const { tricksNeeded } = parseContract(currentHand.contract);
      const hr: HandResult = {
        smazzataId: currentHand.id,
        tricksMade,
        tricksNeeded,
        result: resultDelta,
      };
      const newResults = [...handResults, hr];
      setHandResults(newResults);

      if (currentHandIdx < hands.length - 1) {
        // Show transition, then move to next hand
        setShowTransition(true);
      } else {
        // All hands done - show summary
        const totalTricks = newResults.reduce(
          (s, r) => s + r.tricksMade,
          0
        );
        const totalNeeded = newResults.reduce(
          (s, r) => s + r.tricksNeeded,
          0
        );
        const totalDelta = totalTricks - totalNeeded;

        // Calculate XP: 30 base per hand + 20 if made + 10 per overtrick + 150 tournament bonus
        const handXp = newResults.reduce((sum, r) => {
          return sum + 30 + (r.result >= 0 ? 20 : 0) + Math.max(0, r.result) * 10;
        }, 0);
        const tournamentBonus = alreadyPlayed ? 0 : 150;
        const xpEarned = handXp + tournamentBonus;

        const tournamentResult: TournamentResult = {
          weekNum,
          totalTricks,
          totalNeeded,
          handResults: newResults,
          completedAt: new Date().toISOString(),
          xpEarned: alreadyPlayed ? 0 : xpEarned,
        };

        if (!alreadyPlayed) {
          onFinish(tournamentResult);
        }
        setShowSummary(true);
      }
    },
    [currentHand, currentHandIdx, handResults, hands.length, weekNum, alreadyPlayed, onFinish]
  );

  const handleNextHand = useCallback(() => {
    setShowTransition(false);
    setCurrentHandIdx((prev) => prev + 1);
  }, []);

  // ── Summary View ──
  if (showSummary) {
    const totalTricks = handResults.reduce((s, r) => s + r.tricksMade, 0);
    const totalNeeded = handResults.reduce((s, r) => s + r.tricksNeeded, 0);
    const totalDelta = totalTricks - totalNeeded;
    const stars = calcStars(totalDelta);

    const handXp = handResults.reduce((sum, r) => {
      return sum + 30 + (r.result >= 0 ? 20 : 0) + Math.max(0, r.result) * 10;
    }, 0);
    const tournamentBonus = alreadyPlayed ? 0 : 150;
    const xpEarned = handXp + tournamentBonus;

    return (
      <div className="pt-6 px-5 pb-28">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className={`card-elevated rounded-3xl p-7 text-center ${
                totalDelta >= 0
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                  : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
              }`}
            >
              {/* Trophy / emoji */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200,
                }}
                className="text-5xl mb-3"
              >
                {totalDelta >= 3 ? "🏆" : totalDelta >= 0 ? "🎉" : "😔"}
              </motion.div>

              {/* Star Rating */}
              <div className="flex justify-center gap-1.5 mb-4">
                {[1, 2, 3].map((star) => (
                  <motion.span
                    key={star}
                    initial={{ opacity: 0, scale: 0, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.4 + star * 0.15,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className={`text-3xl ${
                      star <= stars ? "" : "grayscale opacity-30"
                    }`}
                  >
                    {"\u2B50"}
                  </motion.span>
                ))}
              </div>

              <h2
                className={`text-2xl font-extrabold ${
                  totalDelta >= 0 ? "text-emerald-dark" : "text-red-600"
                }`}
              >
                {totalDelta >= 3
                  ? "Torneo Dominato!"
                  : totalDelta > 0
                    ? `Torneo Vinto +${totalDelta}!`
                    : totalDelta === 0
                      ? "Torneo Completato!"
                      : `Caduto di ${Math.abs(totalDelta)}`}
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                Settimana #{weekNum} · {TOURNAMENT_HAND_COUNT} mani giocate
              </p>

              {/* Total tricks */}
              <div className="mt-5 mx-auto max-w-xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1.5">
                  <span>Prese totali</span>
                  <span>
                    {totalTricks} / {totalNeeded}
                  </span>
                </div>
                <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((totalTricks / (TOURNAMENT_HAND_COUNT * 13)) * 100, 100)}%`,
                    }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className={`h-full rounded-full ${
                      totalDelta >= 0
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                    }`}
                  />
                </div>
                <div className="relative h-0">
                  <div
                    className="absolute -top-4 w-0.5 h-4 bg-gray-900/40"
                    style={{
                      left: `${(totalNeeded / (TOURNAMENT_HAND_COUNT * 13)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Per-hand breakdown */}
              <div className="mt-6 grid grid-cols-5 gap-2">
                {handResults.map((hr, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className={`rounded-xl p-2.5 ${
                      hr.result >= 0
                        ? "bg-emerald-100/80 border border-emerald-200"
                        : "bg-red-100/80 border border-red-200"
                    }`}
                  >
                    <p className="text-[9px] font-bold text-gray-400">
                      #{i + 1}
                    </p>
                    <p className="text-xs font-bold text-gray-500">
                      {hands[i].contract}
                    </p>
                    <p
                      className={`text-lg font-extrabold ${
                        hr.result >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {hr.tricksMade}/{hr.tricksNeeded}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        hr.result >= 0
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {hr.result >= 0 ? `+${hr.result}` : hr.result}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* XP Earned */}
              {!alreadyPlayed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="mt-6 space-y-2"
                >
                  <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-xl px-5 py-2.5">
                    <span className="text-base font-extrabold text-indigo-700">
                      +{xpEarned} {profile.xpLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    ({handXp} gioco + {tournamentBonus} bonus torneo)
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Back button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-6 flex justify-center"
          >
            <Button
              onClick={onBack}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold h-12 px-8 shadow-lg shadow-indigo-600/25"
            >
              Torna al Torneo
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Transition between hands ──
  if (showTransition) {
    const lastResult = handResults[handResults.length - 1];
    const completedCount = handResults.length;
    return (
      <div className="pt-6 px-5 pb-28">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                {hands.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 max-w-12 rounded-full transition-colors ${
                      i < completedCount
                        ? handResults[i]?.result >= 0
                          ? "bg-emerald-400"
                          : "bg-red-400"
                        : i === completedCount
                          ? "bg-indigo-400"
                          : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-gray-400">
                {completedCount} / {TOURNAMENT_HAND_COUNT} mani completate
              </p>
            </div>

            {/* Last hand result */}
            <div
              className={`rounded-2xl p-6 mb-6 ${
                lastResult.result >= 0
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-sm font-bold text-gray-500 mb-1">
                Mano #{completedCount}
              </p>
              <p
                className={`text-2xl font-extrabold ${
                  lastResult.result >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {lastResult.tricksMade} / {lastResult.tricksNeeded} prese
              </p>
              <p
                className={`text-sm font-bold mt-1 ${
                  lastResult.result >= 0
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {lastResult.result >= 0
                  ? lastResult.result === 0
                    ? "Contratto mantenuto!"
                    : `Fatto +${lastResult.result}!`
                  : `Caduto di ${Math.abs(lastResult.result)}`}
              </p>
            </div>

            {/* Running total */}
            <div className="rounded-2xl bg-white p-4 border border-gray-200 mb-6">
              <p className="text-xs font-bold text-gray-400 mb-1">
                Totale parziale
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-extrabold text-gray-900">
                    {handResults.reduce((s, r) => s + r.tricksMade, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500">Prese fatte</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-extrabold text-gray-900">
                    {handResults.reduce((s, r) => s + r.tricksNeeded, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500">Necessarie</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center">
                  {(() => {
                    const delta =
                      handResults.reduce((s, r) => s + r.tricksMade, 0) -
                      handResults.reduce((s, r) => s + r.tricksNeeded, 0);
                    return (
                      <p
                        className={`text-lg font-extrabold ${
                          delta >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {delta >= 0 ? `+${delta}` : delta}
                      </p>
                    );
                  })()}
                  <p className="text-[10px] text-gray-500">Bilancio</p>
                </div>
              </div>
            </div>

            {/* Next hand preview */}
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-5 mb-6">
              <p className="text-xs font-bold text-indigo-500 mb-2">
                Prossima mano: #{completedCount + 1} di {TOURNAMENT_HAND_COUNT}
              </p>
              <p className="text-lg font-extrabold text-gray-900">
                {hands[completedCount].title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Contratto: {hands[completedCount].contract} · Obiettivo:{" "}
                {parseContract(hands[completedCount].contract).tricksNeeded}{" "}
                prese
              </p>
            </div>

            <Button
              onClick={handleNextHand}
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-base font-extrabold h-14 shadow-lg shadow-indigo-600/25"
            >
              Gioca Mano #{completedCount + 1}
            </Button>

            <button
              onClick={onBack}
              className="mt-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Abbandona torneo
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Single hand playing view ──
  return (
    <SingleHandView
      key={`hand-${currentHandIdx}`}
      smazzata={currentHand}
      handNumber={currentHandIdx + 1}
      totalHands={TOURNAMENT_HAND_COUNT}
      handResults={handResults}
      onFinish={handleHandFinished}
      onBack={onBack}
      isMobile={isMobile}
      profile={profile}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Single Hand View - Bridge game for one tournament hand
// ═══════════════════════════════════════════════════════════════════════════════

function SingleHandView({
  smazzata,
  handNumber,
  totalHands,
  handResults,
  onFinish,
  onBack,
  isMobile,
  profile,
}: {
  smazzata: Smazzata;
  handNumber: number;
  totalHands: number;
  handResults: HandResult[];
  onFinish: (tricksMade: number, result: number) => void;
  onBack: () => void;
  isMobile: boolean;
  profile: import("@/hooks/use-profile").ProfileConfig;
}) {
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const finishedRef = useRef(false);

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
    if (game.phase === "finished" && game.result && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(game.result.tricksMade, game.result.result);
    }
  }, [game.phase, game.result, onFinish]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  return (
    <div className={`pt-4 ${isMobile ? "px-2" : "px-4"}`}>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                <Badge className="bg-indigo-50 text-indigo-700 text-[10px] font-bold border-0 shrink-0">
                  Torneo · Mano {handNumber}/{totalHands}
                </Badge>
                <BenStatus available={game.benAvailable} />
              </div>
              <h1
                className={`${isMobile ? "text-sm" : "text-lg"} font-extrabold text-gray-900 truncate`}
              >
                {smazzata.title}
              </h1>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-1 ml-10">
            {Array.from({ length: totalHands }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 max-w-8 rounded-full ${
                  i < handNumber - 1
                    ? handResults[i]?.result >= 0
                      ? "bg-emerald-400"
                      : "bg-red-400"
                    : i === handNumber - 1
                      ? "bg-indigo-500"
                      : "bg-gray-200"
                }`}
              />
            ))}
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
            className={`card-elevated rounded-xl bg-white flex items-center text-sm ${isMobile ? "px-3 py-1.5 gap-3" : "px-4 py-2 gap-5"}`}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Contratto
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-black text-emerald-dark`}
              >
                {smazzata.contract}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Obiettivo
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-black text-gray-900`}
              >
                {tricksNeeded} prese
              </p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                N-S / E-O
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-black text-gray-900`}
              >
                {game.gameState?.trickCount.ns ?? 0} /{" "}
                {game.gameState?.trickCount.ew ?? 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Start button on mobile */}
        {isMobile && game.phase === "ready" && (
          <div className="mb-3 flex justify-center">
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold h-11 px-8 shadow-lg shadow-indigo-600/25"
            >
              Inizia Mano #{handNumber}
            </Button>
          </div>
        )}

        {/* Bridge Table + Bidding */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start items-stretch justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 w-full max-w-2xl relative"
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
                trickCount={game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
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
              />
            )}
            {game.phase === "playing" && <GameTutorial />}
          </motion.div>

          {smazzata.bidding && (!isMobile || game.phase === "ready") && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-48 shrink-0"
            >
              <BiddingPanel bidding={smazzata.bidding} />
            </motion.div>
          )}
        </div>

        {/* Message */}
        <div
          className={`mt-3 text-center ${isMobile ? "sticky bottom-16 z-20 bg-white/90 backdrop-blur-sm rounded-xl py-2 mx-auto max-w-xs shadow-sm" : ""}`}
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
                    : "text-gray-500"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && !isMobile && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold h-12 px-8 shadow-lg shadow-indigo-600/25"
            >
              Inizia Mano #{handNumber}
            </Button>
          )}
        </div>

        {/* Inline result after hand finishes (auto-advances via parent) */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-lg"
            >
              <div
                className={`card-elevated rounded-2xl p-5 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                <h3
                  className={`text-xl font-extrabold ${
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
                <p className="text-sm text-gray-600 mt-2">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  {handNumber < totalHands
                    ? "Passaggio alla prossima mano..."
                    : "Calcolo risultati finali..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
