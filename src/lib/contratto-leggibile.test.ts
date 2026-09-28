import { describe, expect, it } from "vitest";
import { contrattoLeggibile } from "./contratto-leggibile";

describe("contratto leggibile", () => {
  it("una notazione sola, qualunque sia la fonte", () => {
    expect(contrattoLeggibile("4S")).toBe("4♠");
    expect(contrattoLeggibile("4♠")).toBe("4♠");
    expect(contrattoLeggibile("3NT")).toBe("3SA");
    expect(contrattoLeggibile("3nt")).toBe("3SA");
    expect(contrattoLeggibile("3SA")).toBe("3SA");
    expect(contrattoLeggibile("3D")).toBe("3♦");
    expect(contrattoLeggibile("1c")).toBe("1♣");
    expect(contrattoLeggibile("6H")).toBe("6♥");
  });
  it("il contro e il surcontro", () => {
    expect(contrattoLeggibile("4SX")).toBe("4♠X");
    expect(contrattoLeggibile("3NTXX")).toBe("3SAXX");
    expect(contrattoLeggibile("4H*")).toBe("4♥X");
  });
  it("quello che non riconosce lo lascia com'è", () => {
    expect(contrattoLeggibile("Passo")).toBe("Passo");
    expect(contrattoLeggibile("")).toBe("");
    expect(contrattoLeggibile(null)).toBe("");
  });
});
