import { describe, expect, it } from "vitest";
import { costruisciStato, IMPOSTAZIONI_INIZIALI } from "./proiezione";
import type { Card, Position } from "./bridge-engine";

const c = (rank: string): Card => ({ suit: "spade", rank } as Card);
const MANI: Record<Position, Card[]> = {
  north: [c("A")],
  east: [c("K")],
  south: [c("Q")],
  west: [c("J")],
};

describe("lo stato spedito alla finestra proiettata", () => {
  /**
   * IL TEST CHE CONTA. Il requisito non è «non mostrare» ma «non spedire»: una
   * mano nascosta via CSS è una mano che sta nella pagina proiettata, e prima o
   * poi un difetto di rendering la fa comparire davanti a una classe.
   */
  it("le mani coperte non partono nemmeno", () => {
    const s = costruisciStato({
      mani: MANI,
      impostazioni: { ...IMPOSTAZIONI_INIZIALI, scoperti: ["north"] },
    });
    expect(Object.keys(s.mani)).toEqual(["north"]);
    // E non devono essere raggiungibili nemmeno serializzando tutto.
    const grezzo = JSON.stringify(s);
    expect(grezzo).toContain('"A"');
    for (const rank of ["K", "Q", "J"]) {
      expect(grezzo, `il rango ${rank} non deve uscire`).not.toContain(`"${rank}"`);
    }
  });

  it("senza nessuno scoperto non esce nessuna carta", () => {
    const s = costruisciStato({ mani: MANI, impostazioni: IMPOSTAZIONI_INIZIALI });
    expect(s.mani).toEqual({});
    expect(JSON.stringify(s.mani)).toBe("{}");
  });

  it("ma le POSIZIONI escono, o non si potrebbero disegnare i riquadri coperti", () => {
    const s = costruisciStato({ mani: MANI, impostazioni: IMPOSTAZIONI_INIZIALI });
    expect(s.posizioni.sort()).toEqual(["east", "north", "south", "west"]);
  });

  it("scoprire tutte le manda tutte", () => {
    const s = costruisciStato({
      mani: MANI,
      impostazioni: { ...IMPOSTAZIONI_INIZIALI, scoperti: ["north", "east", "south", "west"] },
    });
    expect(Object.keys(s.mani).sort()).toEqual(["east", "north", "south", "west"]);
  });

  /**
   * Il contratto è la risposta all'esercizio «cosa si dichiara»: mostrarlo
   * mentre si tiene nascosta la dichiarazione svuoterebbe la domanda.
   */
  it("il contratto segue la dichiarazione", () => {
    const nascosta = costruisciStato({
      mani: MANI,
      contratto: "4♠",
      dichiarante: "south",
      dichiarazione: { dealer: "north", bids: ["1S", "P"] },
      impostazioni: { ...IMPOSTAZIONI_INIZIALI, mostraDichiarazione: false },
    });
    expect(nascosta.contratto).toBeNull();
    expect(nascosta.dichiarante).toBeNull();
    expect(nascosta.dichiarazione).toBeNull();

    const visibile = costruisciStato({
      mani: MANI,
      contratto: "4♠",
      dichiarante: "south",
      dichiarazione: { dealer: "north", bids: ["1S", "P"] },
      impostazioni: { ...IMPOSTAZIONI_INIZIALI, mostraDichiarazione: true },
    });
    expect(visibile.contratto).toBe("4♠");
    expect(visibile.dichiarazione?.bids).toEqual(["1S", "P"]);
  });

  it("l'analisi doppio morto esce solo se accesa", () => {
    const spenta = costruisciStato({
      mani: MANI,
      doppioMorto: "4♠ da Sud",
      impostazioni: IMPOSTAZIONI_INIZIALI,
    });
    expect(spenta.doppioMorto).toBeNull();
    expect(JSON.stringify(spenta)).not.toContain("4♠");
  });

  it("le giocate si possono nascondere", () => {
    const giocate = [{ seat: "north" as Position, card: c("A") }];
    const con = costruisciStato({ mani: MANI, giocate, impostazioni: IMPOSTAZIONI_INIZIALI });
    expect(con.giocate).toHaveLength(1);
    const senza = costruisciStato({
      mani: MANI,
      giocate,
      impostazioni: { ...IMPOSTAZIONI_INIZIALI, mostraGiocate: false },
    });
    expect(senza.giocate).toEqual([]);
  });
});
