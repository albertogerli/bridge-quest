import { describe, expect, it } from "vitest";
import { avversari, raggruppa, ripartizioni, vuotiMostrati } from "./ripartizioni";
import type { Card } from "@/lib/bridge-engine";

const perEtichetta = (n: number, a = 13, b = 13) =>
  Object.fromEntries(raggruppa(ripartizioni(n, a, b)).map((r) => [r.etichetta, +(r.probabilita * 100).toFixed(2)]));

describe("ripartizioni a inizio mano: le tabelle dei libri", () => {
  it("quattro carte mancanti", () => {
    expect(perEtichetta(4)).toEqual({ "2-2": 40.7, "3-1": 49.74, "4-0": 9.57 });
  });
  it("cinque carte mancanti", () => {
    expect(perEtichetta(5)).toEqual({ "3-2": 67.83, "4-1": 28.26, "5-0": 3.91 });
  });
  it("due carte mancanti", () => {
    expect(perEtichetta(2)).toEqual({ "1-1": 52, "2-0": 48 });
  });
  it("sei carte mancanti", () => {
    expect(perEtichetta(6)).toEqual({ "4-2": 48.45, "3-3": 35.53, "5-1": 14.53, "6-0": 1.49 });
  });
  it("le probabilità sommano a uno", () => {
    for (let n = 1; n <= 13; n++) {
      const tot = ripartizioni(n, 13, 13).reduce((s, r) => s + r.probabilita, 0);
      expect(tot).toBeCloseTo(1, 10);
    }
  });
});

describe("posti vacanti a metà mano", () => {
  it("con meno posti a sinistra il lungo va più spesso a destra", () => {
    const [riga] = raggruppa(ripartizioni(3, 5, 9)).filter((r) => r.etichetta === "2-1");
    expect(riga.lunghiB).toBeGreaterThan(riga.lunghiA);
  });
  it("chi ha mostrato il vuoto non ne ha: tutte all'altro", () => {
    expect(ripartizioni(3, 8, 8, { a: true })).toEqual([{ a: 0, b: 3, probabilita: 1 }]);
  });
  it("niente carte mancanti, niente righe", () => {
    expect(ripartizioni(0, 13, 13)).toEqual([]);
  });
});

describe("chi ha mostrato un vuoto", () => {
  const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });
  it("chi non risponde al colore è vuoto in quel colore", () => {
    const vuoti = vuotiMostrati([
      { plays: [
        { position: "west", card: c("heart", "K") },
        { position: "north", card: c("heart", "2") },
        { position: "east", card: c("club", "3") },
        { position: "south", card: c("heart", "A") },
      ] },
    ]);
    expect([...vuoti.east]).toEqual(["heart"]);
    expect(vuoti.north.size + vuoti.south.size + vuoti.west.size).toBe(0);
  });
  it("gli avversari di Sud sono Ovest e poi Est", () => {
    expect(avversari("south")).toEqual(["west", "east"]);
    expect(avversari("north")).toEqual(["east", "west"]);
  });
});
