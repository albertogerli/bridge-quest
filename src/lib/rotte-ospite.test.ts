import { describe, expect, it } from "vitest";
import { apertaAgliOspiti } from "./rotte-ospite";

describe("pagine aperte a chi prova senza account", () => {
  it("studiare e giocare contro il computer", () => {
    for (const p of ["/prima-mano", "/lezioni", "/lezioni/3/2", "/gioca", "/gioca/minibridge", "/gioca/smazzata", "/impara/", "/gioca/sfida"]) {
      expect(apertaAgliOspiti(p), p).toBe(true);
    }
  });
  it("non ciò che chiede un account vero", () => {
    for (const p of ["/profilo", "/classi", "/gioca/sfida-amico", "/gioca/sfida-imp", "/gioca/torneo", "/gioca/licita", "/istruttori", "/amici", "/gioca/sfida-link"]) {
      expect(apertaAgliOspiti(p), p).toBe(false);
    }
  });
  it("un prefisso simile non basta", () => {
    expect(apertaAgliOspiti("/lezioni-segrete")).toBe(false);
    expect(apertaAgliOspiti("/gioca/smazzata/altro")).toBe(false);
  });
});
