import { describe, expect, it } from "vitest";
import { riempi, traduci } from "./traduzioni";

describe("riempi — i segnaposti", () => {
  it("sostituisce i valori", () => {
    expect(riempi("Mancano {n} punti", { n: 12 })).toBe("Mancano 12 punti");
  });

  it("un segnaposto senza valore resta a vista", () => {
    // Una stringa vuota darebbe «Mancano  punti»: una frase che sembra giusta
    // e non lo è. `{n}` è brutto e si nota, che è il punto.
    expect(riempi("Mancano {n} punti", {})).toBe("Mancano {n} punti");
    expect(riempi("Mancano {n} punti")).toBe("Mancano {n} punti");
  });

  it("più segnaposti nella stessa frase", () => {
    expect(riempi("{a} contro {b}", { a: "Nord", b: "Est" })).toBe("Nord contro Est");
  });
});

describe("traduci — con ripiego sulla lingua di casa", () => {
  const en = { "Tocca a te": "Your turn", "Vuoto": "" };

  it("usa la traduzione quando c'è", () => {
    expect(traduci("Tocca a te", en)).toBe("Your turn");
  });

  it("senza dizionario mostra l'italiano", () => {
    expect(traduci("Tocca a te", null)).toBe("Tocca a te");
  });

  it("una chiave che manca mostra l'italiano, non un buco", () => {
    // È ciò che permette di tradurre un'area alla volta col sito vivo.
    expect(traduci("Mano annullata", en)).toBe("Mano annullata");
  });

  it("una traduzione vuota vale come assente", () => {
    // Un valore vuoto lasciato per sbaglio cancellerebbe la frase dallo
    // schermo: meglio l'italiano di un'etichetta invisibile.
    expect(traduci("Vuoto", en)).toBe("Vuoto");
  });

  it("interpola anche la frase tradotta", () => {
    expect(traduci("Mancano {n} punti", { "Mancano {n} punti": "{n} points to go" }, { n: 3 }))
      .toBe("3 points to go");
  });
});
