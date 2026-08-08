import { describe, it, expect } from "vitest";
import { parsePbn } from "./pbn";
import type { Card } from "./bridge-engine";

const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

const MINIMAL_PBN = `
[Board "1"]
[Dealer "N"]
[Vulnerable "NS"]
[Deal "N:AKQ54.A32.K76.43 T762.QJ8.A54.K87 J98.K54.Q32.A652 3.T976.JT98.QJT9"]
[Declarer "N"]
[Contract "4S"]
`;

describe("parsePbn — PBN minimo valido", () => {
  const result = parsePbn(MINIMAL_PBN, "test");

  it("produce una smazzata senza errori", () => {
    expect(result.errors).toEqual([]);
    expect(result.deals).toHaveLength(1);
  });

  it("ogni mano ha 13 carte e le 52 carte sono uniche", () => {
    const { hands } = result.deals[0];
    for (const pos of ["north", "east", "south", "west"] as const) {
      expect(hands[pos]).toHaveLength(13);
    }
    const all = [...hands.north, ...hands.east, ...hands.south, ...hands.west];
    expect(new Set(all.map(cardKey)).size).toBe(52);
  });

  it("assegna le carte al posto giusto (Deal in senso orario da N)", () => {
    const { hands } = result.deals[0];
    // Nord: AKQ54 di picche, T del Deal = 10
    expect(hands.north.filter((c) => c.suit === "spade").map((c) => c.rank)).toEqual([
      "A", "K", "Q", "5", "4",
    ]);
    expect(hands.east.some((c) => c.suit === "spade" && c.rank === "10")).toBe(true);
    expect(hands.west.filter((c) => c.suit === "spade")).toEqual([
      { suit: "spade", rank: "3" },
    ]);
  });

  it("contratto, dichiarante e vulnerabilita corretti", () => {
    const deal = result.deals[0];
    expect(deal.contract).toBe("4♠");
    expect(deal.declarer).toBe("north");
    expect(deal.vulnerability).toBe("ns");
    expect(deal.board).toBe(1);
  });

  it("l'attacco di default proviene dalla mano alla sinistra del dichiarante", () => {
    const deal = result.deals[0];
    const leaderHand = deal.hands.east; // a sinistra di Nord
    expect(
      leaderHand.some(
        (c) => c.suit === deal.openingLead.suit && c.rank === deal.openingLead.rank
      )
    ).toBe(true);
  });
});

describe("parsePbn — casi limite", () => {
  it("contratto Pass -> mano saltata con errore", () => {
    const text = `
[Deal "N:AKQ54.A32.K76.43 T762.QJ8.A54.K87 J98.K54.Q32.A652 3.T976.JT98.QJT9"]
[Declarer "N"]
[Contract "Pass"]
`;
    const result = parsePbn(text);
    expect(result.deals).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("passata");
  });

  it("carta duplicata nel Deal -> errore", () => {
    const text = `
[Deal "N:AAQ54.A32.K76.43 T762.QJ8.A54.K87 J98.K54.Q32.A652 3.T976.JT98.QJT9"]
[Declarer "N"]
[Contract "4S"]
`;
    const result = parsePbn(text);
    expect(result.deals).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("testo senza tag Deal -> messaggio dedicato", () => {
    const result = parsePbn(`[Event "Torneo"]`);
    expect(result.deals).toHaveLength(0);
    expect(result.errors[0]).toContain("[Deal]");
  });

  it("il contratto NT e i contri sono normalizzati", () => {
    const text = `
[Deal "N:AKQ54.A32.K76.43 T762.QJ8.A54.K87 J98.K54.Q32.A652 3.T976.JT98.QJT9"]
[Declarer "S"]
[Contract "3NTX"]
`;
    const result = parsePbn(text);
    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].contract).toBe("3NTX");
    expect(result.deals[0].declarer).toBe("south");
    expect(result.deals[0].vulnerability).toBe("none"); // Vulnerable mancante
  });
});
