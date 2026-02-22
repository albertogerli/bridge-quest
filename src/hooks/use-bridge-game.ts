"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  type Card,
  type Position,
  type GameState,
  type TrickPlay,
  createGame,
  playCard,
  getValidCards,
  getResult,
  partnerOf,
  partnershipOf,
  toDisplayPosition,
} from "@/lib/bridge-engine";
import { useSounds } from "@/hooks/use-sounds";
import type { Vulnerability, BiddingData } from "@/data/smazzate";
import { checkBenHealth, benPlay } from "@/lib/ben-client";
import { getAILevel, aiSelectWithDifficulty, type AILevel } from "@/lib/ai-difficulty";

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
  aiLevel: AILevel;
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
  const [aiLevel, setAiLevel] = useState<AILevel>(() => getAILevel());

  const { playSound } = useSounds();

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

        // Sound: card played
        playSound("cardPlay");

        // Check if trick just completed
        if (newState.currentTrick.length === 0 && state.currentTrick.length === 3) {
          const completedTrick = newState.tricks[newState.tricks.length - 1];
          setLastTrick(completedTrick.plays);

          // Sound: trick won or lost (from declarer's perspective)
          if (completedTrick.winner) {
            const winnerSide = partnershipOf(completedTrick.winner);
            const declarerSide = partnershipOf(configRef.current.declarer);
            setTimeout(() => {
              playSound(winnerSide === declarerSide ? "trickWon" : "trickLost");
            }, 200);
          }

          if (newState.phase === "finished") {
            const res = getResult(newState);
            if (res.result >= 0) {
              setMessage(
                res.result === 0
                  ? `Contratto mantenuto! ${res.tricksMade} prese.`
                  : `Contratto fatto con ${res.result} presa/e in più!`
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
          setMessage("Presa completata...");
          trickTimerRef.current = setTimeout(() => {
            setLastTrick(null);
            setPhase("playing");
            setHighlightedCards([]);

            // Update message for new trick
            const leader = newState.currentPlayer;
            if (isPlayerPosition(leader)) {
              const isDummyTurn = leader === partnerOf(configRef.current.declarer);
              setMessage(isDummyTurn
                ? `Gioca dal morto (${positionName(leader, configRef.current.declarer)}). Tocca le carte evidenziate.`
                : "È il tuo turno. Scegli una carta da giocare."
              );
            } else {
              setMessage(`${positionName(leader, configRef.current.declarer)} sta giocando...`);
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
            const isDummyTurn = next === partnerOf(configRef.current.declarer);
            setMessage(isDummyTurn
              ? `Gioca dal morto (${positionName(next, configRef.current.declarer)}). Tocca le carte evidenziate.`
              : "Scegli una carta da giocare."
            );
          } else {
            setHighlightedCards([]);
            setMessage(`${positionName(newState.currentPlayer, configRef.current.declarer)} sta giocando...`);
          }
        }
      } catch (err) {
        console.error("Play error:", err);
        setMessage("Mossa non valida. Riprova.");
      }
    },
    [isPlayerPosition, playSound]
  );

  // AI auto-play logic (with BEN integration)
  useEffect(() => {
    if (!gameState || phase !== "playing") return;
    if (isPlayerPosition(gameState.currentPlayer)) return;
    if (gameState.phase === "finished") return;

    const currentState = gameState;
    const currentPlayer = gameState.currentPlayer;
    const cfg = configRef.current;
    const currentAiLevel = getAILevel();
    const useBen = benAvailable === true && currentAiLevel === "esperto";

    // For didactic smazzate: use specified opening lead if available AND valid
    const isOpeningLead =
      currentState.tricks.length === 0 && currentState.currentTrick.length === 0;
    if (isOpeningLead && cfg.openingLead) {
      const leaderHand = currentState.hands[currentPlayer];
      const hasCard = leaderHand.some(
        (c) => c.suit === cfg.openingLead!.suit && c.rank === cfg.openingLead!.rank
      );
      if (hasCard) {
        aiTimerRef.current = setTimeout(() => {
          executePlay(currentState, currentPlayer, cfg.openingLead!);
        }, AI_DELAY);
        return () => {
          if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        };
      }
      // Opening lead card not in leader's hand — fall through to AI selection
    }

    // AI's turn
    const delay = useBen ? BEN_DELAY : AI_DELAY;
    aiTimerRef.current = setTimeout(async () => {
      try {
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
              aiCard = aiSelectWithDifficulty(currentState, currentPlayer, currentAiLevel);
            }
          } catch {
            aiCard = aiSelectWithDifficulty(currentState, currentPlayer, currentAiLevel);
            setBenAvailable(false); // Stop trying after failure
          }
        } else {
          aiCard = aiSelectWithDifficulty(currentState, currentPlayer, currentAiLevel);
        }

        executePlay(currentState, currentPlayer, aiCard);
      } catch (err) {
        console.error("AI play error:", err);
        // Fallback: play any valid card to avoid freezing
        try {
          const hand = currentState.hands[currentPlayer];
          const valid = getValidCards(hand, currentState.currentTrick);
          if (valid.length > 0) {
            executePlay(currentState, currentPlayer, valid[0]);
          }
        } catch (fallbackErr) {
          console.error("AI fallback also failed:", fallbackErr);
          setMessage("Errore AI. Tocca per riprovare.");
        }
      }
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayer, gameState?.currentTrick.length, phase]);

  // Watchdog: recover from stuck states (AI didn't play within 5s, or trick-complete stuck)
  useEffect(() => {
    if (!gameState || gameState.phase === "finished") return;

    const watchdog = setTimeout(() => {
      // If stuck in trick-complete, force transition to playing
      if (phase === "trick-complete") {
        console.warn("Watchdog: trick-complete stuck, forcing playing");
        setLastTrick(null);
        setPhase("playing");
        setHighlightedCards([]);
        return;
      }
      // If AI should play but hasn't, retry
      if (phase === "playing" && !isPlayerPosition(gameState.currentPlayer)) {
        console.warn("Watchdog: AI stuck, forcing play for", gameState.currentPlayer);
        try {
          const hand = gameState.hands[gameState.currentPlayer];
          const valid = getValidCards(hand, gameState.currentTrick);
          if (valid.length > 0) {
            executePlay(gameState, gameState.currentPlayer, valid[0]);
          }
        } catch (err) {
          console.error("Watchdog recovery failed:", err);
        }
      }
    }, 5000);

    return () => clearTimeout(watchdog);
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

    // Re-read AI level and re-check BEN on new game start
    setAiLevel(getAILevel());
    checkBenHealth().then((res) => setBenAvailable(res.available));

    const leader = state.currentPlayer;
    if (isPlayerPosition(leader)) {
      const isDummyTurn = leader === partnerOf(config.declarer);
      setMessage(isDummyTurn
        ? `Gioca dal morto (${positionName(leader, config.declarer)}).`
        : "Sei il primo a giocare. Scegli una carta."
      );
      setHighlightedCards(
        getValidCards(state.hands[leader], state.currentTrick)
      );
    } else {
      setMessage(`${positionName(leader, config.declarer)} attacca...`);
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
    aiLevel,
  };
}

function positionName(pos: Position, declarer?: Position): string {
  const names: Record<Position, string> = {
    north: "Nord",
    south: "Sud",
    east: "Est",
    west: "Ovest",
  };
  const displayPos = declarer ? toDisplayPosition(pos, declarer) : pos;
  return names[displayPos];
}
