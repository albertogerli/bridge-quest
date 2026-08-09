"use client";

import { useEffect, useRef, useState } from "react";
import { useBridgeGame, type BridgeGameHook } from "@/hooks/use-bridge-game";
import { useSound } from "@/hooks/use-sound";
import { updateLastActivity } from "@/hooks/use-notifications";
import type { GameResult } from "@/hooks/use-game-results";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  type Position,
} from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import type { CardData } from "@/components/bridge/playing-card";
import { computeHandXp } from "@/lib/daily-hand";
import { saveGameForAnalysis } from "@/lib/save-analysis-data";
import { awardGameXp } from "@/lib/xp-utils";

/** Le quattro mani nell'orientamento di schermo (dichiarante sempre a sud). */
export interface DisplayHands {
  north: CardData[];
  south: CardData[];
  east: CardData[];
  west: CardData[];
}

export interface DailyPlay {
  game: BridgeGameHook;
  tricksNeeded: number;
  declarer: Position;
  hands: DisplayHands | null;
  displayTrick: { position: string; card: CardData }[];
  activeDisplayPos: string | undefined;
  showCelebration: boolean;
  handlePlayCard: (displayPosition: string, cardIndex: number) => void;
  /** "Rigioca": riapre la mano riabilitando il salvataggio XP. */
  replay: () => void;
}

/**
 * Partita di bridge della mano del giorno (o di ieri), con le conversioni
 * posizione di gioco ↔ posizione a schermo e il salvataggio di fine partita.
 *
 * Estratta da `PlayingView` in `src/app/gioca/mano-del-giorno/page.tsx` senza
 * cambi di comportamento: l'esito viene registrato una volta sola per partita.
 */
export function useDailyPlay({
  smazzata,
  isDaily,
  onFinish,
  saveGameResult,
}: {
  smazzata: Smazzata;
  isDaily: boolean;
  onFinish: (tricks: number, result: number, made: boolean) => void;
  saveGameResult: (result: GameResult) => void;
}): DailyPlay {
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
        const earned = computeHandXp(game.result.result);
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

  const replay = () => {
    xpSaved.current = false;
    game.startGame();
  };

  return {
    game,
    tricksNeeded,
    declarer,
    hands,
    displayTrick,
    activeDisplayPos,
    showCelebration,
    handlePlayCard,
    replay,
  };
}
