"use client";

import { motion } from "motion/react";
import { SuitSymbol } from "./suit-symbol";

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

export interface CardData {
  suit: Suit;
  rank: Rank;
}

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
}: {
  card: CardData;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  noHover?: boolean;
}) {
  const dimensions = {
    xs: "w-8 h-[44px]",
    sm: "w-11 h-[60px]",
    md: "w-[72px] h-[100px]",
    lg: "w-24 h-[132px]",
  };

  const textSizes = {
    xs: "text-[10px]",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (faceDown) {
    return (
      <motion.div
        className={`${dimensions[size]} rounded-lg bg-gradient-to-br from-emerald to-emerald-dark border-2 border-white/20 shadow-md cursor-default`}
        style={{
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
        ${dimensions[size]} relative rounded-lg bg-white
        border shadow-md transition-all touch-manipulation
        ${selected ? `ring-2 ring-amber shadow-amber/30 border-amber ${noHover ? "" : "-translate-y-3"}` : "border-gray-300"}
        ${highlighted && !selected ? "ring-2 ring-emerald/50 border-emerald shadow-emerald/20" : ""}
        ${disabled && !highlighted ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${!disabled && !selected ? "active:scale-95" : ""}
        ${highlighted && !disabled && !noHover ? "hover:shadow-lg hover:-translate-y-1" : ""}
      `}
      whileHover={noHover || (disabled && !highlighted) ? {} : { y: selected ? -12 : -6, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      <div className={`flex h-full flex-col justify-between p-1 ${suitColors[card.suit]}`}>
        {/* Top-left rank + suit */}
        <div className="flex flex-col items-start leading-none">
          <span className={`${textSizes[size]} font-bold`}>{card.rank}</span>
          <SuitSymbol suit={card.suit} size={size === "lg" ? "md" : size === "xs" ? "xs" : "sm"} />
        </div>
        {/* Center suit (large) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : size === "xs" ? "text-sm" : "text-lg"} opacity-20`}>
            {card.suit === "spade" && "♠"}
            {card.suit === "heart" && "♥"}
            {card.suit === "diamond" && "♦"}
            {card.suit === "club" && "♣"}
          </span>
        </div>
        {/* Bottom-right rank + suit (rotated) */}
        <div className="flex flex-col items-end leading-none rotate-180">
          <span className={`${textSizes[size]} font-bold`}>{card.rank}</span>
          <SuitSymbol suit={card.suit} size={size === "lg" ? "md" : size === "xs" ? "xs" : "sm"} />
        </div>
      </div>
    </motion.button>
  );
}
