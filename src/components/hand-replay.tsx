"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import type { Card, Position } from "@/lib/bridge-engine";

interface HandReplayProps {
  hands: { north: Card[]; east: Card[]; south: Card[]; west: Card[] };
  tricks: { cards: { player: string; card: Card }[]; winner: string }[];
  contract: { level: number; suit: string; declarer: string };
  onTrickChange?: (trickIndex: number) => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const SUIT_COLORS: Record<string, string> = {
  spade: "#000000",
  heart: "#DC2626",
  diamond: "#EA580C",
  club: "#059669",
};

const POSITION_LABELS: Record<string, string> = {
  north: "N",
  south: "S",
  east: "E",
  west: "O",
};

type PlaySpeed = 1 | 2 | 4;

export function HandReplay({ hands, tricks, contract, onTrickChange }: HandReplayProps) {
  const [currentPlay, setCurrentPlay] = useState(0); // 0-51 (13 tricks x 4 cards)
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaySpeed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPlays = tricks.length * 4;
  const currentTrickIndex = Math.floor(currentPlay / 4);
  const currentCardInTrick = currentPlay % 4;

  // Get remaining cards in each hand
  const getRemainingHands = (playIndex: number) => {
    const remaining = {
      north: [...hands.north],
      south: [...hands.south],
      east: [...hands.east],
      west: [...hands.west],
    };

    // Remove played cards up to playIndex
    for (let i = 0; i < playIndex; i++) {
      const trickIdx = Math.floor(i / 4);
      const cardIdx = i % 4;
      if (tricks[trickIdx]?.cards[cardIdx]) {
        const { player, card } = tricks[trickIdx].cards[cardIdx];
        const pos = player as Position;
        const idx = remaining[pos].findIndex(
          (c) => c.suit === card.suit && c.rank === card.rank
        );
        if (idx !== -1) remaining[pos].splice(idx, 1);
      }
    }

    return remaining;
  };

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || currentPlay >= totalPlays) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
      return;
    }

    const delay = 800 / speed;
    timerRef.current = setTimeout(() => {
      setCurrentPlay((p) => Math.min(p + 1, totalPlays));
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentPlay, totalPlays, speed]);

  // Notify parent of trick change
  useEffect(() => {
    onTrickChange?.(currentTrickIndex);
  }, [currentTrickIndex, onTrickChange]);

  const remainingHands = getRemainingHands(currentPlay);
  const completedTricks = Math.floor(currentPlay / 4);

  // Get cards currently in center (animating or static)
  const centerCards = tricks[currentTrickIndex]?.cards.slice(0, currentCardInTrick) || [];

  const togglePlay = () => {
    if (currentPlay >= totalPlays) {
      setCurrentPlay(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const stepForward = () => {
    setIsPlaying(false);
    setCurrentPlay((p) => Math.min(p + 1, totalPlays));
  };

  const stepBack = () => {
    setIsPlaying(false);
    setCurrentPlay((p) => Math.max(p - 1, 0));
  };

  const cycleSpeed = () => {
    setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1) as PlaySpeed);
  };

  const renderCard = (card: Card, size: "small" | "large" = "small") => {
    const sizeClass = size === "small" ? "w-8 h-11 text-xs" : "w-12 h-16 text-sm";
    return (
      <div
        className={`${sizeClass} bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center`}
        style={{ color: SUIT_COLORS[card.suit] }}
      >
        <div className="font-bold">{card.rank}</div>
        <div className="text-base leading-none">{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    );
  };

  const renderHand = (position: Position, cards: Card[]) => {
    const isLeader = tricks[currentTrickIndex]?.cards[0]?.player === position;
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`text-sm font-semibold px-2 py-0.5 rounded ${
            isLeader ? "bg-blue-100 text-blue-700" : "text-gray-600"
          }`}
        >
          {POSITION_LABELS[position]}
        </div>
        <div className="flex gap-0.5 flex-wrap justify-center max-w-[200px]">
          {cards.slice(0, 13).map((card, i) => (
            <div key={i}>{renderCard(card, "small")}</div>
          ))}
        </div>
        <div className="text-xs text-gray-500">{cards.length} carte</div>
      </div>
    );
  };

  // Position cards in center based on player position
  const getCardPosition = (player: string) => {
    const positions: Record<string, React.CSSProperties> = {
      north: { top: "10%", left: "50%", transform: "translateX(-50%)" },
      south: { bottom: "10%", left: "50%", transform: "translateX(-50%)" },
      east: { right: "10%", top: "50%", transform: "translateY(-50%)" },
      west: { left: "10%", top: "50%", transform: "translateY(-50%)" },
    };
    return positions[player] || positions.north;
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-green-700 via-green-600 to-green-700 rounded-2xl overflow-hidden">
      {/* Table view */}
      <div className="flex-1 relative p-4">
        {/* Center playing area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <AnimatePresence>
              {centerCards.map((play, idx) => {
                const offsets: Record<string, { x: number; y: number }> = {
                  north: { x: 0, y: -40 }, south: { x: 0, y: 40 },
                  east: { x: 40, y: 0 }, west: { x: -40, y: 0 },
                };
                const off = offsets[play.player] || offsets.north;
                return (
                  <motion.div
                    key={`${currentTrickIndex}-${idx}`}
                    initial={{ x: off.x, y: off.y, scale: 0.5, opacity: 0 }}
                    animate={{ x: (idx - 1.5) * 30, y: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ zIndex: idx }}
                  >
                    {renderCard(play.card, "large")}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Hands at positions */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          {renderHand("north", remainingHands.north)}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          {renderHand("south", remainingHands.south)}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {renderHand("east", remainingHands.east)}
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {renderHand("west", remainingHands.west)}
        </div>

        {/* Trick counter */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="text-xs text-gray-600 font-medium">Presa</div>
          <div className="text-xl font-bold text-gray-900">
            {completedTricks}/{tricks.length}
          </div>
        </div>

        {/* Completed tricks stack */}
        {completedTricks > 0 && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="text-xs text-gray-600 font-medium mb-1">Prese fatte</div>
            {tricks.slice(0, completedTricks).map((trick, idx) => (
              <div key={idx} className="text-xs flex items-center gap-1">
                <span className="font-mono">{idx + 1}.</span>
                <span className="font-semibold">{POSITION_LABELS[trick.winner]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={stepBack}
            disabled={currentPlay === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Indietro"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title={isPlaying ? "Pausa" : "Riproduci"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={stepForward}
            disabled={currentPlay >= totalPlays}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Avanti"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">
            Carta {currentPlay + 1} di {totalPlays}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentPlay / totalPlays) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={cycleSpeed}
          className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          title="Cambia velocità"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}
