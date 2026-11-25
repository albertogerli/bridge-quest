import { describe, expect, it } from "vitest";
import type { DdsTable } from "./dds-table";
import { punteggio, valutaScelte } from "./quale-contratto";

/** Tabella in cui Nord e Sud fanno le stesse prese ed Est-Ovest il resto. */
function tabella(p: { s: number; h: number; d: number; c: number; n: number }): DdsTable {
  const riga = (ns: number) => ({ north: ns, south: ns, east: 13 - ns, west: 13 - ns });
  return {
    tricks: {
      spade: riga(p.s),
      heart: riga(p.h),
      diamond: riga(p.d),
      club: riga(p.c),
      notrump: riga(p.n),
    },
  };
}

describe("punteggio", () => {
  it("segue la tabella in prima", () => {
    expect(punteggio("heart", 4, 10)).toBe(420);
    expect(punteggio("notrump", 3, 9)).toBe(400);
    expect(punteggio("notrump", 3, 10)).toBe(430);
    expect(punteggio("diamond", 5, 11)).toBe(400);
    expect(punteggio("spade", 2, 9)).toBe(140);
    expect(punteggio("heart", 6, 12)).toBe(980);
    expect(punteggio("heart", 4, 9)).toBe(-50);
  });
});

describe("valutaScelte", () => {
  it("manche nobile con una presa in meno batte la manche minore", () => {
    // Il caso segnalato: 10 prese a cuori, 11 a quadri.
    const v = valutaScelte(tabella({ s: 7, h: 10, d: 11, c: 8, n: 8 }));
    expect(v.giuste).toEqual(["nobile"]);
    expect(v.migliore).toBe("4H");
  });

  it("10 prese a senza senza fit nobile: 3SA, non 4♥/4♠", () => {
    const v = valutaScelte(tabella({ s: 7, h: 7, d: 9, c: 8, n: 10 }));
    expect(v.giuste).toEqual(["3sa"]);
    expect(v.migliore).toBe("3N");
  });

  it("3SA+1 e 4♥ fatto sono equivalenti", () => {
    const v = valutaScelte(tabella({ s: 7, h: 10, d: 8, c: 8, n: 10 }));
    expect(v.giuste.sort()).toEqual(["3sa", "nobile"]);
  });

  it("3SA fatto e 5♦ fatto valgono uguale: giuste tutte e due", () => {
    const v = valutaScelte(tabella({ s: 6, h: 6, d: 11, c: 7, n: 9 }));
    expect(v.giuste.sort()).toEqual(["3sa", "minore"]);
  });

  it("solo la manche minore", () => {
    const v = valutaScelte(tabella({ s: 6, h: 6, d: 11, c: 7, n: 8 }));
    expect(v.giuste).toEqual(["minore"]);
  });

  it("9 prese a quadri: parziale, non 3SA", () => {
    const v = valutaScelte(tabella({ s: 6, h: 6, d: 9, c: 7, n: 8 }));
    expect(v.giuste).toEqual(["parziale"]);
  });

  it("12 prese: slam", () => {
    const v = valutaScelte(tabella({ s: 12, h: 8, d: 8, c: 7, n: 11 }));
    expect(v.giuste).toEqual(["slam"]);
    expect(v.migliore).toBe("6S");
  });
});
