import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
import { nomeCartella, raggruppaArchivio, type SavedHand } from "./saved-hands";

const m = (id: string, cartella: string | null, preferita = false): SavedHand => ({
  id, titolo: id, nota: null, hands: { north: [], east: [], south: [], west: [] },
  contract: null, declarer: null, played: [], created_at: "", cartella, preferita,
});

describe("archivio a cartelle", () => {
  it("preferite in cima, cartelle in ordine naturale, poi quelle senza", () => {
    const g = raggruppaArchivio([m("a", "lez10"), m("b", null), m("c", "lez2", true), m("d", "lez2")]);
    expect(g.map((x) => x.chiave)).toEqual(["*preferite", "c:lez2", "c:lez10", "*senza"]);
    expect(g[1].mani.map((x) => x.id)).toEqual(["c", "d"]);
  });

  it("una preferita resta anche nella sua cartella", () => {
    const g = raggruppaArchivio([m("c", "transfer", true)]);
    expect(g.map((x) => x.mani.length)).toEqual([1, 1]);
  });

  it("i nomi delle cartelle si ripuliscono", () => {
    expect(nomeCartella("  mani   sulle transfer ")).toBe("mani sulle transfer");
    expect(nomeCartella("   ")).toBeNull();
    expect(nomeCartella("x".repeat(100))).toHaveLength(80);
  });
});
