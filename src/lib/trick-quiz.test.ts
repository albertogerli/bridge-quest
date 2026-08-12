import { describe, it, expect } from "vitest";
import {
  buildOptions,
  nextSeed,
  POINTS_EXACT,
  POINTS_NEAR,
  QUIZ_LEVELS,
  scoreAnswer,
  strainForRound,
  strainLabel,
} from "./trick-quiz";

describe("buildOptions", () => {
  it("dà sempre quattro risposte distinte", () => {
    for (let correct = 0; correct <= 13; correct++) {
      const o = buildOptions(correct, 1);
      expect(o).toHaveLength(4);
      expect(new Set(o).size).toBe(4);
    }
  });

  it("contiene sempre la risposta corretta", () => {
    for (let correct = 0; correct <= 13; correct++) {
      expect(buildOptions(correct, correct)).toContain(correct);
    }
  });

  it("resta nell'intervallo legale anche agli estremi", () => {
    // Con 0 o 13 il ventaglio è asimmetrico: senza il controllo uscirebbero
    // risposte come -1 o 14, che si scartano senza contare nulla.
    for (const correct of [0, 1, 12, 13]) {
      for (const v of buildOptions(correct, 3)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(13);
      }
    }
  });

  it("propone distrattori vicini, non lontani", () => {
    // Distrattori lontani renderebbero la domanda risolvibile a colpo d'occhio.
    for (const v of buildOptions(9, 5)) {
      expect(Math.abs(v - 9)).toBeLessThanOrEqual(3);
    }
  });

  it("la posizione della risposta giusta non è sempre la stessa", () => {
    const posizioni = new Set(
      Array.from({ length: 20 }, (_, i) => buildOptions(9, i).indexOf(9))
    );
    expect(posizioni.size).toBeGreaterThan(1);
  });

  it("stesso seme, stesse opzioni nello stesso ordine", () => {
    expect(buildOptions(7, 42)).toEqual(buildOptions(7, 42));
  });
});

describe("scoreAnswer", () => {
  it("premia la risposta esatta", () => {
    expect(scoreAnswer(9, 9)).toMatchObject({ points: POINTS_EXACT, accepted: true });
  });

  it("riconosce parzialmente lo scarto di una presa", () => {
    // Sbagliare di una presa su tredici significa aver visto quasi tutto:
    // contarlo come errore secco insegnerebbe che è un gioco arbitrario.
    for (const a of [8, 10]) {
      const s = scoreAnswer(a, 9);
      expect(s.points).toBe(POINTS_NEAR);
      expect(s.accepted).toBe(true);
      expect(s.message).toContain("9");
    }
  });

  it("non premia scarti maggiori, ma dice la risposta", () => {
    const s = scoreAnswer(5, 9);
    expect(s.points).toBe(0);
    expect(s.accepted).toBe(false);
    expect(s.message).toContain("9");
    expect(s.message).toContain("5");
  });

  it("il parziale vale meno dell'esatto e più di zero", () => {
    expect(POINTS_NEAR).toBeGreaterThan(0);
    expect(POINTS_NEAR).toBeLessThan(POINTS_EXACT);
  });
});

describe("progressione dei livelli", () => {
  it("il primo livello è solo senza atout", () => {
    expect(QUIZ_LEVELS[0].strains).toEqual([null]);
  });

  it("ogni livello ha un identificatore unico e almeno un seme", () => {
    expect(new Set(QUIZ_LEVELS.map((l) => l.id)).size).toBe(QUIZ_LEVELS.length);
    for (const l of QUIZ_LEVELS) expect(l.strains.length).toBeGreaterThan(0);
  });

  it("strainForRound resta dentro i semi del livello", () => {
    for (const l of QUIZ_LEVELS) {
      for (let i = 0; i < 30; i++) {
        expect(l.strains).toContain(strainForRound(l, 123, i));
      }
    }
  });

  it("il livello a colore varia davvero il seme", () => {
    const visti = new Set(
      Array.from({ length: 40 }, (_, i) => strainForRound(QUIZ_LEVELS[1], 7, i))
    );
    expect(visti.size).toBeGreaterThan(1);
  });
});

describe("nextSeed", () => {
  it("è deterministico", () => {
    expect(nextSeed(5, 3)).toBe(nextSeed(5, 3));
  });

  it("cambia a ogni giro, così le domande non si ripetono", () => {
    const semi = new Set(Array.from({ length: 30 }, (_, i) => nextSeed(99, i)));
    expect(semi.size).toBeGreaterThan(25);
  });
});

describe("strainLabel", () => {
  it("nomina i semi in italiano", () => {
    expect(strainLabel(null)).toBe("senza atout");
    expect(strainLabel("spade")).toContain("picche");
    expect(strainLabel("heart")).toContain("cuori");
  });
});
