import { describe, expect, it } from "vitest";
import type { Card, Position, Rank, Suit } from "./bridge-engine";
import { migliorContrattoAtteso, valoreAtteso } from "./valore-atteso";

/**
 * Il valore atteso passa dal motore double dummy vero: qui non si finge nulla.
 * Le prove sono poche a posta — bastano a verificare le proprietà, e ogni
 * prova è una risoluzione completa.
 */

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const RANGHI: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

/** Mazzo ordinato: 13 picche, 13 cuori, 13 quadri, 13 fiori. */
const MAZZO: Card[] = SEMI.flatMap((suit) => RANGHI.map((rank) => ({ suit, rank })));

/**
 * Nord e Sud hanno tutte le picche e tutti i cuori, Est e Ovest il resto.
 * Comunque si rimescolino le carte avversarie, Nord-Sud fanno tredici prese a
 * cuori: è la smazzata giusta per provare che il conto torni.
 */
function stritolo(): Record<Position, Card[]> {
  return {
    north: MAZZO.slice(0, 13), // tutte le picche
    south: MAZZO.slice(13, 26), // tutti i cuori
    east: MAZZO.slice(26, 39),
    west: MAZZO.slice(39, 52),
  };
}

describe("valoreAtteso", () => {
  it("un contratto imbattibile vale il suo punteggio, sempre", async () => {
    const v = await valoreAtteso(
      stritolo(),
      { level: 6, strain: "heart", declarer: "south" },
      { prove: 3 }
    );
    expect(v.mantenuto).toBe(3);
    expect(v.preseMedie).toBe(13);
    // 6♥ fuori zona: 180 di contratto + 500 di slam + 300 di manche + 30 di
    // presa in più.
    expect(v.ev).toBe(1010);
  }, 60_000);

  it("stesso seme, stesso risultato", async () => {
    const contratto = { level: 4, strain: "heart", declarer: "south" } as const;
    const a = await valoreAtteso(stritolo(), contratto, { prove: 3, seed: 7 });
    const b = await valoreAtteso(stritolo(), contratto, { prove: 3, seed: 7 });
    expect(a).toEqual(b);
  }, 60_000);
});

describe("migliorContrattoAtteso", () => {
  it("trova lo slam quando lo slam c'è", async () => {
    const m = await migliorContrattoAtteso(stritolo(), "ns", { prove: 4 });
    // Con tredici prese sicure a cuori il massimo è 7♥; 7SA no, perché Est-Ovest
    // hanno tutte le quadri e tutti i fiori e il primo giro lo prendono loro.
    expect(m.strain).toBe("heart");
    expect(m.level).toBe(7);
  }, 60_000);

  it("misura sulle prove che non hanno scelto il contratto", async () => {
    // Metà delle distribuzioni sceglie, l'altra metà misura: `mantenuto` è
    // contato solo sulla seconda, altrimenti il numero sarebbe gonfiato dal
    // fatto che il contratto è stato scelto proprio perché lì funzionava.
    const m = await migliorContrattoAtteso(stritolo(), "ns", { prove: 4 });
    expect(m.mantenuto).toBe(2);
  }, 60_000);

  it("guarda la linea che gli si chiede, non l'altra", async () => {
    // La smazzata è simmetrica: anche Est-Ovest, con tutte le quadri e tutti i
    // fiori, hanno lo slam massimo — ma nei LORO semi. È la prova che la
    // funzione tiene ferme le mani giuste.
    const m = await migliorContrattoAtteso(stritolo(), "ew", { prove: 3 });
    expect(m.level).toBe(7);
    expect(["diamond", "club"]).toContain(m.strain);
    expect(["east", "west"]).toContain(m.declarer);
  }, 60_000);

  it("la zona conta: lo stesso contratto in zona vale di più", async () => {
    const fuori = await migliorContrattoAtteso(stritolo(), "ns", { prove: 3, vulnerable: false });
    const dentro = await migliorContrattoAtteso(stritolo(), "ns", { prove: 3, vulnerable: true });
    expect(dentro.ev).toBeGreaterThan(fuori.ev);
  }, 60_000);
});
