"use client";

import { motion } from "motion/react";

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
      <span className="text-gray-300 text-xs font-medium">—</span>
    );
  }
  if (bid === "P" || bid === "Passo") {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className="text-gray-400 text-xs font-semibold"
      >
        P
      </motion.span>
    );
  }
  if (bid === "X" || bid === "Contre") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="text-red-600 text-xs font-black"
      >
        X
      </motion.span>
    );
  }
  if (bid === "XX" || bid === "Surcontro") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="text-blue-600 text-xs font-black"
      >
        XX
      </motion.span>
    );
  }

  // Regular bid like "1NT", "3S", "4H", "2D", "1C"
  const level = bid[0];
  const suitPart = bid.slice(1).toUpperCase();

  const suitDisplay: Record<string, { symbol: string; color: string }> = {
    S: { symbol: "\u2660", color: "text-[#1B2631]" },
    H: { symbol: "\u2665", color: "text-[#D32F2F]" },
    D: { symbol: "\u2666", color: "text-[#FF6F00]" },
    C: { symbol: "\u2663", color: "text-[#2E7D32]" },
    NT: { symbol: "SA", color: "text-gray-800" },
    SA: { symbol: "SA", color: "text-gray-800" },
  };

  const suit = suitDisplay[suitPart];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="text-xs font-black flex items-center justify-center gap-0.5"
    >
      <span className="text-gray-900">{level}</span>
      <span className={suit?.color ?? "text-gray-800"}>
        {suit?.symbol ?? suitPart}
      </span>
    </motion.span>
  );
}

export function BiddingPanel({
  bidding,
  compact = false,
}: {
  bidding: BiddingData;
  compact?: boolean;
}) {
  // Build the grid: figure out which column the dealer is in
  const dealerIdx = POS_ORDER.indexOf(bidding.dealer);

  // Build rows of 4 cells each
  const rows: string[][] = [];
  let currentRow: string[] = [];

  // Fill dashes before dealer
  for (let i = 0; i < dealerIdx; i++) {
    currentRow.push("—");
  }

  // Add bids
  for (const bid of bidding.bids) {
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
      className={`rounded-xl bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center">
        Licita
      </p>
      <table className="w-full">
        <thead>
          <tr>
            {POS_ORDER.map((pos) => (
              <th
                key={pos}
                className={`text-[10px] font-bold text-center pb-1 ${
                  pos === bidding.dealer
                    ? "text-emerald"
                    : "text-gray-400"
                }`}
              >
                {POS_LABELS[pos]}
                {pos === bidding.dealer && (
                  <span className="text-[7px] block text-emerald/60">D</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-t border-gray-50">
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
