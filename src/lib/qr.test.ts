import { describe, expect, it } from "vitest";
import { indirizzoIscrizione, qrSvg } from "./qr";

describe("il QR della locandina", () => {
  it("è un SVG con dentro dei moduli", () => {
    const s = qrSvg("https://bridgelab.it/classi?codice=A7B9XZ");
    expect(s.startsWith("<svg")).toBe(true);
    expect(s).toContain("viewBox=");
    expect(s).toContain('<path d="M');
  });

  /**
   * Il margine chiaro non è decorazione: senza, molti lettori non riconoscono
   * il codice appoggiato a uno sfondo colorato. Lo standard ne chiede quattro
   * moduli, qui ne bastano due perché la locandina lo mette comunque su bianco.
   */
  it("ha il margine chiaro attorno", () => {
    const s = qrSvg("x", { margine: 2 });
    const box = /viewBox="0 0 (\d+) \1"/.exec(s);
    expect(box).not.toBeNull();
    // 21 moduli è il QR più piccolo; con 2 di margine per lato fa 25.
    expect(Number(box![1])).toBeGreaterThanOrEqual(25);
  });

  it("cresce con il testo", () => {
    const corto = qrSvg("a");
    const lungo = qrSvg("a".repeat(200));
    const lato = (s: string) => Number(/viewBox="0 0 (\d+)/.exec(s)![1]);
    expect(lato(lungo)).toBeGreaterThan(lato(corto));
  });

  it("l'indirizzo porta alle classi col codice già scritto", () => {
    expect(indirizzoIscrizione("A7B9XZ", "https://bridgelab.it")).toBe(
      "https://bridgelab.it/classi?codice=A7B9XZ",
    );
  });

  it("un codice con caratteri strani non rompe l'indirizzo", () => {
    expect(indirizzoIscrizione("A B&C", "https://x")).toBe("https://x/classi?codice=A%20B%26C");
  });
});
