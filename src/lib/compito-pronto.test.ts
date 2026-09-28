import { describe, expect, it } from "vitest";
import { compitoPronto } from "./compito-pronto";

describe("il compito si può creare?", () => {
  it("con titolo e mani, sì", () => {
    expect(compitoPronto({ titolo: "Lezione 3", mani: 4, esercizi: 0 }).pronto).toBe(true);
  });

  // IL DIFETTO VERO: il pulsante voleva almeno una mano, il gestore no.
  it("con titolo e soli esercizi, sì — prima era impossibile", () => {
    expect(compitoPronto({ titolo: "Esercizi", mani: 0, esercizi: 2 }).pronto).toBe(true);
  });

  // Il caso della segnalazione: titolo scritto, niente scelto. Il pulsante
  // resta spento ma adesso dice perché.
  it("senza mani né esercizi, no — e dice che manca il contenuto", () => {
    expect(compitoPronto({ titolo: "Lezione 3", mani: 0, esercizi: 0 }))
      .toEqual({ pronto: false, manca: "contenuto" });
  });

  it("senza titolo, no — e dice che manca il titolo", () => {
    expect(compitoPronto({ titolo: "   ", mani: 3, esercizi: 0 }))
      .toEqual({ pronto: false, manca: "titolo" });
  });

  // Se manca tutto, prima si chiede il contenuto: è il passo che si perde.
  it("se manca tutto, prima il contenuto", () => {
    expect(compitoPronto({ titolo: "", mani: 0, esercizi: 0 }).manca).toBe("contenuto");
  });
});
