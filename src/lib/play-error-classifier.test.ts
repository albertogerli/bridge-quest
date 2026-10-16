import { describe, it, expect } from "vitest";
import type { Card, Position, Trick } from "./bridge-engine";
import { classifyPlayErrors } from "./play-error-classifier";

const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });
const p = (position: Position, card: Card) => ({ position, card });

/** 4♥ di Sud; l'allievo gioca Nord-Sud. Le mani contengono solo le carte che servono. */
function classifica(trick: Trick, hands: Record<Position, Card[]>, extra: { ddTricks?: number; tricksMade?: number } = {}) {
  return classifyPlayErrors({
    tricks: [trick],
    originalHands: hands,
    trumpSuit: "heart",
    playerPositions: ["north", "south"],
    declarer: "south",
    ...extra,
  });
}

describe("classifyPlayErrors", () => {
  // Ovest attacca ♠K, il morto non ha picche e scarta invece di tagliare.
  const tagliMancato: Trick = {
    leader: "west",
    winner: "west",
    plays: [p("west", c("spade", "K")), p("north", c("club", "2")), p("east", c("spade", "3")), p("south", c("spade", "4"))],
  };
  const maniTaglio: Record<Position, Card[]> = {
    west: [c("spade", "K")],
    north: [c("club", "2"), c("heart", "3")],
    east: [c("spade", "3")],
    south: [c("spade", "4")],
  };

  it("segnala il taglio mancato quando l'atout avrebbe vinto la presa", () => {
    const errori = classifica(tagliMancato, maniTaglio);
    expect(errori.map((e) => e.category)).toEqual(["missed-ruff"]);
  });

  it("non segnala niente se l'avversario aveva già tagliato più alto", () => {
    const trick: Trick = {
      leader: "west",
      winner: "east",
      plays: [p("west", c("spade", "2")), p("north", c("spade", "5")), p("east", c("heart", "Q")), p("south", c("diamond", "2"))],
    };
    const errori = classifica(trick, {
      west: [c("spade", "2")],
      north: [c("spade", "5")],
      east: [c("heart", "Q")],
      south: [c("diamond", "2"), c("heart", "3")],
    });
    expect(errori).toEqual([]);
  });

  it("nessun errore per presa quando la mano raggiunge l'ottimo a carte scoperte", () => {
    expect(classifica(tagliMancato, maniTaglio, { ddTricks: 10, tricksMade: 10 })).toEqual([]);
  });

  it("sotto l'ottimo restano sia gli errori per presa sia il piano di gioco", () => {
    const errori = classifica(tagliMancato, maniTaglio, { ddTricks: 10, tricksMade: 9 });
    expect(errori.map((e) => e.category)).toEqual(["missed-ruff", "below-optimal"]);
  });
});
