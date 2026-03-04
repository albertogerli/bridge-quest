/**
 * FIGB Bridge LAB - Hand Encoder
 *
 * Encode/decode bridge deals using a deterministic seed-based system.
 * Same seed always generates the same deal, enabling "Sfida via Link" challenges.
 */

import type { Card, Suit, Rank } from "./bridge-engine";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANKS: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

// All 52 cards in the deck
const FULL_DECK: Card[] = SUITS.flatMap(suit =>
  RANKS.map(rank => ({ suit, rank }))
);

const DEALER_MAP: string[] = ["north", "east", "south", "west"];
const VULN_MAP: string[] = ["none", "ns", "ew", "both"];

/**
 * Mulberry32 PRNG - fast, simple, deterministic
 * Returns a random number generator function seeded with the given value.
 */
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Convert a seed string to a numeric seed value for the PRNG
 */
function seedToNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle using a seeded PRNG
 */
function shuffleWithSeed<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a random 8-character alphanumeric seed
 */
export function generateSeed(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar chars (0,O,1,I)
  let seed = "";
  for (let i = 0; i < 8; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)];
  }
  return seed;
}

/**
 * Generate a deterministic bridge deal from a seed
 * Same seed always produces the same deal.
 */
export function dealFromSeed(seed: string): {
  north: Card[];
  east: Card[];
  south: Card[];
  west: Card[];
  dealer: string;
  vulnerability: string;
} {
  const numericSeed = seedToNumber(seed);
  const rng = mulberry32(numericSeed);

  // Shuffle deck deterministically
  const shuffled = shuffleWithSeed(FULL_DECK, rng);

  // Deal 13 cards to each position
  const north = shuffled.slice(0, 13);
  const east = shuffled.slice(13, 26);
  const south = shuffled.slice(26, 39);
  const west = shuffled.slice(39, 52);

  // Determine dealer and vulnerability from seed
  const dealerIndex = Math.floor(rng() * 4);
  const vulnIndex = Math.floor(rng() * 4);

  return {
    north,
    east,
    south,
    west,
    dealer: DEALER_MAP[dealerIndex],
    vulnerability: VULN_MAP[vulnIndex],
  };
}

/**
 * Encode a challenge URL with the seed
 */
export function encodeChallengeUrl(seed: string): string {
  return `https://bridgelab.it/gioca/sfida-link?s=${seed}`;
}

/**
 * Decode seed from a challenge URL
 * Returns null if URL is invalid or seed is missing
 */
export function decodeSeedFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const seed = urlObj.searchParams.get("s");
    return seed && seed.length >= 4 ? seed : null;
  } catch {
    return null;
  }
}
