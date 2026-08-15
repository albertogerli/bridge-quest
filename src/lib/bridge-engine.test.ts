import { describe, it, expect } from "vitest";
import {
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
