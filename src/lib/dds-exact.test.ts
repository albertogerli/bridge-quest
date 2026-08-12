import { describe, it, expect } from "vitest";
import { solveExact } from "./dds-exact";
import { solveDDS } from "./dds-solver";
import { generateDeals } from "./deal-generator";
import type { Card, Position, Rank, Suit } from "./bridge-engine";

const RANKS: Rank[] = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];

/** Riduce una smazzata alle prime N carte per mano: un finale a N prese. */
function ending(deal: Record<Position, Card[]>, n: number): Record<Position, Card[]> {
  return {
    north: deal.north.slice(0, n),
    east: deal.east.slice(0, n),
    south: deal.south.slice(0, n),
    west: deal.west.slice(0, n),
  };
}

describe("solveExact — casi con risposta nota", () => {
  it("chi ha tutte e 13 le carte di un seme le vince tutte", () => {
    // Nord ha tutte le picche: nessuno può rispondere, nessuno ha atout.
    const north: Card[] = RANKS.map((rank) => ({ suit: "spade" as Suit, rank }));
    const altri: Card[] = [];
    for (const suit of ["heart", "diamond", "club"] as Suit[]) {
      for (const rank of RANKS) altri.push({ suit, rank });
    }
    const deal = {
      north,
      east: altri.slice(0, 13),
      south: altri.slice(13, 26),
      west: altri.slice(26, 39),
    };
    // Nord di mano, a senza atout: incassa tutto.
    expect(solveExact(deal, null, "north", 20000).nsTricks).toBe(13);
  });

  it("un finale vuoto vale zero prese", () => {
    const vuoto = { north: [], east: [], south: [], west: [] };
    expect(solveExact(vuoto, null, "west", 5000).nsTricks).toBe(0);
  });
});

describe("solveExact — concorda con il solver esistente sui finali brevi", () => {
  // Il vecchio solver è esatto fino a 6 carte per mano: è l'unico riscontro
  // indipendente disponibile in casa. Se i due divergono, uno dei due sbaglia.
  const { deals } = generateDeals({}, { count: 4, seed: 4242 });

  it.each([3, 4, 5])("finale a %i carte, senza atout", (n) => {
    for (const deal of deals) {
      const fin = ending(deal, n);
      const mio = solveExact(fin, null, "west", 15000);
      const vecchio = solveDDS({
        hands: fin,
        contract: "3NT",
        declarer: "south",
        leader: "west",
        timeout: 15000,
      });
      expect(mio.exact, "il nuovo solver deve concludere").toBe(true);
      expect(vecchio.available, "il vecchio deve essere in modalità esatta").toBe(true);
      // Il vecchio conta le prese del DICHIARANTE (Sud = N-S).
      expect(mio.nsTricks).toBe(vecchio.tricks);
    }
  });

  it("concorda anche a colore", () => {
    for (const deal of deals) {
      const fin = ending(deal, 4);
      const mio = solveExact(fin, "spade", "west", 15000);
      const vecchio = solveDDS({
        hands: fin,
        contract: "4♠",
        declarer: "south",
        leader: "west",
        timeout: 15000,
      });
      expect(mio.exact).toBe(true);
      expect(vecchio.available).toBe(true);
      expect(mio.nsTricks).toBe(vecchio.tricks);
    }
  });
});
