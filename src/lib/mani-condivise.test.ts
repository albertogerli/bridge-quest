import { describe, expect, it } from "vitest";
import { evDelContratto, riferimento, type ManoCondivisa } from "./mani-condivise";

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
    distribuzioni: null,
    scenario: null,
    ...parziale,
  };
}

const contratto = (ev: number) =>
  ({ level: 4, strain: "spade", declarer: "south", ev, mantenuto: 15 }) as const;

/**
 * Distribuzioni finte ma complete: il metro «atteso» vale solo se la mano le
 * porta, perché senza non si potrebbe valutare il contratto raggiunto con lo
 * stesso metro del riferimento.
 */
function distribuzioniFinte() {
  const sempre = (n: number) => {
    const d = new Array(14).fill(0);
    d[n] = 20;
    return d;
  };
  const posti = { north: sempre(10), south: sempre(10), east: sempre(3), west: sempre(3) };
  const perLato = () => ({
    spade: posti, heart: posti, diamond: posti, club: posti, notrump: posti,
  });
  return { ns: perLato(), ew: perLato(), prove: 20 };
}

describe("riferimento", () => {
  it("usa il valore atteso quando c'è", () => {
    const r = riferimento(
      mano({
        par_score: 100,
        valore_atteso: { ns: contratto(620), ew: contratto(-50), prove: 20 },
        distribuzioni: distribuzioniFinte(),
      }),
      "ns"
    );
    expect(r).toEqual({ punteggio: 620, metro: "atteso" });
  });

  it("quando la mano è degli avversari, il metro è il loro contratto", () => {
    // Chi passa correttamente su una mano non sua non deve prendere zero
    // stelle: il meglio che poteva fare era lasciarli giocare.
    const r = riferimento(
      mano({
        valore_atteso: { ns: contratto(80), ew: contratto(620), prove: 20 },
        distribuzioni: distribuzioniFinte(),
      }),
      "ns"
    );
    expect(r.punteggio).toBe(-620);
  });

  it("è simmetrico: lo stesso conto visto da Est-Ovest", () => {
    const m = mano({
      valore_atteso: { ns: contratto(80), ew: contratto(620), prove: 20 },
      distribuzioni: distribuzioniFinte(),
    });
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

describe("evDelContratto", () => {
  const conDistribuzioni = mano({
    vulnerability: "none",
    par_score: 420,
    valore_atteso: { ns: contratto(420), ew: contratto(-50), prove: 20 },
    distribuzioni: distribuzioniFinte(),
  });

  it("dà il valore atteso del contratto, non il risultato di questa smazzata", () => {
    // Le distribuzioni finte dicono dieci prese sempre: 4♠ vale 420.
    expect(evDelContratto(conDistribuzioni, { level: 4, strain: "spade", declarer: "south" }))
      .toBe(420);
    // 5♠ con dieci prese cade: -50.
    expect(evDelContratto(conDistribuzioni, { level: 5, strain: "spade", declarer: "south" }))
      .toBe(-50);
  });

  it("un contratto avversario conta col segno meno", () => {
    // Est fa tre prese: 1♠ di Est va giù di quattro, -200 per loro, +200 per noi.
    expect(evDelContratto(conDistribuzioni, { level: 1, strain: "spade", declarer: "east" }))
      .toBe(200);
  });

  it("la zona entra nel conto", () => {
    const inZona = mano({
      vulnerability: "ns",
      valore_atteso: { ns: contratto(620), ew: contratto(-50), prove: 20 },
      distribuzioni: distribuzioniFinte(),
    });
    expect(evDelContratto(inZona, { level: 4, strain: "spade", declarer: "south" })).toBe(620);
  });

  it("senza distribuzioni non inventa un numero", () => {
    expect(evDelContratto(mano({ par_score: 420 }), { level: 4, strain: "spade", declarer: "south" }))
      .toBeNull();
  });
});
