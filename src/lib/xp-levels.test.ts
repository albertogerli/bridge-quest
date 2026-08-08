import { describe, it, expect } from "vitest";
import {
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  getLevel,
  getXpInLevel,
  getXpForNextLevel,
  getLevelProgress,
  getXpToNextLevel,
} from "./xp-levels";

describe("getLevel", () => {
  it("0 XP = livello 1", () => {
    expect(getLevel(0)).toBe(1);
  });

  it("soglie esatte dalla tabella: 100 XP -> Lv 2, 1000 XP -> Lv 6, 200000 XP -> Lv 36", () => {
    expect(getLevel(100)).toBe(2);
    expect(getLevel(99)).toBe(1);
    expect(getLevel(1_000)).toBe(6);
    expect(getLevel(999)).toBe(5);
    expect(getLevel(200_000)).toBe(36);
    expect(getLevel(199_999)).toBe(35);
  });

  it("oltre l'ultima soglia resta al livello massimo", () => {
    expect(getLevel(1_000_000)).toBe(MAX_LEVEL);
  });

  it("e monotona non decrescente su tutto il range", () => {
    let prev = getLevel(0);
    for (let xp = 0; xp <= 210_000; xp += 37) {
      const lvl = getLevel(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it("ogni soglia della tabella corrisponde esattamente al proprio livello", () => {
    LEVEL_THRESHOLDS.forEach((threshold, i) => {
      expect(getLevel(threshold)).toBe(i + 1);
      if (threshold > 0) expect(getLevel(threshold - 1)).toBe(i);
    });
  });
});

describe("progressione nel livello", () => {
  it("getXpInLevel e getXpForNextLevel a meta del Lv 1", () => {
    expect(getXpInLevel(50)).toBe(50);
    expect(getXpForNextLevel(50)).toBe(100);
    expect(getLevelProgress(50)).toBe(50);
    expect(getXpToNextLevel(50)).toBe(50);
  });

  it("al livello massimo il progresso e 100 e mancano 0 XP", () => {
    expect(getLevelProgress(200_000)).toBe(100);
    expect(getXpToNextLevel(200_000)).toBe(0);
  });
});
