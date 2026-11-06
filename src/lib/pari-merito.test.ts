import { describe, expect, it } from "vitest";
import { eParimerito, posizioniConPariMerito } from "./pari-merito";

describe("posizioniConPariMerito", () => {
  const uguali = (a: number, b: number) => a === b;
  it("chi è appaiato ha la stessa posizione e il successivo salta", () => {
    expect(posizioniConPariMerito([10, 10, 8, 7, 7, 7, 2], uguali)).toEqual([1, 1, 3, 4, 4, 4, 7]);
  });
  it("senza pari merito è l'ordine delle righe", () => {
    expect(posizioniConPariMerito([5, 4, 3], uguali)).toEqual([1, 2, 3]);
    expect(posizioniConPariMerito([], uguali)).toEqual([]);
  });
  it("sa dire chi è a pari merito", () => {
    const p = posizioniConPariMerito([10, 10, 8], uguali);
    expect([0, 1, 2].map((i) => eParimerito(p, i))).toEqual([true, true, false]);
  });
});
