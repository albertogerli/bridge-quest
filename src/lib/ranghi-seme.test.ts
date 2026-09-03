import { describe, expect, it } from "vitest";
import { gruppiDiRanghi } from "./ranghi-seme";

/**
 * La proprietà che conta non è «si legge», è «si conta».
 *
 * Un maestro guarda un seme e sa quante carte sono senza contarle. Il dieci,
 * scritto con due cifre e attaccato ai vicini, fa sbagliare quel colpo d'occhio
 * proprio nella mano lunga — dove serve di più.
 */

const testo = (r: string[]) => gruppiDiRanghi(r).map((g) => g.testo).join("|");

describe("gruppiDiRanghi", () => {
  it("senza dieci resta un gruppo solo: niente da staccare", () => {
    expect(testo(["A", "K", "Q", "7", "2"])).toBe("AKQ72");
    expect(gruppiDiRanghi(["A", "K", "Q"]).every((g) => !g.staccato)).toBe(true);
  });

  it("il dieci si stacca da entrambi i lati", () => {
    expect(testo(["A", "K", "Q", "J", "10", "9", "8"])).toBe("AKQJ|10|98");
  });

  it("il dieci in testa e in coda", () => {
    expect(testo(["10", "8", "4"])).toBe("10|84");
    expect(testo(["A", "Q", "10"])).toBe("AQ|10");
  });

  it("il dieci da solo", () => {
    expect(testo(["10"])).toBe("10");
    expect(gruppiDiRanghi(["10"])[0].staccato).toBe(true);
  });

  it("un seme vuoto non produce gruppi", () => {
    expect(gruppiDiRanghi([])).toEqual([]);
  });

  it("IL CONTEGGIO TORNA: i caratteri visibili sono uno per carta, tranne il dieci", () => {
    // È la proprietà per cui esiste questa funzione. Senza raggruppamento
    // «AKQJ1098» dà otto segni per sette carte; con il dieci isolato i gruppi
    // si contano a occhio e il totale torna.
    const ranghi = ["A", "K", "Q", "J", "10", "9", "8"];
    const gruppi = gruppiDiRanghi(ranghi);
    const carte = gruppi.reduce((n, g) => n + (g.staccato ? 1 : g.testo.length), 0);
    expect(carte).toBe(ranghi.length);
  });

  it("l'ordine non viene toccato: due schermate non devono mostrarlo diverso", () => {
    expect(testo(["2", "10", "A"])).toBe("2|10|A");
  });
});
