import { describe, expect, it } from "vitest";
import type { Position } from "./bridge-engine";
import type { DdsTable, TableStrain } from "./dds-table";
import { contrattiDaRivedere, dalVostroLato } from "./riepilogo-mano";

/** Tabella comoda da scrivere: prese per denominazione, uguali per i due compagni. */
function tabella(p: Partial<Record<TableStrain, number>>): DdsTable {
  const vuoto = { north: 0, east: 0, south: 0, west: 0 } as Record<Position, number>;
  const tricks = {} as DdsTable["tricks"];
  for (const k of ["spade", "heart", "diamond", "club", "notrump"] as TableStrain[]) {
    const n = p[k] ?? 0;
    tricks[k] = { ...vuoto, north: n, south: n };
  }
  return { tricks };
}

describe("contrattiDaRivedere", () => {
  it("propone per ogni denominazione il contratto che rende di più", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10, notrump: 9, spade: 8 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
    });
    // A picche otto prese: 1♠ e 2♠ valgono lo stesso (110), e a parità vince
    // il più basso — che è anche quello che cade meno spesso.
    expect(righe.map((r) => r.etichetta)).toEqual(["4♥", "3SA", "1♠"]);
  });

  it("con dieci prese a senza propone 3SA, non 4SA", () => {
    // 4SA vale esattamente quanto 3SA e al tavolo non lo dichiara nessuno: il
    // bridge si dichiara per traguardi, e un elenco che li salta insegna a
    // contare le prese invece che a scegliere il contratto.
    const righe = contrattiDaRivedere({
      table: tabella({ notrump: 10 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 430,
      metro: "esatto",
    });
    expect(righe.map((r) => r.etichetta)).toEqual(["3SA"]);
    expect(righe[0].punteggio).toBe(430);
  });

  it("con dodici prese a senza propone lo slam, che vale di più", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ notrump: 12 }),
      lato: "ns", vulnerability: "none", riferimento: 990, metro: "esatto",
    });
    expect(righe[0].etichetta).toBe("6SA");
    expect(righe[0].punteggio).toBe(990);
  });

  it("quando c'è il valore atteso, è quello a scegliere il livello", () => {
    // A carte scoperte lo slam passa e vale 990; in media rende meno della
    // manche, e allora la riga da mostrare è la manche — la stessa che dà le
    // stelle.
    const righe = contrattiDaRivedere({
      table: tabella({ notrump: 12 }),
      lato: "ns", vulnerability: "none", riferimento: 400, metro: "atteso",
      ev: ({ level }) => (level === 3 ? 400 : level === 6 ? 120 : 0),
    });
    expect(righe[0].etichetta).toBe("3SA");
    expect(righe[0].ev).toBe(400);
    // Il punteggio reale resta quello dello slam mancato in tabella: 3SA con
    // dodici prese fa 490.
    expect(righe[0].punteggio).toBe(490);
    expect(righe[0].stelle).toBe(3);
  });

  it("mette in cima quello che rende di più", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10, notrump: 9, club: 11 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
    });
    // 4♥ vale 420, 3SA 400, 5♣ 400: la manche a cuori è la migliore.
    expect(righe[0].etichetta).toBe("4♥");
    expect(righe[0].stelle).toBe(3);
  });

  it("le stelle scendono man mano che il contratto rende meno", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10, spade: 8 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
    });
    const spade = righe.find((r) => r.etichetta === "1♠")!;
    // 1♠ con otto prese: 30 di contratto, 50 di parziale, 30 di presa in più.
    expect(spade.punteggio).toBe(110);
    expect(spade.stelle).toBeLessThan(3);
  });

  it("una denominazione senza sette prese non compare", () => {
    // Un 1♣ che cade non è un contratto da proporre a nessuno.
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10, club: 4 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
    });
    expect(righe.some((r) => r.etichetta.includes("♣"))).toBe(false);
  });

  it("il contratto giocato compare anche se è troppo alto", () => {
    // Cinque cuori dove ne reggevano dieci: è proprio il caso in cui l'elenco
    // serve, e lasciarlo fuori nasconderebbe l'errore da spiegare.
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10, notrump: 9 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
      giocato: { level: 5, strain: "heart" },
    });
    const mio = righe.find((r) => r.tuo)!;
    expect(mio.etichetta).toBe("5♥");
    expect(mio.punteggio).toBe(-50);
    // 470 sotto il riferimento: una stella, non zero — la soglia dello zero è
    // a 500. Vale la pena saperlo: cadere di uno in manche non è il disastro
    // che sembra.
    expect(mio.stelle).toBe(1);
    // E resta in fondo, sotto i contratti che invece passavano.
    expect(righe[righe.length - 1].etichetta).toBe("5♥");
  });

  it("segna il contratto giocato quando coincide con quello proposto", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10 }),
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
      giocato: { level: 4, strain: "heart" },
    });
    expect(righe.filter((r) => r.tuo)).toHaveLength(1);
    expect(righe[0].tuo).toBe(true);
  });

  it("la zona cambia i punteggi", () => {
    const fuori = contrattiDaRivedere({
      table: tabella({ heart: 10 }), lato: "ns", vulnerability: "none",
      riferimento: 0, metro: "esatto",
    });
    const dentro = contrattiDaRivedere({
      table: tabella({ heart: 10 }), lato: "ns", vulnerability: "ns",
      riferimento: 0, metro: "esatto",
    });
    expect(fuori[0].punteggio).toBe(420);
    expect(dentro[0].punteggio).toBe(620);
  });

  it("guarda la linea giusta", () => {
    const tricks = tabella({ heart: 10 }).tricks;
    tricks.spade = { north: 2, south: 2, east: 11, west: 11 };
    const loro = contrattiDaRivedere({
      table: { tricks }, lato: "ew", vulnerability: "none",
      riferimento: 0, metro: "esatto",
    });
    // Undici prese a picche: si dichiara 4♠, non 5♠ — vale lo stesso e cade
    // meno. È proprio la correzione che questa regola porta.
    expect(loro[0].etichetta).toBe("4♠");
    expect(["east", "west"]).toContain(loro[0].declarer);
  });
});

describe("il dichiarante del contratto giocato", () => {
  it("è quello vero, con le SUE prese, non quello che avrebbe fatto meglio", () => {
    // Nord fa dieci prese a cuori, Sud otto: se Sud ha dichiarato, il
    // punteggio della riga dev'essere quello di Sud — altrimenti accanto al
    // vostro contratto comparirebbe un numero diverso da quello del voto.
    const tricks = tabella({}).tricks;
    tricks.heart = { north: 10, south: 8, east: 0, west: 0 };
    const righe = contrattiDaRivedere({
      table: { tricks },
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "atteso",
      giocato: { level: 4, strain: "heart", declarer: "south" },
    });
    const mio = righe.find((r) => r.tuo)!;
    expect(mio.declarer).toBe("south");
    expect(mio.prese).toBe(8);
    expect(mio.punteggio).toBe(-100);
  });

  it("senza dichiarante indicato resta il migliore dei due", () => {
    const tricks = tabella({}).tricks;
    tricks.heart = { north: 10, south: 8, east: 0, west: 0 };
    const righe = contrattiDaRivedere({
      table: { tricks }, lato: "ns", vulnerability: "none",
      riferimento: 420, metro: "atteso",
    });
    expect(righe[0].declarer).toBe("north");
    expect(righe[0].prese).toBe(10);
  });
});

describe("il segno del valore atteso", () => {
  it("per gli avversari è dal LORO punto di vista, come il punteggio", () => {
    // `evDelContratto` risponde sempre come il par, cioè da Nord-Sud: se il
    // segno non venisse girato, il contratto migliore degli avversari
    // comparirebbe come il loro disastro peggiore, accanto a un punteggio
    // positivo. Due numeri sulla stessa riga con due segni diversi.
    const tricks = tabella({}).tricks;
    tricks.heart = { north: 2, south: 2, east: 11, west: 11 };
    const righe = contrattiDaRivedere({
      table: { tricks },
      lato: "ew",
      vulnerability: "none",
      riferimento: 0,
      metro: "esatto",
      // Un 4♥ di Est che rende 620 per loro vale -620 per Nord-Sud.
      ev: () => -620,
    });
    const cuori = righe.find((r) => r.etichetta.includes("♥"))!;
    expect(cuori.punteggio).toBeGreaterThan(0);
    expect(cuori.ev).toBe(620);
  });

  it("per la propria linea resta com'è", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10 }), lato: "ns", vulnerability: "none",
      riferimento: 420, metro: "atteso", ev: () => 420,
    });
    expect(righe[0].ev).toBe(420);
  });
});

describe("lo stesso contratto dai due lati del tavolo", () => {
  it("compare due volte quando le prese cambiano", () => {
    // A carte scoperte l'attacco arriva dalla sinistra del dichiarante: 4♠ di
    // Nord fa dieci prese, di Sud otto. Mostrarne uno solo fa pensare che il
    // conto sia ballerino; mostrarli tutti e due è metà della lezione.
    const tricks = tabella({}).tricks;
    tricks.spade = { north: 10, south: 8, east: 0, west: 0 };
    const righe = contrattiDaRivedere({
      table: { tricks },
      lato: "ns",
      vulnerability: "none",
      riferimento: 420,
      metro: "esatto",
      giocato: { level: 4, strain: "spade", declarer: "south" },
    });
    const picche = righe.filter((r) => r.etichetta === "4♠");
    expect(picche).toHaveLength(2);
    expect(picche.find((r) => r.tuo)!.declarer).toBe("south");
    expect(picche.find((r) => r.tuo)!.prese).toBe(8);
    expect(picche.find((r) => !r.tuo)!.declarer).toBe("north");
    expect(picche.find((r) => !r.tuo)!.prese).toBe(10);
  });

  it("una sola riga quando il dichiarante non cambia niente", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ spade: 10 }),
      lato: "ns", vulnerability: "none", riferimento: 420, metro: "esatto",
      giocato: { level: 4, strain: "spade", declarer: "south" },
    });
    expect(righe.filter((r) => r.etichetta === "4♠")).toHaveLength(1);
  });

  it("«il vostro» segna una riga sola, quella col vostro dichiarante", () => {
    const tricks = tabella({}).tricks;
    tricks.spade = { north: 10, south: 8, east: 0, west: 0 };
    const righe = contrattiDaRivedere({
      table: { tricks }, lato: "ns", vulnerability: "none",
      riferimento: 420, metro: "esatto",
      giocato: { level: 4, strain: "spade", declarer: "south" },
    });
    expect(righe.filter((r) => r.tuo)).toHaveLength(1);
  });
});

describe("un contratto degli avversari non è «il vostro»", () => {
  it("non entra nella tabella della propria linea", () => {
    // In produzione compariva «4♠ di Est ← il vostro», con −400 (i punti che
    // perdono LORO) accanto a +195 (il valore atteso per NOI): due segni
    // opposti sulla stessa riga, e un contratto attribuito a chi non l'aveva
    // dichiarato.
    const righe = contrattiDaRivedere({
      table: tabella({ notrump: 8, club: 9 }),
      lato: "ns",
      vulnerability: "ew",
      riferimento: 100,
      metro: "esatto",
      giocato: { level: 4, strain: "spade", declarer: "east" },
    });
    expect(righe.some((r) => r.tuo)).toBe(false);
    expect(righe.some((r) => r.declarer === "east" || r.declarer === "west")).toBe(false);
  });

  it("ma nella tabella della LORO linea sì", () => {
    const tricks = tabella({}).tricks;
    tricks.spade = { north: 0, south: 0, east: 6, west: 6 };
    const righe = contrattiDaRivedere({
      table: { tricks }, lato: "ew", vulnerability: "ew",
      riferimento: 0, metro: "esatto",
      giocato: { level: 4, strain: "spade", declarer: "east" },
    });
    const mia = righe.find((r) => r.tuo)!;
    expect(mia.declarer).toBe("east");
    // Quattro sottoprese in zona: −400 per loro, ed è il loro punto di vista.
    expect(mia.punteggio).toBe(-400);
  });
});

describe("la sezione degli avversari", () => {
  it("compare anche quando loro non hanno nessun contratto che regge", () => {
    // È la mano in cui la risposta è più interessante: «al massimo facevano
    // 1♥, giù di uno» dice che la mano era vostra. Senza questa opzione la
    // sezione spariva proprio lì.
    const tricks = tabella({}).tricks;
    tricks.heart = { north: 0, south: 0, east: 6, west: 6 };
    const righe = contrattiDaRivedere({
      table: { tricks }, lato: "ew", vulnerability: "none",
      riferimento: 0, metro: "esatto", ancheSenzaContratto: true,
    });
    const cuori = righe.find((r) => r.etichetta.includes("♥"))!;
    expect(cuori.prese).toBe(6);
    expect(cuori.punteggio).toBeLessThan(0);
  });

  it("per la propria linea un contratto che cade resta fuori", () => {
    const righe = contrattiDaRivedere({
      table: tabella({ heart: 10, club: 4 }),
      lato: "ns", vulnerability: "none", riferimento: 420, metro: "atteso",
    });
    expect(righe.some((r) => r.etichetta.includes("♣"))).toBe(false);
  });
});

describe("dalVostroLato — i punti degli avversari si scrivono col meno", () => {
  it("un loro contratto mantenuto è una perdita per voi", () => {
    // Lo screenshot del 16/08/2026: «1SA di Est … 90» si legge come novanta
    // punti guadagnati, mentre sono novanta punti presi.
    expect(dalVostroLato(90)).toBe("-90");
    expect(dalVostroLato(114)).toBe("-114");
  });

  it("un loro contratto che cade è un guadagno, e porta il più", () => {
    expect(dalVostroLato(-100)).toBe("+100");
    expect(dalVostroLato(-50)).toBe("+50");
  });

  it("lo zero non prende segno, e il valore assente resta una lineetta", () => {
    expect(dalVostroLato(0)).toBe("0");
    expect(dalVostroLato(null)).toBe("—");
    expect(dalVostroLato(undefined)).toBe("—");
  });
});
