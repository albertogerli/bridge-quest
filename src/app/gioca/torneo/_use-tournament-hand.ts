"use client";

import { useEffect, useRef } from "react";
import { useBridgeGame, type BridgeGameHook } from "@/hooks/use-bridge-game";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  type Position,
} from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import type { CardData } from "@/components/bridge/playing-card";

/** Le quattro mani nell'orientamento di schermo (dichiarante sempre a sud). */
export interface DisplayHands {
  north: CardData[];
  south: CardData[];
  east: CardData[];
  west: CardData[];
}

export interface TournamentHand {
  game: BridgeGameHook;
  tricksNeeded: number;
  declarer: Position;
  hands: DisplayHands | null;
  displayTrick: { position: string; card: CardData }[];
  activeDisplayPos: string | undefined;
  handlePlayCard: (displayPosition: string, cardIndex: number) => void;
}

/**
 * Partita di bridge di una singola mano del torneo, con le conversioni
 * posizione di gioco ↔ posizione a schermo.
 *
 * Estratta da `SingleHandView` in `src/app/gioca/torneo/page.tsx` senza cambi di
 * comportamento: `onFinish` viene notificato una volta sola per mano.
 */
export function useTournamentHand({
  smazzata,
  onFinish,
}: {
  smazzata: Smazzata;
  onFinish: (tricksMade: number, result: number) => void;
}): TournamentHand {
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

  const displayHands = (gs: typeof game.gameState): DisplayHands | null => {
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

  return {
    game,
    tricksNeeded,
    declarer,
    hands,
    displayTrick,
    activeDisplayPos,
    handlePlayCard,
  };
}
