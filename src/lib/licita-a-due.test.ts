import { describe, expect, it } from "vitest";
import { contrattoFinale, licitaFinita, turnoDi } from "./licita-a-due";

/**
 * Il turno e la chiusura sono calcolati due volte: qui, per disegnare la
 * schermata, e nel database, che è l'autorità. Le due devono dire la stessa
 * cosa — altrimenti la schermata offre il cassetto delle dichiarazioni a chi
 * poi si vede rifiutare la mossa, che è il modo peggiore di sbagliare.
 */
describe("turnoDi", () => {
  it("a licita vuota tocca al mazziere", () => {
    expect(turnoDi("south", [])).toBe("south");
    expect(turnoDi("north", [])).toBe("north");
  });

  it("gira in senso orario: Nord, Est, Sud, Ovest", () => {
    expect(turnoDi("south", ["1♠"])).toBe("west");
    expect(turnoDi("south", ["1♠", "P"])).toBe("north");
    expect(turnoDi("south", ["1♠", "P", "4♠"])).toBe("east");
    expect(turnoDi("south", ["1♠", "P", "4♠", "P"])).toBe("south");
  });

  it("dopo un giro completo si torna al mazziere", () => {
    expect(turnoDi("north", ["P", "P", "P", "P"])).toBe("north");
  });
});

describe("licitaFinita", () => {
  it("non è finita all'inizio", () => {
    expect(licitaFinita([])).toBe(false);
    expect(licitaFinita(["1♠"])).toBe(false);
  });

  it("tre passi dopo un contratto la chiudono", () => {
    expect(licitaFinita(["1♠", "P", "P"])).toBe(false);
    expect(licitaFinita(["1♠", "P", "P", "P"])).toBe(true);
  });

  it("i passi contano solo DOPO l'ultimo contratto", () => {
    // Due passi, poi una dichiarazione: il conto riparte.
    expect(licitaFinita(["1♠", "P", "P", "2♥"])).toBe(false);
    expect(licitaFinita(["1♠", "P", "P", "2♥", "P", "P"])).toBe(false);
    expect(licitaFinita(["1♠", "P", "P", "2♥", "P", "P", "P"])).toBe(true);
  });

  it("quattro passi senza contratto chiudono la smazzata", () => {
    expect(licitaFinita(["P", "P", "P"])).toBe(false);
    expect(licitaFinita(["P", "P", "P", "P"])).toBe(true);
  });
});

describe("contrattoFinale", () => {
  it("è l'ultima dichiarazione che non sia un passo", () => {
    expect(contrattoFinale(["1♠", "P", "4♠", "P", "P", "P"])).toBe("4♠");
    expect(contrattoFinale(["1SA", "P", "P", "P"])).toBe("1SA");
  });

  it("è nullo se sono passati tutti", () => {
    expect(contrattoFinale(["P", "P", "P", "P"])).toBeNull();
    expect(contrattoFinale([])).toBeNull();
  });
});

describe("contrattoFinale", () => {
  it("il contro non è un contratto", () => {
    // Mostrava «Contratto: X» invece di «1♠ contrato»: terza copia dello
    // stesso conto trovata nel progetto.
    expect(contrattoFinale(["1♠", "X", "P", "P", "P"])).toBe("1♠X");
    expect(contrattoFinale(["4♥", "X", "XX", "P", "P", "P"])).toBe("4♥XX");
  });

  it("senza contratto risponde niente", () => {
    expect(contrattoFinale(["P", "P", "P", "P"])).toBeNull();
    expect(contrattoFinale([])).toBeNull();
  });

  it("il contratto normale resta quello", () => {
    expect(contrattoFinale(["1♠", "P", "4♠", "P", "P", "P"])).toBe("4♠");
  });
});
