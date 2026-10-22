import { describe, expect, it } from "vitest";
import { mazziereDellaMano, mazziereRegistrato, rigaCompitoLicita, stelleScritte } from "./compito-licita";

describe("mazziereDellaMano", () => {
  it("prende quello scelto dall'insegnante", () => {
    expect(mazziereDellaMano({ mazziere: "west", declarer: "south", bidding: { dealer: "north", bids: [] } })).toBe("west");
  });
  it("altrimenti quello della licita registrata", () => {
    expect(mazziereDellaMano({ declarer: "south", bidding: { dealer: "east", bids: [] } })).toBe("east");
  });
  it("altrimenti il dichiarante, per cui la mano è stata generata", () => {
    expect(mazziereDellaMano({ declarer: "south" })).toBe("south");
    expect(mazziereDellaMano({ declarer: "north" })).toBe("north");
  });
});

describe("rigaCompitoLicita", () => {
  const base = { contratto: "3SA", dichiarante: "north" as const, punteggio: 400, par: 420, bids: ["1SA", "P", "3SA", "P", "P", "P"], mazziere: "north" as const };

  it("da due stelle in su la mano è riuscita: score non negativo, per la classifica", () => {
    const r = rigaCompitoLicita({ ...base, stelle: 2.5 });
    expect(r.score).toBe(3);
    expect(r.details).toMatchObject({ licita: true, made: true, stelle: 2.5, contratto: "3SA" });
  });
  it("sotto le due stelle è da ridichiarare: score negativo", () => {
    const r = rigaCompitoLicita({ ...base, stelle: 1.5 });
    expect(r.score).toBe(-1);
    expect(r.details.made).toBe(false);
  });
  it("il passo generale si registra con contratto nullo", () => {
    const r = rigaCompitoLicita({ ...base, contratto: null, dichiarante: null, punteggio: 0, stelle: 0 });
    expect(r.details).toMatchObject({ contratto: null, dichiarante: null, made: false });
  });
});

describe("stelleScritte", () => {
  it("scrive le mezze stelle con ½", () => {
    expect([0, 0.5, 1, 2.5, 3].map(stelleScritte)).toEqual(["0", "½", "1", "2½", "3"]);
  });
});

describe("mazziereRegistrato", () => {
  it("prende quello scritto nella riga", () => {
    expect(mazziereRegistrato({ mazziere: "west", bids: ["1SA", "P", "P", "P"], dichiarante: "south" }, "south")).toBe("west");
  });
  it("altrimenti lo ricava dall'asta: le righe giocate col mazziere a giro", () => {
    // Mano 1 del 22/10: dava Nord, Est ha aperto 2♥, Nord ha giocato 4♠.
    expect(mazziereRegistrato({ bids: ["P", "2♥", "X", "3♥", "4♠", "P", "P", "P"], dichiarante: "north" }, "south")).toBe("north");
    // Mano 2: dava Est, 1♣ e 1SA di Sud.
    expect(mazziereRegistrato({ bids: ["1♣", "1SA", "P", "P", "P"], dichiarante: "south" }, "south")).toBe("east");
  });
  it("col passo generale resta la riserva", () => {
    expect(mazziereRegistrato({ bids: ["P", "P", "P", "P"], dichiarante: null }, "south")).toBe("south");
  });
});
