import { describe, expect, it } from "vitest";
import { carteComeOpzioni, dichiarazioniPossibili } from "./sondaggi";
import type { Card } from "./bridge-engine";

describe("le dichiarazioni proposte dal sondaggio", () => {
  /**
   * Un sondaggio che propone 1♣ dopo un 3SA non è una domanda, è un errore
   * stampato davanti alla classe.
   */
  it("propone solo dichiarazioni sufficienti", () => {
    const o = dichiarazioniPossibili(["1♠", "Passo"]);
    expect(o).not.toContain("1♠");
    expect(o).not.toContain("1♥");
    expect(o).toContain("1SA");
    expect(o).toContain("2♣");
  });

  it("dopo l'ultima denominazione si sale di livello", () => {
    const o = dichiarazioniPossibili(["3SA"]);
    expect(o).toContain("4♣");
    expect(o).not.toContain("3SA");
    expect(o).not.toContain("3♠");
  });

  it("all'inizio dell'asta si parte da 1♣, e non c'è il contro", () => {
    const o = dichiarazioniPossibili([]);
    expect(o[0]).toBe("Passo");
    expect(o).toContain("1♣");
    // Contrare quando nessuno ha dichiarato non vuol dire niente.
    expect(o).not.toContain("Contro");
  });

  it("dopo una dichiarazione il contro c'è", () => {
    expect(dichiarazioniPossibili(["1♥"])).toContain("Contro");
  });

  /**
   * Oltre una dozzina di opzioni il sondaggio non si legge su un telefono, e
   * le dichiarazioni interessanti sono comunque le più vicine a quella detta.
   */
  it("non supera le quattordici opzioni", () => {
    expect(dichiarazioniPossibili([]).length).toBeLessThanOrEqual(14);
    expect(dichiarazioniPossibili(["1♣"]).length).toBeLessThanOrEqual(14);
  });
});

describe("le carte come opzioni", () => {
  it("si scrivono come le legge un giocatore", () => {
    const carte = [
      { suit: "spade", rank: "A" },
      { suit: "heart", rank: "10" },
    ] as Card[];
    expect(carteComeOpzioni(carte)).toEqual(["♠A", "♥10"]);
  });
});
