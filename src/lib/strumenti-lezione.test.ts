import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STRUMENTI_LEZIONE } from "@/components/istruttori/strumenti-lezione";

/**
 * Ogni strumento elencato deve puntare a una pagina che esiste.
 *
 * L'elenco compare in due punti — portale istruttori e home — e ora è definito
 * una volta sola proprio per non farli divergere. Resta il rischio opposto:
 * rinominare o spostare una pagina e lasciare nell'elenco un collegamento
 * morto. In un menù per insegnanti un link che porta al nulla si scopre
 * davanti alla classe.
 */
describe("strumenti per la lezione", () => {
  it("ogni collegamento ha la sua pagina", () => {
    for (const s of STRUMENTI_LEZIONE) {
      const percorso = `src/app${s.href}/page.tsx`;
      expect(existsSync(percorso), `${s.titolo}: manca ${percorso}`).toBe(true);
    }
  });

  it("include il tavolo condiviso e il generatore di mani", () => {
    // I due che l'insegnante cerca per primi.
    const href = STRUMENTI_LEZIONE.map((s) => s.href);
    expect(href).toContain("/istruttori/tavolo");
    expect(href).toContain("/istruttori/genera-mani");
  });

  it("non ha collegamenti ripetuti", () => {
    const href = STRUMENTI_LEZIONE.map((s) => s.href);
    expect(new Set(href).size).toBe(href.length);
  });
});
