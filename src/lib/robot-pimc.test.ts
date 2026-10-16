import { describe, it, expect } from "vitest";
import { createGame, playCard, type Card, type GameState, type Position } from "./bridge-engine";
import { generateDeals } from "./deal-generator";
import { campionaMondo, postiVisti, scegliCartaPimc, semiMancanti } from "./robot-pimc";

const chiave = (c: Card) => `${c.rank}-${c.suit}`;

function rngFisso(seme: number): () => number {
  let x = seme >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

/** Una smazzata a 3SA di Sud: Ovest attacca, Nord è il morto. */
function partita(): GameState {
  const { deals } = generateDeals({}, { count: 1, seed: 77 });
  return createGame(deals[0], "3NT", "south");
}

describe("postiVisti", () => {
  it("prima dell'attacco il difensore vede solo la propria mano", () => {
    expect([...postiVisti(partita(), "west")]).toEqual(["west"]);
  });

  it("dopo l'attacco il difensore vede anche il morto", () => {
    const s0 = partita();
    const s1 = playCard(s0, "west", s0.hands.west[0]);
    expect(new Set(postiVisti(s1, "east"))).toEqual(new Set(["east", "north"]));
  });

  it("il dichiarante vede il morto, e chi gioca per il morto vede il dichiarante", () => {
    const s = partita();
    expect(new Set(postiVisti(s, "south"))).toEqual(new Set(["south", "north"]));
    expect(new Set(postiVisti(s, "north"))).toEqual(new Set(["south", "north"]));
  });
});

describe("semiMancanti", () => {
  it("chi non risponde al seme d'attacco ha mostrato di non averne", () => {
    const s = partita();
    const conCarta = (pos: Position, card: Card) => ({ position: pos, card });
    const stato: GameState = {
      ...s,
      tricks: [{
        leader: "west",
        winner: "west",
        plays: [
          conCarta("west", { suit: "spade", rank: "A" }),
          conCarta("north", { suit: "spade", rank: "2" }),
          conCarta("east", { suit: "heart", rank: "3" }),
          conCarta("south", { suit: "spade", rank: "4" }),
        ],
      }],
    };
    expect([...semiMancanti(stato).get("east")!]).toEqual(["spade"]);
    expect(semiMancanti(stato).get("north")!.size).toBe(0);
  });
});

describe("campionaMondo", () => {
  it("lascia identiche le mani viste, rispetta i conti e ridistribuisce solo le carte non viste", () => {
    const s0 = partita();
    const s = playCard(s0, "west", s0.hands.west[0]);
    for (let seme = 1; seme <= 20; seme++) {
      const mondo = campionaMondo(s, "east", rngFisso(seme))!;
      expect(mondo.east).toEqual(s.hands.east);
      expect(mondo.north).toEqual(s.hands.north);
      expect(mondo.west).toHaveLength(s.hands.west.length);
      expect(mondo.south).toHaveLength(s.hands.south.length);
      const coperte = [...s.hands.west, ...s.hands.south].map(chiave).sort();
      expect([...mondo.west, ...mondo.south].map(chiave).sort()).toEqual(coperte);
    }
  });

  it("non dà carte di un seme a chi ha mostrato di non averne", () => {
    const s = partita();
    // Est ha mostrato di non avere picche: in nessun mondo ne riceve.
    const stato: GameState = {
      ...s,
      currentPlayer: "south",
      tricks: [{
        leader: "west",
        winner: "west",
        plays: [
          { position: "west", card: { suit: "spade", rank: "A" } },
          { position: "north", card: { suit: "spade", rank: "2" } },
          { position: "east", card: { suit: "heart", rank: "3" } },
          { position: "south", card: { suit: "spade", rank: "4" } },
        ],
      }],
    };
    for (let seme = 1; seme <= 20; seme++) {
      const mondo = campionaMondo(stato, "south", rngFisso(seme))!;
      expect(mondo.east.some((c) => c.suit === "spade")).toBe(false);
    }
  });
});

describe("scegliCartaPimc", () => {
  it("con una sola carta valida la gioca senza chiedere al solver", async () => {
    const s = partita();
    const stato: GameState = { ...s, hands: { ...s.hands, west: [s.hands.west[0]] } };
    expect(await scegliCartaPimc(stato, "west", { mondi: 5 })).toEqual(s.hands.west[0]);
  });

  it("incassa la vincente in un finale dove ogni distribuzione dice lo stesso", async () => {
    const c = (suit: Card["suit"], rank: Card["rank"]): Card => ({ suit, rank });
    const s = partita();
    const finale: GameState = {
      ...s,
      hands: {
        west: [c("spade", "A"), c("heart", "2")],
        north: [c("club", "2"), c("club", "3")],
        east: [c("heart", "K"), c("diamond", "3")],
        south: [c("club", "4"), c("club", "5")],
      },
      tricks: [],
      currentTrick: [],
      currentPlayer: "west",
      leader: "west",
    };
    // Ovest sa che le picche le ha solo lui e che il ♥K è fuori: l'Asso va incassato subito.
    const carta = await scegliCartaPimc(finale, "west", { mondi: 6, rng: rngFisso(3) });
    expect(carta).toEqual(c("spade", "A"));
  });

  it("su una smazzata intera gioca sempre una carta valida", async () => {
    let s = partita();
    for (let n = 0; n < 8; n++) {
      const chi = s.currentPlayer;
      const carta = await scegliCartaPimc(s, chi, { mondi: 3, rng: rngFisso(n + 1) });
      expect(carta).not.toBeNull();
      s = playCard(s, chi, carta!);
    }
    expect(s.tricks.length).toBe(2);
  });
});
