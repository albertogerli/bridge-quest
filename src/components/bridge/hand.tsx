"use client";

import { motion } from "motion/react";
import { PlayingCard, type CardData } from "./playing-card";

export function Hand({
  cards,
  selectedIndex,
  onSelectCard,
  faceDown = false,
  position = "south",
  size = "md",
  highlightedCards = [],
  disabled = false,
  noHover = false,
}: {
  cards: CardData[];
  selectedIndex?: number;
  onSelectCard?: (index: number) => void;
  faceDown?: boolean;
  position?: "north" | "south" | "east" | "west";
  size?: "xs" | "sm" | "md" | "lg";
  highlightedCards?: CardData[];
  disabled?: boolean;
  noHover?: boolean;
}) {
  const isVertical = position === "east" || position === "west";
  const overlap = {
    xs: isVertical ? -25 : -16,
    sm: isVertical ? -35 : -24,
    md: isVertical ? -55 : -38,
    lg: isVertical ? -70 : -50,
  };

  const isHighlighted = (card: CardData) =>
    highlightedCards.some((c) => c.suit === card.suit && c.rank === card.rank);

  return (
    <div
      className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center justify-center`}
    >
      {cards.map((card, index) => (
        <motion.div
          key={`${card.suit}-${card.rank}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          style={{
            marginLeft: !isVertical && index > 0 ? overlap[size] : 0,
            marginTop: isVertical && index > 0 ? overlap[size] : 0,
            zIndex: index,
          }}
        >
          <PlayingCard
            card={card}
            faceDown={faceDown}
            selected={selectedIndex === index}
            highlighted={!faceDown && isHighlighted(card)}
            disabled={disabled || (highlightedCards.length > 0 && !isHighlighted(card))}
            onClick={() => onSelectCard?.(index)}
            size={size}
            noHover={noHover}
          />
        </motion.div>
      ))}
    </div>
  );
}
