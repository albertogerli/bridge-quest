import { describe, it, expect } from "vitest";
import { generateDeals } from "./deal-generator";
import { dealsToSmazzate, licitaVersoIlContratto } from "./deals-to-smazzate";
import type { Card, Position, Rank, Suit } from "./bridge-engine";

const { deals } = generateDeals({}, { count: 4, seed: 2026 });
const base = { idPrefix: "gen-1", contract: "3NT", declarer: "south" as const, title: "Apertura di 1NT" };

describe("dealsToSmazzate", () => {
  const smazzate = dealsToSmazzate(deals, base);

  it("produce una smazzata per mano, con id unici", () => {
    expect(smazzate).toHaveLength(4);
    expect(new Set(smazzate.map((s) => s.id)).size).toBe(4);
  });

  it("numera i board da 1 e li rispecchia nel titolo", () => {
    expect(smazzate.map((s) => s.board)).toEqual([1, 2, 3, 4]);
    expect(smazzate[2].title).toBe("Apertura di 1NT — mano 3");
  });

  it("conserva le carte senza toccarle", () => {
    for (let i = 0; i < deals.length; i++) {
      expect(smazzate[i].hands.north).toEqual(deals[i].north);
      expect(smazzate[i].hands.south).toEqual(deals[i].south);
    }
  });

  it("ruota la vulnerabilità invece di lasciarla sempre uguale", () => {
    expect(smazzate.map((s) => s.vulnerability)).toEqual(["none", "ns", "ew", "both"]);
  });
});

describe("dealsToSmazzate — attacco", () => {
  it("attacca il giocatore alla sinistra del dichiarante", () => {
    // Dichiarante Sud => attacca Ovest. La carta deve appartenergli davvero.
    const s = dealsToSmazzate(deals, base)[0];
    const ovest = s.hands.west;
    expect(
      ovest.some((c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank)
    ).toBe(true);
  });

  it("con dichiarante Nord attacca Est", () => {
    const s = dealsToSmazzate(deals, { ...base, declarer: "north" })[0];
    expect(
      s.hands.east.some((c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank)
    ).toBe(true);
  });

  it("a colore non attacca nell'atout se ha alternative", () => {
    // Regola dell'attacco naturale: si esce nel colore lungo NON di atout.
    for (const s of dealsToSmazzate(deals, { ...base, contract: "4♠" })) {
      const haAltro = s.hands.west.some((c) => c.suit !== "spade");
      if (haAltro) expect(s.openingLead.suit).not.toBe("spade");
    }
  });

  it("accetta il contratto sia in simboli sia in lettere", () => {
    const conSimbolo = dealsToSmazzate(deals, { ...base, contract: "4♥" })[0];
    const conLettera = dealsToSmazzate(deals, { ...base, contract: "4H" })[0];
    expect(conSimbolo.openingLead).toEqual(conLettera.openingLead);
  });

  it("un contratto malformato non fa esplodere nulla", () => {
    const s = dealsToSmazzate(deals, { ...base, contract: "boh" })[0];
    expect(s.openingLead).toBeDefined();
    expect(s.hands.west).toHaveLength(13);
  });
});

describe("dealsToSmazzate — contratto per singola mano", () => {
  it("usa il contratto specifico dove c'è, il generale dove manca", () => {
    // Un contratto unico per tutte le mani è per forza sbagliato su alcune:
    // impossibile su quelle deboli, troppo timido su quelle forti.
    const s = dealsToSmazzate(deals, {
      ...base,
      perHand: [
        { contract: "4♠", declarer: "north" },
        null,
        { contract: "2♥", declarer: "east" },
      ],
    });
    expect(s[0].contract).toBe("4♠");
    expect(s[0].declarer).toBe("north");
    expect(s[1].contract).toBe("3NT");   // ricade sul generale
    expect(s[1].declarer).toBe("south");
    expect(s[2].contract).toBe("2♥");
    expect(s[3].contract).toBe("3NT");   // oltre la fine dell'elenco
  });

  it("l'attacco segue il dichiarante della singola mano", () => {
    // Con Nord dichiarante attacca Est: se l'attacco restasse legato al
    // dichiarante generale, la carta apparterrebbe al giocatore sbagliato.
    const s = dealsToSmazzate(deals, {
      ...base,
      perHand: [{ contract: "4♠", declarer: "north" }],
    })[0];
    expect(
      s.hands.east.some((c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank)
    ).toBe(true);
  });

  it("l'atout dell'attacco segue il contratto della singola mano", () => {
    const s = dealsToSmazzate(deals, {
      ...base,
      perHand: [{ contract: "4♠", declarer: "south" }],
    })[0];
    const haAltro = s.hands.west.some((c) => c.suit !== "spade");
    if (haAltro) expect(s.openingLead.suit).not.toBe("spade");
  });
});

describe("licitaVersoIlContratto — compiti di solo gioco della carta", () => {
  /** Mano da notazione compatta "AKQ32.J54.T98.76". */
  function mano(s: string): Card[] {
    const semi: Suit[] = ["spade", "heart", "diamond", "club"];
    const out: Card[] = [];
    s.split(".").forEach((gruppo, i) => {
      for (const ch of gruppo) out.push({ suit: semi[i], rank: (ch === "T" ? "10" : ch) as Rank });
    });
    return out;
  }
  const quattro = (sud: string): Record<Position, Card[]> => ({
    north: mano("432.432.432.4321"), east: mano("765.765.765.7652"),
    south: mano(sud), west: mano("98.98.98.98765"),
  });

  it("usa l'apertura vera quando porta al contratto finale", () => {
    // Sud ha il maggiore quinto: apre 1♠ e il compagno alza a 4♠.
    const b = licitaVersoIlContratto(quattro("AKJ82.K74.Q93.54"), "4♠", "south");
    expect(b.dealer).toBe("south");
    expect(b.bids).toEqual(["1S", "P", "4S", "P", "P", "P"]);
  });

  it("ripiega sulla forma minima se l'apertura è di un altro colore", () => {
    // Apre 1♠ ma il contratto è a senza atout: la sequenza non starebbe in
    // piedi, meglio spoglia che inventata.
    const b = licitaVersoIlContratto(quattro("AKJ82.K74.Q93.54"), "3SA", "south");
    expect(b.bids).toEqual(["3NT", "P", "P", "P"]);
  });

  it("ripiega quando la regola d'apertura tace", () => {
    const b = licitaVersoIlContratto(quattro("432.543.6542.765"), "2♠", "south");
    expect(b.bids).toEqual(["2S", "P", "P", "P"]);
  });

  it("il mazziere è sempre il dichiarante", () => {
    expect(licitaVersoIlContratto(quattro("AKJ82.K74.Q93.54"), "4♠", "south").dealer).toBe("south");
  });

  it("le smazzate ricevono la licita solo se richiesta", () => {
    const deal = quattro("AKJ82.K74.Q93.54");
    const senza = dealsToSmazzate([deal], { idPrefix: "x", contract: "4♠", declarer: "south", title: "T" });
    const con = dealsToSmazzate([deal], { idPrefix: "x", contract: "4♠", declarer: "south", title: "T", conLicita: true });
    expect(senza[0].bidding).toBeUndefined();
    expect(con[0].bidding?.bids[0]).toBe("1S");
  });
});
