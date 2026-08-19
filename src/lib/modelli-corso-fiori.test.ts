import { describe, expect, it } from "vitest";
import { generateDeals } from "./deal-generator";
import { MODELLI_CORSO_FIORI, modelloDellaLezione } from "./modelli-corso-fiori";

describe("i modelli del Corso Fiori", () => {
  it("ce n'è uno per ogni lezione, dalla zero alla dodici", () => {
    const ids = MODELLI_CORSO_FIORI.map((m) => m.lessonId).sort((a, b) => a - b);
    expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  /**
   * IL TEST CHE CONTA. Un vincolo troppo stretto non dà errore: dà meno mani di
   * quante chieste, o nessuna, e l'insegnante lo scopre la sera della lezione
   * davanti alla classe. Qui si chiede a ciascuno di produrne otto davvero.
   */
  it("producono tutti otto mani, e in fretta", () => {
    for (const m of MODELLI_CORSO_FIORI) {
      const inizio = performance.now();
      const esito = generateDeals(m.vincoli, { count: 8, seed: 2026 });
      const durata = performance.now() - inizio;
      expect(esito.deals.length, `${m.lessonId} — ${m.nome}`).toBe(8);
      // Il requisito parla di dieci mani in meno di cinque secondi: qui si sta
      // molto sotto, e va tenuto così.
      expect(durata, `${m.lessonId} — ${m.nome}: ${Math.round(durata)}ms`).toBeLessThan(3000);
    }
  });

  it("ogni mano ha tredici carte per posizione", () => {
    const { deals } = generateDeals(MODELLI_CORSO_FIORI[1].vincoli, { count: 3, seed: 7 });
    for (const d of deals) {
      for (const p of ["north", "east", "south", "west"] as const) {
        expect(d[p]).toHaveLength(13);
      }
    }
  });

  it("si trova per numero di lezione", () => {
    expect(modelloDellaLezione(8)?.nome).toBe("L'apertura e la risposta");
    expect(modelloDellaLezione(99)).toBeUndefined();
  });
});
