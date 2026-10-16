import { describe, it, expect } from "vitest";
import type { Suit } from "./bridge-engine";
import {
  aiSelectCard,
  createGame,
  determineTrickWinner,
  getValidCards,
  playCard,
  type Card,
  type GameState,
  type TrickPlay,
  type Position,
} from "./bridge-engine";
import { generateDeals } from "./deal-generator";

function play(position: Position, suit: Card["suit"], rank: Card["rank"]): TrickPlay {
  return { position, card: { suit, rank } };
}

describe("determineTrickWinner", () => {
  it("senza atout: vince la carta piu alta del seme di attacco", () => {
    const trick: TrickPlay[] = [
      play("north", "spade", "7"),
      play("east", "spade", "K"),
      play("south", "spade", "A"),
      play("west", "spade", "2"),
    ];
    expect(determineTrickWinner(trick, null)).toBe("south");
  });

  it("senza atout: le carte di altro seme non vincono (scarto)", () => {
    const trick: TrickPlay[] = [
      play("west", "diamond", "5"),
      play("north", "diamond", "J"),
      play("east", "heart", "A"), // scarto: non vince
      play("south", "diamond", "3"),
    ];
    expect(determineTrickWinner(trick, null)).toBe("north");
  });

  it("con atout: il taglio batte la carta alta del seme di attacco", () => {
    const trick: TrickPlay[] = [
      play("north", "spade", "A"),
      play("east", "heart", "2"), // taglia
      play("south", "spade", "K"),
      play("west", "spade", "3"),
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("east");
  });

  it("con atout: il sopratraglio vince sul taglio", () => {
    const trick: TrickPlay[] = [
      play("north", "spade", "A"),
      play("east", "heart", "2"), // taglio
      play("south", "heart", "5"), // sopratraglio
      play("west", "spade", "3"),
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("south");
  });

  it("con atout ma nessun taglio: vince il seme di attacco", () => {
    const trick: TrickPlay[] = [
      play("south", "club", "Q"),
      play("west", "club", "K"),
      play("north", "club", "4"),
      play("east", "diamond", "A"), // scarto, non atout
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("west");
  });

  it("attacco in atout: vince l'atout piu alto", () => {
    const trick: TrickPlay[] = [
      play("north", "heart", "10"),
      play("east", "heart", "J"),
      play("south", "heart", "A"),
      play("west", "heart", "Q"),
    ];
    expect(determineTrickWinner(trick, "heart")).toBe("south");
  });

  it("lancia se la presa non ha 4 carte", () => {
    expect(() =>
      determineTrickWinner([play("north", "spade", "A")], null)
    ).toThrow();
  });
});

describe("getValidCards", () => {
  const hand: Card[] = [
    { suit: "spade", rank: "A" },
    { suit: "spade", rank: "4" },
    { suit: "heart", rank: "K" },
    { suit: "club", rank: "2" },
  ];

  it("chi attacca puo giocare qualsiasi carta", () => {
    expect(getValidCards(hand, [])).toEqual(hand);
  });

  it("obbligo di risposta al seme: solo le carte del seme di attacco", () => {
    const trick = [play("west", "spade", "9")];
    expect(getValidCards(hand, trick)).toEqual([
      { suit: "spade", rank: "A" },
      { suit: "spade", rank: "4" },
    ]);
  });

  it("senza carte del seme di attacco: tutta la mano e valida", () => {
    const trick = [play("west", "diamond", "9")];
    expect(getValidCards(hand, trick)).toEqual(hand);
  });
});

/**
 * L'invariante su cui si regge l'«annulla» del gioco: la storia delle carte
 * giocate, rigiocata dall'inizio, ricostruisce esattamente lo stato.
 *
 * Se una storia contiene una carta di troppo — due giocate per lo stesso turno,
 * come succedeva quando due timer partivano dalla stessa fotografia dello stato
 * — il replay lancia. In produzione quell'eccezione arrivava fino al browser e
 * rompeva la pagina a chi voleva solo ritirare una carta.
 */
describe("rigiocare la storia", () => {
  const { deals } = generateDeals({}, { count: 1, seed: 42 });
  const mani = deals[0];

  function partita(): { stato: GameState; storia: TrickPlay[] } {
    let stato = createGame(mani, "3SA", "south");
    const storia: TrickPlay[] = [];
    for (let i = 0; i < 8; i++) {
      const chi = stato.currentPlayer;
      const carta = getValidCards(stato.hands[chi], stato.currentTrick)[0];
      storia.push({ position: chi, card: carta });
      stato = playCard(stato, chi, carta);
    }
    return { stato, storia };
  }

  it("ricostruisce lo stesso stato", () => {
    const { stato, storia } = partita();
    let rifatto = createGame(mani, "3SA", "south");
    for (const p of storia) rifatto = playCard(rifatto, p.position, p.card);
    expect(rifatto.currentPlayer).toBe(stato.currentPlayer);
    expect(rifatto.tricks.length).toBe(stato.tricks.length);
    expect(rifatto.hands.north.length).toBe(stato.hands.north.length);
  });

  it("una storia con una carta di troppo lancia: va protetta, non ignorata", () => {
    const { storia } = partita();
    // La stessa posizione due volte di fila: è quello che restava nella storia
    // quando due timer giocavano dalla stessa fotografia.
    const rotta = [...storia.slice(0, 3), storia[2]];
    let stato = createGame(mani, "3SA", "south");
    expect(() => {
      for (const p of rotta) stato = playCard(stato, p.position, p.card);
    }).toThrow(/turn/i);
  });
});

describe("le posizioni parziali", () => {
  /**
   * Metà della didattica del gioco della carta si fa su quattro carte, non su
   * tredici: «come giochi questa combinazione per fare due prese». Il motore
   * chiudeva la mano contando fino a tredici prese, quindi quelle posizioni non
   * finivano mai — si giocava l'ultima carta e il tavolo restava in attesa.
   */
  it("una posizione da due carte a testa finisce dopo due prese", () => {
    const mani: Record<Position, Card[]> = {
      north: [{ suit: "spade", rank: "A" }, { suit: "spade", rank: "2" }],
      east: [{ suit: "spade", rank: "K" }, { suit: "spade", rank: "3" }],
      south: [{ suit: "spade", rank: "Q" }, { suit: "spade", rank: "4" }],
      west: [{ suit: "spade", rank: "J" }, { suit: "spade", rank: "5" }],
    };
    let s = createGame(mani, "1SA", "south");
    // L'attacco è a sinistra del dichiarante: Ovest.
    const ordine: Position[] = ["west", "north", "east", "south"];
    // Otto carte in tutto: due prese da quattro. Si gioca sempre l'ultima
    // della mano di turno, che il motore ha già ordinato.
    for (let mossa = 0; mossa < ordine.length * 2; mossa++) {
      const carte = s.hands[s.currentPlayer];
      s = playCard(s, s.currentPlayer, carte[carte.length - 1]);
    }
    expect(s.phase).toBe("finished");
    expect(s.tricks).toHaveLength(2);
    expect(s.trickCount.ns + s.trickCount.ew).toBe(2);
  });

  it("una smazzata intera finisce ancora dopo tredici prese", () => {
    // La contro-verifica: il cambio non deve toccare il caso normale.
    const semi: Suit[] = ["spade", "heart", "diamond", "club"];
    const ranghi = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const mani: Record<Position, Card[]> = { north: [], east: [], south: [], west: [] };
    const posti: Position[] = ["north", "east", "south", "west"];
    semi.forEach((suit, i) => {
      ranghi.forEach((rank) => mani[posti[i]].push({ suit, rank } as Card));
    });
    let s = createGame(mani, "1SA", "south");
    let giri = 0;
    while (s.phase !== "finished" && giri < 60) {
      const carte = s.hands[s.currentPlayer];
      s = playCard(s, s.currentPlayer, carte[carte.length - 1]);
      giri++;
    }
    expect(s.phase).toBe("finished");
    expect(s.tricks).toHaveLength(13);
  });
});

describe("aiSelectCard: scelte del robot", () => {
  const c = (suit: Suit, rank: Card["rank"]): Card => ({ suit, rank });
  /** Uno stato a 4♥ di Sud con le mani date (non serve che siano complete). */
  function stato(over: Partial<GameState>): GameState {
    return {
      hands: { north: [], east: [], south: [], west: [] },
      tricks: [],
      currentTrick: [],
      currentPlayer: "west",
      leader: "west",
      trumpSuit: "heart",
      declarer: "south",
      dummy: "north",
      contract: "4H",
      trickCount: { ns: 0, ew: 0 },
      phase: "playing",
      openingLead: null,
      ...over,
    };
  }

  it("quarto di mano: non butta l'Asso sotto il taglio avversario", () => {
    const s = stato({
      hands: { north: [], east: [], south: [], west: [c("spade", "A"), c("spade", "4")] },
      currentTrick: [play("north", "spade", "5"), play("east", "spade", "6"), play("south", "heart", "9")],
      currentPlayer: "west",
    });
    expect(aiSelectCard(s, "west")).toEqual(c("spade", "4"));
  });

  it("terzo di mano: non butta l'Asso dopo il taglio del secondo", () => {
    const s = stato({
      hands: { north: [], east: [], south: [c("spade", "A"), c("spade", "4")], west: [] },
      currentTrick: [play("north", "spade", "5"), play("east", "heart", "2")],
      currentPlayer: "south",
    });
    expect(aiSelectCard(s, "south")).toEqual(c("spade", "4"));
  });

  it("senza taglio il quarto di mano vince ancora con la carta più bassa che basta", () => {
    const s = stato({
      hands: { north: [], east: [], south: [], west: [c("spade", "A"), c("spade", "K"), c("spade", "4")] },
      currentTrick: [play("north", "spade", "5"), play("east", "spade", "6"), play("south", "spade", "Q")],
      currentPlayer: "west",
    });
    expect(aiSelectCard(s, "west")).toEqual(c("spade", "K"));
  });

  it("in attacco un Re secondo non è un onore scoperto se l'Asso è già uscito", () => {
    const giaGiocata = {
      leader: "west" as Position,
      winner: "north" as Position,
      plays: [play("west", "diamond", "2"), play("north", "spade", "A"), play("east", "diamond", "3"), play("south", "diamond", "4")],
    };
    const s = stato({
      hands: { north: [], east: [], south: [], west: [c("spade", "K"), c("spade", "2"), c("club", "7"), c("club", "4"), c("club", "3"), c("club", "2")] },
      tricks: [giaGiocata],
      currentPlayer: "west",
    });
    expect(aiSelectCard(s, "west")).toEqual(c("spade", "K"));
  });

  it("in difesa con quattro atout non attacca in atout", () => {
    const s = stato({
      hands: {
        north: [], east: [], south: [],
        west: [c("heart", "8"), c("heart", "7"), c("heart", "5"), c("heart", "4"), c("club", "Q"), c("club", "J"), c("club", "10"), c("diamond", "3"), c("diamond", "2")],
      },
      currentPlayer: "west",
    });
    expect(aiSelectCard(s, "west")).toEqual(c("club", "Q"));
  });
});
