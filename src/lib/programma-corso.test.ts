import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePbn } from "./pbn";
import {
  PROGRAMMA_PRIMO_LIVELLO,
  idSmazzateGruppo,
  lezioniConSmazzate,
  siglaGruppi,
  siglaSmazzata,
} from "./programma-corso";

describe("il programma del Corso di Primo Livello", () => {
  it("ha venti lezioni numerate di seguito, dieci per modulo", () => {
    expect(PROGRAMMA_PRIMO_LIVELLO.map((l) => l.numero)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(PROGRAMMA_PRIMO_LIVELLO.filter((l) => l.modulo === 1)).toHaveLength(10);
  });

  it("ogni lezione del sito da 1 a 12 compare una volta sola", () => {
    const usate = PROGRAMMA_PRIMO_LIVELLO.flatMap((l) => l.lezioniSito).sort((a, b) => a - b);
    expect(usate).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("le smazzate sono quelle delle tabelle della Commissione (03/11/2026)", () => {
    const sigle = Object.fromEntries(
      PROGRAMMA_PRIMO_LIVELLO.map((l) => [
        l.numero,
        l.smazzate === "tavolo" ? "tavolo" : Array.isArray(l.smazzate) ? siglaGruppi(l.smazzate) : "BridgeLab",
      ]),
    );
    expect(sigle).toEqual({
      1: "tavolo", 2: "tavolo", 3: "tavolo",
      4: "E1 S1-8", 5: "E5 S1-8", 6: "E6 S1-8",
      7: "E3 S1-4 · E5 S1-4", 8: "E3 S5-8 · E5 S5-8", 9: "E4 S1-4 · E6 S1-4", 10: "E8 S1-8",
      11: "E4 S5-8 · E6 S5-8", 12: "E1 S1-8", 13: "E3 S1-8", 14: "E7 S1-8", 15: "E9 S1-8",
      16: "E10 S1-8", 17: "BridgeLab", 18: "BridgeLab", 19: "E11 S1-8", 20: "tavolo",
    });
  });

  it("E7 ed E8 sono le lezioni 8 e 7 del sito; le altre coincidono", () => {
    expect(idSmazzateGruppo({ e: 7, da: 1, a: 2 })).toEqual(["8-1", "8-2"]);
    expect(idSmazzateGruppo({ e: 8, da: 7, a: 8 })).toEqual(["7-7", "7-8"]);
    expect(idSmazzateGruppo({ e: 3, da: 5, a: 8 })).toEqual(["3-5", "3-6", "3-7", "3-8"]);
    expect(siglaSmazzata(7, 3)).toBe("E8 S3");
    expect(siglaSmazzata(1, 8)).toBe("E1 S8");
    expect(siglaSmazzata(51, 1)).toBeNull();
  });

  it("i file delle lezioni 17 e 18 esistono, con otto mani giocabili e la licita", () => {
    for (const l of lezioniConSmazzate()) {
      if (l.smazzate === "tavolo" || Array.isArray(l.smazzate)) continue;
      const testo = fs.readFileSync(path.join(process.cwd(), "public", l.smazzate.file), "utf8");
      const { deals, errors } = parsePbn(testo, "t");
      expect(errors).toEqual([]);
      expect(deals).toHaveLength(8);
      for (const d of deals) {
        expect(d.bidding?.bids.length).toBeGreaterThan(3);
        expect(d.commentary?.length ?? 0).toBeGreaterThan(40);
      }
    }
  });
});
