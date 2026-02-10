"use client";

import { motion, AnimatePresence } from "motion/react";
import { Hand } from "./hand";
import { DummyHand } from "./dummy-hand";
import type { CardData } from "./playing-card";

export interface TrickPlayDisplay {
  position: string;
  card: CardData;
}

export interface BridgeTableProps {
  north: CardData[];
  south: CardData[];
  east: CardData[];
  west: CardData[];
  northFaceDown?: boolean;
  southFaceDown?: boolean;
  eastFaceDown?: boolean;
  westFaceDown?: boolean;
  currentTrick?: TrickPlayDisplay[];
  contract?: string;
  declarer?: string;
  dummy?: string; // "N" | "S" | "E" | "W" - which position is the dummy
  trickCount?: { ns: number; ew: number };
  vulnerability?: "none" | "ns" | "ew" | "both";
  onPlayCard?: (position: string, cardIndex: number) => void;
  highlightedCards?: CardData[];
  activePosition?: string;
  disabled?: boolean;
  compact?: boolean;
}

const suitSymbol: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const suitColorClass: Record<string, string> = {
  spade: "text-[#1B2631]",
  heart: "text-[#D32F2F]",
  diamond: "text-[#FF6F00]",
  club: "text-[#2E7D32]",
};

/** Compact face-down card stack for mobile E/W positions */
function CompactFaceDown({ count }: { count: number }) {
  return (
    <div className="relative w-8 h-14 flex items-center justify-center">
      {/* Stacked card backs */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute w-8 h-[44px] rounded-md bg-gradient-to-br from-emerald to-emerald-dark border border-white/20 shadow-sm"
          style={{ top: i * 2, left: i * 1 }}
        />
      ))}
      {/* Count badge */}
      <div className="absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[8px] font-black text-emerald-dark shadow-sm">
        {count}
      </div>
    </div>
  );
}

export function BridgeTable({
  north,
  south,
  east,
  west,
  northFaceDown = false,
  southFaceDown = false,
  eastFaceDown = true,
  westFaceDown = true,
  currentTrick = [],
  contract,
  declarer,
  dummy,
  trickCount = { ns: 0, ew: 0 },
  vulnerability = "none",
  onPlayCard,
  highlightedCards = [],
  activePosition,
  disabled = false,
  compact = false,
}: BridgeTableProps) {
  const vulColor = {
    none: "border-white/10",
    ns: "border-y-red-400/50 border-x-white/10",
    ew: "border-x-red-400/50 border-y-white/10",
    both: "border-red-400/50",
  };

  // Determine dummy position from declarer
  const dummyPos = dummy
    ? dummy.toUpperCase()
    : declarer === "N"
      ? "S"
      : declarer === "S"
        ? "N"
        : declarer === "E"
          ? "W"
          : declarer === "W"
            ? "E"
            : null;

  const isDummy = (pos: string) => {
    const map: Record<string, string> = { north: "N", south: "S", east: "E", west: "W" };
    return dummyPos === map[pos];
  };

  const isActive = (pos: string) => activePosition === pos;

  const posLabel = (pos: string, shortPos: string) => {
    const labels: Record<string, string> = { north: "Nord", south: "Sud", east: "Est", west: "Ovest" };
    const isDcl = declarer === shortPos;
    const isDum = isDummy(pos);
    let extra = "";
    if (isDcl) extra = " · Dich.";
    else if (isDum) extra = " · Morto";
    return labels[pos] + extra;
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto no-select ${compact ? "min-h-[340px]" : ""}`} style={{ aspectRatio: compact ? "4 / 5" : "1 / 1", touchAction: "manipulation" }}>
      {/* Felt background */}
      <div
        className={`absolute inset-0 rounded-3xl felt-bg border-4 ${vulColor[vulnerability]} shadow-2xl overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Center: trick area + compass — z-20 so played cards always appear above face-down hands */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className={`relative ${compact ? "w-32 h-32" : "w-48 h-48"}`}>
          {/* Compass */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${compact ? "w-14 h-14" : "w-20 h-20"} rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center`}>
              <div className={`grid grid-cols-3 grid-rows-3 gap-0 text-white/50 ${compact ? "text-[8px]" : "text-[10px]"} font-bold`}>
                <div />
                <div className={`flex items-center justify-center ${isActive("north") ? "text-amber" : ""}`}>N</div>
                <div />
                <div className={`flex items-center justify-center ${isActive("west") ? "text-amber" : ""}`}>O</div>
                <div className="flex items-center justify-center text-amber text-xs font-black">
                  {trickCount.ns}-{trickCount.ew}
                </div>
                <div className={`flex items-center justify-center ${isActive("east") ? "text-amber" : ""}`}>E</div>
                <div />
                <div className={`flex items-center justify-center ${isActive("south") ? "text-amber" : ""}`}>S</div>
                <div />
              </div>
            </div>
          </div>

          {/* Current trick cards */}
          <AnimatePresence>
            {currentTrick.map((play) => {
              const trickPositions: Record<string, string> = compact
                ? {
                    north: "-top-12 left-1/2 -translate-x-1/2",
                    south: "-bottom-12 left-1/2 -translate-x-1/2",
                    east: "top-1/2 -right-11 -translate-y-1/2",
                    west: "top-1/2 -left-11 -translate-y-1/2",
                  }
                : {
                    north: "-top-14 left-1/2 -translate-x-1/2",
                    south: "-bottom-14 left-1/2 -translate-x-1/2",
                    east: "top-1/2 -right-14 -translate-y-1/2",
                    west: "top-1/2 -left-14 -translate-y-1/2",
                  };
              return (
                <motion.div
                  key={`trick-${play.position}`}
                  className={`absolute ${trickPositions[play.position]}`}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className={`${compact ? "w-10 h-[52px]" : "w-14 h-[76px]"} rounded-lg bg-white border border-gray-200 shadow-lg flex flex-col items-center justify-center gap-0.5 ${suitColorClass[play.card.suit]}`}>
                    <span className={`${compact ? "text-base" : "text-lg"} font-black leading-none`}>
                      {play.card.rank}
                    </span>
                    <span className={`${compact ? "text-base" : "text-lg"} leading-none`}>
                      {suitSymbol[play.card.suit]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* North hand */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <div className="text-center mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive("north") ? "text-amber" : isDummy("north") ? "text-white/80" : "text-white/50"}`}>
            {posLabel("north", "N")}
          </span>
        </div>
        {isDummy("north") && !northFaceDown ? (
          <DummyHand
            cards={north}
            onSelectCard={(i) => onPlayCard?.("north", i)}
            highlightedCards={activePosition === "north" ? highlightedCards : []}
            disabled={disabled || activePosition !== "north"}
            compact={compact}
          />
        ) : (
          <Hand
            cards={north}
            faceDown={northFaceDown}
            size={compact ? "xs" : "sm"}
            position="north"
            onSelectCard={(i) => onPlayCard?.("north", i)}
            highlightedCards={activePosition === "north" ? highlightedCards : []}
            disabled={disabled || activePosition !== "north"}
            noHover={compact}
          />
        )}
      </div>

      {/* South hand - player's main hand, bigger cards */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
        {isDummy("south") && !southFaceDown ? (
          <DummyHand
            cards={south}
            onSelectCard={(i) => onPlayCard?.("south", i)}
            highlightedCards={activePosition === "south" ? highlightedCards : []}
            disabled={disabled || activePosition !== "south"}
            compact={compact}
          />
        ) : (
          <Hand
            cards={south}
            faceDown={southFaceDown}
            size={compact ? "sm" : "md"}
            position="south"
            onSelectCard={(i) => onPlayCard?.("south", i)}
            highlightedCards={activePosition === "south" ? highlightedCards : []}
            disabled={disabled || activePosition !== "south"}
            noHover={compact}
          />
        )}
        <div className="text-center mt-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive("south") ? "text-amber" : isDummy("south") ? "text-white/80" : "text-white/50"}`}>
            {posLabel("south", "S")}
          </span>
        </div>
      </div>

      {/* East hand */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <div className="flex items-center gap-1">
          {compact && eastFaceDown ? (
            <CompactFaceDown count={east.length} />
          ) : (
            <Hand
              cards={east}
              faceDown={eastFaceDown}
              size={compact ? "xs" : "sm"}
              position="east"
              disabled={true}
            />
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] ${isActive("east") ? "text-amber" : "text-white/50"}`}>
            Est
          </span>
        </div>
      </div>

      {/* West hand */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 ${isActive("west") ? "text-amber" : "text-white/50"}`}>
            Ovest
          </span>
          {compact && westFaceDown ? (
            <CompactFaceDown count={west.length} />
          ) : (
            <Hand
              cards={west}
              faceDown={westFaceDown}
              size={compact ? "xs" : "sm"}
              position="west"
              disabled={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
