/**
 * Validation script for all smazzate (practice hands)
 * Run with: npx tsx scripts/validate-smazzate.ts
 */

import { smazzate as smazzate1to4 } from "../src/data/smazzate";
import { smazzate5to8 } from "../src/data/smazzate-5-8";
import { smazzate9to12 } from "../src/data/smazzate-9-12";
import { quadriSmazzate } from "../src/data/quadri-smazzate";
import { cuoriGiocoSmazzate } from "../src/data/cuori-gioco-smazzate";

type Position = "north" | "south" | "east" | "west";
type Card = { suit: string; rank: string };

interface Smazzata {
  id: string;
  lesson: number;
  board: number;
  title: string;
  contract: string;
  declarer: string;
  openingLead: Card;
  vulnerability: string;
  hands: Record<string, Card[]>;
  commentary?: string;
  bidding?: { dealer: string; bids: string[] };
}

const POSITIONS: Position[] = ["north", "south", "east", "west"];
const HCP: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

function nextPos(p: string): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  return order[(order.indexOf(p as Position) + 1) % 4];
}

function partnerOf(p: string): Position {
  const partners: Record<string, Position> = {
    north: "south", south: "north", east: "west", west: "east"
  };
  return partners[p];
}

function countHCP(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + (HCP[c.rank] || 0), 0);
}

function countSuit(cards: Card[], suit: string): number {
  return cards.filter(c => c.suit === suit).length;
}

function contractTricks(contract: string): number {
  const level = parseInt(contract[0]);
  return level + 6;
}

function contractSuit(contract: string): string {
  const rest = contract.slice(1).replace(/X$/i, "").toUpperCase();
  if (rest === "NT" || rest === "SA") return "notrump";
  if (rest === "S" || rest === "♠") return "spade";
  if (rest === "H" || rest === "♥") return "heart";
  if (rest === "D" || rest === "♦") return "diamond";
  if (rest === "C" || rest === "♣") return "club";
  return rest;
}

// Determine declarer from bidding
function declarerFromBidding(bidding: { dealer: string; bids: string[] }): string | null {
  const order: Position[] = ["south", "west", "north", "east"]; // standard rotation
  const dealerIdx = order.indexOf(bidding.dealer as Position);
  if (dealerIdx === -1) return null;

  const finalContract = bidding.bids.filter(b => b !== "P" && b !== "Dbl" && b !== "Rdbl" && b !== "X" && b !== "XX");
  if (finalContract.length === 0) return null;

  const lastBid = finalContract[finalContract.length - 1];
  // Determine the denomination of final contract
  const denom = lastBid.replace(/[0-9]/g, "").toUpperCase();

  // Find which side won (made the last non-pass bid)
  let lastBidIdx = -1;
  for (let i = bidding.bids.length - 1; i >= 0; i--) {
    if (bidding.bids[i] !== "P" && bidding.bids[i] !== "Dbl" && bidding.bids[i] !== "Rdbl") {
      lastBidIdx = i;
      break;
    }
  }
  if (lastBidIdx === -1) return null;

  const lastBidderPos = order[(dealerIdx + lastBidIdx) % 4];
  const winningSide = lastBidderPos === "north" || lastBidderPos === "south" ? "ns" : "ew";

  // Find first player on winning side to bid the final denomination
  for (let i = 0; i < bidding.bids.length; i++) {
    const pos = order[(dealerIdx + i) % 4];
    const bid = bidding.bids[i];
    if (bid === "P" || bid === "Dbl" || bid === "Rdbl" || bid === "X" || bid === "XX") continue;

    const bidDenom = bid.replace(/[0-9]/g, "").toUpperCase();
    const bidSide = pos === "north" || pos === "south" ? "ns" : "ew";

    if (bidSide === winningSide && bidDenom === denom) {
      return pos;
    }
  }

  return lastBidderPos;
}

function validate(allHands: Smazzata[], courseName: string) {
  let errors = 0;
  let warnings = 0;
  let filtered = 0;

  for (const s of allHands) {
    const issues: string[] = [];
    const warns: string[] = [];

    // 1. Check each hand has exactly 13 cards
    for (const pos of POSITIONS) {
      const hand = s.hands[pos];
      if (!hand) {
        issues.push(`Missing hand for ${pos}`);
        continue;
      }
      if (hand.length !== 13) {
        issues.push(`${pos} has ${hand.length} cards (should be 13)`);
      }
    }

    // 2. Check no duplicate cards and all 52 present
    const seen = new Set<string>();
    let hasDuplicates = false;
    for (const pos of POSITIONS) {
      if (!s.hands[pos]) continue;
      for (const c of s.hands[pos]) {
        const key = `${c.suit}-${c.rank}`;
        if (seen.has(key)) {
          issues.push(`Duplicate card: ${c.rank} of ${c.suit}`);
          hasDuplicates = true;
        }
        seen.add(key);
      }
    }

    // 3. Check opening lead is in the leader's hand
    const leader = nextPos(s.declarer);
    const leaderHand = s.hands[leader];
    if (leaderHand) {
      const hasLead = leaderHand.some(
        c => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank
      );
      if (!hasLead) {
        issues.push(`Opening lead ${s.openingLead.rank} of ${s.openingLead.suit} NOT in ${leader}'s hand`);
      }
    }

    // 4. Check declarer's side has reasonable HCP
    const declarerHCP = countHCP(s.hands[s.declarer] || []);
    const dummyHCP = countHCP(s.hands[partnerOf(s.declarer)] || []);
    const combinedHCP = declarerHCP + dummyHCP;
    const tricks = contractTricks(s.contract);

    // Other side HCP
    const defPos = POSITIONS.filter(p => p !== s.declarer && p !== partnerOf(s.declarer));
    const defHCP = defPos.reduce((sum, p) => sum + countHCP(s.hands[p] || []), 0);

    if (combinedHCP < defHCP - 5 && tricks >= 10) {
      issues.push(`Declaring side has ${combinedHCP} HCP vs defense ${defHCP} HCP for ${s.contract}`);
    }
    if (combinedHCP < 18 && tricks >= 10) {
      warns.push(`Low HCP (${combinedHCP}) for ${s.contract} (needs ${tricks} tricks)`);
    }

    // 5. Check trump fit for suit contracts
    const suit = contractSuit(s.contract);
    if (suit !== "notrump") {
      const declarerTrump = countSuit(s.hands[s.declarer] || [], suit);
      const dummyTrump = countSuit(s.hands[partnerOf(s.declarer)] || [], suit);
      const totalTrump = declarerTrump + dummyTrump;
      if (totalTrump < 7) {
        issues.push(`Only ${totalTrump} trumps (${suit}) between declarer(${declarerTrump}) and dummy(${dummyTrump})`);
      }
    }

    // 6. Check declarer matches bidding
    if (s.bidding) {
      const expectedDeclarer = declarerFromBidding(s.bidding);
      if (expectedDeclarer && expectedDeclarer !== s.declarer) {
        warns.push(`Bidding suggests declarer=${expectedDeclarer}, but data says ${s.declarer}`);
      }
    }

    if (issues.length > 0) {
      console.log(`\n❌ ${courseName} ${s.id} (L${s.lesson} B${s.board}) "${s.title}" — ${s.contract} by ${s.declarer}`);
      issues.forEach(i => console.log(`   ERROR: ${i}`));
      warns.forEach(w => console.log(`   WARN:  ${w}`));
      errors++;
    } else if (warns.length > 0) {
      console.log(`\n⚠️  ${courseName} ${s.id} (L${s.lesson} B${s.board}) "${s.title}" — ${s.contract} by ${s.declarer}`);
      warns.forEach(w => console.log(`   WARN:  ${w}`));
      warnings++;
    }
  }

  return { total: allHands.length, errors, warnings };
}

console.log("=== BRIDGE HAND VALIDATION ===\n");

const results: { name: string; total: number; errors: number; warnings: number }[] = [];

console.log("\n--- CORSO FIORI 1-4 ---");
results.push({ name: "Fiori 1-4", ...validate(smazzate1to4 as any, "FIORI") });

console.log("\n--- CORSO FIORI 5-8 ---");
results.push({ name: "Fiori 5-8", ...validate(smazzate5to8 as any, "FIORI") });

console.log("\n--- CORSO FIORI 9-12 ---");
results.push({ name: "Fiori 9-12", ...validate(smazzate9to12 as any, "FIORI") });

console.log("\n--- CORSO QUADRI ---");
results.push({ name: "Quadri", ...validate(quadriSmazzate as any, "QUADRI") });

console.log("\n--- CORSO CUORI GIOCO ---");
results.push({ name: "Cuori Gioco", ...validate(cuoriGiocoSmazzate as any, "CUORI") });

console.log("\n\n=== SUMMARY ===");
let totalHands = 0, totalErrors = 0, totalWarnings = 0;
for (const r of results) {
  console.log(`${r.name}: ${r.total} hands, ${r.errors} errors, ${r.warnings} warnings`);
  totalHands += r.total;
  totalErrors += r.errors;
  totalWarnings += r.warnings;
}
console.log(`\nTOTAL: ${totalHands} hands, ${totalErrors} ERRORS, ${totalWarnings} warnings`);
console.log(`Valid: ${totalHands - totalErrors} / ${totalHands}`);
