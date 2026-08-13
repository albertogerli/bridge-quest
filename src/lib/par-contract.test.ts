import { describe, it, expect } from "vitest";
import { describePar, parAssignment, parAssignmentFromContracts, parseParContract } from "./par-contract";
import type { Card, Position } from "./bridge-engine";

describe("parseParContract — formati reali della libreria", () => {
  it.each([
    ["4S-NS+1", { level: 4, contract: "4♠", strain: "spade", side: "ns", declarer: null, doubled: false, result: 1 }],
    ["3N-E", { level: 3, contract: "3SA", strain: "notrump", side: "ew", declarer: "east", doubled: false, result: 0 }],
    ["3C*-EW-1", { level: 3, contract: "3♣", strain: "club", side: "ew", declarer: null, doubled: true, result: -1 }],
    ["5D-NS", { level: 5, contract: "5♦", strain: "diamond", side: "ns", declarer: null, doubled: false, result: 0 }],
    ["6S-EW", { level: 6, contract: "6♠", strain: "spade", side: "ew", declarer: null, doubled: false, result: 0 }],
    ["4C*-NS-1", { level: 4, contract: "4♣", strain: "club", side: "ns", declarer: null, doubled: true, result: -1 }],
  ])("legge %s", (raw, atteso) => {
    expect(parseParContract(raw)).toEqual(atteso);
  });

  it("deduce la linea da un posto singolo", () => {
    expect(parseParContract("3N-W")?.side).toBe("ew");
    expect(parseParContract("2H-S")?.side).toBe("ns");
    expect(parseParContract("2H-S")?.declarer).toBe("south");
  });

  it("restituisce null su stringhe non riconoscibili", () => {
    // Meglio nessuna proposta che una inventata: se la libreria cambiasse
    // formato, il generatore deve accorgersene invece di assegnare a caso.
    for (const s of ["", "Passo", "8S-NS", "4X-NS", "4S-ZZ", "4S", "abc"]) {
      expect(parseParContract(s), s).toBeNull();
    }
  });
});

describe("parAssignment", () => {
  const prese: Record<Position, number> = { north: 10, east: 3, south: 10, west: 3 };

  it("usa il posto quando il par lo indica", () => {
    const par = parseParContract("3N-E")!;
    expect(parAssignment(par, prese)).toEqual({ contract: "3SA", declarer: "east" });
  });

  it("sceglie un posto quando il par indica solo la linea", () => {
    const par = parseParContract("4S-NS+1")!;
    const a = parAssignment(par, prese);
    expect(a.contract).toBe("4♠");
    expect(["north", "south"]).toContain(a.declarer);
  });

  it("per la linea avversaria sceglie fra Est e Ovest", () => {
    const par = parseParContract("6S-EW")!;
    expect(["east", "west"]).toContain(parAssignment(par, prese).declarer);
  });
});

describe("describePar", () => {
  it("dice chiaramente quando il par è degli avversari", () => {
    // Senza questo sembrerebbe un errore del programma.
    const par = parseParContract("3N-E")!;
    expect(describePar(par, -600)).toContain("Est-Ovest");
    expect(describePar(par, -600)).toContain("-600");
  });

  it("dice quando il par è un sacrificio in perdita", () => {
    const par = parseParContract("4C*-NS-1")!;
    const t = describePar(par, -100);
    expect(t).toContain("contrato");
    expect(t).toContain("sotto di 1");
  });

  it("segnala il segno positivo del punteggio", () => {
    expect(describePar(parseParContract("4S-NS+1")!, 450)).toContain("+450");
  });
});

describe("parAssignmentFromContracts", () => {
  const table = {
    tricks: {
      spade: { north: 11, east: 2, south: 11, west: 2 },
      heart: { north: 8, east: 5, south: 8, west: 5 },
      diamond: { north: 9, east: 4, south: 9, west: 4 },
      club: { north: 6, east: 7, south: 6, west: 7 },
      notrump: { north: 9, east: 4, south: 9, west: 4 },
    },
  } as const;

  it("assegna il par, non il contratto più alto mantenibile", () => {
    // A picche ci sono undici prese, ma il par è 4♠: assegnare 5♠
    // insegnerebbe ad allungare i contratti.
    const a = parAssignmentFromContracts(["4S-NS+1"], table);
    expect(a?.contract).toBe("4♠");
    expect(["north", "south"]).toContain(a?.declarer);
  });

  it("assegna anche quando il par è degli avversari", () => {
    const a = parAssignmentFromContracts(["3N-E"], table);
    expect(a).toEqual(expect.objectContaining({ contract: "3SA", declarer: "east" }));
  });

  it("prende il primo par leggibile fra quelli equivalenti", () => {
    const a = parAssignmentFromContracts(["4C*-NS-1", "3N*-NS-1"], table);
    expect(a?.contract).toBe("4♣");
  });

  it("salta i par illeggibili invece di arrendersi", () => {
    const a = parAssignmentFromContracts(["boh", "4S-NS+1"], table);
    expect(a?.contract).toBe("4♠");
  });

  it("restituisce null se nessun par è leggibile", () => {
    // La mano ricadrà sul contratto di riserva dell'insegnante.
    expect(parAssignmentFromContracts([], table)).toBeNull();
    expect(parAssignmentFromContracts(["Passo"], table)).toBeNull();
  });
});

describe("fra par equivalenti si sceglie quello dichiarabile", () => {
  // Caso reale visto sul solver: par `1C-NS+1,1N-NS`, entrambi 90 punti, ma
  // le fiori sono sei in due. 1♣ non lo dichiara nessuno; 1SA sì.
  const table = {
    tricks: {
      spade: { north: 6, east: 7, south: 6, west: 7 },
      heart: { north: 6, east: 7, south: 6, west: 7 },
      diamond: { north: 6, east: 7, south: 6, west: 7 },
      club: { north: 8, east: 5, south: 8, west: 5 },
      notrump: { north: 7, east: 6, south: 7, west: 6 },
    },
  } as const;

  /** Nord e Sud con `fiori` carte di fiori in due, il resto sparso. */
  function mani(fiori: number): Record<Position, Card[]> {
    const ordine: Card["rank"][] = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
    const nord: Card[] = [];
    const sud: Card[] = [];
    for (let i = 0; i < fiori; i++) {
      (i % 2 === 0 ? nord : sud).push({ suit: "club", rank: ordine[i] });
    }
    const riempi = (h: Card[]) => {
      const semi: Card["suit"][] = ["spade", "heart", "diamond"];
      let k = 0;
      while (h.length < 13) {
        h.push({ suit: semi[k % 3], rank: ordine[Math.floor(k / 3) % 13] });
        k++;
      }
      return h;
    };
    return { north: riempi(nord), east: [], south: riempi(sud), west: [] };
  }

  it("scarta il colore con fit corto in favore del senza atout", () => {
    expect(parAssignmentFromContracts(["1C-NS+1", "1N-NS"], table, mani(6))?.contract).toBe("1SA");
  });

  it("tiene il colore quando il fit basta", () => {
    expect(parAssignmentFromContracts(["1C-NS+1", "1N-NS"], table, mani(8))?.contract).toBe("1♣");
  });

  it("senza le mani non può giudicare e prende il primo", () => {
    expect(parAssignmentFromContracts(["1C-NS+1", "1N-NS"], table)?.contract).toBe("1♣");
  });

  it("se nessun par è dichiarabile ripiega sul primo, così il par resta visibile", () => {
    // Meglio mostrare il par vero con un avviso che nasconderlo.
    expect(parAssignmentFromContracts(["1C-NS+1"], table, mani(6))?.contract).toBe("1♣");
  });
});
