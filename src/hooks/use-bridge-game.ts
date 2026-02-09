"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  type Card,
  type Position,
  type GameState,
  type TrickPlay,
  createGame,
  playCard,
  aiSelectCard,
  getValidCards,
  getResult,
  partnerOf,
  partnershipOf,
} from "@/lib/bridge-engine";
import type { Vulnerability, BiddingData } from "@/data/smazzate";
import { checkBenHealth, benPlay } from "@/lib/ben-client";

export type GamePhase = "ready" | "playing" | "trick-complete" | "finished";

export interface BridgeGameHook {
  gameState: GameState | null;
  phase: GamePhase;
  validCards: Card[];
  lastTrick: TrickPlay[] | null;
  message: string;
  startGame: () => void;
  handleCardPlay: (card: Card) => void;
  result: ReturnType<typeof getResult> | null;
  isPlayerTurn: boolean;
  highlightedCards: Card[];
  benAvailable: boolean | null; // null = checking, true/false = result
}

interface GameConfig {
  hands: Record<Position, Card[]>;
  contract: string;
  declarer: Position;
  playerPositions: Position[]; // positions the human controls (e.g. ["north", "south"])
  openingLead?: Card;
  // BEN integration fields
  dealer?: Position;
  vulnerability?: Vulnerability;
  bidding?: BiddingData;
}

const AI_DELAY = 600; // ms delay for AI plays (used when BEN not available)
const BEN_DELAY = 100; // ms delay before BEN call (BEN adds its own latency)
const TRICK_CLEAR_DELAY = 1000; // ms to show completed trick

export function useBridgeGame(config: GameConfig): BridgeGameHook {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [lastTrick, setLastTrick] = useState<TrickPlay[] | null>(null);
  const [message, setMessage] = useState("Premi Gioca per iniziare");
  const [highlightedCards, setHighlightedCards] = useState<Card[]>([]);
  const [benAvailable, setBenAvailable] = useState<boolean | null>(null);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const isPlayerPosition = useCallback(
    (pos: Position) => config.playerPositions.includes(pos),
    [config.playerPositions]
  );

  const isPlayerTurn =
    gameState !== null &&
    phase === "playing" &&
    isPlayerPosition(gameState.currentPlayer);

  const validCards =
    gameState && isPlayerTurn
      ? getValidCards(
          gameState.hands[gameState.currentPlayer],
          gameState.currentTrick
        )
      : [];

  // Calculate result when finished
  const result = gameState?.phase === "finished" ? getResult(gameState) : null;

  // Check BEN availability on mount
  useEffect(() => {
    checkBenHealth().then((res) => setBenAvailable(res.available));
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (trickTimerRef.current) clearTimeout(trickTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const executePlay = useCallback(
    (state: GameState, position: Position, card: Card) => {
      try {
        const newState = playCard(state, position, card);
        setGameState(newState);

        // Check if trick just completed
        if (newState.currentTrick.length === 0 && state.currentTrick.length === 3) {
          const completedTrick = newState.tricks[newState.tricks.length - 1];
          setLastTrick(completedTrick.plays);

          if (newState.phase === "finished") {
            const res = getResult(newState);
            if (res.result >= 0) {
              setMessage(
                res.result === 0
                  ? `Contratto mantenuto! ${res.tricksMade} prese.`
                  : `Contratto fatto con ${res.result} presa/e in piu!`
              );
            } else {
              setMessage(
                `Contratto caduto di ${Math.abs(res.result)}. Prese: ${res.tricksMade}/${res.tricksNeeded}`
              );
            }
            setPhase("finished");
            return;
          }

          // Brief pause to show trick, then clear
          setPhase("trick-complete");
          trickTimerRef.current = setTimeout(() => {
            setLastTrick(null);
            setPhase("playing");
            setHighlightedCards([]);

            // Update message for new trick
            const leader = newState.currentPlayer;
            if (isPlayerPosition(leader)) {
              setMessage("E il tuo turno. Scegli una carta da giocare.");
            } else {
              setMessage(`${positionName(leader)} sta giocando...`);
            }
          }, TRICK_CLEAR_DELAY);
        } else {
          // Trick ongoing
          const next = newState.currentPlayer;
          if (isPlayerPosition(next) && newState.phase !== "finished") {
            const valid = getValidCards(
              newState.hands[next],
              newState.currentTrick
            );
            setHighlightedCards(valid);
            setMessage("Scegli una carta da giocare.");
          } else {
            setHighlightedCards([]);
            setMessage(`${positionName(newState.currentPlayer)} sta giocando...`);
          }
        }
      } catch (err) {
        console.error("Play error:", err);
        setMessage("Mossa non valida. Riprova.");
      }
    },
    [isPlayerPosition]
  );

  // AI auto-play logic (with BEN integration)
  useEffect(() => {
    if (!gameState || phase !== "playing") return;
    if (isPlayerPosition(gameState.currentPlayer)) return;
    if (gameState.phase === "finished") return;

    const currentState = gameState;
    const currentPlayer = gameState.currentPlayer;
    const cfg = configRef.current;
    const useBen = benAvailable === true;

    // For didactic smazzate: use specified opening lead if available
    const isOpeningLead =
      currentState.tricks.length === 0 && currentState.currentTrick.length === 0;
    if (isOpeningLead && cfg.openingLead) {
      aiTimerRef.current = setTimeout(() => {
        executePlay(currentState, currentPlayer, cfg.openingLead!);
      }, AI_DELAY);
      return () => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      };
    }

    // AI's turn
    const delay = useBen ? BEN_DELAY : AI_DELAY;
    aiTimerRef.current = setTimeout(async () => {
      let aiCard: Card;

      if (useBen && cfg.dealer && cfg.vulnerability !== undefined) {
        try {
          const response = await benPlay({
            gameState: currentState,
            position: currentPlayer,
            dealer: cfg.dealer,
            vulnerability: cfg.vulnerability,
            bidding: cfg.bidding,
          });

          if (!response.fallback && response.card) {
            aiCard = response.card;
          } else {
            aiCard = aiSelectCard(currentState, currentPlayer);
          }
        } catch {
          aiCard = aiSelectCard(currentState, currentPlayer);
          setBenAvailable(false); // Stop trying after failure
        }
      } else {
        aiCard = aiSelectCard(currentState, currentPlayer);
      }

      executePlay(currentState, currentPlayer, aiCard);
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayer, gameState?.currentTrick.length, phase]);

  const startGame = useCallback(() => {
    const state = createGame(
      config.hands,
      config.contract,
      config.declarer,
      config.openingLead
    );

    setGameState(state);
    setPhase("playing");
    setLastTrick(null);
    setHighlightedCards([]);

    // Re-check BEN on new game start
    checkBenHealth().then((res) => setBenAvailable(res.available));

    const leader = state.currentPlayer;
    if (isPlayerPosition(leader)) {
      setMessage("Sei il primo a giocare. Scegli una carta.");
      setHighlightedCards(
        getValidCards(state.hands[leader], state.currentTrick)
      );
    } else {
      setMessage(`${positionName(leader)} attacca...`);
    }
  }, [config, isPlayerPosition]);

  const handleCardPlay = useCallback(
    (card: Card) => {
      if (!gameState || phase !== "playing") return;
      if (!isPlayerPosition(gameState.currentPlayer)) return;

      executePlay(gameState, gameState.currentPlayer, card);
    },
    [gameState, phase, isPlayerPosition, executePlay]
  );

  return {
    gameState,
    phase,
    validCards,
    lastTrick,
    message,
    startGame,
    handleCardPlay,
    result,
    isPlayerTurn,
    highlightedCards,
    benAvailable,
  };
}

function positionName(pos: Position): string {
  const names: Record<Position, string> = {
    north: "Nord",
    south: "Sud",
    east: "Est",
    west: "Ovest",
  };
  return names[pos];
}
