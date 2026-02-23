"use client";

import { motion } from "motion/react";
import { PlayingCard, type CardData } from "./playing-card";

const GAP = 2; // px gap between cards in fluid mode

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
  overlapOverride,
  containerWidth,
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
  overlapOverride?: number;
  /** When set, cards distribute evenly across this width with no overlap */
  containerWidth?: number;
}) {
  const isVertical = position === "east" || position === "west";

  // Fluid mode: compute exact card pixel width from container
  // Cap at 70px so cards with 1-2 remaining don't become absurdly large
  const MAX_CARD_WIDTH = position === "south" ? 70 : 55;
  const cardWidth =
    containerWidth && cards.length > 0 && !isVertical
      ? Math.min(MAX_CARD_WIDTH, Math.floor((containerWidth - GAP * (cards.length - 1)) / cards.length))
      : undefined;

  const isHighlighted = (card: CardData) =>
    highlightedCards.some((c) => c.suit === card.suit && c.rank === card.rank);

  // Fluid horizontal layout: no overlap, cards fill the width
  if (cardWidth) {
    return (
      <div
        className="flex items-end justify-center"
        style={{ gap: GAP }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={`${card.suit}-${card.rank}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            style={{ zIndex: index }}
          >
            <PlayingCard
              card={card}
              faceDown={faceDown}
              selected={selectedIndex === index}
              highlighted={!faceDown && isHighlighted(card)}
              disabled={disabled || (highlightedCards.length > 0 && !isHighlighted(card))}
              onClick={() => onSelectCard?.(index)}
              cardWidth={cardWidth}
              noHover={noHover}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  // Legacy overlap mode for vertical (E/W) or when containerWidth not provided
  const defaultOverlap = {
    xs: isVertical ? -22 : -20,
    sm: isVertical ? -32 : -28,
    md: isVertical ? -55 : -38,
    lg: isVertical ? -70 : -50,
  };
  const overlap = overlapOverride !== undefined
    ? { xs: overlapOverride, sm: overlapOverride, md: overlapOverride, lg: overlapOverride }
    : defaultOverlap;

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
