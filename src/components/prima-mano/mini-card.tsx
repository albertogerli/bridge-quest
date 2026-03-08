"use client";

import { motion } from "motion/react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";

export interface MiniCardData {
  rank: string;
  suit: "spade" | "heart" | "diamond" | "club";
}

export function MiniCard({
  card,
  onClick,
  selected,
  correct,
  disabled,
  locked,
  delay = 0,
  size = "normal",
}: {
  card: MiniCardData;
  onClick?: () => void;
  selected?: boolean;
  correct?: boolean;
  disabled?: boolean;
  locked?: boolean;
  delay?: number;
  size?: "small" | "normal";
}) {
  const isRed = card.suit === "heart" || card.suit === "diamond";
  const px = size === "small" ? "px-3 py-3" : "px-4 py-5";
  const textSize = size === "small" ? "text-xl" : "text-2xl";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={!locked ? onClick : undefined}
      disabled={disabled || locked}
      className={`relative rounded-2xl border-2 ${px} text-center transition-all ${
        locked
          ? "border-[#c8c0b0] bg-[#e8e2d5] opacity-50 cursor-not-allowed"
          : selected
            ? correct
              ? "border-emerald-400 bg-emerald-50 shadow-[0_8px_24px_rgba(16,185,129,0.18)]"
              : "border-rose-400 bg-rose-50 shadow-[0_8px_24px_rgba(244,63,94,0.18)]"
            : disabled
              ? "border-[#d8d0c0] bg-[#f5f0e5] opacity-60"
              : "border-[#d8d0c0] bg-white hover:border-[#003DA5]/40 hover:shadow-lg cursor-pointer"
      }`}
    >
      {locked && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#8a94a8] text-[9px] text-white">
          🔒
        </div>
      )}
      <p className={`${textSize} font-black ${isRed ? "text-red-600" : "text-[#12305f]"}`}>
        {card.rank}
      </p>
      <div className="mt-1.5 flex justify-center">
        <SuitSymbol suit={card.suit} size={size === "small" ? "sm" : "md"} />
      </div>
    </motion.button>
  );
}
