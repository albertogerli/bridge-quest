import { describe, expect, it } from "vitest";
import type { Card } from "@/lib/bridge-engine";
import { maniIniziali, normalizzaPrese, posizioneAl, puntiOnori, valutaGiocate } from "./giornale-mano";

const c = (s: string): Card => ({
  suit: ({ S: "spade", H: "heart", D: "diamond", C: "club" } as const)[s[0] as "S"],
  rank: s.slice(1) as Card["rank"],
});

const prese = normalizzaPrese([
  { cards: [{ player: "west", card: c("HQ") }, { player: "north", card: c("H4") }, { player: "east", card: c("H2") }, { player: "south", card: c("HK") }], winner: "south" },
  { cards: [{ player: "south", card: c("SJ") }, { player: "west", card: c("S3") }], winner: "" },
]);

describe("giornale della mano", () => {
  it("normalizza e non inventa vincitori", () => {
    expect(prese[0].vincitore).toBe("south");
    expect(prese[1].vincitore).toBeNull();
  });

  it("le mani iniziali rimettono insieme carte in mano e giocate, senza doppioni", () => {
    const iniziali = maniIniziali(
      { north: [c("SA")], east: [], south: [c("HK"), c("S2")], west: [] },
      prese,
    );
    expect(iniziali.south.map((x) => x.rank + x.suit).sort()).toEqual(["2spade", "Jspade", "Kheart"].sort());
    expect(iniziali.west).toHaveLength(2);
  });

  it("la posizione a metà della seconda presa", () => {
    const iniziali = maniIniziali({ north: [], east: [], south: [], west: [] }, prese);
    const p = posizioneAl(iniziali, prese, 5, "west");
    expect(p.completate).toBe(1);
    expect(p.preseNS).toBe(1);
    expect(p.leader).toBe("south");
    expect(p.presaCorrente.map((g) => g.seat)).toEqual(["south"]);
    expect(p.mani.south).toHaveLength(0);
  });

  it("a presa a metà il primo di mano è chi l'ha aperta, non chi apre la prossima", () => {
    const iniziali = maniIniziali({ north: [], east: [], south: [], west: [] }, prese);
    const p = posizioneAl(iniziali, prese, 1, "west");
    expect(p.leader).toBe("west");
    expect(p.presaCorrente.map((g) => g.seat)).toEqual(["west"]);
    expect(posizioneAl(iniziali, prese, 4, "west").leader).toBe("south");
  });

  it("i punti onori", () => {
    expect(puntiOnori([c("SA"), c("HK"), c("DQ"), c("CJ"), c("C2")])).toBe(10);
  });
});

describe("valutazione carta per carta", () => {
  it("segna il costo e le prese del dichiarante dal punto di vista giusto", async () => {
    const iniziali = maniIniziali({ north: [], east: [], south: [], west: [] }, prese);
    // Un valutatore finto: la carta «giusta» fa 9, le altre 8.
    const valutatore = async (mani: Record<string, Card[]>, _t: unknown, _l: unknown, presa: readonly Card[]) => {
      const tocca = presa.length === 0 ? null : null;
      void tocca;
      const tutte = Object.values(mani).flat();
      return tutte.map((card) => ({ card, tricks: card.rank === "Q" || card.rank === "K" || card.rank === "J" ? 9 : 8 }));
    };
    const v = await valutaGiocate(iniziali, prese, null, "south", valutatore);
    // Ovest (difesa) attacca di Q: la migliore, costo 0. Difesa fa 9 su 13 → dichiarante 4.
    expect(v[0]).toEqual({ preseDichiarante: 4, costo: 0 });
    // Nord (dichiarante) gioca il 4: 8 invece di 9 → costo 1, dichiarante 8.
    expect(v[1]).toEqual({ preseDichiarante: 8, costo: 1 });
    // Sud apre la seconda presa col J dopo averne vinta una: 1 + 9.
    expect(v[4]).toEqual({ preseDichiarante: 10, costo: 0 });
  });
});
