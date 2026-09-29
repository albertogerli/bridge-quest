import { describe, expect, it } from "vitest";
import { getValidCards, createGame, type Card, type Position } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals } from "@/lib/deal-generator";
import { sceltaDelComputer } from "./computer-al-tavolo";

const mani = generateDeals(DEAL_TEMPLATES[0].constraints, { count: 1, seed: 3 }).deals[0];

describe("il computer al tavolo condiviso", () => {
  it("gioca una carta lecita quando tocca a lui", () => {
    // Dichiara Sud: attacca Ovest.
    const c = sceltaDelComputer(mani, [], "3SA", "south", "west");
    expect(c).not.toBeNull();
    expect(mani.west.some((x) => x.suit === c!.suit && x.rank === c!.rank)).toBe(true);
  });

  it("dopo l'attacco risponde al colore, con le mani rimaste", () => {
    const attacco = sceltaDelComputer(mani, [], "3SA", "south", "west")!;
    const rimaste: Record<Position, Card[]> = { ...mani, west: mani.west.filter((x) => !(x.suit === attacco.suit && x.rank === attacco.rank)) };
    const c = sceltaDelComputer(rimaste, [{ seat: "west", card: attacco }], "3SA", "south", "north")!;
    const lecite = getValidCards(mani.north, [{ position: "west", card: attacco }]);
    expect(lecite.some((x) => x.suit === c.suit && x.rank === c.rank)).toBe(true);
  });

  it("non muove se non tocca a quel posto, o se le carte non tornano", () => {
    expect(sceltaDelComputer(mani, [], "3SA", "south", "north")).toBeNull();
    expect(sceltaDelComputer({ ...mani, east: mani.east.slice(1) }, [], "3SA", "south", "west")).toBeNull();
    void createGame;
  });
});
