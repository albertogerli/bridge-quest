import { describe, it, expect } from "vitest";
import {
  buildBadges,
  buildGamesPerDay,
  challengeWinRate,
  completionPercent,
  computeCourseCompetence,
  computeFiches,
  computeGamePerformance,
  countCompletedModules,
  countCompletedWorlds,
  countEarnedBadges,
  countTotalModules,
  describeChallenge,
  formatPlayTime,
  resolveLevelNames,
  worldProgress,
  type CompletedModules,
  type GameRecordLike,
} from "./profile-stats";
import type { Course, Lesson, World } from "@/lib/catalog";
import { MAX_LEVEL } from "@/lib/xp-levels";

// ── Fixtures ───────────────────────────────────────────────────────────────

/** Mercoledì 2026-08-05, 12:00 locali: la finestra dei 7 giorni è 30/07 → 05/08. */
const NOW = new Date(2026, 7, 5, 12, 0, 0);

function lesson(id: number, moduleIds: number[]): Lesson {
  return {
    id,
    worldId: 1,
    title: `Lezione ${id}`,
    subtitle: "",
    icon: "📘",
    modules: moduleIds.map((m) => ({ id: m })),
  } as unknown as Lesson;
}

function world(id: number, lessons: Lesson[]): World {
  return {
    id,
    name: `Mondo ${id}`,
    subtitle: "",
    icon: "🌍",
    gradient: "from-a to-b",
    iconBg: "bg-a",
    lessons,
  };
}

function course(id: Course["id"], lessons: Lesson[]): Course {
  return {
    id,
    name: id,
    subtitle: "",
    icon: "🃏",
    color: "",
    gradient: "",
    level: "base",
    lessonCount: lessons.length,
    worlds: [world(1, lessons)],
    lessons,
  } as unknown as Course;
}

/** Iso date locale (YYYY-MM-DD) a `offset` giorni da NOW: stesso calcolo del grafico. */
function isoDay(offset: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// ── buildGamesPerDay ───────────────────────────────────────────────────────

/** Record dello storico `bq_game_history` a `offset` giorni da NOW. */
function record(offset: number, hour = 10): GameRecordLike {
  return { date: `${isoDay(offset)}T${String(hour).padStart(2, "0")}:00:00Z` };
}

describe("buildGamesPerDay", () => {
  it("costruisce 7 giorni consecutivi terminando con oggi", () => {
    const { days } = buildGamesPerDay(NOW, null);
    expect(days).toHaveLength(7);
    expect(days[6].date).toBe(isoDay(0));
    expect(days[0].date).toBe(isoDay(-6));
    expect(days[6].label).toBe("Mer"); // 2026-08-05 è mercoledì
  });

  it("senza storico azzera tutto e normalizza maxGames a 1", () => {
    const { days, maxGames, hasData } = buildGamesPerDay(NOW, []);
    expect(days.every((d) => d.games === 0)).toBe(true);
    expect(maxGames).toBe(1);
    expect(hasData).toBe(false);
  });

  it("conta le partite dello storico sul giorno corrispondente", () => {
    const { days, maxGames, hasData } = buildGamesPerDay(NOW, [
      record(0, 10),
      record(0, 18),
      record(-2, 9),
    ]);
    expect(days[6].games).toBe(2);
    expect(days[4].games).toBe(1);
    expect(maxGames).toBe(2);
    expect(hasData).toBe(true);
  });

  it("ignora le partite fuori finestra e i record senza data", () => {
    const { days, hasData } = buildGamesPerDay(NOW, [
      record(-30),
      { } as GameRecordLike,
    ]);
    expect(days.reduce((s, d) => s + d.games, 0)).toBe(0);
    expect(hasData).toBe(false);
  });

  it("REGRESSIONE: il grafico sopravvive allo svuotamento della coda di sync", () => {
    // `bq_game_results_queue` (vecchia fonte) viene cancellata dopo il flush
    // verso Supabase: lo storico `bq_game_history` no, e i grafici restano.
    const storico = [record(0), record(-1)];
    expect(buildGamesPerDay(NOW, storico).hasData).toBe(true);
    expect(buildGamesPerDay(NOW, storico).days[6].games).toBe(1);
  });
});

// ── computeCourseCompetence ────────────────────────────────────────────────

describe("computeCourseCompetence", () => {
  it("restituisce sempre le 4 righe dei corsi principali, anche senza catalogo", () => {
    const rows = computeCourseCompetence([], {});
    expect(rows.map((r) => r.id)).toEqual(["fiori", "quadri", "cuori-gioco", "cuori-licita"]);
    expect(rows.every((r) => r.total === 0 && r.completed === 0 && r.progress === 0)).toBe(true);
  });

  it("calcola la percentuale sui moduli completati del corso", () => {
    const courses = [course("fiori", [lesson(1, [1, 2]), lesson(2, [1, 2])])];
    const completed: CompletedModules = { "1-1": true, "1-2": true, "2-1": true };
    const fiori = computeCourseCompetence(courses, completed)[0];
    expect(fiori.total).toBe(4);
    expect(fiori.completed).toBe(3);
    expect(fiori.progress).toBe(75);
  });

  it("non conta i moduli completati di altri corsi", () => {
    const courses = [course("fiori", [lesson(1, [1])])];
    const rows = computeCourseCompetence(courses, { "9-9": true });
    expect(rows[0].completed).toBe(0);
    expect(rows[1].total).toBe(0);
  });
});

// ── formatPlayTime / computeGamePerformance ────────────────────────────────

describe("formatPlayTime", () => {
  it("formatta i minuti sotto l'ora", () => {
    expect(formatPlayTime(0)).toBe("< 1 min");
    expect(formatPlayTime(0.4)).toBe("< 1 min");
    expect(formatPlayTime(1)).toBe("1 min");
    expect(formatPlayTime(42.6)).toBe("43 min");
    expect(formatPlayTime(59)).toBe("59 min");
  });

  it("formatta ore e minuti", () => {
    expect(formatPlayTime(60)).toBe("1h");
    expect(formatPlayTime(125)).toBe("2h 5m");
    expect(formatPlayTime(180)).toBe("3h");
  });
});

describe("computeGamePerformance", () => {
  const emptyStats = { totalGames: 0, avgTricks: 0 };

  it("azzera tutto su profilo vuoto", () => {
    expect(
      computeGamePerformance({ gameStats: emptyStats, rawMinutes: null, streak: 0 }),
    ).toEqual({ totalGames: 0, currentStreak: 0, timeDisplay: "< 1 min", avgTricks: 0 });
  });

  it("REGRESSIONE: partite e media prese vengono dallo storico, non dalla coda", () => {
    // Stessa fonte dell'intestazione dell'accordion: dopo un flush della coda
    // `bq_game_results_queue` i due numeri non possono più divergere.
    expect(
      computeGamePerformance({
        gameStats: { totalGames: 12, avgTricks: 8.4 },
        rawMinutes: "90",
        streak: 4,
      }),
    ).toEqual({ totalGames: 12, currentStreak: 4, timeDisplay: "1h 30m", avgTricks: 8.4 });
  });

  it("REGRESSIONE: la streak riportata è quella corrente (nessun record storico salvato)", () => {
    const stats = computeGamePerformance({
      gameStats: emptyStats,
      rawMinutes: "0",
      streak: 3,
    });
    expect(stats.currentStreak).toBe(3);
    expect(stats).not.toHaveProperty("bestStreak");
  });

  it("non esplode su minuti non numerici", () => {
    expect(
      computeGamePerformance({ gameStats: emptyStats, rawMinutes: "boh", streak: 0 })
        .timeDisplay,
    ).toBe("< 1 min");
  });
});

// ── Moduli e mondi ─────────────────────────────────────────────────────────

describe("countTotalModules / completionPercent / worldProgress / countCompletedWorlds", () => {
  const worlds = [
    world(1, [lesson(1, [1, 2]), lesson(2, [1])]),
    world(2, [lesson(3, [1, 2])]),
    world(3, []), // mondo vuoto: non deve contare come completato
  ];

  it("conta i moduli disponibili (0 con lista vuota)", () => {
    expect(countTotalModules([])).toBe(0);
    expect(countTotalModules(worlds)).toBe(5);
  });

  it("evita la divisione per zero nella percentuale", () => {
    expect(completionPercent(0, 0)).toBe(0);
    expect(completionPercent(0, 10)).toBe(0);
    expect(completionPercent(1, 3)).toBe(33);
    expect(completionPercent(10, 10)).toBe(100);
  });

  it("calcola il progresso del singolo mondo", () => {
    expect(worldProgress(worlds[0], { "1-1": true })).toEqual({
      modules: 3, completed: 1, percent: 33,
    });
    expect(worldProgress(worlds[2], {})).toEqual({ modules: 0, completed: 0, percent: 0 });
  });

  it("conta solo i mondi completi e non quelli senza moduli", () => {
    expect(countCompletedWorlds(worlds, {})).toBe(0);
    expect(countCompletedWorlds(worlds, { "3-1": true, "3-2": true })).toBe(1);
    expect(countCompletedWorlds([], {})).toBe(0);
  });

  it("conta i moduli completati presenti nel catalogo", () => {
    expect(countCompletedModules(worlds, {})).toBe(0);
    expect(countCompletedModules(worlds, { "1-1": true, "3-2": true })).toBe(2);
    expect(countCompletedModules([], { "1-1": true })).toBe(0);
  });

  it("REGRESSIONE: i moduli non più a catalogo non superano il 100%", () => {
    // `bq-game-store` conserva le chiavi delle lezioni ritirate: contarle
    // portava il completamento oltre il 100% e sbloccava «Diplomato».
    const completati: CompletedModules = {
      "1-1": true, "1-2": true, "2-1": true, "3-1": true, "3-2": true, // catalogo (5)
      "99-1": true, "99-2": true, // lezione ritirata
    };
    const totale = countTotalModules(worlds);
    const fatti = countCompletedModules(worlds, completati);
    expect(Object.keys(completati).length).toBeGreaterThan(totale);
    expect(fatti).toBe(totale);
    expect(completionPercent(fatti, totale)).toBe(100);
  });
});

// ── Livelli ────────────────────────────────────────────────────────────────

describe("resolveLevelNames", () => {
  const names = ["Novizio", "Allievo", "Esperto"];

  it("associa il nome al livello corrente e al successivo", () => {
    expect(resolveLevelNames(1, names)).toEqual({
      levelName: "Novizio", nextLevelName: "Allievo",
    });
    expect(resolveLevelNames(2, names)).toEqual({
      levelName: "Allievo", nextLevelName: "Esperto",
    });
  });

  it("satura sull'ultimo nome quando i livelli superano l'elenco", () => {
    expect(resolveLevelNames(9, names)).toEqual({
      levelName: "Esperto", nextLevelName: "Esperto",
    });
  });

  it("al livello massimo il prossimo nome coincide con quello corrente", () => {
    const many = Array.from({ length: MAX_LEVEL + 1 }, (_, i) => `L${i + 1}`);
    expect(resolveLevelNames(MAX_LEVEL, many)).toEqual({
      levelName: `L${MAX_LEVEL}`, nextLevelName: `L${MAX_LEVEL}`,
    });
    expect(resolveLevelNames(MAX_LEVEL - 1, many).nextLevelName).toBe(`L${MAX_LEVEL}`);
  });
});

// ── Badge ──────────────────────────────────────────────────────────────────

describe("buildBadges / countEarnedBadges", () => {
  const zero = {
    totalModulesCompleted: 0, handsPlayed: 0, streak: 0,
    xp: 0, worldsCompleted: 0, completionPercent: 0,
  };

  it("a profilo vuoto restituisce 12 badge tutti bloccati", () => {
    const badges = buildBadges(zero);
    expect(badges).toHaveLength(12);
    expect(countEarnedBadges(badges)).toBe(0);
  });

  it("mantiene l'ordine e le descrizioni originali", () => {
    expect(buildBadges(zero).map((b) => b.name)).toEqual([
      "Prima Presa", "Studente", "Impasse Riuscita", "Praticante", "Streak 7gg",
      "Colpo in Bianco", "Veterano", "Piccolo Slam", "Mondo Completo",
      "Grande Slam", "Diplomato", "Campione",
    ]);
    expect(buildBadges(zero)[0].desc).toBe("Completa 1 modulo");
  });

  it("sblocca i badge sulle soglie esatte", () => {
    const byName = (params: Parameters<typeof buildBadges>[0], name: string) =>
      buildBadges(params).find((b) => b.name === name)!.earned;
    expect(byName({ ...zero, totalModulesCompleted: 1 }, "Prima Presa")).toBe(true);
    expect(byName({ ...zero, totalModulesCompleted: 4 }, "Studente")).toBe(false);
    expect(byName({ ...zero, totalModulesCompleted: 5 }, "Studente")).toBe(true);
    expect(byName({ ...zero, totalModulesCompleted: 20 }, "Colpo in Bianco")).toBe(true);
    expect(byName({ ...zero, handsPlayed: 10 }, "Praticante")).toBe(true);
    expect(byName({ ...zero, handsPlayed: 50 }, "Veterano")).toBe(true);
    expect(byName({ ...zero, streak: 7 }, "Streak 7gg")).toBe(true);
    expect(byName({ ...zero, xp: 500 }, "Piccolo Slam")).toBe(true);
    expect(byName({ ...zero, xp: 2000 }, "Grande Slam")).toBe(true);
    expect(byName({ ...zero, worldsCompleted: 1 }, "Mondo Completo")).toBe(true);
    expect(byName({ ...zero, completionPercent: 100 }, "Diplomato")).toBe(true);
  });

  it("«Campione» resta bloccato anche a profilo completo", () => {
    const full = buildBadges({
      totalModulesCompleted: 999, handsPlayed: 999, streak: 99,
      xp: 99999, worldsCompleted: 9, completionPercent: 100,
    });
    expect(full.find((b) => b.name === "Campione")!.earned).toBe(false);
    expect(countEarnedBadges(full)).toBe(11);
  });
});

// ── Sfide IMP ──────────────────────────────────────────────────────────────

describe("challengeWinRate", () => {
  it("è 0 senza sfide giocate", () => {
    expect(challengeWinRate({ played: 0, won: 0 })).toBe(0);
  });

  it("arrotonda la percentuale di vittorie", () => {
    expect(challengeWinRate({ played: 3, won: 1 })).toBe(33);
    expect(challengeWinRate({ played: 4, won: 4 })).toBe(100);
  });
});

describe("describeChallenge", () => {
  const base = {
    challenger_id: "me",
    challenger_imps: 12,
    opponent_imps: 5,
    challenger_name: "Io",
    opponent_name: "Rivale",
  };

  it("vista sfidante: IMP miei = challenger_imps", () => {
    expect(describeChallenge(base, "me")).toEqual({
      isChallenger: true, opponentName: "Rivale",
      myImps: 12, theirImps: 5, scored: true, won: true, drawn: false, netImp: 7,
    });
  });

  it("vista sfidato: i lati si invertono", () => {
    expect(describeChallenge(base, "altro")).toEqual({
      isChallenger: false, opponentName: "Io",
      myImps: 5, theirImps: 12, scored: true, won: false, drawn: false, netImp: -7,
    });
  });

  it("riconosce il pareggio", () => {
    const draw = describeChallenge({ ...base, challenger_imps: 8, opponent_imps: 8 }, "me");
    expect(draw.scored).toBe(true);
    expect(draw.drawn).toBe(true);
    expect(draw.won).toBe(false);
    expect(draw.netImp).toBe(0);
  });

  it("REGRESSIONE: una sfida senza IMP non è un pareggio ma una sfida da completare", () => {
    const nulls = describeChallenge(
      { challenger_id: "me", challenger_imps: null, opponent_imps: null },
      "me",
    );
    expect(nulls.myImps).toBeNull();
    expect(nulls.scored).toBe(false);
    expect(nulls.drawn).toBe(false);
    expect(nulls.won).toBe(false);
  });

  it("REGRESSIONE: anche un solo lato senza IMP non produce un esito", () => {
    const half = describeChallenge(
      { challenger_id: "me", challenger_imps: 9, opponent_imps: null },
      "me",
    );
    expect(half.scored).toBe(false);
    expect(half.won).toBe(false);
    expect(half.drawn).toBe(false);
  });

  it("ripiega su «Avversario» quando manca il nome", () => {
    expect(
      describeChallenge({ challenger_id: "me", challenger_imps: 1, opponent_imps: 0 }, "me")
        .opponentName,
    ).toBe("Avversario");
    expect(
      describeChallenge({ challenger_id: "tu", challenger_imps: 1, opponent_imps: 0 }, "me")
        .opponentName,
    ).toBe("Avversario");

  });
});

// ── Fiches ─────────────────────────────────────────────────────────────────

describe("computeFiches", () => {
  it("converte 10 XP in 1 fiche troncando", () => {
    expect(computeFiches(0)).toBe(0);
    expect(computeFiches(9)).toBe(0);
    expect(computeFiches(10)).toBe(1);
    expect(computeFiches(1999)).toBe(199);
  });
});
