"use client";

import type { Card, Suit } from "@/lib/bridge-engine";

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const SUIT_COLORS: Record<Suit, string> = {
  spade: "text-foreground",
  heart: "text-red-600 dark:text-red-400",
  diamond: "text-orange-500 dark:text-orange-400",
  club: "text-emerald-700 dark:text-emerald-400",
};

const SUIT_ORDER: Suit[] = ["spade", "heart", "diamond", "club"];

/** Anteprima della mano di Sud, raggruppata per colore. */
export function HandFanPreview({ cards }: { cards: Card[] }) {
  const bySuit: Record<Suit, Card[]> = {
    spade: [],
    heart: [],
    diamond: [],
    club: [],
  };
  for (const card of cards) {
    bySuit[card.suit].push(card);
  }

  return (
    <div className="space-y-1">
      {SUIT_ORDER.map((suit) => {
        const suitCards = bySuit[suit];
        if (suitCards.length === 0) return null;
        return (
          <div key={suit} className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${SUIT_COLORS[suit]}`}>
              {SUIT_SYMBOLS[suit]}
            </span>
            <span className="text-xs font-semibold text-foreground/80 tracking-wide">
              {suitCards.map((c) => c.rank).join(" ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
