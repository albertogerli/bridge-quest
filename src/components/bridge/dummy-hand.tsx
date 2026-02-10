"use client";

import { motion } from "motion/react";
import type { CardData } from "./playing-card";

/**
 * Dummy hand displayed as columns by suit (bridge-style morto layout)
 * Cards shown as mini-cards stacked vertically in suit columns
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

  return (
    <div className="flex gap-1 justify-center">
      {SUIT_ORDER.map((suit) => {
        const suitCards = bySuit[suit];
        if (suitCards.length === 0) return null;

        return (
          <div key={suit} className="flex flex-col items-center">
            {/* Suit column - mini cards stacked */}
            <div className="flex flex-col" style={{ gap: "-2px" }}>
              {suitCards.map(({ card, originalIndex }, i) => {
                const highlighted = isHighlighted(card);
                const cardDisabled = disabled || (highlightedCards.length > 0 && !highlighted);

                return (
                  <motion.button
                    key={`${card.suit}-${card.rank}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !cardDisabled && onSelectCard?.(originalIndex)}
                    disabled={cardDisabled}
                    style={{ marginTop: i > 0 ? "-4px" : 0, zIndex: i }}
                    className={`
                      relative ${compact ? "w-8 h-6" : "w-10 h-7"} rounded bg-white border shadow-sm
                      flex items-center justify-center gap-0.5
                      ${compact ? "text-xs" : "text-sm"} font-black leading-none
                      transition-all
                      ${suitColor[suit]}
                      ${highlighted
                        ? "ring-2 ring-emerald border-emerald shadow-emerald/30 z-20 scale-105"
                        : "border-gray-200"
                      }
                      ${cardDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:scale-110 hover:shadow-md hover:z-30 cursor-pointer active:scale-95"
                      }
                    `}
                  >
                    <span>{card.rank}</span>
                    <span className={compact ? "text-[9px]" : "text-xs"}>{suitSymbol[suit]}</span>
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
