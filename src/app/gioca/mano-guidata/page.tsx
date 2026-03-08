"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { GUIDED_HANDS, type GuidedHand } from "@/data/guided-hands";
import type { Position } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition } from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { ShareResult } from "@/components/bridge/share-result";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { updateLastActivity } from "@/hooks/use-notifications";
import { awardGameXp } from "@/lib/xp-utils";
import { useGameResults } from "@/hooks/use-game-results";
import { CelebrationCombo } from "@/components/celebration-effects";
import { useSound } from "@/hooks/use-sound";
import { ArrowLeft, Target, Swords, CheckCircle2, ChevronRight } from "lucide-react";

function isHandCompleted(handId: number): boolean {
  try {
    return localStorage.getItem(`bq_guided_hand_${handId}`) === "1";
  } catch {
    return false;
  }
}

function markHandCompleted(handId: number) {
  try {
    localStorage.setItem(`bq_guided_hand_${handId}`, "1");
    // Increment hands played
    const current = parseInt(localStorage.getItem("bq_hands_played") || "0", 10);
    localStorage.setItem("bq_hands_played", String(current + 1));
  } catch {}
}

// ─── Hand Selection ─────────────────────────────────────────────────────────

function HandSelector({ onSelect }: { onSelect: (hand: GuidedHand) => void }) {
  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0f1219]">
      <header className="sticky top-0 z-30 bg-[#F7F5F0]/80 dark:bg-[#0f1219]/80 backdrop-blur-xl border-b border-[#e5e0d5] dark:border-[#2a3040]">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3.5">
          <Link
            href="/gioca"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mano Guidata</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pratica passo-passo</p>
          </div>
          <Target className="w-5 h-5 text-[#003DA5]" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Intro card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#003DA5]/5 border border-[#003DA5]/15 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003DA5]/10 shrink-0">
              <Target className="w-5 h-5 text-[#003DA5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Impara giocando
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Due mani progettate per consolidare le basi. La prima è facile con suggerimenti,
                la seconda più impegnativa senza aiuti.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hand cards */}
        {GUIDED_HANDS.map((hand, i) => {
          const completed = isHandCompleted(hand.id);
          return (
            <motion.div
              key={hand.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <button
                onClick={() => onSelect(hand)}
                className="w-full text-left rounded-2xl border border-[#e5e0d5] dark:border-[#2a3040] bg-white dark:bg-[#1a1f2e] shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Gradient header */}
                <div
                  className={`px-5 py-3 ${
                    hand.difficulty === "facile"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{hand.difficulty === "facile" ? "🎯" : "⚔️"}</span>
                      <span className="text-sm font-bold text-white">Mano {hand.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 text-white text-[10px] font-bold border-0 backdrop-blur-sm">
                        {hand.difficulty === "facile" ? "Facile" : "Medio"}
                      </Badge>
                      {completed && (
                        <Badge className="bg-emerald-400/30 text-white text-[10px] font-bold border-0 backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completata
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {hand.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {hand.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>Contratto: <span className="font-bold text-gray-600">{hand.contract}</span></span>
                      <span>{hand.tricksNeeded} prese</span>
                      {hand.hints.length > 0 && (
                        <span className="text-cyan-500 font-semibold">💡 Con suggerimenti</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#003DA5] font-bold text-xs">
                      {completed ? "Rigioca" : "Gioca"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}

        {/* Back to path */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-2 text-center"
        >
          <Link href="/gioca" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Torna a Gioca
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Hint Overlay ────────────────────────────────────────────────────────────

function HintOverlay({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm"
    >
      <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 shadow-lg shadow-cyan-500/10">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">💡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-cyan-900">Suggerimento</p>
            <p className="text-xs text-cyan-700 mt-1 leading-relaxed">{text}</p>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-3 py-1 text-[10px] font-bold text-cyan-600 bg-cyan-100 hover:bg-cyan-200 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Gameplay ────────────────────────────────────────────────────────────────

function GuidedGameplay({
  hand,
  onBack,
}: {
  hand: GuidedHand;
  onBack: () => void;
}) {
  const declarer = hand.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const xpSaved = useRef(false);
  const [alreadyCompleted] = useState(() => isHandCompleted(hand.id));
  const isMobile = useMobile();
  const profile = useProfile();
  const { saveGameResult } = useGameResults();
  const { play } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const shownHints = useRef(new Set<number>());

  const game = useBridgeGame({
    hands: hand.hands,
    contract: hand.contract,
    declarer,
    playerPositions: [declarer, dummyGamePos],
    openingLead: hand.openingLead,
  });

  // Show hints at specific trick numbers
  useEffect(() => {
    if (game.phase !== "playing" || !game.gameState) return;
    const trickNum = game.gameState.trickCount.ns + game.gameState.trickCount.ew + 1;
    const hint = hand.hints.find((h) => h.trick === trickNum);
    if (hint && !shownHints.current.has(trickNum)) {
      shownHints.current.add(trickNum);
      setActiveHint(hint.text);
    }
  }, [game.phase, game.gameState?.trickCount.ns, game.gameState?.trickCount.ew, hand.hints]);

  const handlePlayCard = (displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    const gamePos = toGamePosition(displayPosition as Position, declarer);
    const handCards = game.gameState.hands[gamePos];
    if (!handCards || cardIndex >= handCards.length) return;
    game.handleCardPlay(handCards[cardIndex]);
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

  // Save XP on finish
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current) {
      xpSaved.current = true;
      play(game.result.result >= 0 ? "contractMade" : "contractFailed");
      setShowCelebration(true);
      const xp = 25 + (game.result.result >= 0 ? 10 : 0);
      awardGameXp(`guided-hand-${hand.id}`, xp);
      if (!alreadyCompleted) markHandCompleted(hand.id);
      try { updateLastActivity(); } catch {}
      saveGameResult({
        gameType: "mano-guidata",
        score: xp,
        details: {
          handId: hand.id,
          tricks: game.result.tricksMade,
          tricksNeeded: game.result.tricksNeeded,
          result: game.result.result,
          made: game.result.result >= 0,
          contract: hand.contract,
        },
      });
    }
  }, [game.phase, game.result, alreadyCompleted, hand.id, hand.contract, saveGameResult, play]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  // Find the other hand for "Try next" CTA
  const otherHand = GUIDED_HANDS.find((h) => h.id !== hand.id);

  return (
    <div className="pt-4 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <button
              onClick={onBack}
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Badge
              className={`text-[10px] font-bold border-0 ${
                hand.difficulty === "facile"
                  ? "bg-cyan-50 text-cyan-700"
                  : "bg-purple-50 text-purple-700"
              }`}
            >
              Mano Guidata {hand.id}
            </Badge>
            {hand.hints.length > 0 && (
              <Badge className="bg-cyan-50 text-cyan-600 text-[10px] font-bold border-0">
                💡 Guidata
              </Badge>
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-900">{hand.name}</h1>
          <p className="text-xs text-gray-500 mt-1">{hand.description}</p>
        </motion.div>

        {/* Contract bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 flex items-center justify-center"
        >
          <div className="card-elevated rounded-xl bg-white px-4 py-2 flex items-center gap-5 text-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contratto</p>
              <p className="text-lg font-bold text-emerald-dark">{hand.contract}</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Obiettivo</p>
              <p className="text-lg font-bold text-gray-900">{hand.tricksNeeded} prese</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">N-S / E-O</p>
              <p className="text-lg font-bold text-gray-900">
                {game.gameState?.trickCount.ns ?? 0} / {game.gameState?.trickCount.ew ?? 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bridge Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 max-w-2xl mx-auto relative"
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
              contract={hand.contract}
              declarer="S"
              trickCount={game.gameState!.trickCount}
              onPlayCard={handlePlayCard}
              highlightedCards={game.validCards as CardData[]}
              activePosition={activeDisplayPos}
              disabled={!game.isPlayerTurn}
              compact={isMobile}
              trumpSuit={game.gameState?.trumpSuit}
            />
          ) : (
            <BridgeTable
              north={hand.hands[toGamePosition("north", declarer)] as CardData[]}
              south={hand.hands[toGamePosition("south", declarer)] as CardData[]}
              east={hand.hands[toGamePosition("east", declarer)] as CardData[]}
              west={hand.hands[toGamePosition("west", declarer)] as CardData[]}
              northFaceDown={false}
              southFaceDown={false}
              eastFaceDown={true}
              westFaceDown={true}
              contract={hand.contract}
              declarer="S"
              trickCount={{ ns: 0, ew: 0 }}
              disabled={true}
              compact={isMobile}
              trumpSuit={parseContract(hand.contract).trumpSuit}
            />
          )}
          {game.phase === "playing" && <GameTutorial />}
          <AnimatePresence>
            {activeHint && (
              <HintOverlay text={activeHint} onDismiss={() => setActiveHint(null)} />
            )}
          </AnimatePresence>
        </motion.div>

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
          {game.phase === "ready" && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-8 shadow-lg shadow-emerald/25"
            >
              {alreadyCompleted ? "Rigioca" : "Inizia la mano"}
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Button
                onClick={onBack}
                variant="outline"
                className="rounded-xl h-12 px-6 font-bold"
              >
                Scegli mano
              </Button>
              {otherHand && !isHandCompleted(otherHand.id) && (
                <Button
                  onClick={() => {
                    xpSaved.current = false;
                    onBack();
                  }}
                  className="rounded-xl bg-[#003DA5] hover:bg-[#002d7a] text-sm font-bold h-12 px-6 shadow-lg shadow-[#003DA5]/25"
                >
                  Prova Mano {otherHand.id}
                </Button>
              )}
              <Button
                onClick={() => { xpSaved.current = false; game.startGame(); }}
                className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-6 shadow-lg shadow-emerald/25"
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
              className="mt-6 mx-auto max-w-lg"
            >
              <CelebrationCombo
                trigger={showCelebration}
                type={game.result.result >= 0 ? (game.result.result >= 2 ? "epic" : "medium") : "small"}
              />
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                <div className="text-4xl mb-3">
                  {game.result.result >= 0 ? "🎉" : "😔"}
                </div>
                <h3
                  className={`text-xl font-bold ${
                    game.result.result >= 0 ? "text-emerald-dark" : "text-red-600"
                  }`}
                >
                  {game.result.result >= 0
                    ? game.result.result === 0
                      ? "Contratto Mantenuto!"
                      : `Contratto Mantenuto +${game.result.result}!`
                    : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-bold text-amber-700">
                      +{25 + (game.result.result >= 0 ? 10 : 0)} {profile.xpLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 mx-auto max-w-lg">
                <ShareResult
                  contract={hand.contract}
                  tricksMade={game.result.tricksMade}
                  tricksNeeded={game.result.tricksNeeded}
                  result={game.result.result}
                  stars={game.result.result > 0 ? 3 : game.result.result === 0 ? 2 : game.result.result === -1 ? 1 : 0}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ManoGuidataPage() {
  const [selectedHand, setSelectedHand] = useState<GuidedHand | null>(null);

  if (selectedHand) {
    return (
      <GuidedGameplay
        hand={selectedHand}
        onBack={() => setSelectedHand(null)}
      />
    );
  }

  return <HandSelector onSelect={setSelectedHand} />;
}
