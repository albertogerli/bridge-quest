import { describe, it, expect } from "vitest";
import type { Card, Position, Suit } from "./bridge-engine";
import {
  DEAL_TEMPLATES,
  generateDeals,
  handHcp,
  handShape,
  isBalanced,
  satisfiesDeal,
  satisfiesSeat,
  sortHand,
  suitLengths,
} from "./deal-generator";

const POSITIONS: Position[] = ["north", "east", "south", "west"];

function hand(spec: string): Card[] {
  // "AKQ.432.T98.7654" — picche.cuori.quadri.fiori, T sta per 10
  const suits: Suit[] = ["spade", "heart", "diamond", "club"];
  const cards: Card[] = [];
  spec.split(".").forEach((chars, i) => {
    for (const ch of chars) {
      cards.push({ suit: suits[i], rank: (ch === "T" ? "10" : ch) as Card["rank"] });
    }
  });
  return cards;
}

describe("handHcp", () => {
  it("conta 4-3-2-1 per A-K-Q-J", () => {
    expect(handHcp(hand("AKQJ........."))).toBe(10);
  });

  it("il mazzo intero vale 40 punti", () => {
    // Proprietà che deve valere sempre: se la somma delle quattro mani non fa
    // 40, il generatore sta perdendo o duplicando carte.
    const { deals } = generateDeals({}, { count: 1, seed: 7 });
    const totale = POSITIONS.reduce((sum, p) => sum + handHcp(deals[0][p]), 0);
    expect(totale).toBe(40);
  });

  it("una mano senza onori vale 0", () => {
    expect(handHcp(hand("2345.6789.234.56"))).toBe(0);
  });
});

describe("handShape e isBalanced", () => {
  it("riporta le lunghezze in ordine decrescente", () => {
    expect(handShape(hand("AKQJ.234.567.89T"))).toBe("4333");
    expect(handShape(hand("AKQJ2.34.567.89T"))).toBe("5332");
  });

  it("riconosce le tre sagome bilanciate", () => {
    expect(isBalanced(hand("AKQJ.234.567.89T"))).toBe(true); // 4333
    expect(isBalanced(hand("AKQJ2.34.567.89T"))).toBe(true); // 5332
    expect(isBalanced(hand("AKQJ.2345.678.9T"))).toBe(true); // 4432
  });

  it("esclude singole, vuoti e due doubleton", () => {
    expect(isBalanced(hand("AKQJ23.45.678.9T"))).toBe(false); // 6322
    expect(isBalanced(hand("AKQJ234.567.89.T"))).toBe(false); // singola
    expect(isBalanced(hand("AKQJ2345.678.9T."))).toBe(false); // vuoto
  });
});

describe("satisfiesSeat", () => {
  const bilanciata15 = hand("AKQ2.KQ3.J54.987"); // 4-3-3-3, 15 PO

  it("accetta una mano dentro i limiti", () => {
    expect(satisfiesSeat(bilanciata15, { hcp: { min: 15, max: 17 }, balanced: true })).toBe(true);
  });

  it("rifiuta fuori intervallo su entrambi i lati", () => {
    expect(satisfiesSeat(bilanciata15, { hcp: { min: 16 } })).toBe(false);
    expect(satisfiesSeat(bilanciata15, { hcp: { max: 14 } })).toBe(false);
  });

  it("tratta gli estremi come inclusivi", () => {
    expect(satisfiesSeat(bilanciata15, { hcp: { min: 15, max: 15 } })).toBe(true);
  });

  it("un intervallo senza estremi non vincola nulla", () => {
    expect(satisfiesSeat(bilanciata15, { hcp: {} })).toBe(true);
    expect(satisfiesSeat(bilanciata15, {})).toBe(true);
    expect(satisfiesSeat(bilanciata15, undefined)).toBe(true);
  });

  it("balanced: false richiede una mano NON bilanciata", () => {
    expect(satisfiesSeat(bilanciata15, { balanced: false })).toBe(false);
    expect(satisfiesSeat(hand("AKQJ234.567.89.T"), { balanced: false })).toBe(true);
  });

  it("filtra per lunghezza di seme", () => {
    expect(satisfiesSeat(bilanciata15, { spade: { min: 4 } })).toBe(true);
    expect(satisfiesSeat(bilanciata15, { spade: { min: 5 } })).toBe(false);
  });

  it("filtra per sagoma senza riguardo al seme", () => {
    // "5431" deve valere sia con 5 picche sia con 5 fiori.
    expect(satisfiesSeat(hand("AKQJ2.345.67.89T"), { shapes: ["5332"] })).toBe(true);
    expect(satisfiesSeat(hand("AKQJ2.345.67.89T"), { shapes: ["4432"] })).toBe(false);
  });
});

describe("satisfiesDeal — vincoli di coppia", () => {
  it("somma i punti dei due compagni", () => {
    const { deals } = generateDeals({ nsHcp: { min: 25, max: 26 } }, { count: 3, seed: 42 });
    expect(deals.length).toBe(3);
    for (const d of deals) {
      const ns = handHcp(d.north) + handHcp(d.south);
      expect(ns).toBeGreaterThanOrEqual(25);
      expect(ns).toBeLessThanOrEqual(26);
    }
  });

  it("nsHcp e ewHcp sono complementari a 40", () => {
    const { deals } = generateDeals({ ewHcp: { min: 30 } }, { count: 2, seed: 5 });
    for (const d of deals) {
      expect(handHcp(d.east) + handHcp(d.west)).toBeGreaterThanOrEqual(30);
      expect(handHcp(d.north) + handHcp(d.south)).toBeLessThanOrEqual(10);
    }
  });
});

describe("generateDeals — correttezza della distribuzione", () => {
  const { deals } = generateDeals({}, { count: 5, seed: 123 });

  it("produce quattro mani da tredici carte", () => {
    for (const d of deals) {
      for (const p of POSITIONS) expect(d[p]).toHaveLength(13);
    }
  });

  it("usa tutte e 52 le carte, senza duplicati né mancanti", () => {
    // Il difetto più insidioso di un distributore: una carta in due mani.
    for (const d of deals) {
      const tutte = POSITIONS.flatMap((p) => d[p].map((c) => `${c.rank}${c.suit}`));
      expect(new Set(tutte).size).toBe(52);
    }
  });

  it("ogni seme ha esattamente 13 carte in giro", () => {
    for (const d of deals) {
      const lunghezze = POSITIONS.reduce(
        (acc, p) => {
          const l = suitLengths(d[p]);
          for (const s of ["spade", "heart", "diamond", "club"] as Suit[]) acc[s] += l[s];
          return acc;
        },
        { spade: 0, heart: 0, diamond: 0, club: 0 } as Record<Suit, number>
      );
      expect(Object.values(lunghezze)).toEqual([13, 13, 13, 13]);
    }
  });
});

describe("generateDeals — determinismo", () => {
  it("stesso seme e stessi vincoli danno le stesse mani", () => {
    // Serve a ridistribuire alla classe la stessa serie e a rendere
    // riproducibile un compito assegnato mesi prima.
    const vincoli = { south: { hcp: { min: 15, max: 17 }, balanced: true } };
    const a = generateDeals(vincoli, { count: 4, seed: 2026 });
    const b = generateDeals(vincoli, { count: 4, seed: 2026 });
    expect(a.deals).toEqual(b.deals);
    expect(a.attempts).toBe(b.attempts);
  });

  it("semi diversi danno mani diverse", () => {
    const a = generateDeals({}, { count: 1, seed: 1 });
    const b = generateDeals({}, { count: 1, seed: 2 });
    expect(a.deals[0]).not.toEqual(b.deals[0]);
  });

  it("non dipende dall'orologio né da Math.random", () => {
    // Se il generatore usasse Math.random, due chiamate consecutive con lo
    // stesso seme divergerebbero.
    const seq = Array.from({ length: 3 }, () => generateDeals({}, { count: 1, seed: 99 }).deals[0]);
    expect(seq[0]).toEqual(seq[1]);
    expect(seq[1]).toEqual(seq[2]);
  });
});

describe("generateDeals — vincoli difficili o impossibili", () => {
  it("segnala l'esaurimento invece di bloccarsi", () => {
    // 40 punti in una sola mano: esiste, ma è una su ~10^11. Deve fermarsi.
    const r = generateDeals({ south: { hcp: { min: 40 } } }, { count: 1, seed: 3, maxAttempts: 500 });
    expect(r.exhausted).toBe(true);
    expect(r.deals).toHaveLength(0);
    expect(r.attempts).toBe(500);
  });

  it("un vincolo contraddittorio non produce nulla e non lancia", () => {
    const r = generateDeals(
      { south: { hcp: { min: 20, max: 10 } } },
      { count: 2, seed: 1, maxAttempts: 300 }
    );
    expect(r.deals).toHaveLength(0);
    expect(r.exhausted).toBe(true);
  });

  it("restituisce le mani trovate anche se sono meno del richiesto", () => {
    const r = generateDeals(
      { south: { hcp: { min: 28 } } },
      { count: 10, seed: 8, maxAttempts: 4000 }
    );
    expect(r.deals.length).toBeLessThan(10);
    expect(r.exhausted).toBe(true);
    // Quelle trovate devono comunque rispettare il vincolo.
    for (const d of r.deals) expect(handHcp(d.south)).toBeGreaterThanOrEqual(28);
  });

  it("count zero non gira a vuoto", () => {
    const r = generateDeals({}, { count: 0, seed: 1 });
    expect(r.deals).toHaveLength(0);
    expect(r.exhausted).toBe(false);
    expect(r.attempts).toBe(0);
  });
});

describe("generateDeals — il campione non deve essere distorto", () => {
  // La proprietà che distingue un distributore corretto da uno che "funziona":
  // le sagome devono comparire con le frequenze reali del bridge. Un metodo
  // costruttivo (prima gli onori, poi il riempimento) supererebbe tutti i test
  // precedenti e fallirebbe qui, producendo mani innaturali su cui gli allievi
  // si formerebbero aspettative sbagliate.
  //
  // Frequenze di riferimento: Encyclopedia of Bridge. Verificate su 80.000
  // mani con scarto massimo di 0,31 punti percentuali; qui il campione è più
  // piccolo per non rallentare la suite, quindi la tolleranza è più larga.
  const CAMPIONE = 2000;
  const { deals } = generateDeals({}, { count: CAMPIONE, seed: 20260811, maxAttempts: CAMPIONE + 10 });
  const mani = deals.flatMap((d) => POSITIONS.map((p) => d[p]));

  it.each([
    ["4432", 21.55],
    ["5332", 15.52],
    ["5431", 12.93],
    ["4333", 10.54],
  ])("la sagoma %s compare circa nel %s%% dei casi", (sagoma, attesa) => {
    const osservata = (mani.filter((h) => handShape(h) === sagoma).length / mani.length) * 100;
    expect(Math.abs(osservata - (attesa as number))).toBeLessThan(2);
  });

  it("i punti onori medi per mano sono 10", () => {
    // Vale per costruzione (40 punti diviso 4): se non torna, il distributore
    // sta perdendo carte.
    const media = mani.reduce((s, h) => s + handHcp(h), 0) / mani.length;
    expect(media).toBeCloseTo(10, 1);
  });
});

describe("sortHand", () => {
  it("ordina per seme e per rango decrescente", () => {
    const ordinata = sortHand(hand("2AK.Q3.J.98765432").slice(0, 13));
    const primi = ordinata.slice(0, 3).map((c) => c.rank);
    expect(primi).toEqual(["A", "K", "2"]);
  });

  it("non modifica la mano ricevuta", () => {
    const originale = hand("AKQJ.234.567.89T");
    const copia = [...originale];
    sortHand(originale);
    expect(originale).toEqual(copia);
  });
});

describe("DEAL_TEMPLATES", () => {
  it("hanno identificatori unici", () => {
    const ids = DEAL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ognuno produce davvero mani conformi", () => {
    // Un modello che non genera nulla sarebbe peggio di non averlo: la prova
    // gira su tutti, così un vincolo scritto male si vede subito.
    for (const t of DEAL_TEMPLATES) {
      const r = generateDeals(t.constraints, { count: 2, seed: 2026, maxAttempts: 60_000 });
      expect(r.deals.length, `modello "${t.id}" non genera mani`).toBe(2);
      for (const d of r.deals) {
        expect(satisfiesDeal(d, t.constraints), `modello "${t.id}" produce mani non conformi`).toBe(true);
      }
    }
  });
});
