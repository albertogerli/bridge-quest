import { describe, expect, it } from "vitest";
import { COMBINAZIONI, lunghezze, problemiDi, siProietta } from "./combinazioni";
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

describe("la figura, che si proietta ma non si gioca", () => {
  const carta = (suit: Card["suit"], rank: Card["rank"]) => ({ suit, rank }) as Card;

  it("un seme solo con lunghezze diverse si proietta", () => {
    const m: Record<Position, Card[]> = {
      north: [carta("spade", "A"), carta("spade", "Q"), carta("spade", "3")],
      west: [carta("spade", "K"), carta("spade", "10"), carta("spade", "5")],
      east: [carta("spade", "J"), carta("spade", "9"), carta("spade", "8"), carta("spade", "7")],
      south: [carta("spade", "6"), carta("spade", "4"), carta("spade", "2")],
    };
    const problemi = problemiDi(m);
    expect(problemi.map((p) => p.campo)).toEqual(["lunghezza"]);
    expect(siProietta(problemi)).toBe(true);
  });

  it("una carta in due mani non si proietta", () => {
    const m: Record<Position, Card[]> = {
      north: [carta("spade", "A")],
      south: [carta("spade", "A"), carta("spade", "2")],
      east: [],
      west: [],
    };
    expect(siProietta(problemiDi(m))).toBe(false);
  });

  it("senza carte non c'è niente da proiettare", () => {
    expect(siProietta(problemiDi({ north: [], east: [], south: [], west: [] }))).toBe(false);
  });
});
