"use client";

/**
 * Progressive hints — three escalating levels per turn:
 *   1. a thinking prompt (free)
 *   2. the right suit to play
 *   3. the exact card (DD-verified in endgames, expert heuristic otherwise)
 *
 * Each level beyond the first costs XP at the end of the hand: the parent
 * page tracks usage via onHintUsed and reduces the reward accordingly.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2 } from "lucide-react";
import type { Card, GameState, Suit } from "@/lib/bridge-engine";
import { aiSelectCard, cardToString } from "@/lib/bridge-engine";
import { aiSelectExpertCard } from "@/lib/ai-difficulty";

const SUIT_NAMES: Record<Suit, string> = {
  spade: "picche",
  heart: "cuori",
  diamond: "quadri",
  club: "fiori",
};

export interface HintPanelProps {
  gameState: GameState | null;
  isPlayerTurn: boolean;
  /** Called once per level revealed (1, 2 or 3) — use to scale the XP penalty */
  onHintUsed?: (level: number) => void;
}

interface HintData {
  card: Card;
  exact: boolean;
}

export function HintPanel({ gameState, isPlayerTurn, onHintUsed }: HintPanelProps) {
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState<HintData | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset the hint when the turn changes (new decision point)
  const turnKey = gameState
    ? `${gameState.tricks.length}-${gameState.currentTrick.length}-${gameState.currentPlayer}`
    : "";
  useEffect(() => {
    setLevel(0);
    setHint(null);
    setLoading(false);
  }, [turnKey]);

  if (!gameState || !isPlayerTurn || gameState.phase === "finished") return null;

  const nextLevel = async () => {
    if (loading || level >= 3) return;
    const newLevel = level + 1;

    // Levels 2 and 3 need the computed best card
    if (newLevel >= 2 && !hint) {
      setLoading(true);
      try {
        const expert = await aiSelectExpertCard(gameState, gameState.currentPlayer);
        const card = expert ?? aiSelectCard(gameState, gameState.currentPlayer);
        setHint({ card, exact: expert !== null });
      } finally {
        setLoading(false);
      }
    }

    setLevel(newLevel);
    onHintUsed?.(newLevel);
  };

  const hintText = (): string | null => {
    if (level === 0) return null;
    if (level === 1) {
      return gameState.currentTrick.length === 0
        ? "Prima di giocare: conta le prese sicure e chiediti dove puoi svilupparne altre."
        : "Osserva la presa: chi sta vincendo? Vale la pena impegnare una carta alta?";
    }
    if (!hint) return null;
    if (level === 2) return `Il colore giusto è ${SUIT_NAMES[hint.card.suit]}.`;
    return `Gioca ${cardToString(hint.card)}${hint.exact ? " — è la carta migliore (verificato double-dummy)." : " — è il consiglio dell'esperto."}`;
  };

  const text = hintText();

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      {level < 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={nextLevel}
          disabled={loading}
          className="h-8 rounded-xl px-3 text-xs font-bold text-amber-600 hover:text-amber-700 gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5" />
          )}
          {level === 0 ? "Suggerimento" : "Dimmi di più"}
        </Button>
      )}
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={`${turnKey}-${level}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-md text-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
