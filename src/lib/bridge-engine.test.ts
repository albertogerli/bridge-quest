import { describe, it, expect } from "vitest";
import {
  determineTrickWinner,
  getValidCards,
  type Card,
  type TrickPlay,
  type Position,
} from "./bridge-engine";

function play(position: Position, suit: Card["suit"], rank: Card["rank"]): TrickPlay {
  return { position, card: { suit, rank } };
}

describe("determineTrickWinner", () => {
  it("senza atout: vince la carta piu alta del seme di attacco", () => {
    const trick: TrickPlay[] = [
      play("north", "spade", "7"),
      play("east", "spade", "K"),
      play("south", "spade", "A"),
      play("west", "spade", "2"),
    ];
    expect(determineTrickWinner(trick, null)).toBe("south");
  });

  it("senza atout: le carte di altro seme non vincono (scarto)", () => {
    const trick: TrickPlay[] = [
      play("west", "diamond", "5"),
      play("north", "diamond", "J"),
      play("east", "heart", "A"), // scarto: non vince
      play("south", "diamond", "3"),
    ];
    expect(determineTrickWinner(trick, null)).toBe("north");
  });

  it("con atout: il taglio batte la carta alta del seme di attacco", () => {
    const trick: TrickPlay[] = [
      play("north", "spade", "A"),
      play("east", "heart", "2"), // taglia
      play("south", "spade", "K"),
      play("west", "spade", "3"),
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("east");
  });

  it("con atout: il sopratraglio vince sul taglio", () => {
    const trick: TrickPlay[] = [
      play("north", "spade", "A"),
      play("east", "heart", "2"), // taglio
      play("south", "heart", "5"), // sopratraglio
      play("west", "spade", "3"),
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("south");
  });

  it("con atout ma nessun taglio: vince il seme di attacco", () => {
    const trick: TrickPlay[] = [
      play("south", "club", "Q"),
      play("west", "club", "K"),
      play("north", "club", "4"),
      play("east", "diamond", "A"), // scarto, non atout
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("west");
  });

  it("attacco in atout: vince l'atout piu alto", () => {
    const trick: TrickPlay[] = [
      play("north", "heart", "10"),
      play("east", "heart", "J"),
      play("south", "heart", "A"),
      play("west", "heart", "Q"),
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("south");
  });

  it("lancia se la presa non ha 4 carte", () => {
    expect(() =>
      determineTrickWinner([play("north", "spade", "A")], null)
    ).toThrow();
  });
});

describe("getValidCards", () => {
  const hand: Card[] = [
    { suit: "spade", rank: "A" },
    { suit: "spade", rank: "4" },
    { suit: "heart", rank: "K" },
    { suit: "club", rank: "2" },
  ];

  it("chi attacca puo giocare qualsiasi carta", () => {
    expect(getValidCards(hand, [])).toEqual(hand);
  });

  it("obbligo di risposta al seme: solo le carte del seme di attacco", () => {
    const trick = [play("west", "spade", "9")];
    expect(getValidCards(hand, trick)).toEqual([
      { suit: "spade", rank: "A" },
      { suit: "spade", rank: "4" },
    ]);
  });

  it("senza carte del seme di attacco: tutta la mano e valida", () => {
    const trick = [play("west", "diamond", "9")];
    expect(getValidCards(hand, trick)).toEqual(hand);
  });
});
