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

  it("con due maggiori quinti apre la più alta", () => {
    const a = aperturaConsigliata(mano("AKJ82.KQ932.Q4.5"));
    expect(a?.bid).toBe("1♠");
    expect(a?.perche).toContain("più alta");
  });

  it("con cuori più lunghe delle picche apre cuori", () => {
    expect(aperturaConsigliata(mano("AKJ82.KQ9432.Q.5"))?.bid).toBe("1♥");
  });

  it("apre di barrage con sette carte e mano debole", () => {
    const a = aperturaConsigliata(mano("KQJ9876.54.32.J2"));
    expect(a?.bid).toBe("3♠");
    expect(a?.perche).toContain("barrage");
  });

  it("apre il minore più lungo senza maggiori quinti", () => {
    expect(aperturaConsigliata(mano("KQ4.A75.KJ832.94"))?.bid).toBe("1♦");
    expect(aperturaConsigliata(mano("KQ4.A75.94.KJ832"))?.bid).toBe("1♣");
  });

  it("tace quando la risposta non è una sola", () => {
    // Sono i casi che NON vanno trasformati in esercizio: due aperture
    // difendibili, o mani fuori dal programma dell'allievo.
    expect(aperturaConsigliata(mano("KQ4.K75.QJ83.942"))).toBeNull();   // 11 punti scarsi
    expect(aperturaConsigliata(mano("432.543.6542.765"))).toBeNull();   // mano nulla
    expect(aperturaConsigliata(mano("AKQ.AKQ.AKQ.AKQ2"))).toBeNull();   // fuori scala
  });

  it("rifiuta una mano che non ha tredici carte", () => {
    expect(aperturaConsigliata(mano("AKQ.AKQ.AKQ"))).toBeNull();
  });
});
