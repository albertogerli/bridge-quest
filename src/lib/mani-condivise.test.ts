import { describe, expect, it } from "vitest";
import { riferimento, type ManoCondivisa } from "./mani-condivise";

/** Solo la parte pura: il resto è database, e si prova con `prova-campo.mjs`. */
function mano(parziale: Partial<ManoCondivisa>): ManoCondivisa {
  return {
    id: "m",
    hands: {} as ManoCondivisa["hands"],
    dealer: "south",
    vulnerability: "none",
    par_contracts: null,
    par_score: null,
    dd_table: null,
    valore_atteso: null,
    scenario: null,
    ...parziale,
  };
}

const contratto = (ev: number) =>
  ({ level: 4, strain: "spade", declarer: "south", ev, mantenuto: 15 }) as const;

describe("riferimento", () => {
  it("usa il valore atteso quando c'è", () => {
    const r = riferimento(
      mano({ par_score: 100, valore_atteso: { ns: contratto(620), ew: contratto(-50), prove: 20 } }),
      "ns"
    );
    expect(r).toEqual({ punteggio: 620, metro: "atteso" });
  });

  it("quando la mano è degli avversari, il metro è il loro contratto", () => {
    // Chi passa correttamente su una mano non sua non deve prendere zero
    // stelle: il meglio che poteva fare era lasciarli giocare.
    const r = riferimento(
      mano({ valore_atteso: { ns: contratto(80), ew: contratto(620), prove: 20 } }),
      "ns"
    );
    expect(r.punteggio).toBe(-620);
  });

  it("è simmetrico: lo stesso conto visto da Est-Ovest", () => {
    const m = mano({ valore_atteso: { ns: contratto(80), ew: contratto(620), prove: 20 } });
    expect(riferimento(m, "ew").punteggio).toBe(620);
    expect(riferimento(m, "ns").punteggio).toBe(-620);
  });

  it("ripiega sul par, e lo dichiara", () => {
    const m = mano({ par_score: -430 });
    expect(riferimento(m, "ns")).toEqual({ punteggio: -430, metro: "esatto" });
    // Il par è scritto dal punto di vista di Nord-Sud: per gli altri va girato.
    expect(riferimento(m, "ew")).toEqual({ punteggio: 430, metro: "esatto" });
  });

  it("senza par e senza valore atteso non inventa un riferimento alto", () => {
    expect(riferimento(mano({}), "ns").punteggio).toBe(0);
  });
});
