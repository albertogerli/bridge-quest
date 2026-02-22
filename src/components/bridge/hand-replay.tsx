"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import type {
  GameState,
  Trick,
  TrickPlay,
  Position,
  Suit,
  Card,
} from "@/lib/bridge-engine";
import { cardToString, suitSymbol, sortHand, toDisplayPosition } from "@/lib/bridge-engine";

// ── helpers ──────────────────────────────────────────────────────

const SUIT_COLORS: Record<Suit, string> = {
  spade: "text-[#1B2631]",
  heart: "text-[#D32F2F]",
  diamond: "text-[#FF6F00]",
  club: "text-[#2E7D32]",
};

const POSITION_LABELS: Record<Position, string> = {
  north: "Nord",
  south: "Sud",
  east: "Est",
  west: "Ovest",
};

function displayLabel(gamePos: Position, declarer: Position): string {
  const dPos = toDisplayPosition(gamePos, declarer);
  return POSITION_LABELS[dPos];
}

/** Reconstruct all 4 original hands by collecting every card played + cards
 *  still remaining in the finished game state's hands. */
function reconstructOriginalHands(
  state: GameState
): Record<Position, Card[]> {
  const hands: Record<Position, Card[]> = {
    north: [...state.hands.north],
    south: [...state.hands.south],
    east: [...state.hands.east],
    west: [...state.hands.west],
  };

  // Add back every card that was played during the game
  for (const trick of state.tricks) {
    for (const play of trick.plays) {
      hands[play.position].push(play.card);
    }
  }

  // Sort each hand
  return {
    north: sortHand(hands.north),
    south: sortHand(hands.south),
    east: sortHand(hands.east),
    west: sortHand(hands.west),
  };
}

/** Build the set of cards played up to (and including) a given trick index. */
function cardsPlayedUpTo(
  tricks: Trick[],
  trickIndex: number
): Set<string> {
  const s = new Set<string>();
  for (let t = 0; t <= trickIndex && t < tricks.length; t++) {
    for (const play of tricks[t].plays) {
      s.add(`${play.card.rank}-${play.card.suit}`);
    }
  }
  return s;
}

/** Remaining hand for a position after N tricks have been played. */
function remainingHand(
  original: Card[],
  played: Set<string>
): Card[] {
  return original.filter(
    (c) => !played.has(`${c.rank}-${c.suit}`)
  );
}

// ── card chip (inline text card) ────────────────────────────────

function CardChip({
  card,
  highlight = false,
}: {
  card: Card;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-extrabold leading-none
        ${highlight ? "bg-amber-100 ring-1 ring-amber-300" : "bg-gray-50"}
        ${SUIT_COLORS[card.suit]}`}
    >
      {suitSymbol(card.suit)}
      {card.rank}
    </span>
  );
}

// ── mini hand display (single position, horizontal) ─────────────

function MiniHand({
  cards,
  playedCard,
  dimmed,
}: {
  cards: Card[];
  playedCard?: Card;
  dimmed?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-0.5 ${dimmed ? "opacity-40" : ""}`}>
      {cards.map((c, i) => {
        const isPlayed =
          playedCard &&
          c.rank === playedCard.rank &&
          c.suit === playedCard.suit;
        return (
          <span
            key={`${c.rank}-${c.suit}-${i}`}
            className={`text-xs font-bold leading-none
              ${isPlayed ? "underline decoration-2 decoration-amber-400" : ""}
              ${SUIT_COLORS[c.suit]}`}
          >
            {suitSymbol(c.suit)}{c.rank}
          </span>
        );
      })}
    </div>
  );
}

// ── trick table (2x2 compass layout) ────────────────────────────

function TrickTable({
  trick,
  declarer,
  trumpSuit,
}: {
  trick: Trick;
  declarer: Position;
  trumpSuit: Suit | null;
}) {
  // Map each play to a display position
  const playByDisplay: Partial<Record<Position, TrickPlay>> = {};
  for (const play of trick.plays) {
    const dp = toDisplayPosition(play.position, declarer);
    playByDisplay[dp] = play;
  }

  const winner = trick.winner;

  function Cell({ pos }: { pos: Position }) {
    const play = playByDisplay[pos];
    if (!play) return <div />;
    const isWinner = play.position === winner;
    return (
      <div
        className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center transition-colors
          ${isWinner ? "bg-emerald-100 ring-1 ring-emerald-300" : "bg-white"}`}
      >
        <CardChip card={play.card} highlight={isWinner} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-48 mx-auto">
      {/* Row 1: North */}
      <div />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-bold text-gray-400 uppercase">N</span>
        <Cell pos="north" />
      </div>
      <div />

      {/* Row 2: West - center - East */}
      <div className="flex flex-col items-center gap-0.5 justify-center">
        <span className="text-[9px] font-bold text-gray-400 uppercase">O</span>
        <Cell pos="west" />
      </div>
      <div className="flex items-center justify-center">
        <span className="text-[9px] font-bold text-gray-400">
          {trumpSuit ? suitSymbol(trumpSuit) : "SA"}
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5 justify-center">
        <span className="text-[9px] font-bold text-gray-400 uppercase">E</span>
        <Cell pos="east" />
      </div>

      {/* Row 3: South */}
      <div />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-bold text-gray-400 uppercase">S</span>
        <Cell pos="south" />
      </div>
      <div />
    </div>
  );
}

// ── commentary generator ────────────────────────────────────────

function trickCommentary(trick: Trick, declarer: Position): string {
  if (!trick.winner) return "";
  const winnerLabel = displayLabel(trick.winner, declarer);
  const winnerPlay = trick.plays.find((p) => p.position === trick.winner);
  if (!winnerPlay) return `${winnerLabel} vince la presa`;
  return `${winnerLabel} vince con ${cardToString(winnerPlay.card)}`;
}

// ── main component ──────────────────────────────────────────────

export function HandReplay({
  gameState,
  onClose,
}: {
  gameState: GameState;
  onClose: () => void;
}) {
  const [currentTrickIdx, setCurrentTrickIdx] = useState(0);
  const tricks = gameState.tricks;
  const totalTricks = tricks.length;
  const trick = tricks[currentTrickIdx];

  const originalHands = useMemo(
    () => reconstructOriginalHands(gameState),
    [gameState]
  );

  // Cards played up to previous trick (so current trick cards are still "in hand")
  const playedBefore = useMemo(
    () =>
      currentTrickIdx > 0
        ? cardsPlayedUpTo(tricks, currentTrickIdx - 1)
        : new Set<string>(),
    [tricks, currentTrickIdx]
  );

  // Running score up to and including current trick
  const runningScore = useMemo(() => {
    const score = { ns: 0, ew: 0 };
    for (let t = 0; t <= currentTrickIdx && t < totalTricks; t++) {
      const w = tricks[t].winner;
      if (w === "north" || w === "south") score.ns++;
      else if (w === "east" || w === "west") score.ew++;
    }
    return score;
  }, [tricks, currentTrickIdx, totalTricks]);

  // Find the card each position played in the current trick
  const playedInTrick = useMemo(() => {
    const map: Partial<Record<Position, Card>> = {};
    if (trick) {
      for (const play of trick.plays) {
        map[play.position] = play.card;
      }
    }
    return map;
  }, [trick]);

  if (!trick) return null;

  const positions: Position[] = ["north", "east", "south", "west"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">
              Rivedi la mano
            </h3>
            <p className="text-xs text-gray-500">
              {gameState.contract} &middot; Dich.{" "}
              {displayLabel(gameState.declarer, gameState.declarer)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Chiudi"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Trick number + score bar */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-lg bg-emerald-50 px-2 text-xs font-extrabold text-emerald-700">
              {currentTrickIdx + 1}/{totalTricks}
            </span>
            <span className="text-xs font-bold text-gray-400">Presa</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-gray-500">N-S</span>
            <span className="text-emerald-700 bg-emerald-50 rounded-md px-1.5 py-0.5">
              {runningScore.ns}
            </span>
            <span className="text-gray-300">-</span>
            <span className="text-red-600 bg-red-50 rounded-md px-1.5 py-0.5">
              {runningScore.ew}
            </span>
            <span className="text-gray-500">E-O</span>
          </div>
        </div>

        {/* Trick compass display */}
        <div className="px-5 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrickIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TrickTable
                trick={trick}
                declarer={gameState.declarer}
                trumpSuit={gameState.trumpSuit}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Commentary */}
        <div className="px-5 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrickIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-gray-50 px-4 py-2.5 text-center"
            >
              <p className="text-sm font-semibold text-gray-700">
                {trickCommentary(trick, gameState.declarer)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Attacco: {displayLabel(trick.leader, gameState.declarer)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hands at this point */}
        <div className="px-5 pb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Carte in mano (prima della presa)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {positions.map((pos) => {
              const dp = toDisplayPosition(pos, gameState.declarer);
              const hand = remainingHand(originalHands[pos], playedBefore);
              return (
                <div key={pos} className="rounded-lg bg-gray-50 px-2.5 py-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {POSITION_LABELS[dp]}
                  </span>
                  <MiniHand
                    cards={hand}
                    playedCard={playedInTrick[pos]}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentTrickIdx === 0}
            onClick={() => setCurrentTrickIdx((i) => Math.max(0, i - 1))}
            className="rounded-xl text-xs font-bold h-9 px-4"
          >
            <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Precedente
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold h-9 px-4 text-gray-500"
          >
            Chiudi
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={currentTrickIdx === totalTricks - 1}
            onClick={() =>
              setCurrentTrickIdx((i) => Math.min(totalTricks - 1, i + 1))
            }
            className="rounded-xl text-xs font-bold h-9 px-4"
          >
            Successiva
            <svg className="h-3.5 w-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="9,6 15,12 9,18" />
            </svg>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
