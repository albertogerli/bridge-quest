import { describe, expect, it } from "vitest";
import { MATERIALI_CORSO } from "./materiali-corso";
import { SCHEDE_ESERCIZI, problemiFigura, ranghiSeme, schedaEsercizi } from "./esercizi-commissione";

describe("esercizi della Commissione", () => {
  it("legge i ranghi, con il 10, le cartine e i puntini", () => {
    expect(ranghiSeme("KQ1098x")).toEqual(["K", "Q", "10", "9", "8", "x"]);
    expect(ranghiSeme("…A")).toEqual(["A"]);
  });

  it("trova la carta doppia e la mano di 14 carte", () => {
    expect(problemiFigura({ nord: { S: "AK" }, sud: { S: "A2" } })).toHaveLength(1);
    expect(problemiFigura({ sud: { S: "AKQJ1098765432", H: "2" } })).toHaveLength(1);
  });

  it("ogni figura è a posto, o il suo errore è dell'originale ed è dichiarato", () => {
    for (const s of SCHEDE_ESERCIZI) {
      for (const tema of s.temi) {
        for (const e of tema.esercizi) {
          for (const f of e.figure ?? []) {
            if (f.errataOriginale) continue;
            expect(problemiFigura(f), `${s.slug} ${tema.tema} es.${e.numero}`).toEqual([]);
          }
          expect(e.consegna.trim()).not.toBe("");
          expect(e.soluzione.trim()).not.toBe("");
        }
      }
    }
  });

  it("ogni scheda ha il suo PDF tra i materiali, con le stesse lezioni", () => {
    const pdf = MATERIALI_CORSO.flatMap((m) => m.esercizi);
    for (const s of SCHEDE_ESERCIZI) {
      const p = pdf.find((x) => x.file.endsWith(`esercizi-${s.slug}.pdf`));
      expect(p, s.slug).toBeDefined();
      expect(p?.lezioni).toEqual(s.lezioni);
    }
    expect(schedaEsercizi("non-esiste")).toBeNull();
  });
});
