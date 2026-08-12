import { describe, it, expect } from "vitest";
import { bestContractFor, calcTableAndPar, TABLE_STRAINS } from "./dds-table";
import { generateDeals } from "./deal-generator";
import { solveExact } from "./dds-exact";

const { deals } = generateDeals({}, { count: 3, seed: 7 });

describe("calcTableAndPar", () => {
  it("riempie tutte e 20 le caselle con valori plausibili", async () => {
    const { table } = await calcTableAndPar(deals[0], "north", "none");
    for (const strain of TABLE_STRAINS) {
      for (const seat of ["north", "east", "south", "west"] as const) {
        const t = table.tricks[strain][seat];
        expect(Number.isInteger(t)).toBe(true);
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThanOrEqual(13);
      }
    }
  }, 60000);

  it("le prese delle due linee NON sommano a 13, ed è corretto così", async () => {
    // Sembra un invariante ovvio e non lo è: cambiando dichiarante cambia chi
    // attacca (l'attacco è sempre a sinistra del dichiarante), e un attacco
    // diverso porta a un risultato diverso. Nella mano di prova il senza atout
    // dà 9 prese a N-S con Nord dichiarante e 2 a E-O con Est: fanno 11.
    // Il test esiste per impedire che qualcuno "corregga" la lettura della
    // tabella inseguendo quel 13.
    const { table } = await calcTableAndPar(deals[0], "north", "none");
    const somma = table.tricks.notrump.north + table.tricks.notrump.east;
    expect(somma).toBeLessThanOrEqual(13);
    expect(table.tricks.notrump.north).toBe(9);
    expect(table.tricks.notrump.east).toBe(2);
  }, 60000);

  it("i due compagni ottengono lo stesso numero di prese", async () => {
    // A double dummy la mano è nota: chi dei due dichiara non cambia il
    // risultato. Se differissero, avremmo scambiato i dichiaranti.
    const { table } = await calcTableAndPar(deals[2], "north", "none");
    for (const strain of TABLE_STRAINS) {
      expect(table.tricks[strain].north).toBe(table.tricks[strain].south);
      expect(table.tricks[strain].east).toBe(table.tricks[strain].west);
    }
  }, 60000);

  it("il par indica almeno un contratto", async () => {
    const { par } = await calcTableAndPar(deals[0], "north", "none");
    expect(par.contracts.length).toBeGreaterThan(0);
    expect(Number.isInteger(par.score)).toBe(true);
  }, 60000);

  it("la vulnerabilità può cambiare il par", async () => {
    // Il par è un fatto di punteggio: cambiando zona può cambiare la
    // convenienza di un sacrificio. Non deve però esplodere in nessun caso.
    for (const v of ["none", "ns", "ew", "both"] as const) {
      const { par } = await calcTableAndPar(deals[0], "north", v);
      expect(par.contracts.length).toBeGreaterThan(0);
    }
  }, 120000);
});

describe("la libreria concorda con il nostro solver indipendente", () => {
  it("stesso numero di prese a senza atout", async () => {
    // dds-exact.ts è lento ma verificato: è il riscontro che permetterebbe di
    // accorgersi se un aggiornamento della libreria cambiasse i numeri.
    const { table } = await calcTableAndPar(deals[0], "north", "none");
    // Ovest di mano corrisponde a Sud dichiarante.
    const mio = solveExact(deals[0], null, "west", 120000);
    expect(mio.exact).toBe(true);
    expect(table.tricks.notrump.south).toBe(mio.nsTricks);
  }, 200000);
});

describe("bestContractFor", () => {
  it("propone un contratto che le carte reggono", async () => {
    const { table } = await calcTableAndPar(deals[0], "north", "none");
    const best = bestContractFor(table, "ns");
    expect(best).not.toBeNull();
    // Il livello proposto non deve superare le prese realizzabili.
    expect(best!.tricks).toBeGreaterThanOrEqual(7);
    expect(Number(best!.contract[0])).toBe(best!.tricks - 6);
  }, 60000);

  it("restituisce null quando la coppia non mantiene nulla", () => {
    const vuota = {
      tricks: Object.fromEntries(
        TABLE_STRAINS.map((s) => [s, { north: 0, east: 13, south: 0, west: 13 }])
      ),
    } as Parameters<typeof bestContractFor>[0];
    expect(bestContractFor(vuota, "ns")).toBeNull();
    expect(bestContractFor(vuota, "ew")).not.toBeNull();
  });
});
