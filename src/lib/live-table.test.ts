import { describe, expect, it } from "vitest";
import type { Card, Position, Rank, Suit } from "./bridge-engine";
import { statoDelGioco } from "./live-table";

/**
 * Il tavolo condiviso conserva SOLO la successione delle carte: tutto il resto
 * — chi ha vinto la presa, di chi è il turno — si ricava da qui. Se questa
 * funzione sbaglia, in aula il tavolo dice a due persone due cose diverse.
 */
const c = (s: Suit, r: Rank): Card => ({ suit: s, rank: r });
const g = (seat: Position, card: Card) => ({ seat, card });

describe("statoDelGioco", () => {
  it("a mano vuota attacca chi sta a sinistra del dichiarante", () => {
    // Dichiara Sud: attacca Ovest.
    expect(statoDelGioco([], "south", "spade").turno).toBe("west");
    expect(statoDelGioco([], "north", "spade").turno).toBe("east");
  });

  it("dentro la presa si gira in senso orario", () => {
    const s = statoDelGioco([g("west", c("spade", "A"))], "south", "spade");
    expect(s.turno).toBe("north");
    expect(s.presaCorrente).toHaveLength(1);
    expect(s.prese).toHaveLength(0);
  });

  it("chiusa la presa, riapre chi l'ha vinta", () => {
    // Ovest attacca l'asso di picche e vince: tocca ancora a lui.
    const played = [
      g("west", c("spade", "A")), g("north", c("spade", "2")),
      g("east", c("spade", "3")), g("south", c("spade", "4")),
    ];
    const s = statoDelGioco(played, "south", "spade");
    expect(s.prese).toHaveLength(1);
    expect(s.prese[0].winner).toBe("west");
    expect(s.turno).toBe("west");
    expect(s.presaCorrente).toHaveLength(0);
  });

  it("l'atout batte il colore di attacco", () => {
    // Ovest attacca cuori, Nord taglia a picche: vince Nord.
    const played = [
      g("west", c("heart", "A")), g("north", c("spade", "2")),
      g("east", c("heart", "K")), g("south", c("heart", "3")),
    ];
    const s = statoDelGioco(played, "south", "spade");
    expect(s.prese[0].winner).toBe("north");
    expect(s.turno).toBe("north");
    expect(s.preseNs).toBe(1);
    expect(s.preseEw).toBe(0);
  });

  it("a senza atout vince la carta più alta del colore d'attacco", () => {
    const played = [
      g("west", c("heart", "9")), g("north", c("spade", "A")),
      g("east", c("heart", "K")), g("south", c("heart", "3")),
    ];
    const s = statoDelGioco(played, "south", null);
    // L'asso di picche non conta: non è il colore d'attacco e non c'è atout.
    expect(s.prese[0].winner).toBe("east");
    expect(s.preseEw).toBe(1);
  });

  it("conta le prese delle due linee", () => {
    const played = [
      // presa 1: vince Ovest
      g("west", c("spade", "A")), g("north", c("spade", "2")),
      g("east", c("spade", "3")), g("south", c("spade", "4")),
      // presa 2: vince Nord col re
      g("west", c("heart", "2")), g("north", c("heart", "K")),
      g("east", c("heart", "3")), g("south", c("heart", "4")),
    ];
    const s = statoDelGioco(played, "south", "spade");
    expect(s.preseEw).toBe(1);
    expect(s.preseNs).toBe(1);
    expect(s.turno).toBe("north");
  });

  it("regge una presa incompleta in coda", () => {
    const played = [
      g("west", c("spade", "A")), g("north", c("spade", "2")),
      g("east", c("spade", "3")), g("south", c("spade", "4")),
      g("west", c("heart", "2")),
    ];
    const s = statoDelGioco(played, "south", "spade");
    expect(s.prese).toHaveLength(1);
    expect(s.presaCorrente).toHaveLength(1);
    expect(s.turno).toBe("north");
  });
});
