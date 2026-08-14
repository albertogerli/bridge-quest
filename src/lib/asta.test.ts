import { describe, expect, it } from "vitest";
import {
  astaFinita, dichiarante, dichiarazioniLecite, righeAsta, turno,
} from "./asta";

/**
 * Le regole dell'asta stanno in un posto solo perché le schermate non possano
 * divergere. Questi test sono il contratto: se una schermata offre una
 * dichiarazione che il server rifiuta, l'utente pensa di aver rotto qualcosa.
 */

describe("turno", () => {
  it("parte dal mazziere e gira in senso orario", () => {
    expect(turno("south", [])).toBe("south");
    expect(turno("south", ["1♠"])).toBe("west");
    expect(turno("south", ["1♠", "P"])).toBe("north");
    expect(turno("south", ["1♠", "P", "2♠"])).toBe("east");
    expect(turno("south", ["1♠", "P", "2♠", "P"])).toBe("south");
  });
});

describe("dichiarazioniLecite — contratti", () => {
  it("all'inizio si può dire tutto", () => {
    const d = dichiarazioniLecite("south", []);
    expect(d.contratti[0]).toBe("1♣");
    expect(d.contratti).toHaveLength(35);
    expect(d.passo).toBe(true);
  });

  it("dopo un contratto restano solo quelli più alti", () => {
    const d = dichiarazioniLecite("south", ["1♠"]);
    expect(d.contratti[0]).toBe("1SA");
    expect(d.contratti).not.toContain("1♠");
    expect(d.contratti).not.toContain("1♥");
  });

  it("il senza atout batte le picche allo stesso livello", () => {
    expect(dichiarazioniLecite("south", ["1SA"]).contratti[0]).toBe("2♣");
  });
});

describe("dichiarazioniLecite — contro e surcontro", () => {
  it("si contra il contratto degli AVVERSARI, non il proprio", () => {
    // Sud apre, tocca a Ovest: avversario, può contrare.
    expect(dichiarazioniLecite("south", ["1♠"]).contro).toBe(true);
    // Sud apre, Ovest passa, tocca a Nord: è il compagno di chi ha aperto.
    expect(dichiarazioniLecite("south", ["1♠", "P"]).contro).toBe(false);
  });

  it("non si contra due volte", () => {
    // Sud 1♠, Ovest contra, tocca a Nord: già contrato.
    expect(dichiarazioniLecite("south", ["1♠", "X"]).contro).toBe(false);
  });

  it("si surcontra solo il contro sul PROPRIO contratto", () => {
    // Sud 1♠, Ovest contra, tocca a Nord: il contratto è della sua linea.
    expect(dichiarazioniLecite("south", ["1♠", "X"]).surcontro).toBe(true);
    // Sud 1♠, Ovest contra, Nord passa, tocca a Est: contratto avversario.
    expect(dichiarazioniLecite("south", ["1♠", "X", "P"]).surcontro).toBe(false);
  });

  it("dopo il surcontro non si contra più", () => {
    const d = dichiarazioniLecite("south", ["1♠", "X", "XX"]);
    expect(d.contro).toBe(false);
    expect(d.surcontro).toBe(false);
  });

  it("a inizio asta non si contra il nulla", () => {
    const d = dichiarazioniLecite("south", []);
    expect(d.contro).toBe(false);
    expect(d.surcontro).toBe(false);
  });

  it("ad asta finita non si dichiara più niente", () => {
    const d = dichiarazioniLecite("south", ["1♠", "P", "P", "P"]);
    expect(d.contratti).toHaveLength(0);
    expect(d.passo).toBe(false);
  });
});

describe("astaFinita", () => {
  it("tre passi dopo un contratto chiudono", () => {
    expect(astaFinita(["1♠", "P", "P"])).toBe(false);
    expect(astaFinita(["1♠", "P", "P", "P"])).toBe(true);
  });
  it("quattro passi secchi chiudono la smazzata", () => {
    expect(astaFinita(["P", "P", "P", "P"])).toBe(true);
    expect(astaFinita(["P", "P", "P"])).toBe(false);
  });
  it("il contro non chiude: servono ancora tre passi", () => {
    expect(astaFinita(["1♠", "X", "P", "P"])).toBe(false);
    expect(astaFinita(["1♠", "X", "P", "P", "P"])).toBe(true);
  });
});

describe("dichiarante", () => {
  it("è chi ha nominato per PRIMO quel seme nella linea, non chi ha chiuso", () => {
    // Sud apre 1♠, Nord alza a 4♠: dichiara SUD, non Nord.
    expect(dichiarante("south", ["1♠", "P", "4♠", "P", "P", "P"])).toBe("south");
  });

  it("con un solo contratto è chi l'ha detto", () => {
    expect(dichiarante("south", ["1SA", "P", "P", "P"])).toBe("south");
  });

  it("riconosce un contratto degli avversari", () => {
    // Sud passa, Ovest apre 1♥, tutti passano.
    expect(dichiarante("south", ["P", "1♥", "P", "P", "P"])).toBe("west");
  });

  it("è nullo se sono passati tutti", () => {
    expect(dichiarante("south", ["P", "P", "P", "P"])).toBeNull();
  });
});

describe("righeAsta", () => {
  it("lascia vuote le caselle prima del mazziere", () => {
    // Mazziere Sud: Nord ed Est della prima riga restano vuoti.
    const r = righeAsta("south", ["1♠", "P"]);
    expect(r[0].north).toBeNull();
    expect(r[0].east).toBeNull();
    expect(r[0].south).toBe("1♠");
    expect(r[0].west).toBe("P");
  });

  it("con mazziere Nord la prima casella è piena", () => {
    const r = righeAsta("north", ["1♠"]);
    expect(r[0].north).toBe("1♠");
  });

  it("va a capo ogni quattro dichiarazioni", () => {
    const r = righeAsta("north", ["1♠", "P", "2♠", "P", "4♠"]);
    expect(r).toHaveLength(2);
    expect(r[1].north).toBe("4♠");
  });
});
