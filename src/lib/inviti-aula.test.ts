import { describe, expect, it } from "vitest";
import { nuovoCodice } from "./inviti-aula";

describe("il codice dell'aula", () => {
  it("ha sempre sei cifre, zeri iniziali compresi", () => {
    for (let i = 0; i < 2000; i++) expect(nuovoCodice()).toMatch(/^\d{6}$/);
  });
});
