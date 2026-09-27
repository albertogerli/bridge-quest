import { describe, expect, it } from "vitest";
import { posizioneRispettoAlDealer } from "./condizioni-asta";

describe("in che posizione parlo", () => {
  it("chi apre è in prima", () => {
    expect(posizioneRispettoAlDealer("south", "south")).toBe("prima");
    expect(posizioneRispettoAlDealer("north", "north")).toBe("prima");
  });

  it("si conta in senso orario da chi apre", () => {
    expect(posizioneRispettoAlDealer("south", "east")).toBe("seconda");
    expect(posizioneRispettoAlDealer("south", "north")).toBe("terza");
    expect(posizioneRispettoAlDealer("south", "west")).toBe("quarta");
  });

  // L'ordine è Nord, Est, Sud, Ovest: il giro del tavolo, non l'alfabeto.
  it("vale da qualunque posto, non solo da Sud", () => {
    expect(posizioneRispettoAlDealer("west", "north")).toBe("quarta");
    expect(posizioneRispettoAlDealer("north", "west")).toBe("seconda");
    expect(posizioneRispettoAlDealer("east", "south")).toBe("quarta");
  });
});
