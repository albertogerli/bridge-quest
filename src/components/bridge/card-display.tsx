"use client";

import { motion } from "motion/react";

/**
 * CardDisplay - Renders card notation like "♠AQ854 ♥K9 ♦J87 ♣AKJ"
 * as visual mini-cards grouped by suit, with proper colors.
 */

interface SuitGroup {
  suit: string;
  symbol: string;
  color: string;
  bgColor: string;
  ranks: string[];
}

const SUIT_MAP: Record<string, { symbol: string; color: string; bgColor: string }> = {
  "\u2660": { symbol: "\u2660", color: "text-[#1B2631]", bgColor: "bg-slate-50" },
  "\u2665": { symbol: "\u2665", color: "text-[#D32F2F]", bgColor: "bg-red-50" },
  "\u2666": { symbol: "\u2666", color: "text-[#FF6F00]", bgColor: "bg-orange-50" },
  "\u2663": { symbol: "\u2663", color: "text-[#2E7D32]", bgColor: "bg-green-50" },
};

function parseCardString(cards: string): SuitGroup[] {
  const groups: SuitGroup[] = [];
  const suitKeys = Object.keys(SUIT_MAP);

  // Split by suit symbols
  let remaining = cards.trim();
  // Remove arrow and anything after it (like "→ 1♦")
  const arrowIdx = remaining.indexOf("\u2192");
  if (arrowIdx >= 0) remaining = remaining.slice(0, arrowIdx).trim();

  for (let i = 0; i < remaining.length; i++) {
    const ch = remaining[i];
    if (suitKeys.includes(ch)) {
      const info = SUIT_MAP[ch];
      // Collect ranks until next suit symbol or end
      let ranks = "";
      let j = i + 1;
      while (j < remaining.length && !suitKeys.includes(remaining[j])) {
        if (remaining[j] !== " ") ranks += remaining[j];
        j++;
      }
      if (ranks.length > 0) {
        groups.push({
          suit: ch,
          symbol: info.symbol,
          color: info.color,
          bgColor: info.bgColor,
          ranks: splitRanks(ranks),
        });
      }
      i = j - 1;
    }
  }

  return groups;
}

function splitRanks(rankStr: string): string[] {
  const ranks: string[] = [];
  let i = 0;
  while (i < rankStr.length) {
    if (rankStr[i] === "1" && i + 1 < rankStr.length && rankStr[i + 1] === "0") {
      ranks.push("10");
      i += 2;
    } else if (rankStr[i] !== "," && rankStr[i] !== " ") {
      ranks.push(rankStr[i]);
      i++;
    } else {
      i++;
    }
  }
  return ranks;
}

export function CardDisplay({
  cards,
  size = "md",
}: {
  cards: string;
  size?: "sm" | "md" | "lg";
}) {
  const groups = parseCardString(cards);

  if (groups.length === 0) {
    // Fallback: show as text
    return (
      <span className="font-black text-gray-900 tracking-wide">{cards}</span>
    );
  }

  const sizeClasses = {
    sm: { card: "h-5 px-1 text-[10px]", symbol: "text-[10px]", gap: "gap-0.5" },
    md: { card: "h-7 px-1.5 text-xs", symbol: "text-xs", gap: "gap-1" },
    lg: { card: "h-8 px-2 text-sm", symbol: "text-sm", gap: "gap-1" },
  };

  const s = sizeClasses[size];

  return (
    <span className={`inline-flex flex-wrap items-center ${s.gap}`}>
      {groups.map((group, gIdx) => (
        <motion.span
          key={gIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gIdx * 0.08 }}
          className={`inline-flex items-center ${s.gap} ${group.bgColor} rounded-lg px-1.5 py-0.5`}
        >
          <span className={`${group.color} ${s.symbol} font-bold`}>
            {group.symbol}
          </span>
          <span className={`inline-flex items-center ${s.gap}`}>
            {group.ranks.map((rank, rIdx) => (
              <span
                key={rIdx}
                className={`${group.color} ${s.card} font-black inline-flex items-center justify-center`}
              >
                {rank}
              </span>
            ))}
          </span>
        </motion.span>
      ))}
    </span>
  );
}

/** Full hand display showing all 4 suits vertically */
export function HandDiagram({
  cards,
  label,
  position,
}: {
  cards: string;
  label?: string;
  position?: string;
}) {
  const groups = parseCardString(cards);

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3">
      {label && (
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {groups.map((group, gIdx) => (
          <motion.div
            key={gIdx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: gIdx * 0.1 }}
            className="flex items-center gap-1.5"
          >
            <span className={`${group.color} text-base font-bold w-4 text-center`}>
              {group.symbol}
            </span>
            <div className="flex items-center gap-0.5">
              {group.ranks.map((rank, rIdx) => (
                <span
                  key={rIdx}
                  className={`inline-flex items-center justify-center w-6 h-6 rounded bg-gray-50 border border-gray-100 text-xs font-black ${group.color}`}
                >
                  {rank}
                </span>
              ))}
              {group.ranks.length === 0 && (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
