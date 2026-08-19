import { describe, expect, it } from "vitest";
import { COMBINAZIONI, lunghezze, problemiDi } from "./combinazioni";
import { createGame, playCard, type Card, type Position } from "./bridge-engine";

describe("le combinazioni classiche", () => {
  it("ce ne sono quattro, quelle del programma di primo livello", () => {
    expect(COMBINAZIONI.map((c) => c.id)).toEqual([
      "impasse-semplice",
      "doppio-impasse",
      "taglio-in-mano",
      "muovere-la-lunga",
    ]);
  });

  /**
   * Una posizione in cui due hanno tre carte e due ne hanno due non è una
   * posizione di bridge: il motore fa giocare quattro persone a turno.
   */
  it("ognuna dà lo stesso numero di carte a tutti e quattro", () => {
    for (const c of COMBINAZIONI) {
      const l = lunghezze(c.hands);
      expect(new Set(l).size, c.nome).toBe(1);
    }
  });

  it("nessuna carta compare in due mani", () => {
    for (const c of COMBINAZIONI) {
      expect(problemiDi(c.hands), c.nome).toEqual([]);
    }
  });

  /**
   * La prova vera: si giocano fino in fondo e la mano finisce. Prima del
   * cambio al motore restavano appese, perché la fine era «tredici prese».
   */
  it("si giocano fino in fondo e finiscono", () => {
    for (const comb of COMBINAZIONI) {
      let s = createGame(comb.hands, comb.atout ? `1${comb.atout === "spade" ? "♠" : "♣"}` : "1SA", comb.posizione);
      let giri = 0;
      while (s.phase !== "finished" && giri < 40) {
        const carte = s.hands[s.currentPlayer];
        s = playCard(s, s.currentPlayer, carte[carte.length - 1]);
        giri++;
      }
      expect(s.phase, comb.nome).toBe("finished");
      expect(s.tricks.length, comb.nome).toBe(lunghezze(comb.hands)[0]);
    }
  });
});

describe("i controlli su una posizione composta a mano", () => {
  const vuote: Record<Position, Card[]> = { north: [], east: [], south: [], west: [] };

  it("una posizione vuota lo dice", () => {
    expect(problemiDi(vuote)[0].campo).toBe("vuota");
  });

  it("le lunghezze diverse si segnalano", () => {
    const m = {
      ...vuote,
      north: [{ suit: "spade", rank: "A" }] as Card[],
      east: [] as Card[],
      south: [{ suit: "spade", rank: "K" }] as Card[],
      west: [{ suit: "spade", rank: "Q" }] as Card[],
    };
    expect(problemiDi(m).some((p) => p.campo === "lunghezza")).toBe(true);
  });

  /**
   * Una carta ripetuta in due mani non dà nessun errore al motore: produce
   * semplicemente un gioco impossibile, e chi lo scopre è l'allievo davanti a
   * una combinazione che non torna.
   */
  it("una carta in due mani si segnala", () => {
    const asso = { suit: "spade", rank: "A" } as Card;
    const m = {
      north: [asso],
      east: [asso],
      south: [{ suit: "spade", rank: "K" }] as Card[],
      west: [{ suit: "spade", rank: "Q" }] as Card[],
    };
    expect(problemiDi(m).some((p) => p.campo === "doppioni")).toBe(true);
  });
});
