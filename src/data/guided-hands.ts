import type { Card, Position } from "@/lib/bridge-engine";

const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });

export interface GuidedHandHint {
  /** Trick number (1-based) when this hint should appear */
  trick: number;
  /** Hint text shown to the player */
  text: string;
}

export interface GuidedHand {
  id: number;
  name: string;
  description: string;
  difficulty: "facile" | "medio";
  hands: Record<Position, Card[]>;
  contract: string;
  declarer: Position;
  openingLead: Card;
  hints: GuidedHandHint[];
  /** Tricks needed to make the contract */
  tricksNeeded: number;
}

/**
 * Guided Hand 2: "Il tuo primo Senza Atout"
 * Contract: 3NT by South — needs 9 tricks
 *
 * South has strong NT hand with long clubs.
 * Strategy: take sure tricks and develop clubs.
 * Easy — combined 28 HCP, many top cards.
 *
 * South: ♠KQ4 ♥AK5 ♦A63 ♣KQ84       (13 cards, 20 HCP)
 * North: ♠A63 ♥Q72 ♦KQ5 ♣A653        (13 cards, 14 HCP) — dummy
 * East:  ♠J1087 ♥J96 ♦J97 ♣J72       (13 cards, 3 HCP)
 * West:  ♠952 ♥10843 ♦10842 ♣109      (13 cards, 0 HCP)
 *
 * Spades: KQ4 + A63 + J1087 + 952 = 13 ✓
 * Hearts: AK5 + Q72 + J96 + 10843 = 13 ✓
 * Diamonds: A63 + KQ5 + J97 + 10842 = 13 ✓
 * Clubs: KQ84 + A653 + J72 + 109 = 13 ✓
 *
 * Opening lead: ♠9 from West (safe lead)
 * Sure tricks: 3 spades + 3 hearts + 3 diamonds + 4 clubs = 13 tricks easy
 */
const GUIDED_HAND_2: GuidedHand = {
  id: 2,
  name: "Il tuo primo Senza Atout",
  description: "Conta le prese sicure e incassa i vincenti!",
  difficulty: "facile",
  hands: {
    south: [
      c("spade", "K"), c("spade", "Q"), c("spade", "4"),
      c("heart", "A"), c("heart", "K"), c("heart", "5"),
      c("diamond", "A"), c("diamond", "6"), c("diamond", "3"),
      c("club", "K"), c("club", "Q"), c("club", "8"), c("club", "4"),
    ],
    north: [
      c("spade", "A"), c("spade", "6"), c("spade", "3"),
      c("heart", "Q"), c("heart", "7"), c("heart", "2"),
      c("diamond", "K"), c("diamond", "Q"), c("diamond", "5"),
      c("club", "A"), c("club", "6"), c("club", "5"), c("club", "3"),
    ],
    east: [
      c("spade", "J"), c("spade", "10"), c("spade", "8"), c("spade", "7"),
      c("heart", "J"), c("heart", "9"), c("heart", "6"),
      c("diamond", "J"), c("diamond", "9"), c("diamond", "7"),
      c("club", "J"), c("club", "7"), c("club", "2"),
    ],
    west: [
      c("spade", "9"), c("spade", "5"), c("spade", "2"),
      c("heart", "10"), c("heart", "8"), c("heart", "4"), c("heart", "3"),
      c("diamond", "10"), c("diamond", "8"), c("diamond", "4"), c("diamond", "2"),
      c("club", "10"), c("club", "9"),
    ],
  },
  contract: "3N",
  declarer: "south",
  openingLead: c("spade", "9"),
  tricksNeeded: 9,
  hints: [
    { trick: 1, text: "A Senza Atout non c'è briscola. Vince sempre la carta più alta del seme giocato." },
    { trick: 2, text: "Conta le tue prese sicure: Assi, Re, Donne in cima ai semi. Ne vedi tante!" },
    { trick: 4, text: "Incassa le fiori dall'alto: A, K, Q... e poi le piccole diventano vincenti!" },
  ],
};

/**
 * Guided Hand 3: "Gestire gli Atout"
 * Contract: 4H by South — needs 10 tricks
 *
 * South has 6 hearts + good side cards.
 * Strategy: draw trumps first, then cash winners.
 * Medium — requires drawing trumps before cashing side suits.
 *
 * South: ♠A5 ♥AKQ1063 ♦K4 ♣Q62     (13 cards, 17 HCP)
 * North: ♠KQ3 ♥J74 ♦AQ5 ♣A753      (13 cards, 15 HCP) — dummy
 * East:  ♠10876 ♥95 ♦J1098 ♣J108    (13 cards, 3 HCP)
 * West:  ♠J942 ♥82 ♦7632 ♣K94       (13 cards, 4 HCP)
 *
 * Spades: A5 + KQ3 + 10876 + J942 = 13 ✓
 * Hearts: AKQ1063 + J74 + 95 + 82 = 13 ✓
 * Diamonds: K4 + AQ5 + J1098 + 7632 = 13 ✓
 * Clubs: Q62 + A753 + J108 + K94 = 13 ✓
 *
 * Opening lead: ♠J from West (top of sequence)
 * Plan: Win ♠A, draw trumps (A, K, Q — pulls all enemy hearts),
 *       then cash ♠KQ, ♦AKQ, ♣A = 13 tricks easy with good play.
 */
const GUIDED_HAND_3: GuidedHand = {
  id: 3,
  name: "Gestire gli Atout",
  description: "Battezza le cuori e poi incassa i vincenti laterali.",
  difficulty: "medio",
  hands: {
    south: [
      c("spade", "A"), c("spade", "5"),
      c("heart", "A"), c("heart", "K"), c("heart", "Q"), c("heart", "10"), c("heart", "6"), c("heart", "3"),
      c("diamond", "K"), c("diamond", "4"),
      c("club", "Q"), c("club", "6"), c("club", "2"),
    ],
    north: [
      c("spade", "K"), c("spade", "Q"), c("spade", "3"),
      c("heart", "J"), c("heart", "7"), c("heart", "4"),
      c("diamond", "A"), c("diamond", "Q"), c("diamond", "5"),
      c("club", "A"), c("club", "7"), c("club", "5"), c("club", "3"),
    ],
    east: [
      c("spade", "10"), c("spade", "8"), c("spade", "7"), c("spade", "6"),
      c("heart", "9"), c("heart", "5"),
      c("diamond", "J"), c("diamond", "10"), c("diamond", "9"), c("diamond", "8"),
      c("club", "J"), c("club", "10"), c("club", "8"),
    ],
    west: [
      c("spade", "J"), c("spade", "9"), c("spade", "4"), c("spade", "2"),
      c("heart", "8"), c("heart", "2"),
      c("diamond", "7"), c("diamond", "6"), c("diamond", "3"), c("diamond", "2"),
      c("club", "K"), c("club", "9"), c("club", "4"),
    ],
  },
  contract: "4H",
  declarer: "south",
  openingLead: c("spade", "J"),
  tricksNeeded: 10,
  hints: [],
};

export const GUIDED_HANDS: GuidedHand[] = [GUIDED_HAND_2, GUIDED_HAND_3];

/** Get a guided hand by ID */
export function getGuidedHand(id: number): GuidedHand | undefined {
  return GUIDED_HANDS.find((h) => h.id === id);
}
