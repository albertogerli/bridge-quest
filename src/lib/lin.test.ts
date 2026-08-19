import { describe, expect, it } from "vitest";
import { cifraMazziere, fileLin, manoLin, smazzataLin } from "./lin";
import { generateDeals } from "./deal-generator";
import type { Card, Position } from "./bridge-engine";

const c = (suit: string, rank: string) => ({ suit, rank }) as Card;

describe("il formato LIN", () => {
  it("scrive i semi in ordine, col dieci come T", () => {
    const mano = [c("spade", "A"), c("heart", "10"), c("club", "2"), c("spade", "K")];
    expect(manoLin(mano)).toBe("SAKHTDC2");
  });

  it("un seme vuoto resta come lettera sola", () => {
    expect(manoLin([c("spade", "A")])).toBe("SAHDC");
  });

  /**
   * Il mazziere numerato da SUD, non da Nord. Viene da come BBO ordina i
   * posti, non da una convenzione di bridge: sbagliarlo sposta la
   * dichiarazione di un posto senza che nessun controllo se ne accorga.
   */
  it("il mazziere è numerato partendo da Sud", () => {
    expect(cifraMazziere("south")).toBe(1);
    expect(cifraMazziere("west")).toBe(2);
    expect(cifraMazziere("north")).toBe(3);
    expect(cifraMazziere("east")).toBe(4);
  });

  /**
   * LA TRAPPOLA DEL FORMATO: la mano di Est non si scrive, BBO la ricava per
   * differenza. Scriverla fa rifiutare il file, e senza un messaggio utile —
   * si vede solo che la mano non si apre.
   */
  it("scrive tre mani e non quattro", () => {
    const { deals } = generateDeals({}, { count: 1, seed: 1 });
    const lin = smazzataLin({ hands: deals[0], dealer: "north", vulnerability: "none" });
    const md = /md\|([^|]*)\|/.exec(lin)![1];
    // Tre mani separate da due virgole.
    expect(md.split(",")).toHaveLength(3);
    // E la mano di Est non compare: la si ricostruisce per differenza.
    const scritte = md.slice(1).split(",");
    const estScritta = manoLin(deals[0].east);
    expect(scritte).not.toContain(estScritta);
  });

  it("le tre mani scritte sono Sud, Ovest e Nord in quest'ordine", () => {
    const { deals } = generateDeals({}, { count: 1, seed: 3 });
    const lin = smazzataLin({ hands: deals[0], dealer: "south", vulnerability: "ns" });
    const md = /md\|([^|]*)\|/.exec(lin)![1];
    const [primaConCifra, seconda, terza] = md.split(",");
    expect(primaConCifra).toBe(`1${manoLin(deals[0].south)}`);
    expect(seconda).toBe(manoLin(deals[0].west));
    expect(terza).toBe(manoLin(deals[0].north));
  });

  it("la zona usa le lettere di BBO", () => {
    const { deals } = generateDeals({}, { count: 1, seed: 5 });
    const zona = (v: "none" | "ns" | "ew" | "both") =>
      /sv\|([^|]*)\|/.exec(smazzataLin({ hands: deals[0], dealer: "north", vulnerability: v }))![1];
    expect(zona("none")).toBe("o");
    expect(zona("ns")).toBe("n");
    expect(zona("ew")).toBe("e");
    expect(zona("both")).toBe("b");
  });

  it("ogni mano scritta ha tredici carte", () => {
    const { deals } = generateDeals({}, { count: 4, seed: 11 });
    for (const d of deals) {
      for (const p of ["south", "west", "north"] as Position[]) {
        const s = manoLin(d[p]);
        // Quattro lettere di seme più tredici ranghi.
        expect(s.replace(/[SHDC]/g, "")).toHaveLength(13);
      }
    }
  });

  it("un file con più smazzate le numera in ordine", () => {
    const { deals } = generateDeals({}, { count: 3, seed: 13 });
    const testo = fileLin(
      deals.map((hands) => ({ hands, dealer: "north" as Position, vulnerability: "none" as const })),
    );
    expect(testo.split("\n")).toHaveLength(3);
    expect(testo).toContain("qx|o1|");
    expect(testo).toContain("qx|o3|");
  });
});
