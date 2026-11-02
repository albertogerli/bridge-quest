import { describe, expect, it } from "vitest";
import type { Card, Suit } from "./bridge-engine";
import { ordinaManoAlternata, ordineSemiAlternato } from "./ordine-semi";

const rosso = (s: Suit) => s === "heart" || s === "diamond";
const accostati = (o: Suit[]) => o.slice(1).filter((s, i) => rosso(s) === rosso(o[i])).length;

describe("ordineSemiAlternato", () => {
  it("con quattro semi alterna nero e rosso: ♠ ♥ ♣ ♦", () => {
    expect(ordineSemiAlternato(["spade", "heart", "diamond", "club"])).toEqual(["spade", "heart", "club", "diamond"]);
  });

  it("senza fiori mette le picche tra i due rossi", () => {
    expect(ordineSemiAlternato(["spade", "heart", "diamond"])).toEqual(["heart", "spade", "diamond"]);
  });

  it("senza cuori mette le quadri tra i due neri", () => {
    expect(ordineSemiAlternato(["spade", "diamond", "club"])).toEqual(["spade", "diamond", "club"]);
  });

  it("con l'atout lo mette per primo e alterna il resto", () => {
    for (const atout of ["spade", "heart", "diamond", "club"] as Suit[]) {
      const o = ordineSemiAlternato(["spade", "heart", "diamond", "club"], atout);
      expect(o[0]).toBe(atout);
      expect(accostati(o)).toBe(0);
    }
  });

  it("un atout che non è in mano non cambia niente", () => {
    expect(ordineSemiAlternato(["spade", "club"], "heart")).toEqual(["spade", "club"]);
  });

  it("non perde e non inventa semi", () => {
    expect(ordineSemiAlternato([])).toEqual([]);
    expect(ordineSemiAlternato(["diamond"])).toEqual(["diamond"]);
  });
});

describe("ordinaManoAlternata", () => {
  it("ordina per seme alternato e dentro il seme dall'asso in giù", () => {
    const c = (rank: Card["rank"], suit: Suit): Card => ({ rank, suit });
    const mano = [c("2", "heart"), c("K", "diamond"), c("A", "spade"), c("10", "club"), c("A", "heart"), c("3", "spade")];
    expect(ordinaManoAlternata(mano).map((x) => `${x.rank}${x.suit[0]}`)).toEqual(["As", "3s", "Ah", "2h", "10c", "Kd"]);
  });
});
