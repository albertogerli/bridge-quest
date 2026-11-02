import { describe, expect, it } from "vitest";
import { senzaLicita, soloObiettivo } from "./gioco-della-carta";

describe("senzaLicita", () => {
  it("vale per le lezioni 1–6 del corso Fiori", () => {
    for (const id of [1, 2, 3, 4, 5, 6]) expect(senzaLicita(id)).toBe(true);
  });
  it("non vale per la lezione 0, per la licita (7–12) e per gli altri corsi", () => {
    for (const id of [0, 7, 12, 51, 100, 200]) expect(senzaLicita(id)).toBe(false);
    expect(senzaLicita(null)).toBe(false);
  });
});

describe("soloObiettivo", () => {
  it("senza scelta decide la lezione", () => {
    expect(soloObiettivo(null, 3)).toBe(true);
    expect(soloObiettivo(undefined, 9)).toBe(false);
  });
  it("la scelta dell'insegnante vale per qualunque lezione", () => {
    expect(soloObiettivo(false, 3)).toBe(false);
    expect(soloObiettivo(true, 9)).toBe(true);
  });
});
