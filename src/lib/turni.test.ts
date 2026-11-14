import { describe, expect, it } from "vitest";
import { nelTurno, proposteTurno, turniDellaClasse } from "./turni";

const classe = [{ turno: "Sera" }, { turno: null }, { turno: "Pomeriggio" }, { turno: " sera " }, { turno: "" }];

describe("turniDellaClasse", () => {
  it("conta gli allievi per turno, e due grafie dello stesso turno sono uno", () => {
    expect(turniDellaClasse(classe)).toEqual([
      { turno: "Sera", allievi: 2 },
      { turno: "Pomeriggio", allievi: 1 },
    ]);
  });
  it("una classe senza turni non ne ha", () => {
    expect(turniDellaClasse([{ turno: null }, {}])).toEqual([]);
  });
});

describe("proposteTurno", () => {
  it("prima quelli usati, poi i soliti, senza doppioni", () => {
    expect(proposteTurno([{ turno: "martedì" }, { turno: "sera" }])).toEqual(["martedì", "sera", "Pomeriggio"]);
    expect(proposteTurno([])).toEqual(["Pomeriggio", "Sera"]);
  });
});

describe("nelTurno", () => {
  it("tutti, senza turno, o quel turno", () => {
    expect(nelTurno("Sera", null)).toBe(true);
    expect(nelTurno(null, "")).toBe(true);
    expect(nelTurno("Sera", "")).toBe(false);
    expect(nelTurno(" sera", "Sera")).toBe(true);
    expect(nelTurno("Pomeriggio", "Sera")).toBe(false);
    expect(nelTurno(undefined, "Sera")).toBe(false);
  });
});
