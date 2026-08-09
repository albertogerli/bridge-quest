import { describe, expect, it } from "vitest";
import {
  LEITNER_INTERVALS_DAYS,
  MAX_BOX,
  addDaysISO,
  intervalForBox,
  migrateLegacyBox,
  scheduleAfterCorrect,
  scheduleAfterWrong,
} from "./spaced-review";

describe("intervalForBox", () => {
  it("mappa le scatole sugli intervalli crescenti", () => {
    expect(intervalForBox(1)).toBe(1);
    expect(intervalForBox(2)).toBe(3);
    expect(intervalForBox(3)).toBe(7);
    expect(intervalForBox(4)).toBe(14);
    expect(intervalForBox(5)).toBe(30);
  });

  it("clampa fuori range", () => {
    expect(intervalForBox(0)).toBe(1);
    expect(intervalForBox(99)).toBe(30);
  });
});

describe("scheduleAfterWrong", () => {
  it("nuovo errore parte dalla scatola 1 con scadenza a 1 giorno", () => {
    const item = scheduleAfterWrong(null, "2026-08-09");
    expect(item.box).toBe(1);
    expect(item.wrongCount).toBe(1);
    expect(item.nextReview).toBe("2026-08-10");
  });

  it("errore su item esistente regredisce alla scatola 1 e incrementa il conteggio", () => {
    const item = scheduleAfterWrong({ box: 4, wrongCount: 2 }, "2026-08-09");
    expect(item.box).toBe(1);
    expect(item.wrongCount).toBe(3);
    expect(item.nextReview).toBe("2026-08-10");
  });
});

describe("scheduleAfterCorrect", () => {
  it("avanza di scatola con intervallo crescente", () => {
    const item = scheduleAfterCorrect({ box: 1, wrongCount: 1 }, "2026-08-09");
    expect(item?.box).toBe(2);
    expect(item?.nextReview).toBe("2026-08-12"); // +3 giorni
  });

  it("dall'ultima scatola l'item è padroneggiato (null)", () => {
    expect(scheduleAfterCorrect({ box: MAX_BOX, wrongCount: 1 }, "2026-08-09")).toBeNull();
  });

  it("ciclo completo: 5 risposte giuste consecutive → padroneggiato", () => {
    let today = "2026-08-09";
    let item = scheduleAfterWrong(null, today);
    for (let i = 0; i < LEITNER_INTERVALS_DAYS.length - 1; i++) {
      today = item.nextReview;
      const next = scheduleAfterCorrect(item, today);
      expect(next).not.toBeNull();
      item = next!;
    }
    expect(item.box).toBe(MAX_BOX);
    expect(scheduleAfterCorrect(item, item.nextReview)).toBeNull();
  });
});

describe("migrateLegacyBox", () => {
  it("item legacy senza box → scatola 1; box valido conservato", () => {
    expect(migrateLegacyBox({})).toBe(1);
    expect(migrateLegacyBox({ box: 3 })).toBe(3);
    expect(migrateLegacyBox({ box: 42 })).toBe(1);
  });
});

describe("addDaysISO", () => {
  it("gestisce i cambi di mese", () => {
    expect(addDaysISO("2026-08-31", 1)).toBe("2026-09-01");
  });
});
