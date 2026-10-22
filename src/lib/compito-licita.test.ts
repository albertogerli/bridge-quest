import { describe, expect, it } from "vitest";
import { mazziereDellaMano, rigaCompitoLicita, stelleScritte } from "./compito-licita";

describe("mazziereDellaMano", () => {
  it("prende quello scelto dall'insegnante", () => {
    expect(mazziereDellaMano({ mazziere: "west", board: 1, bidding: { dealer: "north", bids: [] } })).toBe("west");
  });
  it("altrimenti quello della licita registrata", () => {
    expect(mazziereDellaMano({ board: 1, bidding: { dealer: "east", bids: [] } })).toBe("east");
  });
  it("altrimenti il giro del torneo sul board", () => {
    expect([1, 2, 3, 4, 5].map((board) => mazziereDellaMano({ board }))).toEqual([
      "north", "east", "south", "west", "north",
    ]);
  });
});

describe("rigaCompitoLicita", () => {
  const base = { contratto: "3SA", dichiarante: "north" as const, punteggio: 400, par: 420, bids: ["1NT", "P", "3NT", "P", "P", "P"] };

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
