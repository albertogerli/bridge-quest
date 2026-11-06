import { describe, expect, it } from "vitest";
import { PROGRAMMA_PRIMO_LIVELLO } from "./programma-corso";
import { etichettaLezioneProgramma, materialiDellaLezione } from "./materiali-programma";

const lezione = (n: number) => PROGRAMMA_PRIMO_LIVELLO.find((l) => l.numero === n)!;

describe("materialiDellaLezione", () => {
  it("la lezione 1 ha slide, video, dispense e i due esercizi", () => {
    const m = materialiDellaLezione(lezione(1));
    expect(m.slide.map((s) => s.url)).toEqual(["/materiali/gioco-della-carta/slide-vincenti-e-affrancabili.pdf"]);
    expect(m.video.length).toBeGreaterThan(0);
    expect(m.dispense.length).toBe(2);
    expect(m.esercizi.map((t) => t.numero)).toEqual([1, 2]);
  });

  it("una lezione di solo gioco non ha materiali da leggere", () => {
    const m = materialiDellaLezione(lezione(3));
    expect([m.slide, m.video, m.dispense, m.esercizi].every((x) => x.length === 0)).toBe(true);
  });

  it("la stessa dispensa non compare due volte e le slide sono stampabili", () => {
    const m = materialiDellaLezione(lezione(6));
    expect(new Set(m.dispense.map((d) => d.url)).size).toBe(m.dispense.length);
    expect(m.slide.every((s) => s.stampabile)).toBe(true);
    expect(m.video.every((v) => !v.stampabile)).toBe(true);
  });

  it("l'etichetta è quella del programma", () => {
    expect(etichettaLezioneProgramma(lezione(4))).toBe("Lezione 4 – Il piano di gioco");
  });
});
