"use client";

import { motion } from "motion/react";
import type { CardData } from "./playing-card";

/**
 * Dummy hand displayed as rows by suit (bridge diagram style)
 * ♠ A J 7 4
 * ♥ J 10 7
 * ♦ Q 6
 * ♣ K 8 5 2
 * Each rank is a clickable button for card selection.
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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-md border border-white/50">
      <div className={`flex flex-col ${compact ? "gap-0" : "gap-0.5"}`}>
        {SUIT_ORDER.map((suit) => {
          const suitCards = bySuit[suit];
          if (suitCards.length === 0) return null;

          return (
            <div key={suit} className="flex items-center gap-1">
              {/* Suit symbol */}
              <span className={`${compact ? "text-base" : "text-lg"} font-black ${suitColor[suit]} w-5 text-center shrink-0`}>
                {suitSymbol[suit]}
              </span>
              {/* Rank buttons */}
              <div className="flex gap-0.5">
                {suitCards.map(({ card, originalIndex }, i) => {
                  const highlighted = isHighlighted(card);
                  const cardDisabled = disabled || (highlightedCards.length > 0 && !highlighted);

                  return (
                    <motion.button
                      key={`${card.suit}-${card.rank}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => !cardDisabled && onSelectCard?.(originalIndex)}
                      disabled={cardDisabled}
                      className={`
                        ${compact ? "w-7 h-7 text-sm" : "w-8 h-8 text-base"} rounded-md
                        font-extrabold leading-none
                        flex items-center justify-center
                        transition-all touch-manipulation
                        ${suitColor[suit]}
                        ${highlighted
                          ? "bg-emerald-100 ring-2 ring-emerald border-emerald shadow-md shadow-emerald/30 scale-110 z-10"
                          : "bg-gray-50 border border-gray-200"
                        }
                        ${cardDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-white hover:shadow-md hover:scale-110 hover:z-10 cursor-pointer active:scale-95"
                        }
                      `}
                    >
                      {card.rank}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
