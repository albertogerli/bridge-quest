"use client";

/**
 * FIGB BridgeLab - Weekly Challenge Page
 * 5 hands per week, played directly in-page with progress tracking
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { usePlayableSmazzate, useSmazzate } from "@/store/use-smazzate-store";
import type { Smazzata } from "@/lib/catalog";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import { useCurrentWeeklyChallenge } from "@/store/use-weekly-challenges-store";
import { getIsoWeekId, getTimeRemainingInWeek, type WeeklyChallenge } from "@/lib/catalog";
import {
  getWeeklyChallengeProgress,
  updateWeeklyChallengeProgress,
} from "@/lib/weekly-challenge-progress";
import type { Position } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition, partnershipOf } from "@/lib/bridge-engine";
import { saveGameForAnalysis } from "@/lib/save-analysis-data";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { ShareResult } from "@/components/bridge/share-result";
import { CelebrationCombo } from "@/components/celebration-effects";
import { useSound } from "@/hooks/use-sound";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { updateLastActivity } from "@/hooks/use-notifications";
import { awardGameXp } from "@/lib/xp-utils";
import { useGameResults } from "@/hooks/use-game-results";
import { ArrowLeft, Trophy, Zap, Clock, Play, CheckCircle2 } from "lucide-react";

const HANDS_PER_WEEK = 5;

/** Deterministic: pick 5 hands for this week based on the shared ISO week id. */
function getWeeklySmazzate(pool: Smazzata[]): Smazzata[] {
  if (pool.length === 0) return [];
  const weekId = getIsoWeekId();
  const result: Smazzata[] = [];
  for (let i = 0; i < HANDS_PER_WEEK; i++) {
    const hash = ((weekId * 31 + i * 7919) % pool.length + pool.length) % pool.length;
    result.push(pool[hash]);
  }
  return result;
}

export default function SfidaSettimanale() {
  const challenge = useCurrentWeeklyChallenge();
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [currentHandIndex, setCurrentHandIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(() => getWeeklyChallengeProgress(challenge));

  const { isLoaded: isSmazzateLoaded } = useSmazzate();
  const playable = usePlayableSmazzate();
  const weeklyHands = getWeeklySmazzate(playable);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
    setMounted(true);
    setProgress(getWeeklyChallengeProgress(challenge));
    const updateTimer = () => setTimeRemaining(getTimeRemainingInWeek());
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [challenge]);

  // Find next unplayed hand
  const nextUnplayed = progress.completedHands.length < HANDS_PER_WEEK
    ? progress.completedHands.length
    : null;

  if (!mounted || !challenge) return null;

  if (!isSmazzateLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Caricamento sfida in corso...</p>
        </div>
      </div>
    );
  }

  const progressPercent = (progress.played / progress.target) * 100;

  // If playing a hand, show the game
  if (currentHandIndex !== null && currentHandIndex < weeklyHands.length) {
    return (
      <WeeklyHandGame
        smazzata={weeklyHands[currentHandIndex]}
        handNumber={currentHandIndex + 1}
        challenge={challenge}
        onFinish={(score, xpGained) => {
          updateWeeklyChallengeProgress(
            challenge,
            `weekly-${challenge.id}-hand-${currentHandIndex}`,
            score,
            xpGained
          );
          setProgress(getWeeklyChallengeProgress(challenge));
          setCurrentHandIndex(null);
        }}
        onBack={() => setCurrentHandIndex(null)}
      />
    );
  }

  // Overview page
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-br ${challenge.gradient} text-white px-4 pt-6 pb-10`}>
        <div className="mx-auto max-w-6xl">
          <Link href="/gioca" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Torna a Gioca
          </Link>

          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{challenge.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{challenge.name}</h1>
              <p className="text-white/80 text-base">{challenge.description}</p>
            </div>
          </div>

          {/* Timer + XP */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <Clock className="h-3.5 w-3.5" />
              Scade tra: {timeRemaining.days}g {timeRemaining.hours}h {timeRemaining.minutes}m
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold">
              <Zap className="h-3.5 w-3.5" />
              {challenge.xpMultiplier}x XP
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 bg-white/15 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6 }}
              className="bg-white h-full rounded-full"
            />
          </div>
          <p className="text-sm text-white/70 mt-2">
            {progress.played}/{progress.target} mani completate
            {progress.completed && " — Sfida completata!"}
          </p>
        </div>
      </div>

      {/* Hands list */}
      <div className="px-4 -mt-4">
        <div className="mx-auto max-w-6xl space-y-3">
          {weeklyHands.map((hand, i) => {
            const isPlayed = i < progress.completedHands.length;
            const isNext = i === nextUnplayed;
            const completedData = progress.completedHands[i];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card rounded-2xl p-4 shadow-sm border transition-all ${
                  isPlayed
                    ? "border-emerald-200"
                    : isNext
                      ? "border-figb/30 dark:border-primary/40 shadow-md"
                      : "border-border opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                    isPlayed
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : isNext
                        ? `bg-gradient-to-br ${challenge.gradient} text-white`
                        : "bg-muted text-muted-foreground/70"
                  }`}>
                    {isPlayed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{i + 1}</span>
                    )}
                  </div>

                  {/* Hand info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      Mano {i + 1}: {hand.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contratto {hand.contract} · Lezione {getLessonDisplayNumber(hand.lesson)}
                    </p>
                    {isPlayed && completedData && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        +{completedData.xpGained} XP · Punteggio: {completedData.score}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  {isNext && (
                    <Button
                      onClick={() => setCurrentHandIndex(i)}
                      size="sm"
                      className="rounded-xl bg-figb hover:bg-figb-dark font-bold text-xs h-9 px-4 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Gioca
                    </Button>
                  )}
                  {isPlayed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Giocata</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 mt-6">
        <div className="mx-auto max-w-6xl">
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              💡 Suggerimenti per questa settimana
            </h2>
            <ul className="space-y-2">
              {challenge.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-figb text-white text-[10px] font-bold">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Badge section */}
      {progress.completed && (
        <div className="px-4 mt-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-6 text-center bg-gradient-to-br ${challenge.gradient} text-white`}
            >
              <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-300" />
              <h2 className="text-xl font-bold mb-1">Sfida Completata!</h2>
              <p className="text-white/80 text-base mb-2">Badge &quot;{challenge.badgeName}&quot; sbloccato</p>
              <p className="text-sm text-white/60">
                XP totali: {progress.xpEarned} XP
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline game component ──────────────────────────────────────────────

interface WeeklyHandGameProps {
  smazzata: Smazzata;
  handNumber: number;
  challenge: WeeklyChallenge;
  onFinish: (score: number, xpGained: number) => void;
  onBack: () => void;
}

function WeeklyHandGame({ smazzata, handNumber, challenge, onFinish, onBack }: WeeklyHandGameProps) {
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const xpSaved = useRef(false);
  const isMobile = useMobile();
  const profile = useProfile();
  const { saveGameResult } = useGameResults();
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

  // Save XP when game finishes
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current) {
      xpSaved.current = true;
      play(game.result.result >= 0 ? "contractMade" : "contractFailed");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reazione a evento asincrono di fine partita (con guard anti-doppio): non derivabile durante il render
      setShowCelebration(true);

      const baseXp = 30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10;
      const multipliedXp = Math.round(baseXp * challenge.xpMultiplier);

      awardGameXp(`weekly-${challenge.id}-hand-${handNumber}`, multipliedXp);
      try { updateLastActivity(); } catch {}

      // Save for AI analysis
      const parsed = parseContract(smazzata.contract);
      saveGameForAnalysis(smazzata.hands, game.gameState?.tricks || [], { level: parsed.level, suit: parsed.trumpSuit, declarer: smazzata.declarer }, game.result);

      saveGameResult({
        gameType: "sfida-settimanale",
        score: multipliedXp,
        details: {
          tricks: game.result.tricksMade,
          tricksNeeded: game.result.tricksNeeded,
          result: game.result.result,
          made: game.result.result >= 0,
          contract: smazzata.contract,
          weekChallenge: challenge.name,
          handNumber,
        },
      });

      // Notify parent after a short delay
      setTimeout(() => onFinish(game.result!.result, multipliedXp), 2500);
    }
  }, [game.phase, game.result, game.gameState?.tricks, challenge, handNumber, saveGameResult, onFinish, play, smazzata.contract, smazzata.declarer, smazzata.hands]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  return (
    <div className="pt-4 px-4 min-h-screen bg-background">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <button
              onClick={onBack}
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Badge className={`bg-gradient-to-r ${challenge.gradient} text-white text-[10px] font-bold border-0`}>
              {challenge.name}
            </Badge>
            <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold border-0">
              Mano {handNumber}/5
            </Badge>
            <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
          </div>
          <h1 className="text-lg font-bold text-foreground">{smazzata.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Lezione {getLessonDisplayNumber(smazzata.lesson)} · Board {smazzata.board}
          </p>
        </motion.div>

        {/* Contract bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 flex items-center justify-center">
          <div className="card-elevated rounded-xl bg-card px-4 py-2 flex items-center gap-5 text-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Contratto</p>
              <p className="text-lg font-bold text-figb dark:text-primary">{smazzata.contract}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Obiettivo</p>
              <p className="text-lg font-bold text-foreground">{tricksNeeded} prese</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Dich. / Dif.</p>
              <p className="text-lg font-bold text-foreground">
                {partnershipOf(declarer) === "ew"
                  ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                  : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">XP</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{challenge.xpMultiplier}x</p>
            </div>
          </div>
        </motion.div>

        {/* Bridge Table + Bidding */}
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex-1 max-w-3xl relative">
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
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="w-full lg:w-48 shrink-0">
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
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                  : game.isPlayerTurn
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && (
            <Button
              onClick={game.startGame}
              className={`rounded-xl bg-gradient-to-r ${challenge.gradient} text-white text-sm font-bold h-12 px-8 shadow-lg`}
            >
              <Play className="w-4 h-4 mr-2" />
              Gioca Mano {handNumber}
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Button onClick={onBack} variant="outline" className="rounded-xl h-12 px-6 font-bold">
                Torna alla Sfida
              </Button>
              <Button
                onClick={() => { xpSaved.current = false; game.startGame(); }}
                className="rounded-xl bg-figb hover:bg-figb-dark text-sm font-bold h-12 px-6"
              >
                Rigioca
              </Button>
            </div>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-6xl"
            >
              <CelebrationCombo trigger={showCelebration} type={game.result.result >= 0 ? (game.result.result >= 2 ? "epic" : "medium") : "small"} />
              <div className={`card-elevated rounded-2xl p-6 text-center ${
                game.result.result >= 0
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-900"
                  : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 dark:from-red-950/40 dark:to-red-900/20 dark:border-red-900"
              }`}>
                <div className="text-4xl mb-3">{game.result.result >= 0 ? "🎉" : "😔"}</div>
                <h3 className={`text-xl font-bold ${game.result.result >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>
                  {game.result.result >= 0
                    ? game.result.result === 0
                      ? "Contratto Mantenuto!"
                      : `Contratto +${game.result.result}!`
                    : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-4 py-2">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    +{Math.round((30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10) * challenge.xpMultiplier)} {profile.xpLabel} ({challenge.xpMultiplier}x)
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <ShareResult
                  contract={smazzata.contract}
                  tricksMade={game.result.tricksMade}
                  tricksNeeded={game.result.tricksNeeded}
                  result={game.result.result}
                  stars={game.result.result > 0 ? 3 : game.result.result === 0 ? 2 : game.result.result === -1 ? 1 : 0}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        {game.phase === "ready" && smazzata.commentary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 mx-auto max-w-6xl">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 mx-auto mb-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/70 text-sm font-semibold text-muted-foreground transition-colors"
            >
              {showHint ? "Nascondi suggerimento" : "Mostra suggerimento"}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="card-elevated rounded-2xl bg-card p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{smazzata.commentary}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
