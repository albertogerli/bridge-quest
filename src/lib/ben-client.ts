/**
 * BEN Bridge Engine Neural - TypeScript client
 * Calls our Next.js API routes which proxy to the BEN server
 */

import type { Card, Position, GameState } from "./bridge-engine";
import type { Vulnerability, BiddingData } from "@/data/smazzate";
import {
  handToPBN,
  positionToBEN,
  vulToBEN,
  biddingToCTX,
  gameStateToPBNPlayed,
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

    const hand = handToPBN(gameState.hands[position]);
    const dummy = handToPBN(gameState.hands[gameState.dummy]);
    const seat = positionToBEN(position);
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
