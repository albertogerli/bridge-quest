import type { Card, Position } from "@/lib/bridge-engine";

const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });

/**
 * Pre-designed easy hand for the onboarding tutorial.
 * Contract: 4 Spades by South — needs 10 tricks.
 *
 * South has AKQJ2 of spades + aces everywhere.
 * Combined with North's supporting cards, 11-13 tricks are almost guaranteed.
 * Even with mistakes, minimum 10 tricks.
 *
 * Card distribution (13 per hand, 13 per suit):
 * South: S-AKQJ2(5) H-A53(3) D-KQ(2) C-A83(3) = 13
 * North: S-1098(3) H-KQ4(3) D-AJ6(3) C-KQ62(4) = 13
 * East:  S-76(2) H-J109(3) D-1098(3) C-J10954(5) = 13
 * West:  S-543(3) H-8762(4) D-75432(5) C-7(1) = 13
 */
export const ONBOARDING_HAND = {
  hands: {
    south: [
      c("spade", "A"), c("spade", "K"), c("spade", "Q"), c("spade", "J"), c("spade", "2"),
      c("heart", "A"), c("heart", "5"), c("heart", "3"),
      c("diamond", "K"), c("diamond", "Q"),
      c("club", "A"), c("club", "8"), c("club", "3"),
    ],
    north: [
      c("spade", "10"), c("spade", "9"), c("spade", "8"),
      c("heart", "K"), c("heart", "Q"), c("heart", "4"),
      c("diamond", "A"), c("diamond", "J"), c("diamond", "6"),
      c("club", "K"), c("club", "Q"), c("club", "6"), c("club", "2"),
    ],
    east: [
      c("spade", "7"), c("spade", "6"),
      c("heart", "J"), c("heart", "10"), c("heart", "9"),
      c("diamond", "10"), c("diamond", "9"), c("diamond", "8"),
      c("club", "J"), c("club", "10"), c("club", "9"), c("club", "5"), c("club", "4"),
    ],
    west: [
      c("spade", "5"), c("spade", "4"), c("spade", "3"),
      c("heart", "8"), c("heart", "7"), c("heart", "6"), c("heart", "2"),
      c("diamond", "7"), c("diamond", "5"), c("diamond", "4"), c("diamond", "3"), c("diamond", "2"),
      c("club", "7"),
    ],
  } as Record<Position, Card[]>,
  contract: "4S",
  declarer: "south" as Position,
  openingLead: c("heart", "8"),
};
