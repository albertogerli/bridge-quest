"use client";

import { motion } from "motion/react";

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

export interface CardData {
  suit: Suit;
  rank: Rank;
}

const suitSymbols: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const suitColors: Record<Suit, string> = {
  spade: "text-[#1B2631]",
  heart: "text-[#D32F2F]",
  diamond: "text-[#FF6F00]",
  club: "text-[#2E7D32]",
};

export function PlayingCard({
  card,
  faceDown = false,
  onClick,
  selected = false,
  disabled = false,
  highlighted = false,
  size = "md",
  noHover = false,
  cardWidth,
}: {
  card: CardData;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  noHover?: boolean;
  /** When set, overrides size prop with exact pixel width (height auto-calculated) */
  cardWidth?: number;
}) {
  const dimensions = {
    xs: "w-8 h-[44px]",
    sm: "w-11 h-[60px]",
    md: "w-[72px] h-[100px]",
    lg: "w-24 h-[132px]",
  };

  // Determine effective size tier from cardWidth for font scaling
  const effectiveSize: "xs" | "sm" | "md" | "lg" = cardWidth
    ? cardWidth >= 55 ? "md" : cardWidth >= 35 ? "sm" : "xs"
    : size;

  const rankSizes = {
    xs: "text-sm",
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const suitSizes = {
    xs: "text-[10px]",
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  // Dynamic inline style when cardWidth is set
  const dynamicStyle = cardWidth
    ? { width: cardWidth, height: Math.round(cardWidth * 1.4) }
    : undefined;

  const dimClass = cardWidth ? "" : dimensions[size];

  if (faceDown) {
    return (
      <motion.div
        className={`${dimClass} rounded bg-gradient-to-br from-emerald to-emerald-dark border border-white/20 shadow-sm cursor-default`}
        style={{
          ...dynamicStyle,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.05) 4px,
            rgba(255,255,255,0.05) 8px
          )`,
        }}
      >
        <div className="flex h-full items-center justify-center">
          <span className="text-white/30 text-lg font-bold">♣</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${dimClass} relative rounded bg-white
        border border-gray-200 shadow-sm transition-all touch-manipulation
        ${selected ? `ring-2 ring-amber shadow-amber/30 border-amber ${noHover ? "" : "-translate-y-3"}` : ""}
        ${highlighted && !selected ? "ring-2 ring-emerald/50 border-emerald shadow-emerald/20" : ""}
        ${disabled && !highlighted ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
        ${!disabled && !selected ? "active:scale-95" : ""}
        ${highlighted && !disabled && !noHover ? "hover:shadow-lg hover:-translate-y-1" : ""}
      `}
      style={dynamicStyle}
      whileHover={noHover || (disabled && !highlighted) ? {} : { y: selected ? -12 : -6, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {/* Simple clean layout: rank + suit, centered */}
      <div className={`flex h-full flex-col items-center justify-center ${suitColors[card.suit]}`}>
        <span className={`${rankSizes[effectiveSize]} font-black leading-none`}>{card.rank}</span>
        <span className={`${suitSizes[effectiveSize]} leading-none`}>{suitSymbols[card.suit]}</span>
      </div>
    </motion.button>
  );
}
