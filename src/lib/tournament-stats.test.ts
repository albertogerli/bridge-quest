import { describe, it, expect } from "vitest";
import {
  calcStars,
  computeHandTotals,
  computeTournamentXp,
  decideProgressRestore,
  formatCountdown,
  formatDateShort,
  getTournamentHands,
  getWeekDates,
  getWeekNum,
  sumTricksNeeded,
  tournamentCtaLabel,
} from "./tournament-stats";
import {
  EPOCH_MS,
  EPOCH_START,
  TOURNAMENT_HAND_COUNT,
  type HandResult,
  type TournamentProgress,
} from "@/app/gioca/torneo/_types";
import type { Smazzata } from "@/lib/catalog";

// ── Fixtures ───────────────────────────────────────────────────────────────

/** Smazzata minima: del torneo servono solo id, titolo e contratto. */
function smazzata(id: string, contract: string): Smazzata {
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
  return Array.from({ length: size }, (_, i) => smazzata(`s${i}`, "3NT"));
}

function handResult(tricksMade: number, tricksNeeded: number): HandResult {
  return {
    smazzataId: `s${tricksMade}`,
    tricksMade,
    tricksNeeded,
    result: tricksMade - tricksNeeded,
  };
}

function progress(handIds: string[], handResults: HandResult[]): TournamentProgress {
  return { weekNum: 100, handIds, handResults };
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ── getWeekNum / getWeekDates ──────────────────────────────────────────────

describe("getWeekNum", () => {
  it("la settimana 0 inizia all'epoch (lunedì 2024-01-01)", () => {
    expect(getWeekNum(EPOCH_START)).toBe(0);
    expect(getWeekNum(EPOCH_START + EPOCH_MS - 1)).toBe(0);
  });

  it("avanza di 1 a ogni settimana trascorsa", () => {
    expect(getWeekNum(EPOCH_START + EPOCH_MS)).toBe(1);
    expect(getWeekNum(EPOCH_START + 52 * EPOCH_MS + 3 * DAY)).toBe(52);
  });

  it("è costante lungo tutta la settimana", () => {
    const week = getWeekNum(Date.UTC(2026, 7, 5, 12));
    expect(getWeekNum(Date.UTC(2026, 7, 5, 23, 59))).toBe(week);
  });
});

describe("getWeekDates", () => {
  it("copre esattamente i 7 giorni della settimana, estremi inclusi", () => {
    const { start, end } = getWeekDates(3);
    expect(start.getTime()).toBe(EPOCH_START + 3 * EPOCH_MS);
    expect(end.getTime()).toBe(EPOCH_START + 4 * EPOCH_MS - 1);
  });

  it("la settimana successiva inizia 1 ms dopo la fine della precedente", () => {
    expect(getWeekDates(9).start.getTime()).toBe(getWeekDates(8).end.getTime() + 1);
  });

  it("è coerente con getWeekNum", () => {
    const { start, end } = getWeekDates(120);
    expect(getWeekNum(start.getTime())).toBe(120);
    expect(getWeekNum(end.getTime())).toBe(120);
  });
});

// ── formatDateShort ────────────────────────────────────────────────────────

describe("formatDateShort", () => {
  it("usa giorno e mese abbreviato in italiano", () => {
    expect(formatDateShort(new Date(2026, 0, 1))).toBe("1 Gen");
    expect(formatDateShort(new Date(2026, 7, 5))).toBe("5 Ago");
    expect(formatDateShort(new Date(2026, 11, 31))).toBe("31 Dic");
  });
});

// ── formatCountdown ────────────────────────────────────────────────────────

describe("formatCountdown", () => {
  it("segnala la scadenza a tempo esaurito o negativo", () => {
    expect(formatCountdown(0)).toBe("Scaduto");
    expect(formatCountdown(-1)).toBe("Scaduto");
  });

  it("oltre le 24h mostra giorni, ore e minuti", () => {
    expect(formatCountdown(2 * DAY + 3 * HOUR + 4 * MINUTE + 59 * SECOND)).toBe("2g 3h 4m");
  });

  it("sotto le 24h passa al cronometro hh:mm:ss con zeri iniziali", () => {
    expect(formatCountdown(HOUR + 2 * MINUTE + 3 * SECOND)).toBe("01:02:03");
    expect(formatCountdown(23 * HOUR + 59 * MINUTE + 59 * SECOND)).toBe("23:59:59");
    expect(formatCountdown(1)).toBe("00:00:00");
  });
});

// ── getTournamentHands ─────────────────────────────────────────────────────

describe("getTournamentHands", () => {
  it("restituisce esattamente 5 mani distinte da una pool ampia", () => {
    const hands = getTournamentHands(pool(50), 42, TOURNAMENT_HAND_COUNT);
    expect(hands).toHaveLength(TOURNAMENT_HAND_COUNT);
    expect(new Set(hands.map((h) => h.id)).size).toBe(TOURNAMENT_HAND_COUNT);
  });

  it("è deterministica: stessa settimana = stesse mani", () => {
    const p = pool(50);
    expect(getTournamentHands(p, 42, 5).map((h) => h.id)).toEqual(
      getTournamentHands(p, 42, 5).map((h) => h.id)
    );
  });

  it("cambia selezione al cambiare della settimana", () => {
    const p = pool(50);
    expect(getTournamentHands(p, 42, 5).map((h) => h.id)).not.toEqual(
      getTournamentHands(p, 43, 5).map((h) => h.id)
    );
  });

  it("con pool vuota non propone nulla (CTA disabilitata)", () => {
    expect(getTournamentHands([], 42, 5)).toEqual([]);
  });

  it("non supera la dimensione della pool", () => {
    expect(getTournamentHands(pool(3), 42, 5)).toHaveLength(3);
  });
});

// ── sumTricksNeeded ────────────────────────────────────────────────────────

describe("sumTricksNeeded", () => {
  it("somma le prese necessarie dei contratti (6 + livello)", () => {
    expect(
      sumTricksNeeded([{ contract: "3NT" }, { contract: "4♠" }, { contract: "1♣" }])
    ).toBe(9 + 10 + 7);
  });

  it("senza mani vale 0", () => {
    expect(sumTricksNeeded([])).toBe(0);
  });
});

// ── calcStars ──────────────────────────────────────────────────────────────

describe("calcStars", () => {
  it("assegna 3 stelle da +3 in su", () => {
    expect(calcStars(3)).toBe(3);
    expect(calcStars(10)).toBe(3);
  });

  it("assegna 2 stelle da 0 a +2", () => {
    expect(calcStars(0)).toBe(2);
    expect(calcStars(2)).toBe(2);
  });

  it("assegna 1 stella in caduta", () => {
    expect(calcStars(-1)).toBe(1);
  });
});

// ── computeHandTotals ──────────────────────────────────────────────────────

describe("computeHandTotals", () => {
  it("somma prese fatte e necessarie", () => {
    expect(computeHandTotals([handResult(9, 9), handResult(11, 10)])).toEqual({
      totalTricks: 20,
      totalNeeded: 19,
    });
  });

  it("su un torneo non iniziato vale 0/0", () => {
    expect(computeHandTotals([])).toEqual({ totalTricks: 0, totalNeeded: 0 });
  });
});

// ── computeTournamentXp ────────────────────────────────────────────────────

describe("computeTournamentXp", () => {
  it("dà 30 di base per mano, +20 se il contratto è mantenuto, +10 per surlevée", () => {
    // 9/9 → 30+20; 11/10 → 30+20+10; 8/9 → 30
    const { handXp } = computeTournamentXp(
      [handResult(9, 9), handResult(11, 10), handResult(8, 9)],
      true
    );
    expect(handXp).toBe(50 + 60 + 30);
  });

  it("aggiunge il bonus torneo di 150 solo alla prima giocata della settimana", () => {
    const results = [handResult(9, 9)];
    expect(computeTournamentXp(results, false)).toEqual({
      handXp: 50,
      tournamentBonus: 150,
      xpEarned: 200,
    });
    expect(computeTournamentXp(results, true)).toEqual({
      handXp: 50,
      tournamentBonus: 0,
      xpEarned: 50,
    });
  });

  it("non toglie XP per le cadute", () => {
    const { handXp } = computeTournamentXp([handResult(5, 10)], true);
    expect(handXp).toBe(30);
  });
});

// ── decideProgressRestore ──────────────────────────────────────────────────

describe("decideProgressRestore", () => {
  const hands = [smazzata("a", "3NT"), smazzata("b", "4♠"), smazzata("c", "2♥")];

  it("riprende le mani già giocate quando il set di mani coincide", () => {
    const saved = progress(["a", "b", "c"], [handResult(9, 9), handResult(10, 10)]);
    expect(decideProgressRestore(saved, hands)).toEqual({
      action: "restore",
      handResults: saved.handResults,
    });
  });

  it("senza progresso salvato non fa nulla", () => {
    expect(decideProgressRestore(null, hands)).toEqual({ action: "none" });
  });

  it("senza mani caricate non tocca il progresso salvato", () => {
    // Le smazzate arrivano in modo asincrono: un progresso valido non va
    // buttato solo perché la pool non è ancora arrivata.
    const saved = progress(["a", "b", "c"], [handResult(9, 9)]);
    expect(decideProgressRestore(saved, [])).toEqual({ action: "none" });
  });

  it("azzera il progresso se le mani della settimana sono cambiate", () => {
    const saved = progress(["a", "x", "c"], [handResult(9, 9)]);
    expect(decideProgressRestore(saved, hands)).toEqual({ action: "clear" });
  });

  it("azzera il progresso se l'ordine delle mani è cambiato", () => {
    const saved = progress(["b", "a", "c"], [handResult(9, 9)]);
    expect(decideProgressRestore(saved, hands)).toEqual({ action: "clear" });
  });

  it("azzera un progresso con più mani di quelle in programma", () => {
    const saved = progress(
      ["a", "b", "c"],
      [handResult(9, 9), handResult(10, 10), handResult(8, 8)]
    );
    expect(decideProgressRestore(saved, hands)).toEqual({ action: "clear" });
  });

  it("azzera un progresso di lunghezza pari alle mani (torneo di fatto concluso)", () => {
    const saved = progress(["a"], [handResult(9, 9)]);
    expect(decideProgressRestore(saved, [smazzata("a", "3NT")])).toEqual({
      action: "clear",
    });
  });

  it("un progresso vuoto e coerente viene ripristinato senza mani da saltare", () => {
    expect(decideProgressRestore(progress(["a", "b", "c"], []), hands)).toEqual({
      action: "restore",
      handResults: [],
    });
  });
});

// ── tournamentCtaLabel ─────────────────────────────────────────────────────

describe("tournamentCtaLabel", () => {
  it("propone l'avvio quando non c'è nulla da riprendere", () => {
    expect(tournamentCtaLabel(0, TOURNAMENT_HAND_COUNT)).toBe("Gioca il Torneo");
  });

  it("propone la ripresa indicando la mano successiva", () => {
    expect(tournamentCtaLabel(2, TOURNAMENT_HAND_COUNT)).toBe(
      "Riprendi il Torneo (mano 3/5)"
    );
    expect(tournamentCtaLabel(4, TOURNAMENT_HAND_COUNT)).toBe(
      "Riprendi il Torneo (mano 5/5)"
    );
  });
});
