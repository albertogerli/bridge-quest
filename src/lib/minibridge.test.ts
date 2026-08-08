import { describe, it, expect } from "vitest";
import {
  countHcp,
  decisionTableTricks,
  analyzeDeal,
  suggestStrain,
  strainChoices,
  buildContract,
} from "./minibridge";
import type { Card, Position, Rank, Suit } from "@/lib/bridge-engine";

/** Build a 13-card hand from rank lists in the order spades/hearts/diamonds/clubs. */
function hand(spades: Rank[], hearts: Rank[], diamonds: Rank[], clubs: Rank[]): Card[] {
  const mk = (suit: Suit, ranks: Rank[]) => ranks.map((rank) => ({ suit, rank }));
  return [
    ...mk("spade", spades),
    ...mk("heart", hearts),
    ...mk("diamond", diamonds),
    ...mk("club", clubs),
  ];
}

// Deal costruito a mano: N/S 26 HCP con fit 8 carte a picche, E/W 14 HCP.
// N: 16 HCP, S: 10 HCP, E: 10 HCP, W: 4 HCP (totale 40).
const HANDS: Record<Position, Card[]> = {
  north: hand(["A", "K", "Q", "5", "4"], ["A", "3", "2"], ["K", "7", "6"], ["4", "3"]),
  east: hand(["10", "7", "6", "2"], ["Q", "J", "8"], ["A", "5", "4"], ["K", "8", "7"]),
  south: hand(["J", "9", "8"], ["K", "5", "4"], ["Q", "3", "2"], ["A", "6", "5", "2"]),
  west: hand(["3"], ["10", "9", "7", "6"], ["J", "10", "9", "8"], ["Q", "J", "10", "9"]),
};

describe("countHcp (Milton Work)", () => {
  it("A=4 K=3 Q=2 J=1, le altre carte 0", () => {
    expect(countHcp(HANDS.north)).toBe(16);
    expect(countHcp(HANDS.south)).toBe(10);
    expect(countHcp(HANDS.east)).toBe(10);
    expect(countHcp(HANDS.west)).toBe(4);
  });
});

describe("decisionTableTricks (Decision Table WBF)", () => {
  it("mappa gli HCP combinati alle prese attese", () => {
    expect(decisionTableTricks(20)).toBe(7);
    expect(decisionTableTricks(22)).toBe(7);
    expect(decisionTableTricks(23)).toBe(8);
    expect(decisionTableTricks(25)).toBe(9);
    expect(decisionTableTricks(26)).toBe(9);
    expect(decisionTableTricks(27)).toBe(10);
    expect(decisionTableTricks(30)).toBe(11);
    expect(decisionTableTricks(33)).toBe(12);
    expect(decisionTableTricks(37)).toBe(13);
    expect(decisionTableTricks(40)).toBe(13);
  });
});

describe("analyzeDeal", () => {
  const analysis = analyzeDeal(HANDS);

  it("dichiara il lato con piu punti, il giocatore piu forte e il dichiarante", () => {
    expect(analysis.partnershipHcp).toEqual({ ns: 26, ew: 14 });
    expect(analysis.declaringSide).toBe("ns");
    expect(analysis.defendingSide).toBe("ew");
    expect(analysis.declarer).toBe("north"); // 16 > 10
    expect(analysis.dummy).toBe("south");
  });

  it("26 HCP combinati -> 9 prese attese (Decision Table)", () => {
    expect(analysis.combinedHcp).toBe(26);
    expect(analysis.expectedTricks).toBe(9);
  });

  it("rileva il fit 8+ carte a picche", () => {
    expect(analysis.fits).toEqual([{ suit: "spade", count: 8 }]);
  });

  it("contratto atteso: 9 prese + fit a picche -> 3♠", () => {
    const strain = suggestStrain(analysis.fits);
    expect(strain).toBe("spade");
    expect(buildContract(analysis.expectedTricks, strain)).toBe("3♠");
  });
});

describe("suggestStrain / strainChoices / buildContract", () => {
  it("senza fit suggerisce Senza Atout", () => {
    expect(suggestStrain([])).toBe("nt");
    expect(buildContract(9, "nt")).toBe("3NT");
  });

  it("preferisce il fit nobile a parita di lunghezza", () => {
    expect(
      suggestStrain([
        { suit: "club", count: 9 },
        { suit: "heart", count: 8 },
      ])
    ).toBe("heart");
  });

  it("strainChoices = NT + tutti i fit", () => {
    expect(strainChoices([{ suit: "spade", count: 8 }])).toEqual(["nt", "spade"]);
  });

  it("buildContract limita il livello tra 1 e 7", () => {
    expect(buildContract(13, "spade")).toBe("7♠");
    expect(buildContract(7, "nt")).toBe("1NT");
    expect(buildContract(6, "nt")).toBe("1NT"); // mai sotto livello 1
  });
});
