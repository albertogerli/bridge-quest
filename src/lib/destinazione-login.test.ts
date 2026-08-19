import { describe, expect, it } from "vitest";
import { destinazioneSicura } from "./destinazione-login";

describe("la destinazione dopo il login", () => {
  it("lascia passare i percorsi interni", () => {
    expect(destinazioneSicura("/classi/x/compito/y")).toBe("/classi/x/compito/y");
    expect(destinazioneSicura("/en/gioca")).toBe("/en/gioca");
    expect(destinazioneSicura("/gioca?board=3#mano")).toBe("/gioca?board=3#mano");
  });

  it("non manda fuori dal sito", () => {
    // Il link parte da bridgelab.it, mostra la nostra pagina di accesso, e a
    // login fatto scarica la persona altrove: il valore, per chi lo spedisce,
    // è tutto nel dominio da cui comincia.
    for (const brutta of [
      "https://esempio.invalid",
      "http://esempio.invalid",
      "//esempio.invalid",
      "/\\esempio.invalid",
      "  //esempio.invalid",
      "\n//esempio.invalid",
      "javascript:alert(1)",
      "esempio.invalid",
    ]) {
      expect(destinazioneSicura(brutta), brutta).toBe("/");
    }
  });

  it("senza destinazione si va alla home", () => {
    expect(destinazioneSicura(null)).toBe("/");
    expect(destinazioneSicura(undefined)).toBe("/");
    expect(destinazioneSicura("")).toBe("/");
  });
});
