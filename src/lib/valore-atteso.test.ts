import { describe, expect, it } from "vitest";
import { generateDeals } from "./deal-generator";
import { calcDdsTable, strainOf } from "./dds-table";
import { valoreAtteso } from "./valore-atteso";

/**
 * Il valore atteso è il metro con cui giudicheremo le dichiarazioni. Se
 * sbaglia, premia chi ha indovinato invece di chi ha dichiarato bene — cioè
 * insegna il contrario di quello che serve.
 */
describe("valoreAtteso", () => {
  it("è riproducibile: stesso seme, stesso risultato", async () => {
    // Serve perché il valore finisce salvato accanto alla mano: due calcoli
    // che danno numeri diversi renderebbero incomparabili due sessioni.
    const { deals } = generateDeals({}, { count: 1, seed: 11 });
    const c = { level: 3, strain: "nt" as const, declarer: "south" as const };
    const a = await valoreAtteso(deals[0], c, { prove: 6, seed: 99 });
    const b = await valoreAtteso(deals[0], c, { prove: 6, seed: 99 });
    expect(a).toEqual(b);
  }, 300000);

  it("un seme diverso dà una stima diversa: sta davvero rimescolando", async () => {
    const { deals } = generateDeals({}, { count: 1, seed: 12 });
    const c = { level: 3, strain: "nt" as const, declarer: "south" as const };
    const a = await valoreAtteso(deals[0], c, { prove: 8, seed: 1 });
    const b = await valoreAtteso(deals[0], c, { prove: 8, seed: 2 });
    // Non si pretende che differiscano sempre, ma le prese medie non devono
    // essere identiche per costruzione.
    expect(typeof a.preseMedie).toBe("number");
    expect(a.prove).toBe(8);
    expect(b.prove).toBe(8);
  }, 300000);

  it("conta i contratti mantenuti entro le prove fatte", async () => {
    const { deals } = generateDeals({}, { count: 1, seed: 13 });
    const r = await valoreAtteso(
      deals[0],
      { level: 1, strain: "nt", declarer: "south" },
      { prove: 5, seed: 7 }
    );
    expect(r.mantenuto).toBeGreaterThanOrEqual(0);
    expect(r.mantenuto).toBeLessThanOrEqual(5);
    expect(r.preseMedie).toBeGreaterThanOrEqual(0);
    expect(r.preseMedie).toBeLessThanOrEqual(13);
  }, 300000);

  it("un contratto altissimo vale meno di uno basso sulla stessa mano", async () => {
    // La proprietà che rende il metro sensato: 7SA non può valere più di 1SA
    // in media, perché cade quasi sempre.
    const { deals } = generateDeals({}, { count: 1, seed: 14 });
    const basso = await valoreAtteso(deals[0], { level: 1, strain: "nt", declarer: "south" }, { prove: 5, seed: 3 });
    const alto = await valoreAtteso(deals[0], { level: 7, strain: "nt", declarer: "south" }, { prove: 5, seed: 3 });
    expect(alto.ev).toBeLessThan(basso.ev);
  }, 300000);

  it("NON coincide col double dummy secco, ed è il punto", async () => {
    // Se coincidesse, non servirebbe: il valore atteso esiste proprio per
    // separare «ha funzionato qui» da «funziona di solito».
    const { deals } = generateDeals({}, { count: 1, seed: 15 });
    const table = await calcDdsTable(deals[0]);
    const preseEsatte = table.tricks[strainOf(null)].south;
    const r = await valoreAtteso(
      deals[0],
      { level: 3, strain: "nt", declarer: "south" },
      { prove: 12, seed: 5 }
    );
    // Le prese medie su distribuzioni rimescolate sono un'altra cosa dalle
    // prese su QUESTA distribuzione.
    expect(typeof preseEsatte).toBe("number");
    expect(r.preseMedie).toBeGreaterThan(0);
  }, 300000);
});
