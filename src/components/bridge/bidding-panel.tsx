"use client";

import { motion } from "motion/react";
import { bidAriaLabel, positionAriaLabel } from "@/lib/card-labels";

export interface BiddingData {
  dealer: "north" | "south" | "east" | "west";
  bids: string[]; // Sequential bids starting from dealer, e.g. ["1NT", "P", "3NT", "P", "P", "P"]
}

const POS_ORDER = ["west", "north", "east", "south"] as const;
const POS_LABELS: Record<string, string> = {
  west: "O",
  north: "N",
  east: "E",
  south: "S",
};

// Color a bid string
function BidCell({ bid, delay }: { bid: string; delay: number }) {
  if (bid === "—") {
    return (
      <span className="text-muted-foreground/40 text-xs font-medium" aria-hidden="true">—</span>
    );
  }
  if (bid === "P" || bid === "Passo") {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className="text-muted-foreground text-xs font-semibold"
        role="img"
        aria-label={bidAriaLabel(bid)}
      >
        <span aria-hidden="true">P</span>
      </motion.span>
    );
  }
  if (bid === "X" || bid === "Contre") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="text-red-600 dark:text-red-400 text-xs font-black"
        role="img"
        aria-label={bidAriaLabel(bid)}
      >
        <span aria-hidden="true">X</span>
      </motion.span>
    );
  }
  if (bid === "XX" || bid === "Surcontro") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="text-blue-600 dark:text-blue-400 text-xs font-black"
        role="img"
        aria-label={bidAriaLabel(bid)}
      >
        <span aria-hidden="true">XX</span>
      </motion.span>
    );
  }

  // Regular bid like "1NT", "3S", "4H", "2D", "1C"
  const level = bid[0];
  const suitPart = bid.slice(1).toUpperCase();

  const suitDisplay: Record<string, { symbol: string; color: string }> = {
    S: { symbol: "\u2660", color: "text-[#1B2631] dark:text-slate-200" },
    H: { symbol: "\u2665", color: "text-[#D32F2F] dark:text-red-400" },
    D: { symbol: "\u2666", color: "text-[#FF6F00] dark:text-orange-400" },
    C: { symbol: "\u2663", color: "text-[#2E7D32] dark:text-emerald-400" },
    NT: { symbol: "SA", color: "text-foreground" },
    SA: { symbol: "SA", color: "text-foreground" },
  };

  const suit = suitDisplay[suitPart];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="text-xs font-black flex items-center justify-center gap-0.5"
      role="img"
      aria-label={bidAriaLabel(bid)}
    >
      <span className="text-foreground" aria-hidden="true">{level}</span>
      <span className={suit?.color ?? "text-foreground"} aria-hidden="true">
        {suit?.symbol ?? suitPart}
      </span>
    </motion.span>
  );
}

/**
 * Rotate bidding positions so the declarer's bids appear under "S" (South),
 * matching the table display where the declarer is always at the bottom.
 */
function rotateBidding(bidding: BiddingData, declarer?: string): { displayOrder: readonly string[]; dealer: string; bids: string[] } {
  if (!declarer || declarer === "south") {
    return { displayOrder: POS_ORDER, dealer: bidding.dealer, bids: bidding.bids };
  }

  // Rotation map: game position → display position
  const ROTATIONS: Record<string, Record<string, string>> = {
    north: { north: "south", south: "north", east: "west", west: "east" },
    east:  { north: "east",  south: "west",  east: "south", west: "north" },
    west:  { north: "west",  south: "east",  east: "north", west: "south" },
  };
  const rot = ROTATIONS[declarer];

  // Rotate the dealer position
  const rotatedDealer = rot[bidding.dealer];

  // Build a mapping from original column index to rotated column index
  // Original order: W N E S (indices 0 1 2 3)
  // Each original position maps to a display position, find its new column
  const originalBidsByPos: string[][] = [[], [], [], []]; // W, N, E, S
  const dealerIdx = POS_ORDER.indexOf(bidding.dealer);
  let posIdx = dealerIdx;
  for (const bid of bidding.bids) {
    originalBidsByPos[posIdx].push(bid);
    posIdx = (posIdx + 1) % 4;
  }

  // Map each original position's bids to its rotated display column
  const rotatedBidsByCol: string[][] = [[], [], [], []]; // columns in POS_ORDER display
  for (let i = 0; i < 4; i++) {
    const origPos = POS_ORDER[i];
    const displayPos = rot[origPos];
    const displayCol = POS_ORDER.indexOf(displayPos as typeof POS_ORDER[number]);
    rotatedBidsByCol[displayCol] = originalBidsByPos[i];
  }

  // Reconstruct sequential bids starting from rotated dealer
  const rotatedDealerIdx = POS_ORDER.indexOf(rotatedDealer as typeof POS_ORDER[number]);
  const maxRounds = Math.max(...rotatedBidsByCol.map((c) => c.length));
  const rotatedBids: string[] = [];
  for (let round = 0; round < maxRounds; round++) {
    for (let col = 0; col < 4; col++) {
      const actualCol = (rotatedDealerIdx + col) % 4;
      if (round < rotatedBidsByCol[actualCol].length) {
        rotatedBids.push(rotatedBidsByCol[actualCol][round]);
      }
    }
  }

  return {
    displayOrder: POS_ORDER,
    dealer: rotatedDealer,
    bids: rotatedBids,
  };
}

export function BiddingPanel({
  bidding,
  compact = false,
  declarer,
}: {
  bidding: BiddingData;
  compact?: boolean;
  declarer?: string;
}) {
  const { dealer, bids } = rotateBidding(bidding, declarer);

  // Build the grid: figure out which column the dealer is in
  const dealerIdx = POS_ORDER.indexOf(dealer as typeof POS_ORDER[number]);

  // Build rows of 4 cells each
  const rows: string[][] = [];
  let currentRow: string[] = [];

  // Fill dashes before dealer
  for (let i = 0; i < dealerIdx; i++) {
    currentRow.push("—");
  }

  // Add bids
  for (const bid of bids) {
    currentRow.push(bid);
    if (currentRow.length === 4) {
      rows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return (
    <div
      className={`rounded-xl bg-card/95 backdrop-blur-sm border border-border shadow-sm ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center" aria-hidden="true">
        Licita
      </p>
      <table className="w-full">
        <caption className="sr-only">
          Sequenza di licita, una colonna per posizione (Ovest, Nord, Est, Sud)
        </caption>
        <thead>
          <tr>
            {POS_ORDER.map((pos) => (
              <th
                key={pos}
                scope="col"
                className={`text-[12px] font-bold text-center pb-1 ${
                  pos === dealer
                    ? "text-emerald"
                    : "text-muted-foreground"
                }`}
              >
                <span aria-hidden="true">{POS_LABELS[pos]}</span>
                <span className="sr-only">
                  {positionAriaLabel(pos)}
                  {pos === dealer ? " (dichiarante di mano)" : ""}
                </span>
                {pos === dealer && (
                  <span className="text-[12px] block text-emerald/60" aria-hidden="true">D</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-t border-border/50">
              {row.map((bid, colIdx) => (
                <td
                  key={colIdx}
                  className="text-center py-1 px-1"
                >
                  <BidCell
                    bid={bid}
                    delay={0.1 + (rowIdx * 4 + colIdx) * 0.05}
                  />
                </td>
              ))}
              {/* Fill remaining cells if last row is incomplete */}
              {row.length < 4 &&
                Array.from({ length: 4 - row.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="py-1 px-1" />
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
