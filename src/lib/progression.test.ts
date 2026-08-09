import { describe, expect, it } from "vitest";
import {
  isModuleLocked,
  isWorldLocked,
  moduleKey,
  worldCompletionPct,
  type CompletedMap,
  type ProgressionWorld,
} from "./progression";

const lesson = (id: string | number, moduleIds: string[]) => ({
  id,
  modules: moduleIds.map((m) => ({ id: m })),
});

describe("moduleKey", () => {
  it("concatena lessonId e moduleId", () => {
    expect(moduleKey(3, "0-1")).toBe("3-0-1");
    expect(moduleKey("q1", "Q1-1")).toBe("q1-Q1-1");
  });
});

describe("isModuleLocked", () => {
  const l = lesson(1, ["m1", "m2", "m3"]);

  it("il primo modulo è sempre sbloccato", () => {
    expect(isModuleLocked(l, 0, {})).toBe(false);
  });

  it("un modulo è bloccato se il precedente non è completato", () => {
    expect(isModuleLocked(l, 1, {})).toBe(true);
    expect(isModuleLocked(l, 2, { "1-m1": true })).toBe(true);
  });

  it("si sblocca quando il precedente è completato", () => {
    expect(isModuleLocked(l, 1, { "1-m1": true })).toBe(false);
    expect(isModuleLocked(l, 2, { "1-m1": true, "1-m2": true })).toBe(false);
  });
});

describe("worldCompletionPct", () => {
  const world: ProgressionWorld = {
    lessons: [lesson(1, ["a", "b"]), lesson(2, ["c", "d"])],
  };

  it("0% senza completamenti, 100% con tutto completato", () => {
    expect(worldCompletionPct(world, {})).toBe(0);
    const all: CompletedMap = { "1-a": true, "1-b": true, "2-c": true, "2-d": true };
    expect(worldCompletionPct(world, all)).toBe(100);
  });

  it("arrotonda la percentuale", () => {
    expect(worldCompletionPct(world, { "1-a": true })).toBe(25);
  });

  it("mondo vuoto = 0%", () => {
    expect(worldCompletionPct({ lessons: [] }, {})).toBe(0);
  });
});

describe("isWorldLocked", () => {
  const worlds: ProgressionWorld[] = [
    { lessons: [lesson(1, ["a", "b"])] },
    { lessons: [lesson(2, ["c"])] },
  ];

  it("il primo mondo è sempre sbloccato", () => {
    expect(isWorldLocked(worlds, 0, {})).toBe(false);
  });

  it("il secondo è bloccato sotto il 50% del primo", () => {
    expect(isWorldLocked(worlds, 1, {})).toBe(true);
  });

  it("si sblocca al 50% esatto del precedente", () => {
    expect(isWorldLocked(worlds, 1, { "1-a": true })).toBe(false);
  });

  it("un mondo precedente senza moduli non blocca", () => {
    const withEmpty: ProgressionWorld[] = [{ lessons: [] }, { lessons: [lesson(2, ["c"])] }];
    expect(isWorldLocked(withEmpty, 1, {})).toBe(false);
  });
});
