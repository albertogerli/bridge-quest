/**
 * BEN Bridge Engine Neural - TypeScript client
 * Calls our Next.js API routes which proxy to the BEN server
 */

import type { Card, Position, GameState } from "./bridge-engine";
import type { Vulnerability, BiddingData } from "@/lib/catalog";
import {
  handToPBN,
  positionToBEN,
  vulToBEN,
  biddingToCTX,
  gameStateToPBNPlayed,
  benSeatParams,
} from "./ben-format";

// --- Types ---

export interface BenPlayRequest {
  gameState: GameState;
  position: Position;
  dealer: Position;
  vulnerability: Vulnerability;
  bidding?: BiddingData;
}

export interface BenPlayResponse {
  card: Card;
  fallback: boolean;
  error?: string;
}

export interface BenHealthResponse {
  available: boolean;
  latency?: number;
}

// --- API calls ---

/** Check if BEN server is running */
export async function checkBenHealth(): Promise<BenHealthResponse> {
  try {
    const res = await fetch("/api/ben/health", { cache: "no-store" });
    if (!res.ok) return { available: false };
    const data = await res.json();
    return { available: data.available === true, latency: data.latency };
  } catch {
    return { available: false };
  }
}

/** Ask BEN to play a card */
export async function benPlay(req: BenPlayRequest): Promise<BenPlayResponse> {
  try {
    const { gameState, position, dealer, vulnerability, bidding } = req;

    // Mani ORIGINALI da tredici carte, e il caso del morto: vedi
    // `benSeatParams`. Con le mani correnti BEN rispondeva «Hand should have
    // 13 cards» — e con HTTP 200, quindi il proxy lo leggeva come un
    // fallimento e ripiegava in silenzio: BEN non veniva mai usato e nulla lo
    // segnalava.
    const { hand, dummy, seat } = benSeatParams(gameState, position);
    const dealerBen = positionToBEN(dealer);
    const vul = vulToBEN(vulnerability);
    const ctx = biddingToCTX(bidding);
    const played = gameStateToPBNPlayed(gameState);

    const res = await fetch("/api/ben/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hand, dummy, seat, dealer: dealerBen, vul, ctx, played }),
    });

    if (!res.ok) {
      return { card: null as unknown as Card, fallback: true, error: "API error" };
    }

    const data = await res.json();
    if (data.fallback) {
      return { card: null as unknown as Card, fallback: true, error: data.error };
    }

    return { card: data.card, fallback: false };
  } catch {
    return { card: null as unknown as Card, fallback: true, error: "Network error" };
  }
}

/** Ask BEN for an opening lead */
export async function benLead(
  hand: Card[],
  position: Position,
  dealer: Position,
  vulnerability: Vulnerability,
  bidding?: BiddingData,
): Promise<BenPlayResponse> {
  try {
    const res = await fetch("/api/ben/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hand: handToPBN(hand),
        seat: positionToBEN(position),
        dealer: positionToBEN(dealer),
        vul: vulToBEN(vulnerability),
        ctx: biddingToCTX(bidding),
      }),
    });

    if (!res.ok) {
      return { card: null as unknown as Card, fallback: true, error: "API error" };
    }

    const data = await res.json();
    if (data.fallback) {
      return { card: null as unknown as Card, fallback: true, error: data.error };
    }

    return { card: data.card, fallback: false };
  } catch {
    return { card: null as unknown as Card, fallback: true, error: "Network error" };
  }
}

/**
 * La dichiarazione del compagno, dal modello neurale di BEN.
 *
 * Restituisce `fallback: true` quando BEN non risponde: chi chiama decide
 * cosa fare, e nell'esercizio di licita il compagno passa — dicendolo. Fingere
 * che abbia scelto di passare sarebbe peggio del silenzio.
 */
export async function benBid(req: {
  hand: Card[];
  seat: Position;
  dealer: Position;
  vulnerability: Vulnerability;
  bidding?: BiddingData;
}): Promise<{ bid: string; fallback: boolean }> {
  try {
    const res = await fetch("/api/ben/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hand: handToPBN(req.hand),
        seat: positionToBEN(req.seat),
        dealer: positionToBEN(req.dealer),
        vul: vulToBEN(req.vulnerability),
        ctx: biddingToCTX(req.bidding),
      }),
    });
    if (!res.ok) return { bid: "P", fallback: true };
    const data = await res.json();
    if (data.fallback || typeof data.bid !== "string") return { bid: "P", fallback: true };
    return { bid: benBidToItaliano(data.bid), fallback: false };
  } catch {
    return { bid: "P", fallback: true };
  }
}

/** Da "1S"/"PASS"/"X" alla forma usata nella schermata ("1♠", "P", "X"). */
export function benBidToItaliano(bid: string): string {
  const b = bid.trim().toUpperCase();
  if (b === "PASS" || b === "P" || b === "--") return "P";
  if (b === "X" || b === "DBL") return "X";
  if (b === "XX" || b === "RDBL") return "XX";
  const m = b.match(/^([1-7])(NT|N|S|H|D|C)$/);
  if (!m) return "P";
  const simbolo: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", N: "SA", NT: "SA" };
  return `${m[1]}${simbolo[m[2]]}`;
}
