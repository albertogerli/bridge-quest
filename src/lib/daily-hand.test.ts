import { describe, it, expect } from "vitest";
import {
  DAILY_BONUS_XP,
  calcStars,
  computeDailyXp,
  computeHandXp,
  dateToIndex,
  formatContractItalian,
  formatDate,
  formatTimeToMidnight,
  formatVulnerability,
  getSmazzataForDate,
  getTodayString,
  getYesterdayString,
  nextStreak,
  positionLabelIt,
  resultHeadline,
  resultVerdict,
} from "./daily-hand";
import type { Smazzata } from "@/lib/catalog";

// ── Fixtures ───────────────────────────────────────────────────────────────

/** Smazzata minima: della mano del giorno servono solo id e contratto. */
function smazzata(id: string, contract = "3NT"): Smazzata {
  return {
    id,
    lesson: 1,
    board: 1,
    title: `Mano ${id}`,
    contract,
    declarer: "south",
    openingLead: { suit: "spade", rank: "2" },
    vulnerability: "none",
    hands: { north: [], south: [], east: [], west: [] },
    commentary: "",
  } as unknown as Smazzata;
}

function pool(size: number): Smazzata[] {
  return Array.from({ length: size }, (_, i) => smazzata(`s${i}`));
}

// ── Date ───────────────────────────────────────────────────────────────────

describe("getTodayString", () => {
  it("rende la data UTC in formato YYYY-MM-DD", () => {
    expect(getTodayString(Date.UTC(2026, 7, 8, 12))).toBe("2026-08-08");
    expect(getTodayString(Date.UTC(2026, 0, 1, 12))).toBe("2026-01-01");
  });

  it("azzera l'orario: mattina e sera dello stesso giorno coincidono", () => {
    expect(getTodayString(Date.UTC(2026, 7, 8, 0, 0, 1))).toBe(
      getTodayString(Date.UTC(2026, 7, 8, 23, 59, 59))
    );
  });
});

describe("getYesterdayString", () => {
  it("torna indietro di un giorno", () => {
    expect(getYesterdayString(Date.UTC(2026, 7, 8, 12))).toBe("2026-08-07");
  });

  it("attraversa il cambio di mese e di anno", () => {
    expect(getYesterdayString(Date.UTC(2026, 7, 1, 12))).toBe("2026-07-31");
    expect(getYesterdayString(Date.UTC(2026, 0, 1, 12))).toBe("2025-12-31");
  });

  it("gestisce l'anno bisestile", () => {
    expect(getYesterdayString(Date.UTC(2028, 2, 1, 12))).toBe("2028-02-29");
  });
});

describe("formatTimeToMidnight", () => {
  it("conta le ore che mancano alla mezzanotte locale", () => {
    expect(formatTimeToMidnight(new Date(2026, 7, 8, 12, 0, 0).getTime())).toBe(
      "12:00:00"
    );
  });

  it("usa due cifre per ore, minuti e secondi", () => {
    expect(formatTimeToMidnight(new Date(2026, 7, 8, 23, 59, 30).getTime())).toBe(
      "00:00:30"
    );
    expect(formatTimeToMidnight(new Date(2026, 7, 8, 8, 5, 4).getTime())).toBe(
      "15:54:56"
    );
  });

  it("a mezzanotte esatta mancano 24 ore alla mano successiva", () => {
    expect(formatTimeToMidnight(new Date(2026, 7, 8, 0, 0, 0).getTime())).toBe(
      "24:00:00"
    );
  });
});

// ── Selezione deterministica della mano ────────────────────────────────────

describe("dateToIndex", () => {
  it("resta dentro i limiti della pool", () => {
    for (const day of ["2026-01-01", "2026-08-08", "2026-12-31"]) {
      const idx = dateToIndex(day, 7);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(7);
    }
  });

  it("è deterministico: stessa data e stessa pool → stesso indice", () => {
    expect(dateToIndex("2026-08-08", 40)).toBe(dateToIndex("2026-08-08", 40));
  });

  it("cambia al cambiare del giorno", () => {
    expect(dateToIndex("2026-08-09", 40)).not.toBe(dateToIndex("2026-08-08", 40));
  });
});

describe("getSmazzataForDate", () => {
  it("stessa data → stessa mano per tutti", () => {
    const p = pool(40);
    expect(getSmazzataForDate("2026-08-08", p)).toBe(
      getSmazzataForDate("2026-08-08", p)
    );
  });

  it("giorni diversi → mani diverse", () => {
    const p = pool(40);
    const oggi = getSmazzataForDate("2026-08-08", p);
    const ieri = getSmazzataForDate("2026-08-07", p);
    const domani = getSmazzataForDate("2026-08-09", p);
    expect(oggi?.id).not.toBe(ieri?.id);
    expect(oggi?.id).not.toBe(domani?.id);
  });

  it("non dipende dall'ordine in cui si chiedono le date", () => {
    const p = pool(40);
    const primaIeri = [
      getSmazzataForDate("2026-08-07", p)?.id,
      getSmazzataForDate("2026-08-08", p)?.id,
    ];
    const primaOggi = [
      getSmazzataForDate("2026-08-08", p)?.id,
      getSmazzataForDate("2026-08-07", p)?.id,
    ];
    expect(primaIeri).toEqual([primaOggi[1], primaOggi[0]]);
  });

  it("pool vuota (catalogo non ancora caricato) → null, senza divisione per zero", () => {
    expect(getSmazzataForDate("2026-08-08", [])).toBeNull();
  });

  it("pool di una sola mano → sempre quella, ogni giorno", () => {
    const p = pool(1);
    expect(getSmazzataForDate("2026-08-08", p)?.id).toBe("s0");
    expect(getSmazzataForDate("2026-08-09", p)?.id).toBe("s0");
  });

  it("pool più piccola del previsto → indice comunque valido", () => {
    const p = pool(3);
    for (const day of ["2026-08-07", "2026-08-08", "2026-08-09"]) {
      expect(p).toContain(getSmazzataForDate(day, p));
    }
  });

  it("copre più di una mano nell'arco di un mese", () => {
    const p = pool(12);
    const ids = new Set(
      Array.from({ length: 30 }, (_, i) =>
        getSmazzataForDate(`2026-08-${String(i + 1).padStart(2, "0")}`, p)?.id
      )
    );
    expect(ids.size).toBe(12);
  });
});

// ── Punteggi e XP ──────────────────────────────────────────────────────────

describe("calcStars", () => {
  it("3 stelle con surlevée, 2 con contratto esatto, 1 se cade", () => {
    expect(calcStars(2)).toBe(3);
    expect(calcStars(1)).toBe(3);
    expect(calcStars(0)).toBe(2);
    expect(calcStars(-1)).toBe(1);
    expect(calcStars(-5)).toBe(1);
  });
});

describe("computeHandXp", () => {
  it("30 base se il contratto cade", () => {
    expect(computeHandXp(-1)).toBe(30);
    expect(computeHandXp(-3)).toBe(30);
  });

  it("+20 se il contratto è mantenuto", () => {
    expect(computeHandXp(0)).toBe(50);
  });

  it("+10 per ogni surlevée", () => {
    expect(computeHandXp(1)).toBe(60);
    expect(computeHandXp(3)).toBe(80);
  });
});

describe("computeDailyXp", () => {
  it("aggiunge il bonus giornaliero solo alla prima giocata di oggi", () => {
    expect(computeDailyXp(0, true)).toBe(50 + DAILY_BONUS_XP);
    expect(computeDailyXp(0, false)).toBe(50);
  });

  it("il bonus si somma anche quando il contratto cade", () => {
    expect(computeDailyXp(-2, true)).toBe(30 + DAILY_BONUS_XP);
  });
});

describe("nextStreak", () => {
  it("prosegue la serie se ieri è stata giocata", () => {
    expect(nextStreak(4, true)).toBe(5);
  });

  it("riparte da 1 se ieri è saltata", () => {
    expect(nextStreak(9, false)).toBe(1);
    expect(nextStreak(0, false)).toBe(1);
  });
});

// ── Formattazioni ──────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("rende la data in forma estesa italiana", () => {
    expect(formatDate("2026-08-08")).toBe("8 Agosto 2026");
    expect(formatDate("2026-01-31")).toBe("31 Gennaio 2026");
    expect(formatDate("2026-12-01")).toBe("1 Dicembre 2026");
  });
});

describe("positionLabelIt / formatContractItalian", () => {
  it("traduce le quattro posizioni", () => {
    expect(positionLabelIt("north")).toBe("Nord");
    expect(positionLabelIt("south")).toBe("Sud");
    expect(positionLabelIt("east")).toBe("Est");
    expect(positionLabelIt("west")).toBe("Ovest");
  });

  it("accosta contratto e dichiarante", () => {
    expect(formatContractItalian("3NT", "south")).toBe("3NT Sud");
    expect(formatContractItalian("4♠", "west")).toBe("4♠ Ovest");
  });
});

describe("formatVulnerability", () => {
  it("traduce le quattro vulnerabilità", () => {
    expect(formatVulnerability("none")).toBe("Nessuna");
    expect(formatVulnerability("ns")).toBe("N-S");
    expect(formatVulnerability("ew")).toBe("E-O");
    expect(formatVulnerability("both")).toBe("Tutti");
  });
});

describe("resultHeadline", () => {
  it("distingue surlevée, contratto esatto e caduta", () => {
    expect(resultHeadline(2)).toBe("Fatto +2!");
    expect(resultHeadline(0)).toBe("Contratto Mantenuto!");
    expect(resultHeadline(-3)).toBe("Caduto di 3");
  });
});

describe("resultVerdict", () => {
  it("ha un giudizio dedicato per la caduta di una sola presa", () => {
    expect(resultVerdict(1)).toBe("Eccellente! Più prese del necessario");
    expect(resultVerdict(0)).toBe("Ben giocato! Contratto esatto");
    expect(resultVerdict(-1)).toBe("Quasi! Solo una presa in meno");
    expect(resultVerdict(-2)).toBe("Da rivedere - riprova la mano!");
  });
});
