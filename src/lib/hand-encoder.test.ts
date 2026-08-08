import { describe, it, expect } from "vitest";
import { dealFromSeed, generateSeed, decodeSeedFromUrl, encodeChallengeUrl } from "./hand-encoder";
import type { Card } from "./bridge-engine";

const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

describe("dealFromSeed", () => {
  it("stesso seed -> stessa smazzata (determinismo)", () => {
    const a = dealFromSeed("ABCD1234");
    const b = dealFromSeed("ABCD1234");
    expect(b).toEqual(a);
  });

  it("seed diversi -> smazzate diverse", () => {
    const a = dealFromSeed("ABCD1234");
    const b = dealFromSeed("WXYZ9876");
    expect(b).not.toEqual(a);
  });

  it("ogni mano ha 13 carte", () => {
    const deal = dealFromSeed("TESTSEED");
    expect(deal.north).toHaveLength(13);
    expect(deal.east).toHaveLength(13);
    expect(deal.south).toHaveLength(13);
    expect(deal.west).toHaveLength(13);
  });

  it("le 52 carte sono tutte presenti e uniche", () => {
    const deal = dealFromSeed("TESTSEED");
    const all = [...deal.north, ...deal.east, ...deal.south, ...deal.west];
    expect(all).toHaveLength(52);
    expect(new Set(all.map(cardKey)).size).toBe(52);
  });

  it("dealer e vulnerabilita sono valori validi e deterministici", () => {
    const deal = dealFromSeed("TESTSEED");
    expect(["north", "east", "south", "west"]).toContain(deal.dealer);
    expect(["none", "ns", "ew", "both"]).toContain(deal.vulnerability);
    const again = dealFromSeed("TESTSEED");
    expect(again.dealer).toBe(deal.dealer);
    expect(again.vulnerability).toBe(deal.vulnerability);
  });
});

describe("seed & URL helpers", () => {
  it("generateSeed produce 8 caratteri dall'alfabeto senza ambigui", () => {
    for (let i = 0; i < 20; i++) {
      const seed = generateSeed();
      expect(seed).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("encode/decode del seed via URL e simmetrico", () => {
    const url = encodeChallengeUrl("ABCD1234");
    expect(decodeSeedFromUrl(url)).toBe("ABCD1234");
  });

  it("decodeSeedFromUrl restituisce null per URL non validi o seed corti", () => {
    expect(decodeSeedFromUrl("not-a-url")).toBeNull();
    expect(decodeSeedFromUrl("https://bridgelab.it/gioca/sfida-link")).toBeNull();
    expect(decodeSeedFromUrl("https://bridgelab.it/gioca/sfida-link?s=AB")).toBeNull();
  });
});
