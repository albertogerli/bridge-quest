import { describe, it, expect } from "vitest";
import { generateDeals } from "./deal-generator";
import { dealsToSmazzate } from "./deals-to-smazzate";

const { deals } = generateDeals({}, { count: 4, seed: 2026 });
const base = { idPrefix: "gen-1", contract: "3NT", declarer: "south" as const, title: "Apertura di 1NT" };

describe("dealsToSmazzate", () => {
  const smazzate = dealsToSmazzate(deals, base);

  it("produce una smazzata per mano, con id unici", () => {
    expect(smazzate).toHaveLength(4);
    expect(new Set(smazzate.map((s) => s.id)).size).toBe(4);
  });

  it("numera i board da 1 e li rispecchia nel titolo", () => {
    expect(smazzate.map((s) => s.board)).toEqual([1, 2, 3, 4]);
    expect(smazzate[2].title).toBe("Apertura di 1NT — mano 3");
  });

  it("conserva le carte senza toccarle", () => {
    for (let i = 0; i < deals.length; i++) {
      expect(smazzate[i].hands.north).toEqual(deals[i].north);
      expect(smazzate[i].hands.south).toEqual(deals[i].south);
    }
  });

  it("ruota la vulnerabilità invece di lasciarla sempre uguale", () => {
    expect(smazzate.map((s) => s.vulnerability)).toEqual(["none", "ns", "ew", "both"]);
  });
});

describe("dealsToSmazzate — attacco", () => {
  it("attacca il giocatore alla sinistra del dichiarante", () => {
    // Dichiarante Sud => attacca Ovest. La carta deve appartenergli davvero.
    const s = dealsToSmazzate(deals, base)[0];
    const ovest = s.hands.west;
    expect(
      ovest.some((c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank)
    ).toBe(true);
  });

  it("con dichiarante Nord attacca Est", () => {
    const s = dealsToSmazzate(deals, { ...base, declarer: "north" })[0];
    expect(
      s.hands.east.some((c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank)
    ).toBe(true);
  });

  it("a colore non attacca nell'atout se ha alternative", () => {
    // Regola dell'attacco naturale: si esce nel colore lungo NON di atout.
    for (const s of dealsToSmazzate(deals, { ...base, contract: "4♠" })) {
      const haAltro = s.hands.west.some((c) => c.suit !== "spade");
      if (haAltro) expect(s.openingLead.suit).not.toBe("spade");
    }
  });

  it("accetta il contratto sia in simboli sia in lettere", () => {
    const conSimbolo = dealsToSmazzate(deals, { ...base, contract: "4♥" })[0];
    const conLettera = dealsToSmazzate(deals, { ...base, contract: "4H" })[0];
    expect(conSimbolo.openingLead).toEqual(conLettera.openingLead);
  });

  it("un contratto malformato non fa esplodere nulla", () => {
    const s = dealsToSmazzate(deals, { ...base, contract: "boh" })[0];
    expect(s.openingLead).toBeDefined();
    expect(s.hands.west).toHaveLength(13);
  });
});
