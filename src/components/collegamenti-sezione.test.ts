import { describe, expect, it } from "vitest";
import { vociVisibili, type Collegamento } from "./collegamenti-sezione";

const voci: Collegamento[] = [
  { href: "/classifica", emoji: "🏆", etichetta: "Classifica", descrizione: "x" },
  { href: "/amici", emoji: "👥", etichetta: "Amici", descrizione: "y" },
  { href: "/forum", emoji: "💬", etichetta: "Forum", descrizione: "z" },
];

describe("i collegamenti che l'insegnante ha nascosto", () => {
  it("con niente nascosto si vedono tutti", () => {
    expect(vociVisibili(voci, new Set())).toHaveLength(3);
  });

  it("una voce nascosta sparisce, non si mostra col lucchetto", () => {
    const visti = vociVisibili(voci, new Set(["/forum"]));
    expect(visti.map((v) => v.href)).toEqual(["/classifica", "/amici"]);
  });

  // Il gruppo intero deve poter sparire: un titolo con sotto il vuoto è
  // peggio dell'assenza, perché dice che manca qualcosa.
  it("nascoste tutte, non resta niente da mostrare", () => {
    expect(vociVisibili(voci, new Set(["/classifica", "/amici", "/forum"]))).toEqual([]);
  });

  it("non tocca le voci di partenza", () => {
    const copia = [...voci];
    vociVisibili(voci, new Set(["/amici"]));
    expect(voci).toEqual(copia);
  });
});
