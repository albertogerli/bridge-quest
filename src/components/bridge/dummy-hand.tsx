"use client";

import { motion } from "motion/react";
import type { CardData } from "./playing-card";

/**
 * Dummy hand displayed as vertical columns by suit (classic bridge style)
 * Each suit is a column with cards stacked vertically, slightly overlapping.
 */

const SUIT_ORDER: Array<CardData["suit"]> = ["spade", "heart", "diamond", "club"];

const suitSymbol: Record<string, string> = {
  spade: "\u2660",
  heart: "\u2665",
  diamond: "\u2666",
  club: "\u2663",
};

const suitColor: Record<string, string> = {
  spade: "text-[#1B2631]",
  heart: "text-[#D32F2F]",
  diamond: "text-[#FF6F00]",
  club: "text-[#2E7D32]",
};

export function DummyHand({
  cards,
  onSelectCard,
  highlightedCards = [],
  disabled = false,
  compact = false,
}: {
  cards: CardData[];
  onSelectCard?: (index: number) => void;
  highlightedCards?: CardData[];
  disabled?: boolean;
  compact?: boolean;
}) {
  // Group cards by suit
  const bySuit: Record<string, { card: CardData; originalIndex: number }[]> = {};
  for (const suit of SUIT_ORDER) {
    bySuit[suit] = [];
  }
  cards.forEach((card, idx) => {
    bySuit[card.suit].push({ card, originalIndex: idx });
  });

  const isHighlighted = (card: CardData) =>
    highlightedCards.some((c) => c.suit === card.suit && c.rank === card.rank);

  const cardW = compact ? "w-9" : "w-11";
  const cardH = compact ? "h-7" : "h-8";
  const fontSize = compact ? "text-xs" : "text-sm";
  const suitSize = compact ? "text-[10px]" : "text-xs";
  const overlapY = compact ? -3 : -2;

  return (
    <div className="flex gap-0.5 justify-center">
      {SUIT_ORDER.map((suit) => {
        const suitCards = bySuit[suit];
        if (suitCards.length === 0) return null;

        return (
          <div key={suit} className="flex flex-col items-center">
            <div className="flex flex-col">
              {suitCards.map(({ card, originalIndex }, i) => {
                const highlighted = isHighlighted(card);
                const cardDisabled = disabled || (highlightedCards.length > 0 && !highlighted);

                return (
                  <motion.button
                    key={`${card.suit}-${card.rank}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => !cardDisabled && onSelectCard?.(originalIndex)}
                    disabled={cardDisabled}
                    style={{ marginTop: i > 0 ? overlapY : 0, zIndex: i }}
                    className={`
                      relative ${cardW} ${cardH} rounded-sm bg-white
                      border flex items-center justify-center gap-0.5
                      ${fontSize} font-extrabold leading-none
                      transition-all touch-manipulation
                      ${suitColor[suit]}
                      ${highlighted
                        ? "ring-2 ring-emerald border-emerald shadow-md shadow-emerald/30 z-20 scale-110"
                        : "border-gray-300 shadow-sm"
                      }
                      ${cardDisabled
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:scale-110 hover:shadow-md hover:z-30 cursor-pointer active:scale-95"
                      }
                    `}
                  >
                    <span>{card.rank}</span>
                    <span className={suitSize}>{suitSymbol[suit]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
