import { describe, it, expect } from "vitest";
import {
  calculateRawScore,
  rawToIMP,
  calculateBoardIMP,
  calculateMatchIMP,
  contractToScoreParams,
  type RawScoreParams,
} from "./bridge-scoring";

/** Helper: score a contract string with duplicate rules. */
function score(
  contract: string,
  tricksMade: number,
  vulnerable: boolean,
): number {
  return calculateRawScore(contractToScoreParams(contract, tricksMade, vulnerable));
}

describe("calculateRawScore — contratti mantenuti (regole duplicate)", () => {
  it("3NT non vulnerabile mantenuto (9 prese) = 400", () => {
    expect(score("3NT", 9, false)).toBe(400);
  });

  it("3NT vulnerabile mantenuto (9 prese) = 600", () => {
    expect(score("3NT", 9, true)).toBe(600);
  });

  it("4S vulnerabile mantenuto (10 prese) = 620", () => {
    expect(score("4S", 10, true)).toBe(620);
  });

  it("2S+1 non vulnerabile (9 prese) = 140", () => {
    expect(score("2S", 9, false)).toBe(140);
  });

  it("parziale 1NT mantenuto (7 prese) = 90", () => {
    expect(score("1NT", 7, false)).toBe(90);
  });

  it("6S non vulnerabile mantenuto (12 prese) = 980 (slam bonus 500)", () => {
    expect(score("6S", 12, false)).toBe(980);
  });

  it("2S contrato non vulnerabile mantenuto (8 prese) = 470", () => {
    // 60x2=120 trick score -> partita (300) + insult 50 = 470
    expect(score("2Sx", 8, false)).toBe(470);
  });

  it("minorile: 5C vulnerabile mantenuto (11 prese) = 600", () => {
    expect(score("5C", 11, true)).toBe(600);
  });

  it("7NT vulnerabile mantenuto (13 prese) = 2220 (grande slam)", () => {
    // 220 + 500 game + 1500 grand slam
    expect(score("7NT", 13, true)).toBe(2220);
  });
});

describe("calculateRawScore — sottoprese", () => {
  it("1 down non vulnerabile non contrato = -50", () => {
    expect(score("3NT", 8, false)).toBe(-50);
  });

  it("2 down vulnerabile non contrato = -200", () => {
    expect(score("4S", 8, true)).toBe(-200);
  });

  it("1 down contrato vulnerabile = -200", () => {
    expect(score("3NTx", 8, true)).toBe(-200);
  });

  it("3 down contrato non vulnerabile = -500", () => {
    // -100, -200, -200
    expect(score("4Sx", 7, false)).toBe(-500);
  });

  it("1 down surcontrato non vulnerabile = -200", () => {
    expect(score("2Hxx", 7, false)).toBe(-200);
  });
});

describe("contractToScoreParams", () => {
  it("interpreta livello, seme e contro", () => {
    expect(contractToScoreParams("4Sx", 10, true)).toEqual<RawScoreParams>({
      level: 4,
      suitChar: "S",
      doubled: true,
      redoubled: false,
      vulnerable: true,
      tricksMade: 10,
    });
  });

  it("interpreta il surcontro e i simboli unicode", () => {
    const p = contractToScoreParams("3♥xx", 9, false);
    expect(p.suitChar).toBe("H");
    expect(p.redoubled).toBe(true);
    expect(p.doubled).toBe(false);
  });

  it("lancia su livello non valido", () => {
    expect(() => contractToScoreParams("8NT", 8, false)).toThrow();
  });
});

describe("rawToIMP — tabella WBF", () => {
  it("differenza 0 = 0 IMP", () => {
    expect(rawToIMP(0)).toBe(0);
  });

  it("differenza 20 = 1 IMP", () => {
    expect(rawToIMP(20)).toBe(1);
  });

  it("differenza 50 = 2 IMP", () => {
    expect(rawToIMP(50)).toBe(2);
  });

  it("differenza 400 = 9 IMP", () => {
    expect(rawToIMP(400)).toBe(9);
  });

  it("differenza 4000+ = 24 IMP", () => {
    expect(rawToIMP(4000)).toBe(24);
    expect(rawToIMP(9999)).toBe(24);
  });

  it("usa il valore assoluto della differenza", () => {
    expect(rawToIMP(-400)).toBe(9);
  });

  it("limiti di fascia: 40 = 1 IMP, 41-80 = 2 IMP", () => {
    expect(rawToIMP(40)).toBe(1);
    expect(rawToIMP(80)).toBe(2);
  });
});

describe("calculateBoardIMP / calculateMatchIMP", () => {
  it("assegna gli IMP al lato con punteggio migliore", () => {
    expect(calculateBoardIMP({ challengerScore: 620, opponentScore: 170 })).toEqual({
      challengerIMP: 10, // diff 450 -> 10 IMP
      opponentIMP: 0,
    });
    expect(calculateBoardIMP({ challengerScore: -100, opponentScore: 620 })).toEqual({
      challengerIMP: 0,
      opponentIMP: 12, // diff 720 -> 12 IMP
    });
  });

  it("pareggio = 0 IMP per entrambi", () => {
    expect(calculateBoardIMP({ challengerScore: 400, opponentScore: 400 })).toEqual({
      challengerIMP: 0,
      opponentIMP: 0,
    });
  });

  it("somma gli IMP su piu board", () => {
    const result = calculateMatchIMP([
      { challengerScore: 620, opponentScore: 170 }, // +10
      { challengerScore: -100, opponentScore: 620 }, // -12
      { challengerScore: 400, opponentScore: 400 }, // 0
    ]);
    expect(result).toEqual({ challengerTotal: 10, opponentTotal: 12, net: -2 });
  });
});
