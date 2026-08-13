import { describe, it, expect } from "vitest";
import { isTextSize, parseTextSize, scaleFor, TEXT_SIZES } from "./text-size";

describe("parseTextSize", () => {
  it("accetta i valori previsti", () => {
    for (const s of TEXT_SIZES) expect(parseTextSize(s)).toBe(s);
  });

  it("ripiega su medio per valori assenti o corrotti", () => {
    // Il valore arriva da localStorage e dalla sincronizzazione: può essere
    // qualsiasi cosa, e un'interfaccia illeggibile sarebbe peggio del default.
    for (const v of [null, undefined, "", "enorme", "Grande", "12"]) {
      expect(parseTextSize(v as string)).toBe("medio");
    }
  });
});

describe("scaleFor", () => {
  it("medio corrisponde al valore predefinito del browser", () => {
    // Chi non tocca nulla non deve vedere alcun cambiamento.
    expect(scaleFor("medio")).toBe("100%");
  });

  it("le scale sono crescenti", () => {
    const num = (s: string) => Number(s.replace("%", ""));
    expect(num(scaleFor("piccolo"))).toBeLessThan(num(scaleFor("medio")));
    expect(num(scaleFor("medio"))).toBeLessThan(num(scaleFor("grande")));
  });

  it("«grande» ingrandisce abbastanza da farsi notare", () => {
    // Sotto il 10% la differenza non si vede, e l'utente conclude che il
    // comando non funziona — che è esattamente com'era prima.
    expect(Number(scaleFor("grande").replace("%", ""))).toBeGreaterThanOrEqual(110);
  });

  it("«piccolo» non scende sotto una soglia leggibile", () => {
    expect(Number(scaleFor("piccolo").replace("%", ""))).toBeGreaterThanOrEqual(90);
  });
});

describe("isTextSize", () => {
  it("rifiuta valori non previsti", () => {
    expect(isTextSize("gigante")).toBe(false);
    expect(isTextSize(3)).toBe(false);
    expect(isTextSize(null)).toBe(false);
  });
});
