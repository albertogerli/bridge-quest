import { describe, it, expect } from "vitest";
import { calcTableAndPar, fitFor, TABLE_STRAINS } from "./dds-table";
import type { Card, Position } from "./bridge-engine";
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

describe("fitFor — quante carte ha davvero la linea", () => {
  /** Mani con una lunghezza voluta di picche fra Nord e Sud. */
  function maniConFitPicche(fit: number): Record<Position, Card[]> {
    const ordine: Card["rank"][] = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
    const nord: Card[] = [];
    const sud: Card[] = [];
    for (let i = 0; i < fit; i++) {
      (i % 2 === 0 ? nord : sud).push({ suit: "spade", rank: ordine[i] });
    }
    const riempi = (h: Card[]) => {
      const semi: Card["suit"][] = ["heart", "diamond", "club"];
      let k = 0;
      while (h.length < 13) {
        h.push({ suit: semi[k % 3], rank: ordine[Math.floor(k / 3) % 13] });
        k++;
      }
      return h;
    };
    return { north: riempi(nord), east: [], south: riempi(sud), west: [] };
  }

  it("somma le carte delle due mani della linea", () => {
    expect(fitFor(maniConFitPicche(8), "ns", "spade")).toBe(8);
    expect(fitFor(maniConFitPicche(6), "ns", "spade")).toBe(6);
  });

  it("guarda la linea giusta", () => {
    // Est e Ovest sono vuoti in queste mani di prova.
    expect(fitFor(maniConFitPicche(8), "ew", "spade")).toBe(0);
  });

  it("al senza atout il fit non esiste", () => {
    expect(fitFor(maniConFitPicche(8), "ns", "notrump")).toBeNull();
  });
});
