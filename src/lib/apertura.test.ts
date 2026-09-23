import { describe, expect, it } from "vitest";
import type { Card, Rank, Suit } from "./bridge-engine";
import { aperturaConsigliata } from "./apertura";

/** Mano da notazione compatta: "AKQ32.J54.T98.76" (picche.cuori.quadri.fiori). */
function mano(s: string): Card[] {
  const semi: Suit[] = ["spade", "heart", "diamond", "club"];
  const out: Card[] = [];
  s.split(".").forEach((gruppo, i) => {
    for (const ch of gruppo) {
      const rank = (ch === "T" ? "10" : ch) as Rank;
      out.push({ suit: semi[i], rank });
    }
  });
  return out;
}

describe("aperturaConsigliata — sistema Naturale", () => {
  it("apre 1SA con bilanciata 15-17", () => {
    const a = aperturaConsigliata(mano("KQ4.AJ7.KJ83.Q94"));
    expect(a?.bid).toBe("1SA");
    expect(a?.perche).toContain("bilanciata");
  });

  it("non apre 1SA con 14 punti, anche se bilanciata", () => {
    // Fuori fascia: la mano si apre di colore, e qui la scelta è del minore.
    expect(aperturaConsigliata(mano("KQ4.AJ7.KJ83.942"))?.bid).not.toBe("1SA");
  });

  it("apre il maggiore quinto", () => {
    expect(aperturaConsigliata(mano("AKJ82.K74.Q93.54"))?.bid).toBe("1♠");
    expect(aperturaConsigliata(mano("K74.AKJ82.Q93.54"))?.bid).toBe("1♥");
  });

  it("mano segnalata: nel Fiori 2022 20 punti e cinque cuori aprono 1♥, non 1♣", () => {
    const a = aperturaConsigliata(mano("J.KQJ74.AK4.AQ63"));
    expect(a?.bid).toBe("1♥");
  });

  it("19 e 20 restano a livello uno; da 21 interviene la forte naturale del Fiori 2022", () => {
    expect(aperturaConsigliata(mano("J.KQJ74.AK4.KQ63"))?.bid).toBe("1♥");
    expect(aperturaConsigliata(mano("J.KQJ74.AK4.AQ63"))?.bid).toBe("1♥");
    expect(aperturaConsigliata(mano("Q.KQJ74.AK4.AQ63"))?.bid).toBe("2♥");
  });

  it("gestisce le aperture forti bilanciate", () => {
    expect(aperturaConsigliata(mano("AKQ.AKJ.QJ4.J983"))?.bid).toBe("2SA");
    expect(aperturaConsigliata(mano("AKQ.AKJ.AJ4.J983"))?.bid).toBe("2SA");
    expect(aperturaConsigliata(mano("AKQ.AKJ.AJ4.Q983"))?.bid).toBe("2♣");
    expect(aperturaConsigliata(mano("AKQ.AKQ.AKQ.AKQ2"))?.bid).toBe("2♣");
  });

  it("apre al livello di due nell'unico colore lungo di una forte sbilanciata", () => {
    expect(aperturaConsigliata(mano("A.KQ3.AKQJ74.KJ3"))?.bid).toBe("2♦");
    expect(aperturaConsigliata(mano("A.KQ3.KJ3.AKQJ74"))?.bid).toBe("2♣");
  });

  it("con due maggiori quinti apre la più alta", () => {
    const a = aperturaConsigliata(mano("AKJ82.KQ932.Q4.5"));
    expect(a?.bid).toBe("1♠");
    expect(a?.perche).toContain("più alto");
  });

  it("con due colori entrambi almeno quinti apre il più alto (Fiori 2022)", () => {
    expect(aperturaConsigliata(mano("AKJ82.KQ9432.Q.5"))?.bid).toBe("1♠");
  });

  it("apre di barrage con sette carte e mano debole", () => {
    const a = aperturaConsigliata(mano("KQJ9876.54.32.32"));
    expect(a?.bid).toBe("3♠");
    expect(a?.perche).toContain("barrage");
  });

  it("apre il minore più lungo senza maggiori quinti", () => {
    expect(aperturaConsigliata(mano("KQ4.A75.KJ832.94"))?.bid).toBe("1♦");
    expect(aperturaConsigliata(mano("KQ4.A75.94.KJ832"))?.bid).toBe("1♣");
  });

  it("non impone un barrage con lunga povera, valori laterali o sette vincenti", () => {
    expect(aperturaConsigliata(mano("J987654.AK.32.32"))).toBeNull();
    expect(aperturaConsigliata(mano("AKQ9876.54.32.32"))).toBeNull();
  });

  it("tace quando la risposta non è una sola", () => {
    // Sono i casi che NON vanno trasformati in esercizio: due aperture
    // difendibili, o mani fuori dal programma dell'allievo.
    expect(aperturaConsigliata(mano("KQ4.K75.QJ83.942"))).toBeNull();   // 11 punti scarsi
    expect(aperturaConsigliata(mano("432.543.6542.765"))).toBeNull();   // mano nulla
  });

  it("rifiuta una mano che non ha tredici carte", () => {
    expect(aperturaConsigliata(mano("AKQ.AKQ.AKQ"))).toBeNull();
  });
});
