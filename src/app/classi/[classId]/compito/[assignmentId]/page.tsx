"use client";

import { useEffect, useRef, useState, use } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { GameActions } from "@/components/bridge/game-actions";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { useSmazzate, useValidatedSmazzate } from "@/store/use-smazzate-store";
import type { Smazzata } from "@/lib/catalog";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import type { Position } from "@/lib/bridge-engine";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  partnershipOf,
} from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { classifyPlayErrors } from "@/lib/play-error-classifier";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { CelebrationCombo } from "@/components/celebration-effects";
import { useSound } from "@/hooks/use-sound";
import { useMobile } from "@/hooks/use-mobile";
import { awardGameXp } from "@/lib/xp-utils";
import {
  getAssignment,
  getMyAssignmentProgress,
  getMyAssignmentResults,
  recordAssignmentResult,
  type Assignment,
  type HandResult,
} from "@/lib/instructors";
import { ArrowLeft, Play, CheckCircle2, XCircle } from "lucide-react";

export default function CompitoPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = use(params);

  const { isLoaded: smazzateLoaded } = useSmazzate();
  const validated = useValidatedSmazzate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, HandResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const a = await getAssignment(assignmentId);
        const [prog, res] = await Promise.all([
          getMyAssignmentProgress([assignmentId]),
          getMyAssignmentResults([assignmentId]),
        ]);
        if (active) {
          setAssignment(a);
          setDoneIds(prog.get(assignmentId) ?? new Set());
          setResults(res.get(assignmentId) ?? new Map());
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Errore nel caricamento");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [assignmentId]);

  // Ordered playable hands for this assignment: from the global catalog or,
  // for ids not found there, from the assignment's own PBN-imported hands.
  const hands: Smazzata[] = assignment
    ? assignment.smazzata_ids
        .map(
          (id) =>
            validated.find((s) => s.id === id) ??
            assignment.custom_hands?.find((s) => s.id === id)
        )
        .filter((s): s is Smazzata => s !== undefined)
    : [];

  if (loading || !smazzateLoaded) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Compito non trovato"}</p>
        <Link href={`/classi/${classId}`} className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Torna alla classe
        </Link>
      </div>
    );
  }

  // Playing a hand
  if (currentIndex !== null && currentIndex < hands.length) {
    const smazzata = hands[currentIndex];
    return (
      <CompitoHandGame
        smazzata={smazzata}
        handNumber={currentIndex + 1}
        totalHands={hands.length}
        onFinish={async (score, details) => {
          try {
            await recordAssignmentResult({
              assignmentId,
              smazzataId: smazzata.id,
              score,
              details,
            });
          } catch {
            // best-effort; the local state still advances so the student isn't stuck
          }
          setDoneIds((prev) => new Set(prev).add(smazzata.id));
          setResults((prev) => new Map(prev).set(smazzata.id, { made: score >= 0, result: score }));
          setCurrentIndex(null);
        }}
        onBack={() => setCurrentIndex(null)}
      />
    );
  }

  const completedCount = hands.filter((h) => doneIds.has(h.id)).length;
  const downCount = hands.filter((h) => {
    const r = results.get(h.id);
    return r && !r.made;
  }).length;
  const nextIndex = hands.findIndex((h) => !doneIds.has(h.id));
  const allDone = completedCount === hands.length && hands.length > 0;

  // Overview
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link href={`/classi/${classId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Torna alla classe
      </Link>

      <div className="mt-3 mb-2">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {assignment.title}
        </h1>
        {assignment.instructor_note && (
          <p className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            📝 {assignment.instructor_note}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6 mt-4">
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hands.length ? (completedCount / hands.length) * 100 : 0}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {completedCount}/{hands.length} mani completate
          {downCount > 0 && (
            <span className="font-bold text-red-600"> · {downCount} {downCount === 1 ? "caduta" : "cadute"} da rigiocare</span>
          )}
          {allDone && downCount === 0 && " — Compito completato! 🎉"}
        </p>
      </div>

      {hands.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Le smazzate di questo compito non sono al momento disponibili nel catalogo.
        </p>
      )}

      {/* Hands list */}
      <div className="space-y-3">
        {hands.map((hand, i) => {
          const r = results.get(hand.id);
          const isPlayed = doneIds.has(hand.id) || !!r;
          const isDown = !!r && !r.made;
          const isMade = !!r && r.made;
          const isNext = i === nextIndex;
          return (
            <motion.div
              key={hand.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border bg-card p-4 transition-all ${
                isDown
                  ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                  : isMade
                    ? "border-emerald-200 dark:border-emerald-900"
                    : isNext
                      ? "border-primary/40 shadow-md"
                      : "border-border opacity-70"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    isDown
                      ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                      : isMade
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : isNext
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDown ? <XCircle className="h-5 w-5" /> : isMade ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    Mano {i + 1}: {hand.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contratto {hand.contract} ·{" "}
                    {hand.lesson > 0
                      ? `Lezione ${getLessonDisplayNumber(hand.lesson)}`
                      : "Mano dell'istruttore"}
                  </p>
                  {isDown && (
                    <p className="mt-0.5 text-xs font-bold text-red-600">
                      Caduto{r ? ` di ${Math.abs(r.result)}` : ""} — rigioca questa mano
                    </p>
                  )}
                  {isMade && (
                    <p className="mt-0.5 text-xs font-semibold text-emerald-600">Mantenuto ✓</p>
                  )}
                </div>
                {(isNext || isPlayed) && (
                  <Button
                    onClick={() => setCurrentIndex(i)}
                    size="sm"
                    variant={isDown ? "default" : isPlayed ? "outline" : "default"}
                    className={`shrink-0 ${isDown ? "bg-red-600 text-white hover:bg-red-700" : ""}`}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    {isPlayed ? "Rigioca" : "Gioca"}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inline game component (adapted from the weekly challenge engine) ──────

interface CompitoHandGameProps {
  smazzata: Smazzata;
  handNumber: number;
  totalHands: number;
  onFinish: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

function CompitoHandGame({ smazzata, handNumber, totalHands, onFinish, onBack }: CompitoHandGameProps) {
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const saved = useRef(false);
  const startRef = useRef<number>(Date.now()); // for the speed tiebreak in the class leaderboard
  const isMobile = useMobile();
  const { play } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHint, setShowHint] = useState(false);

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

  const mapTrickToDisplay = (plays: { position: string; card: CardData }[]) =>
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
      ? mapTrickToDisplay(game.lastTrick.map((tp) => ({ position: tp.position, card: tp.card as CardData })))
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

  // Record result + XP when the game finishes.
  useEffect(() => {
    if (game.phase === "finished" && game.result && !saved.current) {
      saved.current = true;
      const res = game.result;
      play(res.result >= 0 ? "contractMade" : "contractFailed");
      setShowCelebration(true);

      const xp = 30 + (res.result >= 0 ? 20 : 0) + Math.max(0, res.result) * 10;
      awardGameXp(`compito-${smazzata.id}`, xp);

      // Classify the student's play errors (rule-based, best-effort) so the
      // instructor portal can aggregate them into a per-student taxonomy.
      let errors: { category: string; trick?: number }[] = [];
      try {
        if (game.gameState) {
          errors = classifyPlayErrors({
            tricks: game.gameState.tricks,
            originalHands: smazzata.hands,
            trumpSuit: parseContract(smazzata.contract).trumpSuit,
            playerPositions: [declarer, dummyGamePos],
            declarer,
          }).map((e) => ({ category: e.category, trick: e.trickNumber }));
        }
      } catch {}

      // score = bridge result (e.g. +1, 0, -2); details power the heatmap.
      setTimeout(
        () =>
          onFinish(res.result, {
            tricksMade: res.tricksMade,
            tricksNeeded: res.tricksNeeded,
            result: res.result,
            made: res.result >= 0,
            contract: smazzata.contract,
            durationMs: Date.now() - startRef.current,
            errors,
            // Full card-by-card play so the instructor can replay the hand.
            play: game.gameState
              ? { hands: game.gameState.hands, tricks: game.gameState.tricks }
              : undefined,
          }),
        2200
      );
    }
  }, [game.phase, game.result, smazzata, onFinish, play]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  return (
    <div className="min-h-screen bg-background px-4 pt-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-3 text-center">
          <button
            onClick={onBack}
            className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Badge variant="outline">Compito</Badge>
            <Badge variant="outline">Mano {handNumber}/{totalHands}</Badge>
            <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
          </div>
          <h1 className="text-lg font-bold">{smazzata.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {smazzata.lesson > 0
              ? `Lezione ${getLessonDisplayNumber(smazzata.lesson)} · `
              : "Mano dell'istruttore · "}
            Board {smazzata.board}
          </p>
        </motion.div>

        {/* Contract bar */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-5 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contratto</p>
              <p className="text-lg font-bold text-primary">{smazzata.contract}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Obiettivo</p>
              <p className="text-lg font-bold">{tricksNeeded} prese</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dich. / Dif.</p>
              <p className="text-lg font-bold">
                {partnershipOf(declarer) === "ew"
                  ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                  : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
              </p>
            </div>
          </div>
        </div>

        {/* Bridge table + bidding */}
        <div className="flex flex-col items-start justify-center gap-4 lg:flex-row">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="relative max-w-3xl flex-1">
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
                north={smazzata.hands[toGamePosition("north", declarer)] as CardData[]}
                south={smazzata.hands[toGamePosition("south", declarer)] as CardData[]}
                east={smazzata.hands[toGamePosition("east", declarer)] as CardData[]}
                west={smazzata.hands[toGamePosition("west", declarer)] as CardData[]}
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

          {smazzata.bidding && (!isMobile || game.phase === "ready") && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="w-full shrink-0 lg:w-48">
              <BiddingPanel bidding={smazzata.bidding} declarer={declarer} />
            </motion.div>
          )}
        </div>

        {/* Message */}
        <div className="mt-4 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={game.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-sm font-semibold ${
                game.phase === "finished"
                  ? game.result && game.result.result >= 0
                    ? "text-emerald-600"
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
          {game.phase === "ready" && (
            <Button onClick={game.startGame} className="h-12 px-8 text-sm font-bold">
              <Play className="mr-2 h-4 w-4" />
              Gioca la mano
            </Button>
          )}
          {game.phase === "finished" && (
            <Button onClick={onBack} className="h-12 px-6 text-sm font-bold">
              Continua →
            </Button>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-auto mt-6 max-w-lg"
            >
              <CelebrationCombo trigger={showCelebration} type={game.result.result >= 0 ? (game.result.result >= 2 ? "epic" : "medium") : "small"} />
              <div
                className={`rounded-2xl border p-6 text-center ${
                  game.result.result >= 0
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                }`}
              >
                <div className="mb-3 text-4xl">{game.result.result >= 0 ? "🎉" : "😔"}</div>
                <h3 className={`text-xl font-bold ${game.result.result >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {game.result.result >= 0
                    ? game.result.result === 0
                      ? "Contratto mantenuto!"
                      : `Contratto +${game.result.result}!`
                    : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        {game.phase === "ready" && smazzata.commentary && (
          <div className="mx-auto mt-6 max-w-lg">
            <button
              onClick={() => setShowHint(!showHint)}
              className="mx-auto mb-2 flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/70"
            >
              {showHint ? "Nascondi suggerimento" : "Mostra suggerimento"}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{smazzata.commentary}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
