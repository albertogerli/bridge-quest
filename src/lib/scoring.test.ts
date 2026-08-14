import { describe, expect, it } from "vitest";
import { scoreContract } from "./scoring";

/**
 * I valori sono quelli della tavola ufficiale WBF. Non sono opinioni: se un
 * numero qui cambia, è il codice ad avere torto.
 */
describe("punteggi non contrati", () => {
  it("riproduce la tavola, contratti mantenuti fuori zona", () => {
    const p = (level: number, strain: "club" | "heart" | "nt", prese: number) =>
      scoreContract({ level, strain, tricksMade: prese }).score;
    expect(p(1, "nt", 7)).toBe(90);
    expect(p(2, "heart", 8)).toBe(110);
    expect(p(3, "nt", 9)).toBe(400);
    expect(p(4, "heart", 10)).toBe(420);
    expect(p(5, "club", 11)).toBe(400);
    expect(p(6, "heart", 12)).toBe(980);
    expect(p(7, "nt", 13)).toBe(1520);
  });

  it("le sottoprese valgono 50 fuori zona e 100 in zona", () => {
    expect(scoreContract({ level: 4, strain: "spade", tricksMade: 8 }).score).toBe(-100);
    expect(
      scoreContract({ level: 4, strain: "spade", tricksMade: 8, vulnerable: true }).score
    ).toBe(-200);
  });
});

describe("contro e surcontro", () => {
  it("2♠ contrato mantenuto giusto, fuori zona", () => {
    // 60 di contratto raddoppiato + 300 di manche + 50 di insulto.
    expect(
      scoreContract({ level: 2, strain: "spade", tricksMade: 8, doppio: 2 }).score
    ).toBe(470);
  });

  it("le prese in più contrate valgono 100, non il valore del seme", () => {
    expect(
      scoreContract({ level: 4, strain: "heart", tricksMade: 11, doppio: 2 }).score
    ).toBe(240 + 300 + 50 + 100);
    expect(
      scoreContract({ level: 4, strain: "heart", tricksMade: 11, doppio: 2, vulnerable: true })
        .score
    ).toBe(240 + 500 + 50 + 200);
  });

  it("le sottoprese contrate seguono la scala 100/300/500/800", () => {
    const giu = (n: number, vul = false, doppio: 2 | 4 = 2) =>
      scoreContract({ level: 4, strain: "spade", tricksMade: 10 - n, vulnerable: vul, doppio })
        .score;
    expect(giu(1)).toBe(-100);
    expect(giu(2)).toBe(-300);
    expect(giu(3)).toBe(-500);
    expect(giu(4)).toBe(-800);
    expect(giu(5)).toBe(-1100);
  });

  it("in zona la scala è 200 e poi 300 per presa", () => {
    const giu = (n: number) =>
      scoreContract({ level: 4, strain: "spade", tricksMade: 10 - n, vulnerable: true, doppio: 2 })
        .score;
    expect(giu(1)).toBe(-200);
    expect(giu(2)).toBe(-500);
    expect(giu(3)).toBe(-800);
    expect(giu(4)).toBe(-1100);
  });

  it("il surcontro raddoppia le sottoprese e porta 100 di insulto", () => {
    expect(
      scoreContract({ level: 4, strain: "spade", tricksMade: 8, doppio: 4 }).score
    ).toBe(-600);
    // 1SA surcontrato mantenuto: 40×4 = 160, che è manche.
    expect(scoreContract({ level: 1, strain: "nt", tricksMade: 7, doppio: 4 }).score).toBe(
      160 + 300 + 100
    );
  });

  it("un parziale contrato può diventare manche", () => {
    // 2♥ contrato vale 120: sopra i 100, quindi manche.
    expect(scoreContract({ level: 2, strain: "heart", tricksMade: 8, doppio: 2 }).isGame).toBe(
      true
    );
    // 2♥ liscio no.
    expect(scoreContract({ level: 2, strain: "heart", tricksMade: 8 }).isGame).toBe(false);
  });
});
