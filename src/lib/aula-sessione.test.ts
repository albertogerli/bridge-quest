import { describe, expect, it } from "vitest";
import { accountDaProteggere, eOspite } from "./aula-sessione";

describe("accountDaProteggere", () => {
  it("nessuna sessione: si entra come ospite", () => {
    expect(accountDaProteggere(null)).toBe(false);
    expect(accountDaProteggere(undefined)).toBe(false);
  });

  it("un account vero non si sostituisce", () => {
    expect(accountDaProteggere({ email: "maestro@esempio.it", user_metadata: {} })).toBe(true);
    expect(accountDaProteggere({ email: "maestro@esempio.it", user_metadata: null })).toBe(true);
  });

  it("un ospite che riapre il link rientra come prima", () => {
    expect(accountDaProteggere({ email: "x@esempio.it", user_metadata: { ospite: true } })).toBe(false);
    expect(
      accountDaProteggere({ email: "ospite-abc@bridgelab-ospite.invalid", user_metadata: {} }),
    ).toBe(false);
  });

  it("ospite solo se il segno è quello vero", () => {
    expect(eOspite({ email: "a@b.it", user_metadata: { ospite: "true" } })).toBe(false);
  });
});
