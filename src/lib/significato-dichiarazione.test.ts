import { describe, expect, it } from "vitest";
import { significatoDichiarazione as sig } from "./significato-dichiarazione";

const testo = (bids: string[], i = bids.length - 1) => sig(bids, i)?.testo ?? "";
const titolo = (bids: string[], i = bids.length - 1) => sig(bids, i)?.titolo ?? "";

describe("significatoDichiarazione", () => {
  it("2♦ d'apertura è debole con le quadri, non multicolor (il caso di Lillo Irrera)", () => {
    // Ovest mazziere passa, Nord passa, Est apre 2♦.
    expect(titolo(["P", "P", "2♦"])).toBe("Sottoapertura");
    expect(testo(["P", "P", "2♦"])).toMatch(/6 carte di quadri/);
    expect(testo(["P", "P", "2♦"])).toMatch(/Non è una multicolor/);
  });

  it("le aperture di base", () => {
    expect(testo(["1SA"])).toMatch(/15 a 17/);
    expect(testo(["1♠"])).toMatch(/5 carte a picche/);
    expect(testo(["1♦"])).toMatch(/3 carte a quadri/);
    expect(testo(["2♣"])).toMatch(/Artificiale/);
    expect(titolo(["3♥"])).toBe("Barrage");
  });

  it("in terza posizione l'apertura può essere più leggera", () => {
    expect(testo(["P", "P", "1♥"])).toMatch(/terza o quarta/);
    expect(testo(["1♥"])).not.toMatch(/terza o quarta/);
  });

  it("le risposte a 1SA", () => {
    expect(testo(["1SA", "P", "2♣"])).toMatch(/Stayman/);
    expect(testo(["1SA", "P", "2♦"])).toMatch(/cuori/);
    expect(testo(["1SA", "P", "2♥"])).toMatch(/picche/);
  });

  it("le risposte a un colore", () => {
    expect(testo(["1♥", "P", "2♥"])).toMatch(/6 a 10/);
    expect(testo(["1♥", "P", "3♥"])).toMatch(/invitante/);
    expect(testo(["1♥", "P", "1♠"])).toMatch(/Forzante/);
    expect(testo(["1♠", "P", "2♣"])).toMatch(/2 su 1/);
    expect(testo(["1♥", "P", "2♠"])).toMatch(/salto/);
    expect(testo(["1♥", "P", "2SA"])).toMatch(/Jacoby/);
  });

  it("gli interventi, con il salto riconosciuto per seme", () => {
    expect(testo(["1♥", "1♠"])).toMatch(/8 a 16/);
    expect(testo(["1♥", "2♣"])).toMatch(/livello due/);
    expect(testo(["1♥", "2♠"])).toMatch(/salto, debole/);
    expect(testo(["1♥", "1SA"])).toMatch(/fermo a cuori/);
    expect(titolo(["1♥", "2♥"])).toBe("Surlicita");
  });

  it("il contro informativo e quello di forza", () => {
    expect(titolo(["1♥", "X"])).toBe("Contro informativo");
    expect(testo(["1♥", "X"])).toMatch(/corto a cuori/);
    expect(testo(["1SA", "X"])).toMatch(/di forza/);
  });

  it("dove non sa, lo dice", () => {
    expect(testo(["1♥", "P", "1♠", "P", "2♦", "P", "3♣"])).toMatch(/dipende/);
  });

  it("fuori dall'asta non risponde", () => {
    expect(sig(["1♥"], 3)).toBeNull();
  });
});
