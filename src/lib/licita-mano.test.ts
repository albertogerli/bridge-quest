import { describe, expect, it } from "vitest";
import type { Position } from "./bridge-engine";
import type { DdsTable, TableStrain } from "./dds-table";
import { astaChiusa, esitoAsta, ordineDa, turnoDi } from "./licita-mano";

/** Dieci prese a picche per Nord-Sud, poche per gli altri. */
function tabella(): DdsTable {
  const vuoto = { north: 0, east: 0, south: 0, west: 0 } as Record<Position, number>;
  const tricks = {} as DdsTable["tricks"];
  for (const k of ["spade", "heart", "diamond", "club", "notrump"] as TableStrain[]) {
    tricks[k] = { ...vuoto };
  }
  tricks.spade = { north: 10, south: 8, east: 3, west: 3 };
  tricks.notrump = { north: 9, south: 9, east: 4, west: 4 };
  tricks.heart = { north: 2, south: 2, east: 11, west: 11 };
  return { tricks };
}

describe("ordine e turno", () => {
  it("l'ordine parte dal mazziere", () => {
    expect(ordineDa("west")).toEqual(["west", "north", "east", "south"]);
  });

  it("il turno gira di quattro in quattro", () => {
    expect(turnoDi("west", [])).toBe("west");
    expect(turnoDi("west", ["P"])).toBe("north");
    expect(turnoDi("west", ["P", "P", "P", "P"])).toBe("west");
  });
});

describe("astaChiusa", () => {
  it("quattro passi chiudono", () => {
    expect(astaChiusa(["P", "P", "P"])).toBe(false);
    expect(astaChiusa(["P", "P", "P", "P"])).toBe(true);
  });

  it("tre passi dopo una dichiarazione chiudono", () => {
    expect(astaChiusa(["1♠", "P", "P"])).toBe(false);
    expect(astaChiusa(["1♠", "P", "P", "P"])).toBe(true);
  });

  it("un contro riapre il conto", () => {
    expect(astaChiusa(["1♠", "X", "P", "P"])).toBe(false);
    expect(astaChiusa(["1♠", "X", "P", "P", "P"])).toBe(true);
  });
});

describe("esitoAsta", () => {
  const t = tabella();

  it("il passo generale non è un errore: è zero", () => {
    expect(esitoAsta(["P", "P", "P", "P"], "north", t, "none")).toBeNull();
  });

  it("il dichiarante è il PRIMO della linea ad aver nominato il seme", () => {
    // Nord apre 1♠, Sud rilancia a 4♠: dichiara Nord, non Sud.
    const e = esitoAsta(["1♠", "P", "4♠", "P", "P", "P"], "north", t, "none")!;
    expect(e.declarer).toBe("north");
    expect(e.prese).toBe(10);
    expect(e.punteggio).toBe(420);
  });

  it("le prese sono quelle del dichiarante, non del compagno migliore", () => {
    // Stesso contratto dichiarato da Sud: otto prese, non dieci.
    const e = esitoAsta(["P", "P", "4♠", "P", "P", "P"], "north", t, "none")!;
    expect(e.declarer).toBe("south");
    expect(e.prese).toBe(8);
    expect(e.punteggio).toBe(-100);
  });

  it("un contratto degli avversari conta col segno meno", () => {
    // Est apre 4♥ e nessuno dice più niente: undici prese per loro.
    const e = esitoAsta(["P", "4♥", "P", "P", "P"], "north", t, "none")!;
    expect(e.lato).toBe("ew");
    expect(e.declarer).toBe("east");
    expect(e.punteggio).toBeLessThan(0);
  });

  it("il contro entra nel punteggio e nell'etichetta", () => {
    const liscio = esitoAsta(["P", "P", "4♠", "P", "P", "P"], "north", t, "none")!;
    const contrato = esitoAsta(["P", "P", "4♠", "X", "P", "P", "P"], "north", t, "none")!;
    expect(contrato.contratto).toBe("4♠X");
    expect(contrato.doppio).toBe(2);
    // Giù di due contrato: -300 invece di -100.
    expect(contrato.punteggio).toBe(-300);
    expect(liscio.punteggio).toBe(-100);
  });

  it("la zona cambia il conto", () => {
    const fuori = esitoAsta(["1♠", "P", "4♠", "P", "P", "P"], "north", t, "none")!;
    const dentro = esitoAsta(["1♠", "P", "4♠", "P", "P", "P"], "north", t, "ns")!;
    expect(fuori.punteggio).toBe(420);
    expect(dentro.punteggio).toBe(620);
  });

  it("il mazziere sposta tutto: la stessa asta da un altro posto", () => {
    // Le stesse dichiarazioni con mazziere Ovest: a dire 1♠ è Ovest, non Nord.
    const e = esitoAsta(["1♠", "P", "4♠", "P", "P", "P"], "west", t, "none")!;
    expect(e.declarer).toBe("west");
    expect(e.lato).toBe("ew");
  });
});

/**
 * Il difetto che ha portato questa funzione a esistere.
 *
 * La pagina prendeva come contratto «l'ultima dichiarazione diversa da passo»,
 * che però può essere un CONTRO. Su iPad, in produzione, quella riga è esplosa
 * con «undefined is not an object»: il contro non è un contratto, e cercarlo
 * fra le denominazioni non dava niente.
 */
describe("il contro non è un contratto", () => {
  const t = tabella();

  it("dopo un contro il contratto resta l'ultima dichiarazione vera", () => {
    const e = esitoAsta(["1♠", "P", "4♠", "X", "P", "P", "P"], "north", t, "none")!;
    expect(e.level).toBe(4);
    expect(e.strain).toBe("spade");
    expect(e.doppio).toBe(2);
  });

  it("un'asta di soli contro non esiste, ma non deve rompere niente", () => {
    // Non è una sequenza legale: la funzione deve rispondere «niente
    // contratto» invece di cercare una denominazione che non c'è.
    expect(esitoAsta(["X", "P", "P", "P"], "north", t, "none")).toBeNull();
    expect(esitoAsta(["XX"], "north", t, "none")).toBeNull();
  });

  it("l'asta che ha bloccato la pagina, presa dallo schermo", () => {
    // 15/08/2026: dealer Sud, competitiva lunga che finisce su un contro di
    // Sud a 5♣ di Est. La pagina prendeva il contro come contratto e si
    // fermava lì, senza voto e senza riepilogo: l'asta era finita e non
    // succedeva più niente.
    const bids = ["2♠", "3♥", "4♥", "P", "P", "X", "4♠", "5♣", "X", "P", "P", "P"];
    expect(astaChiusa(bids)).toBe(true);

    const e = esitoAsta(bids, "south", t, "ew")!;
    expect(e.contratto).toBe("5♣X");
    expect(e.declarer).toBe("east");
    expect(e.lato).toBe("ew");
    expect(e.doppio).toBe(2);
  });

  it("nemmeno una dichiarazione mai vista rompe il conto", () => {
    expect(esitoAsta(["8♠", "P", "P", "P"], "north", t, "none")).toBeNull();
    expect(esitoAsta(["1Z", "P", "P", "P"], "north", t, "none")).toBeNull();
  });
});
