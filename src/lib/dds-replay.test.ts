import { describe, it, expect } from "vitest";
import { analyseReplay, significantMoments, type PlayedTrick } from "./dds-replay";
import { generateDeals } from "./deal-generator";
import { calcDdsTable } from "./dds-table";
import type { Card, Position } from "./bridge-engine";

const SEATS: Position[] = ["north", "east", "south", "west"];
const RANK_VALUE: Record<string, number> = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,J:11,Q:12,K:13,A:14 };

/**
 * Gioca la mano scegliendo sempre la prima carta legale: non è gioco sensato,
 * ma produce una sequenza di 13 prese valida, che è ciò che serve per provare
 * la ricostruzione della posizione.
 */
function playRandomly(
  hands: Record<Position, Card[]>,
  trump: string | null,
  firstLeader: Position
): PlayedTrick[] {
  const h: Record<Position, Card[]> = {
    north: [...hands.north], east: [...hands.east], south: [...hands.south], west: [...hands.west],
  };
  const tricks: PlayedTrick[] = [];
  let leader = firstLeader;
  for (let t = 0; t < 13; t++) {
    const cards: { player: string; card: Card }[] = [];
    let ledSuit: string | null = null;
    for (let i = 0; i < 4; i++) {
      const seat = SEATS[(SEATS.indexOf(leader) + i) % 4];
      const legal: Card[] =
        ledSuit && h[seat].some((c) => c.suit === ledSuit)
          ? h[seat].filter((c) => c.suit === ledSuit)
          : h[seat];
      const card: Card = legal[0];
      h[seat].splice(h[seat].findIndex((c) => c.suit === card.suit && c.rank === card.rank), 1);
      if (i === 0) ledSuit = card.suit;
      cards.push({ player: seat, card });
    }
    let winner = 0;
    for (let i = 1; i < 4; i++) {
      const c = cards[i].card, w = cards[winner].card;
      const cT = c.suit === trump, wT = w.suit === trump;
      if (cT && !wT) winner = i;
      else if (cT === wT && c.suit === w.suit && RANK_VALUE[c.rank] > RANK_VALUE[w.rank]) winner = i;
      else if (!cT && !wT && c.suit === ledSuit && w.suit !== ledSuit) winner = i;
    }
    tricks.push({ cards, winner: cards[winner].player });
    leader = cards[winner].player as Position;
  }
  return tricks;
}

const { deals } = generateDeals({}, { count: 2, seed: 31 });

describe("analyseReplay", () => {
  it("produce una voce per ogni presa giocata", async () => {
    const tricks = playRandomly(deals[0], null, "west");
    const a = await analyseReplay(deals[0], tricks, null, "south");
    expect(a.points).toHaveLength(13);
    expect(a.points.map((p) => p.trick)).toEqual([...Array(13)].map((_, i) => i + 1));
  }, 200000);

  it("all'ultima presa il potenziale coincide con le prese davvero fatte", async () => {
    // Invariante forte: finite le carte non resta nulla da ottenere, quindi il
    // totale ottenibile DEVE essere il risultato reale. Se non torna, la
    // ricostruzione della posizione sta perdendo o duplicando carte.
    const tricks = playRandomly(deals[0], null, "west");
    const a = await analyseReplay(deals[0], tricks, null, "south");
    const ultima = a.points[12];
    expect(ultima.potential).toBe(ultima.won);
    expect(ultima.won).toBe(a.finalTricks);
  }, 200000);

  it("il potenziale iniziale coincide con la tabella double dummy", async () => {
    // Prima che sia giocata una carta, il totale ottenibile è per definizione
    // il valore della tabella per quel contratto.
    const tricks = playRandomly(deals[1], null, "west");
    const a = await analyseReplay(deals[1], tricks, null, "south");
    const table = await calcDdsTable(deals[1]);
    expect(a.initialPotential).toBe(table.tricks.notrump.south);
  }, 200000);

  it("le prese vinte non diminuiscono mai", async () => {
    const tricks = playRandomly(deals[0], null, "west");
    const a = await analyseReplay(deals[0], tricks, null, "south");
    for (let i = 1; i < a.points.length; i++) {
      expect(a.points[i].won).toBeGreaterThanOrEqual(a.points[i - 1].won);
    }
  }, 200000);

  it("funziona anche a colore", async () => {
    const tricks = playRandomly(deals[0], "spade", "west");
    const a = await analyseReplay(deals[0], tricks, "spade", "south");
    expect(a.points[12].potential).toBe(a.finalTricks);
  }, 200000);
});

describe("significantMoments", () => {
  it("scarta le prese in cui non è cambiato nulla", async () => {
    const tricks = playRandomly(deals[0], null, "west");
    const a = await analyseReplay(deals[0], tricks, null, "south");
    const momenti = significantMoments(a);
    expect(momenti.every((m) => m.delta !== 0)).toBe(true);
    expect(momenti.length).toBeLessThanOrEqual(a.points.length);
  }, 200000);

  it("mette per primo il calo maggiore", async () => {
    const finto = {
      points: [
        { trick: 1, won: 0, potential: 9, delta: 0 },
        { trick: 2, won: 1, potential: 8, delta: -1 },
        { trick: 3, won: 1, potential: 6, delta: -2 },
        { trick: 4, won: 2, potential: 7, delta: 1 },
      ],
      initialPotential: 9,
      finalTricks: 7,
    };
    const m = significantMoments(finto);
    expect(m[0].trick).toBe(3);
    expect(m[0].delta).toBe(-2);
  });
});
