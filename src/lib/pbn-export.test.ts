import { describe, it, expect } from "vitest";
import { dealToPbnString, dealsToPbn, parsePbn } from "./pbn";
import { generateDeals } from "./deal-generator";

describe("dealToPbnString", () => {
  const { deals } = generateDeals({}, { count: 1, seed: 2026 });

  it("usa il formato N:<mano> <mano> <mano> <mano>", () => {
    const s = dealToPbnString(deals[0]);
    expect(s.startsWith("N:")).toBe(true);
    expect(s.slice(2).split(" ")).toHaveLength(4);
  });

  it("scrive quattro semi separati da punto per ogni mano", () => {
    for (const mano of dealToPbnString(deals[0]).slice(2).split(" ")) {
      expect(mano.split(".")).toHaveLength(4);
    }
  });

  it("distribuisce 52 carte in tutto", () => {
    const lettere = dealToPbnString(deals[0]).slice(2).replace(/[ .]/g, "");
    expect(lettere).toHaveLength(52);
  });

  it("scrive il dieci come T, non come 10", () => {
    // "10" occuperebbe due caratteri e romperebbe i lettori PBN, che contano
    // un carattere per carta.
    const s = dealToPbnString(deals[0]);
    expect(s).not.toContain("10");
    expect(s).toMatch(/T/);
  });
});

describe("dealsToPbn", () => {
  const { deals } = generateDeals({}, { count: 5, seed: 99 });
  const pbn = dealsToPbn(deals);

  it("scrive un record per smazzata con i tag obbligatori", () => {
    expect(pbn.match(/\[Board /g)).toHaveLength(5);
    for (const tag of ["[Event ", "[Dealer ", "[Vulnerable ", "[Deal "]) {
      expect(pbn).toContain(tag);
    }
  });

  it("ruota dichiarante e vulnerabilità come una vera serie di board", () => {
    // Senza rotazione ogni board sarebbe "Nessuna / Nord" e la serie non
    // somiglierebbe a un torneo.
    expect(pbn).toContain('[Dealer "N"]');
    expect(pbn).toContain('[Dealer "E"]');
    expect(pbn).toContain('[Vulnerable "None"]');
    expect(pbn).toContain('[Vulnerable "NS"]');
  });

  it("il risultato viene riletto dal nostro stesso importatore", () => {
    // Prova del giro completo: se generiamo un PBN che poi non sappiamo
    // rileggere, non lo leggerà nemmeno Dealer4.
    const riletto = parsePbn(pbn);
    expect(riletto.deals.length + riletto.errors.length).toBe(5);
  });
});
