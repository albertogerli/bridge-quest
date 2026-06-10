/**
 * AI Difficulty System for FIGB Bridge LAB
 * Provides three difficulty levels for AI opponents:
 * - Base: makes plausible beginner mistakes ~20% of the time
 * - Intermedio: standard heuristic AI (default)
 * - Esperto: BEN when available, otherwise DDS-perfect endgame play
 *   (falls back to the standard heuristic in large positions)
 */

import type { Card, Position, Rank, Suit, GameState, TrickPlay } from "./bridge-engine";
import { aiSelectCard, getValidCards, partnerOf, rankValue } from "./bridge-engine";
import { ddsSelectCard } from "./dds-select";

export type AILevel = "base" | "intermedio" | "esperto";

export const AI_LEVEL_LABELS: Record<AILevel, string> = {
  base: "Base",
  intermedio: "Intermedio",
  esperto: "Esperto",
};

export const AI_LEVEL_DESCRIPTIONS: Record<AILevel, string> = {
  base: "Avversari che commettono errori occasionali",
  intermedio: "Avversari con buona strategia di gioco",
  esperto: "AI neurale BEN (se disponibile) o gioco perfetto nei finali",
};

/** Read current AI level from localStorage */
export function getAILevel(): AILevel {
  if (typeof window === "undefined") return "intermedio";
  return (localStorage.getItem("bq_ai_level") as AILevel) || "intermedio";
}

/** Save AI level to localStorage */
export function setAILevel(level: AILevel): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("bq_ai_level", level);
}

// ──────────────────────────────────────────────────────────────
// Plausible beginner mistakes (level "base")
// ──────────────────────────────────────────────────────────────

const MISTAKE_PROBABILITY = 0.2;

const HONOR_RANKS: Rank[] = ["A", "K", "Q", "J"];

function isHonor(card: Card): boolean {
  return HONOR_RANKS.includes(card.rank);
}

/** The play currently winning an incomplete trick */
function currentWinningPlay(trick: TrickPlay[], trumpSuit: Suit | null): TrickPlay {
  const leadSuit = trick[0].card.suit;
  let winning = trick[0];
  for (let i = 1; i < trick.length; i++) {
    const play = trick[i];
    const winIsTrump = trumpSuit !== null && winning.card.suit === trumpSuit;
    const playIsTrump = trumpSuit !== null && play.card.suit === trumpSuit;
    if (playIsTrump && !winIsTrump) {
      winning = play;
    } else if (playIsTrump === winIsTrump && play.card.suit === winning.card.suit) {
      if (rankValue(play.card.rank) > rankValue(winning.card.rank)) winning = play;
    } else if (!winIsTrump && !playIsTrump && play.card.suit === leadSuit && winning.card.suit !== leadSuit) {
      winning = play;
    }
  }
  return winning;
}

/**
 * Pick a *plausible* beginner mistake for this situation, or null when no
 * credible error applies (in which case the AI just plays correctly).
 *
 * Guardrails: never throws an honor away at random — mistakes are the kind a
 * real beginner makes (forgets to ruff, overtakes partner, second hand high,
 * discards from the long suit).
 */
function plausibleMistake(
  state: GameState,
  position: Position,
  validCards: Card[]
): Card | null {
  const trick = state.currentTrick;
  const trumpSuit = state.trumpSuit;
  const partner = partnerOf(position);
  const sorted = [...validCards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  const lowest = sorted[sorted.length - 1];
  const highest = sorted[0];

  // LEADING: lead a low card from a random suit (no plan)
  if (trick.length === 0) {
    const suits = Array.from(new Set(validCards.map(c => c.suit)));
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const inSuit = validCards
      .filter(c => c.suit === suit)
      .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    return inSuit[0];
  }

  const leadSuit = trick[0].card.suit;
  const followingSuit = validCards[0].suit === leadSuit;
  const winning = currentWinningPlay(trick, trumpSuit);
  const partnerWinning = winning.position === partner;

  if (followingSuit) {
    // Overtake partner's winner ("takes partner's trick") — classic beginner move
    if (partnerWinning && rankValue(highest.rank) > rankValue(winning.card.rank) && highest !== lowest) {
      return highest;
    }
    // Second hand high: waste a high spot/honor in second seat
    if (trick.length === 1 && highest !== lowest) {
      // Plays high but not a top honor for nothing: prefer the highest non-A/K
      const candidate = sorted.find(c => c.rank !== "A" && c.rank !== "K") ?? highest;
      if (candidate !== lowest) return candidate;
    }
    return null;
  }

  // Can't follow suit
  const trumpCards = trumpSuit ? validCards.filter(c => c.suit === trumpSuit) : [];
  const nonTrump = validCards.filter(c => c.suit !== trumpSuit);

  // Forgets to ruff: discards instead of ruffing a losing trick
  if (trumpSuit && trumpCards.length > 0 && nonTrump.length > 0 && !partnerWinning) {
    const discards = nonTrump
      .filter(c => !isHonor(c))
      .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    if (discards.length > 0) return discards[0];
  }

  // Bad discard: throws the highest non-honor from the longest suit
  if (nonTrump.length > 0) {
    const counts = new Map<Suit, number>();
    for (const c of state.hands[position]) {
      if (c.suit !== trumpSuit) counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1);
    }
    const longSuit = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const fromLong = nonTrump
      .filter(c => c.suit === longSuit && !isHonor(c))
      .sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
    if (fromLong.length > 0) return fromLong[0];
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// Expert play: DDS-perfect endgames (BEN fallback)
// ──────────────────────────────────────────────────────────────

/** Max cards per hand for attempting an exact DDS search during play */
const EXPERT_DDS_THRESHOLD = 7;

/**
 * DD-optimal card for the expert AI when BEN is unavailable.
 * Returns null when the position is too large or the search times out —
 * callers should fall back to aiSelectWithDifficulty.
 */
export async function aiSelectExpertCard(
  state: GameState,
  position: Position
): Promise<Card | null> {
  const maxCards = Math.max(
    state.hands.north.length,
    state.hands.south.length,
    state.hands.east.length,
    state.hands.west.length
  );
  if (maxCards > EXPERT_DDS_THRESHOLD) return null;

  try {
    const result = await ddsSelectCard({
      hands: state.hands,
      contract: state.contract,
      position,
      currentTrick: state.currentTrick.map(tp => ({ position: tp.position, card: tp.card })),
      timeout: 1200,
      maxCardsForSearch: EXPERT_DDS_THRESHOLD,
    });
    return result.available ? result.card : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Main entry point (synchronous heuristic selection)
// ──────────────────────────────────────────────────────────────

/**
 * Select a card for the AI to play, taking difficulty into account.
 * - "base": ~20% chance of a plausible beginner mistake
 * - "intermedio": standard aiSelectCard heuristic
 * - "esperto": same heuristic (BEN and DDS endgame play are handled
 *   asynchronously in use-bridge-game via aiSelectExpertCard)
 */
export function aiSelectWithDifficulty(
  gameState: GameState,
  position: Position,
  level: AILevel
): Card {
  const hand = gameState.hands[position];
  const validCards = getValidCards(hand, gameState.currentTrick);

  // Only one valid card - no choice regardless of difficulty
  if (validCards.length <= 1) {
    return validCards.length === 1 ? validCards[0] : aiSelectCard(gameState, position);
  }

  if (level === "base" && Math.random() < MISTAKE_PROBABILITY) {
    const mistake = plausibleMistake(gameState, position, validCards);
    if (mistake) return mistake;
  }

  // For "intermedio" and "esperto" (when BEN/DDS unavailable): use existing heuristic
  return aiSelectCard(gameState, position);
}
