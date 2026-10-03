import { describe, expect, it } from "vitest";
import { leggiContratto } from "./contratto";
import { createGame, parseContract, playCard, type Card, type Position } from "./bridge-engine";

describe("leggiContratto", () => {
  it.each([
    ["4S", 4, "spade", 0],
    ["4♠", 4, "spade", 0],
    ["4SX", 4, "spade", 1],
    ["4♠X", 4, "spade", 1],
    ["2HXX", 2, "heart", 2],
    ["2♥XX", 2, "heart", 2],
    ["5dx", 5, "diamond", 1],
    ["3NT", 3, null, 0],
    ["3SA", 3, null, 0],
    ["3N", 3, null, 0],
    ["3NTX", 3, null, 1],
    [" 6 ♣ ", 6, "club", 0],
    ["4♠️", 4, "spade", 0],
  ])("%s", (scritto, level, trumpSuit, contro) => {
    expect(leggiContratto(scritto)).toEqual({ level, trumpSuit, tricksNeeded: level + 6, contro });
  });

  it.each(["", "PASS", "4", "8S", "4Z", "4SXXX"])("rifiuta «%s»", (scritto) => {
    expect(() => leggiContratto(scritto)).toThrow();
  });
});

describe("parseContract con il contro", () => {
  it("un contratto contrato tiene l'atout (era giocato a senz'atout)", () => {
    expect(parseContract("4♠X").trumpSuit).toBe("spade");
    expect(parseContract("4SX").trumpSuit).toBe("spade");
    expect(parseContract("1HXX").trumpSuit).toBe("heart");
  });

  it("una stringa che non è un contratto non rompe la pagina", () => {
    expect(parseContract("")).toEqual({ level: 0, trumpSuit: null, tricksNeeded: 6 });
  });

  it("smazzata Q11-7, 4♠X da Ovest: il taglio di Ovest vince la prima presa", () => {
    const mano = (s: string): Card[] =>
      s.split(" ").map((c) => ({ rank: c.slice(0, -1), suit: { s: "spade", h: "heart", d: "diamond", c: "club" }[c.slice(-1)] }) as Card);
    const hands: Record<Position, Card[]> = {
      north: mano("Qs 10s Kh 10h 8h 5h 4h Kd 6d 2d Qc Jc 4c"),
      east: mano("8s Ah Jh 6h 3h 2h Jd 9d 10c 8c 6c 3c 2c"),
      south: mano("Js 4s 9h 7h Ad Qd 10d 8d Ac Kc 9c 7c 5c"),
      west: mano("As Ks 9s 7s 6s 5s 3s 2s Qh 7d 5d 4d 3d"),
    };
    let g = createGame(hands, "4♠X", "west", { rank: "Q", suit: "club" });
    expect(g.trumpSuit).toBe("spade");
    g = playCard(g, "north", { rank: "Q", suit: "club" });
    g = playCard(g, "east", { rank: "2", suit: "club" });
    g = playCard(g, "south", { rank: "5", suit: "club" });
    g = playCard(g, "west", { rank: "3", suit: "spade" });
    expect(g.tricks[0].winner).toBe("west");
  });
});
