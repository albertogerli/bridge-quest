import { describe, expect, it } from "vitest";
import { contrattoDallaMano } from "./contratto-sfida";
import type { DdsTable, TableStrain } from "./dds-table";
import type { Position } from "./bridge-engine";

/** Tavola comoda: prese per denominazione, uguali per i due compagni salvo dove detto. */
function tavola(
  p: Partial<Record<TableStrain, number>>,
  differenze: Partial<Record<TableStrain, Partial<Record<Position, number>>>> = {}
): DdsTable {
  const tricks = {} as DdsTable["tricks"];
  for (const k of ["spade", "heart", "diamond", "club", "notrump"] as TableStrain[]) {
    const n = p[k] ?? 0;
    tricks[k] = { north: n, east: 13 - n, south: n, west: 13 - n, ...(differenze[k] ?? {}) };
  }
  return { tricks };
}

describe("contrattoDallaMano — il contratto viene dalle carte", () => {
  it("dieci prese a picche fanno 4♠, non 5♠", () => {
    // Il difetto opposto — «il contratto più alto mantenibile» — insegna a
    // strapagare le mani: è documentato in par-contract.ts.
    const c = contrattoDallaMano(tavola({ spade: 10, heart: 7, notrump: 8 }));
    expect(c.contract).toBe("4S");
    expect(c.prese).toBe(10);
  });

  it("su una mano povera NON esce una manche", () => {
    // È il caso del 19/08/2026: 4♠ con otto picche senza onori e 14 punti in
    // linea. Con sette prese il contratto è 1♠, e si vede subito che è poco.
    const c = contrattoDallaMano(tavola({ spade: 7, heart: 6, notrump: 6, diamond: 5, club: 5 }));
    expect(c.contract).toBe("1S");
  });

  it("sceglie la denominazione che rende di più", () => {
    expect(contrattoDallaMano(tavola({ spade: 8, heart: 11, notrump: 9 })).contract).toBe("5H");
    expect(contrattoDallaMano(tavola({ notrump: 9, spade: 8 })).contract).toBe("3NT");
  });

  it("a parità di prese preferisce il senza atout, poi le nobili", () => {
    // Nove prese: 3SA rende più di 3♠ e si gioca allo stesso livello.
    expect(contrattoDallaMano(tavola({ notrump: 9, spade: 9, club: 9 })).contract).toBe("3NT");
    expect(contrattoDallaMano(tavola({ spade: 9, club: 9 })).contract).toBe("3S");
  });

  it("dichiara chi dei due compagni fa più prese", () => {
    // L'attacco arriva dalla sinistra del dichiarante: una carta in meno da
    // girare può valere due prese.
    const c = contrattoDallaMano(
      tavola({ spade: 10 }, { spade: { north: 10, south: 8 } })
    );
    expect(c.declarer).toBe("north");
    expect(c.contract).toBe("4S");
  });

  it("una mano che non è nostra dà comunque un contratto giocabile", () => {
    // Meglio una mano difficile che una impossibile: entrambi gli sfidanti
    // hanno davanti la stessa, ed è questo che rende il confronto onesto.
    const c = contrattoDallaMano(tavola({ spade: 4, heart: 3, notrump: 5, diamond: 4, club: 4 }));
    expect(c.contract).toBe("1NT");
    expect(c.prese).toBe(5);
  });

  it("non supera mai il sette", () => {
    expect(contrattoDallaMano(tavola({ notrump: 13 })).contract).toBe("7NT");
  });
});
