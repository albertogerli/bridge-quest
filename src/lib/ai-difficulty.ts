/**
 * AI Difficulty System for FIGB Bridge LAB
 * Provides three difficulty levels for AI opponents:
 * - Base: makes random mistakes 20% of the time
 * - Intermedio: standard heuristic AI (default)
 * - Esperto: BEN when available, otherwise standard heuristic
 */

import type { Card, Position, GameState } from "./bridge-engine";
import { aiSelectCard, getValidCards } from "./bridge-engine";

export type AILevel = "base" | "intermedio" | "esperto";

export const AI_LEVEL_LABELS: Record<AILevel, string> = {
  base: "Base",
  intermedio: "Intermedio",
  esperto: "Esperto",
};

export const AI_LEVEL_DESCRIPTIONS: Record<AILevel, string> = {
  base: "Avversari che commettono errori occasionali",
  intermedio: "Avversari con buona strategia di gioco",
  esperto: "AI neurale BEN (se disponibile) o euristica avanzata",
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

/**
 * Select a card for the AI to play, taking difficulty into account.
 * - "base": 20% chance of a random valid card (simulating mistakes)
 * - "intermedio": standard aiSelectCard heuristic
 * - "esperto": same as intermedio (BEN handled separately in use-bridge-game)
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

  if (level === "base") {
    // 20% chance of playing a random valid card (simulating mistakes)
    if (Math.random() < 0.2) {
      return validCards[Math.floor(Math.random() * validCards.length)];
    }
  }

  // For "intermedio" and "esperto" (when BEN unavailable): use existing heuristic
  return aiSelectCard(gameState, position);
}
