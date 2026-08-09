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
  "\u2660": { symbol: "\u2660", color: "text-[#1B2631] dark:text-slate-200", bgColor: "bg-slate-50 dark:bg-slate-800/40" },
  "\u2665": { symbol: "\u2665", color: "text-[#D32F2F] dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/40" },
  "\u2666": { symbol: "\u2666", color: "text-[#FF6F00] dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/40" },
  "\u2663": { symbol: "\u2663", color: "text-[#2E7D32] dark:text-emerald-400", bgColor: "bg-green-50 dark:bg-green-950/40" },
};

/**
 * Un blocco `cards` può contenere più mani separate da "|" o "+", con un'etichetta
 * opzionale prima dei semi ("Ovest (morto): ♠Q74 ♥98 …"). Senza questo split
 * la "|" veniva letta come se fosse il rango di una carta.
 */
function splitHands(cards: string): { label?: string; cards: string }[] {
  let src = cards.trim();
  // Remove arrow and anything after it (like "→ 1♦")
  const arrowIdx = src.indexOf("→");
  if (arrowIdx >= 0) src = src.slice(0, arrowIdx).trim();

  return src
    .split(/[|+]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => ({ label: extractLabel(part), cards: part }));
}

/** Testo prima del primo simbolo di seme, ripulito dai due punti finali. */
function extractLabel(hand: string): string | undefined {
  const suitKeys = Object.keys(SUIT_MAP);
  const firstSuit = Math.min(
    ...suitKeys.map((s) => {
      const idx = hand.indexOf(s);
      return idx < 0 ? Number.POSITIVE_INFINITY : idx;
    })
  );
  if (!Number.isFinite(firstSuit) || firstSuit === 0) return undefined;
  const label = hand.slice(0, firstSuit).replace(/[:\-–—]\s*$/, "").trim();
  return label.length > 0 ? label : undefined;
}

function stripLabel(hand: string): string {
  const label = extractLabel(hand);
  return label ? hand.slice(hand.indexOf(label) + label.length) : hand;
}

function parseCardString(cards: string): SuitGroup[] {
  const groups: SuitGroup[] = [];
  const suitKeys = Object.keys(SUIT_MAP);

  // Split by suit symbols
  let remaining = stripLabel(cards).trim();
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
  const hands = splitHands(cards).map((h) => ({
    label: h.label,
    groups: parseCardString(h.cards),
  }));

  if (hands.every((h) => h.groups.length === 0)) {
    // Fallback: show as text
    return (
      <span className="font-black text-foreground tracking-wide">{cards}</span>
    );
  }

  const sizeClasses = {
    sm: { card: "h-5 px-1 text-[10px]", symbol: "text-[10px]", gap: "gap-0.5" },
    md: { card: "h-7 px-1.5 text-xs", symbol: "text-xs", gap: "gap-1" },
    lg: { card: "h-8 px-2 text-sm", symbol: "text-sm", gap: "gap-1" },
  };

  const s = sizeClasses[size];

  return (
    <span className="inline-flex flex-wrap items-start gap-x-3 gap-y-2">
      {hands.map((hand, hIdx) => (
        <span key={hIdx} className="inline-flex items-start gap-x-3">
          {hIdx > 0 && (
            <span
              className="mt-1 h-6 w-px shrink-0 bg-border"
              aria-hidden="true"
            />
          )}
          <span className="inline-flex flex-col gap-1">
            {hand.label && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {hand.label}
              </span>
            )}
            <span className={`inline-flex flex-wrap items-center ${s.gap}`}>
              {hand.groups.map((group, gIdx) => (
                <motion.span
                  key={gIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (hIdx * 4 + gIdx) * 0.08 }}
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
          </span>
        </span>
      ))}
    </span>
  );
}

/** Full hand display showing all 4 suits vertically */
export function HandDiagram({
  cards,
  label,
}: {
  cards: string;
  label?: string;
  position?: string;
}) {
  const groups = parseCardString(cards);

  return (
    <div className="rounded-xl bg-card border border-border shadow-sm p-3">
      {label && (
        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-2">
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
                  className={`inline-flex items-center justify-center w-6 h-6 rounded bg-muted border border-border text-xs font-black ${group.color}`}
                >
                  {rank}
                </span>
              ))}
              {group.ranks.length === 0 && (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
