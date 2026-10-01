import { describe, expect, it } from "vitest";
import type { Position } from "./bridge-engine";
import type { DdsTable, TableStrain } from "./dds-table";
import { votoLicitaChiusa } from "./voto-licita-chiusa";

function tabella(): DdsTable {
  const vuoto = { north: 0, east: 0, south: 0, west: 0 } as Record<Position, number>;
  const tricks = {} as DdsTable["tricks"];
  for (const k of ["spade", "heart", "diamond", "club", "notrump"] as TableStrain[]) tricks[k] = { ...vuoto };
  tricks.spade = { north: 10, south: 8, east: 3, west: 3 };
  return { tricks };
}
const par = { score: 420, contracts: ["4S-N"] };

describe("il voto di una licita chiusa", () => {
  it("il contratto par prende tre stelle", () => {
    const { esito, voto } = votoLicitaChiusa(["1♠", "P", "4♠", "P", "P", "P"], "north", "none", { table: tabella(), par });
    expect(esito?.punteggio).toBe(420);
    expect(voto.stelle).toBe(3);
  });
  it("un parziale al posto della manche perde stelle", () => {
    const { voto } = votoLicitaChiusa(["1♠", "P", "2♠", "P", "P", "P"], "north", "none", { table: tabella(), par });
    expect(voto.stelle).toBeLessThan(3);
  });
  it("il passo generale vale zero, e si misura sul par", () => {
    const { esito, voto } = votoLicitaChiusa(["P", "P", "P", "P"], "north", "none", { table: tabella(), par });
    expect(esito).toBeNull();
    expect(voto.punteggio).toBe(0);
    expect(voto.stelle).toBeLessThan(2);
  });
});
