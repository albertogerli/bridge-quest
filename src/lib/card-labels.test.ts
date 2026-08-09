import { describe, it, expect } from "vitest";
import {
  bidAriaLabel,
  cardAriaLabel,
  handAriaLabel,
  normalizeSuit,
  positionAriaLabel,
  rankAriaLabel,
  suitAriaLabel,
  trickCardAriaLabel,
  type CardRank,
  type CardSuit,
} from "./card-labels";

const ALL_SUITS: CardSuit[] = ["spade", "heart", "diamond", "club"];
const ALL_RANKS: CardRank[] = [
  "A",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];

describe("normalizeSuit", () => {
  it("accetta le chiavi interne", () => {
    for (const suit of ALL_SUITS) {
      expect(normalizeSuit(suit)).toBe(suit);
    }
  });

  it("accetta i simboli Unicode", () => {
    expect(normalizeSuit("♠")).toBe("spade");
    expect(normalizeSuit("♥")).toBe("heart");
    expect(normalizeSuit("♦")).toBe("diamond");
    expect(normalizeSuit("♣")).toBe("club");
  });

  it("accetta le sigle PBN maiuscole e minuscole", () => {
    expect(normalizeSuit("S")).toBe("spade");
    expect(normalizeSuit("h")).toBe("heart");
    expect(normalizeSuit("D")).toBe("diamond");
    expect(normalizeSuit("c")).toBe("club");
  });

  it("restituisce null per input non riconosciuti", () => {
    expect(normalizeSuit("")).toBeNull();
    expect(normalizeSuit("NT")).toBeNull();
    expect(normalizeSuit("x")).toBeNull();
  });
});

describe("suitAriaLabel", () => {
  it("traduce tutti e quattro i semi in italiano", () => {
    expect(suitAriaLabel("spade")).toBe("picche");
    expect(suitAriaLabel("heart")).toBe("cuori");
    expect(suitAriaLabel("diamond")).toBe("quadri");
    expect(suitAriaLabel("club")).toBe("fiori");
  });

  it("funziona anche partendo dal simbolo", () => {
    expect(suitAriaLabel("♦")).toBe("quadri");
  });

  it("restituisce stringa vuota per semi ignoti", () => {
    expect(suitAriaLabel("zzz")).toBe("");
  });
});

describe("rankAriaLabel", () => {
  it("traduce le figure", () => {
    expect(rankAriaLabel("A")).toBe("Asso");
    expect(rankAriaLabel("K")).toBe("Re");
    expect(rankAriaLabel("Q")).toBe("Donna");
    expect(rankAriaLabel("J")).toBe("Fante");
  });

  it("normalizza la T del formato PBN in 10", () => {
    expect(rankAriaLabel("T")).toBe("10");
    expect(rankAriaLabel("t")).toBe("10");
  });

  it("lascia invariate le cartine", () => {
    for (const rank of ["10", "9", "8", "7", "6", "5", "4", "3", "2"]) {
      expect(rankAriaLabel(rank)).toBe(rank);
    }
  });
});

describe("cardAriaLabel", () => {
  it("genera l'etichetta per tutte le 52 carte", () => {
    const labels = new Set<string>();
    for (const suit of ALL_SUITS) {
      for (const rank of ALL_RANKS) {
        const label = cardAriaLabel({ suit, rank });
        expect(label).toMatch(/^\S.* di (picche|cuori|quadri|fiori)$/);
        labels.add(label);
      }
    }
    expect(labels.size).toBe(52);
  });

  it("usa la terminologia italiana del bridge per le figure", () => {
    expect(cardAriaLabel({ suit: "spade", rank: "A" })).toBe("Asso di picche");
    expect(cardAriaLabel({ suit: "heart", rank: "K" })).toBe("Re di cuori");
    expect(cardAriaLabel({ suit: "diamond", rank: "Q" })).toBe("Donna di quadri");
    expect(cardAriaLabel({ suit: "club", rank: "J" })).toBe("Fante di fiori");
    expect(cardAriaLabel({ suit: "spade", rank: "10" })).toBe("10 di picche");
    expect(cardAriaLabel({ suit: "club", rank: "2" })).toBe("2 di fiori");
  });

  it("accetta i simboli usati da CardDisplay", () => {
    expect(cardAriaLabel({ suit: "♥", rank: "Q" })).toBe("Donna di cuori");
    expect(cardAriaLabel({ suit: "♣", rank: "T" })).toBe("10 di fiori");
  });

  it("degrada senza rompersi su input parziali", () => {
    expect(cardAriaLabel({ suit: "boh", rank: "A" })).toBe("Asso");
    expect(cardAriaLabel({ suit: "spade", rank: "" })).toBe("picche");
    expect(cardAriaLabel({ suit: "", rank: "" })).toBe("");
  });
});

describe("positionAriaLabel", () => {
  it("traduce le posizioni estese e le sigle", () => {
    expect(positionAriaLabel("north")).toBe("Nord");
    expect(positionAriaLabel("south")).toBe("Sud");
    expect(positionAriaLabel("east")).toBe("Est");
    expect(positionAriaLabel("west")).toBe("Ovest");
    expect(positionAriaLabel("N")).toBe("Nord");
    expect(positionAriaLabel("w")).toBe("Ovest");
  });

  it("restituisce stringa vuota per posizioni ignote", () => {
    expect(positionAriaLabel("centro")).toBe("");
  });
});

describe("trickCardAriaLabel", () => {
  it("descrive chi ha giocato cosa", () => {
    expect(trickCardAriaLabel("south", { suit: "spade", rank: "A" })).toBe(
      "Sud gioca Asso di picche"
    );
  });

  it("ripiega sulla sola carta se la posizione è ignota", () => {
    expect(trickCardAriaLabel("?", { suit: "heart", rank: "3" })).toBe("3 di cuori");
  });
});

describe("bidAriaLabel", () => {
  it("traduce le dichiarazioni di colore", () => {
    expect(bidAriaLabel("1S")).toBe("1 picche");
    expect(bidAriaLabel("4H")).toBe("4 cuori");
    expect(bidAriaLabel("2D")).toBe("2 quadri");
    expect(bidAriaLabel("7C")).toBe("7 fiori");
    expect(bidAriaLabel("1♠")).toBe("1 picche");
  });

  it("traduce i senza atout in entrambe le notazioni", () => {
    expect(bidAriaLabel("1NT")).toBe("1 senza atout");
    expect(bidAriaLabel("3SA")).toBe("3 senza atout");
  });

  it("traduce passo, contro e surcontro", () => {
    expect(bidAriaLabel("P")).toBe("Passo");
    expect(bidAriaLabel("Passo")).toBe("Passo");
    expect(bidAriaLabel("X")).toBe("Contro");
    expect(bidAriaLabel("Contre")).toBe("Contro");
    expect(bidAriaLabel("XX")).toBe("Surcontro");
    expect(bidAriaLabel("Surcontro")).toBe("Surcontro");
  });

  it("restituisce stringa vuota per le celle vuote", () => {
    expect(bidAriaLabel("—")).toBe("");
    expect(bidAriaLabel("")).toBe("");
  });

  it("non altera input non riconosciuti", () => {
    expect(bidAriaLabel("boh")).toBe("boh");
    expect(bidAriaLabel("9S")).toBe("9S");
  });
});

describe("handAriaLabel", () => {
  it("raggruppa per seme e segnala i vuoti", () => {
    const label = handAriaLabel([
      { suit: "spade", rank: "A" },
      { suit: "spade", rank: "4" },
      { suit: "diamond", rank: "K" },
    ]);
    expect(label).toBe(
      "Picche: Asso, 4. Cuori: nessuna carta. Quadri: Re. Fiori: nessuna carta"
    );
  });

  it("prefissa il proprietario quando indicato", () => {
    expect(handAriaLabel([{ suit: "club", rank: "Q" }], "north")).toBe(
      "Mano di Nord. Picche: nessuna carta. Cuori: nessuna carta. Quadri: nessuna carta. Fiori: Donna"
    );
  });
});
