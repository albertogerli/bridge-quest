import { describe, expect, it } from "vitest";
import { MASSIMO_AL_TAVOLO, offreLui } from "./video-tavolo";

describe("chi fa la prima mossa", () => {
  it("uno solo dei due offre, e i due sono d'accordo senza parlarsi", () => {
    // Se offrissero entrambi, le due offerte si annullerebbero a vicenda — il
    // «glare». Non si vede provando, perché provando non si entra mai davvero
    // nello stesso istante: si vede in aula, con venti persone che entrano
    // insieme all'inizio della lezione.
    expect(offreLui("aaa", "bbb")).toBe(true);
    expect(offreLui("bbb", "aaa")).toBe(false);
  });

  it("la regola è la stessa vista dai due lati, per qualunque coppia", () => {
    const ids = ["0f3a", "91bc", "aa01", "zz99", "3-7", "Z", "a"];
    for (const x of ids) {
      for (const y of ids) {
        if (x === y) continue;
        // Esattamente uno dei due deve offrire: né zero né due.
        expect(offreLui(x, y) !== offreLui(y, x)).toBe(true);
      }
    }
  });

  it("nessuno offre a sé stesso", () => {
    expect(offreLui("uguale", "uguale")).toBe(false);
  });
});

describe("il limite di persone al tavolo", () => {
  it("è dichiarato, non sperato", () => {
    // Ognuno si collega a ognuno: con n persone sono n·(n−1)/2 connessioni.
    // Con sei sono quindici, che un telefono regge; con venti sarebbero
    // centonovanta, e il telefono si ferma. Per questo il video vive al tavolo
    // e non nella classe.
    expect(MASSIMO_AL_TAVOLO).toBe(6);
    const connessioni = (n: number) => (n * (n - 1)) / 2;
    expect(connessioni(MASSIMO_AL_TAVOLO)).toBe(15);
    expect(connessioni(20)).toBe(190);
  });

  it("un tavolo da bridge ci sta comodo", () => {
    expect(MASSIMO_AL_TAVOLO).toBeGreaterThanOrEqual(4);
  });
});
