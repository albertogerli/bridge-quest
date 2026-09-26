import { describe, it, expect } from "vitest";
import { aulaAlCompleto } from "./aula-tetto";

describe("il tetto degli ospiti in aula", () => {
  it("lascia entrare finché i posti ospite non sono finiti", () => {
    expect(aulaAlCompleto(0, 40)).toBe(false);
    expect(aulaAlCompleto(39, 40)).toBe(false);
  });

  it("chiude quando gli ospiti hanno riempito il tetto", () => {
    expect(aulaAlCompleto(40, 40)).toBe(true);
    expect(aulaAlCompleto(41, 40)).toBe(true);
  });

  // Il difetto vero: si contavano gli ISCRITTI. Una classe con quaranta
  // allievi veri e nessun ospite risultava piena, e il link dell'insegnante
  // non funzionava proprio nelle classi grandi.
  it("una classe piena di allievi veri ha comunque tutti i posti ospite", () => {
    expect(aulaAlCompleto(0, 40)).toBe(false);
  });

  it("un invito con tetto zero non fa entrare nessuno", () => {
    expect(aulaAlCompleto(0, 0)).toBe(true);
  });
});
