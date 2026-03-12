"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { ONBOARDING_HAND } from "../onboarding-hand";
import type { Position } from "@/lib/bridge-engine";
import { toDisplayPosition, toGamePosition } from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { CelebrationCombo } from "@/components/celebration-effects";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import type { StepProps } from "../types";

interface StepManoVeraProps extends StepProps {
  onHandResult: (result: { tricksMade: number; tricksNeeded: number; made: boolean }) => void;
}

const TUTORIAL_TIPS = [
  "Le carte verdi sono giocabili. Tocca una per giocarla.",
  "Ora tocca le carte del morto (Nord). Le controlli tu.",
  "Guarda il contatore prese in centro. Devi arrivare a 10.",
];

export function StepManoVera({ onComplete, playSound, onHandResult }: StepManoVeraProps) {
  const declarer = ONBOARDING_HAND.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const xpSaved = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

  const game = useBridgeGame({
    hands: ONBOARDING_HAND.hands,
    contract: ONBOARDING_HAND.contract,
    declarer,
    playerPositions: [declarer, dummyGamePos],
    openingLead: ONBOARDING_HAND.openingLead,
  });

  // Auto-start the game when component mounts
  useEffect(() => {
    game.startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trickCount = game.gameState?.tricks.length || 0;
  const showTutorial = !tutorialDismissed && trickCount < 3;
  const tutorialTip = showTutorial ? TUTORIAL_TIPS[Math.min(trickCount, 2)] : null;

  // Dismiss tutorial after trick 3
  useEffect(() => {
    if (trickCount >= 3) setTutorialDismissed(true);
  }, [trickCount]);

  // Handle game completion
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current) {
      xpSaved.current = true;
      const made = game.result.result >= 0;
      const tricksMade = game.result.tricksMade;
      const tricksNeeded = game.result.tricksNeeded;

      onHandResult({ tricksMade, tricksNeeded, made });
      setShowCelebration(true);
      playSound("levelUp");

      setTimeout(() => {
        onComplete(30 + (made ? 20 : 0));
      }, 2500);
    }
  }, [game.phase, game.result, onComplete, onHandResult, playSound]);

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
      ? mapTrickToDisplay(
          game.lastTrick.map((tp) => ({
            position: tp.position,
            card: tp.card as CardData,
          }))
        )
      : mapTrickToDisplay(trickDisplay);

  const hands = game.gameState
    ? {
        north: game.gameState.hands[toGamePosition("north", declarer)] as CardData[],
        south: game.gameState.hands[toGamePosition("south", declarer)] as CardData[],
        east: game.gameState.hands[toGamePosition("east", declarer)] as CardData[],
        west: game.gameState.hands[toGamePosition("west", declarer)] as CardData[],
      }
    : null;

  const activePosition = game.gameState
    ? toDisplayPosition(game.gameState.currentPlayer, declarer)
    : undefined;

  return (
    <div className="space-y-4">
      <CelebrationCombo trigger={showCelebration} type="epic" />

      {/* Contract info bar */}
      <div className="flex items-center justify-between rounded-[20px] border border-[#d8d0c0] bg-[#fffaf0] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#12305f]">Contratto:</span>
          <span className="flex items-center gap-1 text-sm font-bold text-[#003DA5]">
            4 <SuitSymbol suit="spade" size="sm" />
          </span>
        </div>
        <div className="text-sm text-[#5c677d]">
          Prese:{" "}
          <span className="font-bold text-[#12305f]">
            {game.gameState?.trickCount.ns || 0}
          </span>
          /10
        </div>
      </div>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {tutorialTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-[20px] border border-[#c8a44e]/30 bg-[#fffdf5] px-4 py-3 text-sm text-[#8f6b16]"
          >
            {tutorialTip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bridge Table */}
      {hands && (
        <div className="rounded-[24px] border border-[#d8d0c0] bg-white p-2 shadow-md">
          <BridgeTable
            north={hands.north}
            south={hands.south}
            east={hands.east}
            west={hands.west}
            northFaceDown={false}
            eastFaceDown={true}
            westFaceDown={true}
            currentTrick={displayTrick}
            contract={ONBOARDING_HAND.contract}
            declarer={toDisplayPosition(declarer, declarer).charAt(0).toUpperCase()}
            dummy={toDisplayPosition(dummyGamePos, declarer).charAt(0).toUpperCase()}
            trickCount={game.gameState?.trickCount}
            onPlayCard={handlePlayCard}
            highlightedCards={game.validCards as CardData[]}
            activePosition={activePosition}
            compact={true}
            trumpSuit="spade"
          />
        </div>
      )}

      {/* Game message */}
      {game.message && (
        <p className="text-center text-sm italic text-[#5c677d]">{game.message}</p>
      )}
    </div>
  );
}
