import { describe, expect, it } from "vitest";
import { MATERIALI_CORSO } from "./materiali-corso";
import { PROGRAMMA_PRIMO_LIVELLO } from "./programma-corso";

describe("il programma del Corso di Primo Livello", () => {
  it("ha venti lezioni numerate di seguito, dieci per modulo", () => {
    expect(PROGRAMMA_PRIMO_LIVELLO.map((l) => l.numero)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(PROGRAMMA_PRIMO_LIVELLO.filter((l) => l.modulo === 1)).toHaveLength(10);
  });

  it("ogni lezione del sito da 1 a 12 compare una volta sola", () => {
    const usate = PROGRAMMA_PRIMO_LIVELLO.flatMap((l) => l.lezioniSito).sort((a, b) => a - b);
    expect(usate).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("le mani indicate esistono tra le Mani della Commissione", () => {
    const file = new Set(MATERIALI_CORSO.flatMap((m) => m.mani.map((x) => x.file)));
    for (const l of PROGRAMMA_PRIMO_LIVELLO) for (const m of l.mani) expect(file.has(m)).toBe(true);
  });
});
