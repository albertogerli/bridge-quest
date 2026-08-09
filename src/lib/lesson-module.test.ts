import { describe, it, expect } from "vitest";
import {
  CONFETTI_FALL_FALLBACK_PX,
  GLOSSARY_AUTO_KEYS,
  MIN_READ_SECONDS,
  PARTICLE_EMOJI,
  QUIZ_BLOCK_TYPES,
  buildConfettiPieces,
  buildGlossaryTermMap,
  buildShuffledQuizOptions,
  collectRuleTexts,
  computeCardStreakBonus,
  computeProgressPercent,
  computeQuizStreakBonus,
  computeStars,
  computeTotalModuleXp,
  computeXpMultiplier,
  confettiFallDistance,
  correctAnswerFor,
  countCorrectAnswers,
  countQuizzes,
  findNextLesson,
  findNextModule,
  hintLetter,
  isAnswerCorrect,
  isQuizBlock,
  loginStreakAction,
  needsReadTimer,
  parseCardSelectHand,
  pickFiftyFiftyEliminations,
  pickParticleSpin,
  shouldRecordCompletion,
  shuffleIndices,
  splitTextByCards,
  splitTextByGlossaryTerms,
  todayIsoDate,
  withStepViewed,
  xpDeltaToPersist,
  yesterdayIsoDate,
} from "./lesson-module";
import type {
  ContentBlock,
  GlossaryEntry,
  Lesson,
  LessonModule,
  World,
} from "@/lib/catalog";

// ── Fixtures ───────────────────────────────────────────────────────────────

function block(type: string, extra: Partial<ContentBlock> = {}): ContentBlock {
  return { type, content: `blocco ${type}`, ...extra };
}

function lessonModule(id: string): LessonModule {
  return {
    id,
    title: `Modulo ${id}`,
    icon: null,
    duration: "5",
    type: "theory",
    content: [],
    xpReward: 50,
  };
}

function lesson(id: number, moduleIds: string[]): Lesson {
  return {
    id,
    worldId: 1,
    title: `Lezione ${id}`,
    subtitle: "",
    icon: "🃏",
    modules: moduleIds.map(lessonModule),
  } as Lesson;
}

function world(id: number, lessons: Lesson[]): World {
  return {
    id,
    name: `Mondo ${id}`,
    subtitle: "",
    icon: "🌍",
    gradient: "",
    iconBg: "",
    lessons,
  };
}

function glossaryEntry(id: string, term: string): GlossaryEntry {
  return { id, term, definition: "", emoji: "", relatedTerms: [] } as unknown as GlossaryEntry;
}

/** Generatore deterministico: consuma la sequenza data, poi torna 0. */
function seededRandom(values: number[]): () => number {
  let i = 0;
  return () => (i < values.length ? values[i++] : 0);
}

// ── Costanti ───────────────────────────────────────────────────────────────

describe("costanti", () => {
  it("elenca i cinque tipi di blocco interattivi", () => {
    expect(QUIZ_BLOCK_TYPES).toEqual([
      "quiz",
      "true-false",
      "card-select",
      "hand-eval",
      "bid-select",
    ]);
  });

  it("tiene il tempo minimo di lettura a 5 secondi (verificato dall'E2E)", () => {
    expect(MIN_READ_SECONDS).toBe(5);
  });

  it("non auto-linka parole italiane comuni", () => {
    expect(GLOSSARY_AUTO_KEYS).not.toContain("carta");
    expect(GLOSSARY_AUTO_KEYS).toContain("dichiarante");
  });
});

// ── Conteggio quiz e risposte corrette ─────────────────────────────────────

describe("isQuizBlock", () => {
  it("riconosce i tipi interattivi e scarta gli altri", () => {
    for (const type of QUIZ_BLOCK_TYPES) {
      expect(isQuizBlock(block(type))).toBe(true);
    }
    expect(isQuizBlock(block("text"))).toBe(false);
    expect(isQuizBlock(block("rule"))).toBe(false);
    expect(isQuizBlock(block("sequence"))).toBe(false);
  });

  it("è falso per un blocco assente (passo oltre la fine del modulo)", () => {
    expect(isQuizBlock(undefined)).toBe(false);
  });
});

describe("countQuizzes", () => {
  it("conta tutti i tipi interattivi, non solo 'quiz'", () => {
    const content = [
      block("heading"),
      block("quiz"),
      block("text"),
      block("true-false"),
      block("card-select"),
      block("hand-eval"),
      block("bid-select"),
      block("sequence"),
    ];
    expect(countQuizzes(content)).toBe(5);
  });

  it("è zero su un modulo di sola teoria", () => {
    expect(countQuizzes([block("heading"), block("text"), block("rule")])).toBe(0);
  });
});

describe("isAnswerCorrect", () => {
  it("confronta con correctAnswer per quiz, true-false e bid-select", () => {
    const quiz = block("quiz", { correctAnswer: 2, options: ["a", "b", "c"] });
    expect(isAnswerCorrect(quiz, 2)).toBe(true);
    expect(isAnswerCorrect(quiz, 0)).toBe(false);
    expect(isAnswerCorrect(block("true-false", { correctAnswer: 1 }), 1)).toBe(true);
    expect(isAnswerCorrect(block("bid-select", { correctAnswer: 0 }), 0)).toBe(true);
  });

  it("confronta con correctValue per hand-eval", () => {
    const he = block("hand-eval", { correctValue: 13, correctAnswer: 0 });
    expect(isAnswerCorrect(he, 13)).toBe(true);
    expect(isAnswerCorrect(he, 0)).toBe(false);
  });

  it("confronta con l'indice della carta per card-select", () => {
    const cs = block("card-select", { cards: "♠AK7", correctCard: "♠7" });
    expect(isAnswerCorrect(cs, 2)).toBe(true);
    expect(isAnswerCorrect(cs, 0)).toBe(false);
  });

  it("è falso per un blocco assente", () => {
    expect(isAnswerCorrect(undefined, 0)).toBe(false);
  });
});

describe("correctAnswerFor", () => {
  /**
   * È la soluzione che il power-up «salta» registra al posto dell'utente:
   * deve essere espressa nella stessa unità in cui viene registrata la
   * risposta, altrimenti il salta consegna una soluzione sbagliata (e il
   * modulo la conta pure come errore).
   */
  it("dà l'indice dell'opzione per quiz, true-false e bid-select", () => {
    expect(correctAnswerFor(block("quiz", { correctAnswer: 2, options: ["a", "b", "c"] }))).toBe(2);
    expect(correctAnswerFor(block("true-false", { correctAnswer: 1 }))).toBe(1);
    expect(correctAnswerFor(block("bid-select", { correctAnswer: 0 }))).toBe(0);
  });

  it("dà il valore in punti per hand-eval, non l'indice", () => {
    expect(correctAnswerFor(block("hand-eval", { correctValue: 13, correctAnswer: 0 }))).toBe(13);
  });

  it("dà l'indice della carta dentro la mano per card-select", () => {
    expect(correctAnswerFor(block("card-select", { cards: "♠AK7", correctCard: "♠7" }))).toBe(2);
  });

  it("segnala con -1 la carta corretta che non compare nella mano", () => {
    expect(correctAnswerFor(block("card-select", { cards: "♠AK7", correctCard: "♥Q" }))).toBe(-1);
  });

  it("dà undefined quando il blocco non dichiara una soluzione", () => {
    expect(correctAnswerFor(block("quiz", { options: ["a", "b"] }))).toBeUndefined();
    expect(correctAnswerFor(block("hand-eval"))).toBeUndefined();
    expect(correctAnswerFor(undefined)).toBeUndefined();
  });

  it("è la risposta che il modulo conta come giusta, per ogni tipo interattivo", () => {
    // Valori attesi scritti a mano: l'oracolo non deve essere la funzione
    // stessa, altrimenti il confronto sarebbe una tautologia.
    const cases: [ContentBlock, number][] = [
      [block("quiz", { correctAnswer: 2, options: ["a", "b", "c"] }), 2],
      [block("true-false", { correctAnswer: 1 }), 1],
      [block("bid-select", { correctAnswer: 3, options: ["1♣", "1♦", "1♥", "1♠"] }), 3],
      [block("hand-eval", { correctValue: 13, correctAnswer: 0 }), 13],
      [block("card-select", { cards: "♠AK7 ♥Q10", correctCard: "♥10" }), 4],
    ];
    for (const [b, expected] of cases) {
      expect(correctAnswerFor(b)).toBe(expected);
      expect(isAnswerCorrect(b, expected)).toBe(true);
    }
  });
});

describe("countCorrectAnswers", () => {
  const content = [
    block("heading"),
    block("quiz", { correctAnswer: 1, options: ["a", "b"] }),
    block("card-select", { cards: "♠AK", correctCard: "♠K" }),
    block("hand-eval", { correctValue: 12 }),
  ];

  it("conta solo le risposte esatte, per tipo di blocco", () => {
    expect(countCorrectAnswers(content, { 1: 1, 2: 1, 3: 12 })).toBe(3);
    expect(countCorrectAnswers(content, { 1: 0, 2: 1, 3: 9 })).toBe(1);
  });

  it("è zero senza risposte", () => {
    expect(countCorrectAnswers(content, {})).toBe(0);
  });
});

// ── Punteggio finale e stelle ──────────────────────────────────────────────

describe("computeStars", () => {
  it("dà 3 stelle solo col punteggio pieno", () => {
    expect(computeStars(4, 4)).toBe(3);
    expect(computeStars(3, 4)).toBe(2);
  });

  it("scala a 2 dal 70%, a 1 dal 40%, a 0 sotto", () => {
    expect(computeStars(7, 10)).toBe(2);
    expect(computeStars(6, 10)).toBe(1);
    expect(computeStars(4, 10)).toBe(1);
    expect(computeStars(3, 10)).toBe(0);
  });

  it("è 0 quando non ci sono quiz (nessuna divisione per zero)", () => {
    expect(computeStars(0, 0)).toBe(0);
  });
});

// ── XP ─────────────────────────────────────────────────────────────────────

describe("computeQuizStreakBonus", () => {
  it("cresce a scalini con la serie", () => {
    expect(computeQuizStreakBonus(1)).toBe(0);
    expect(computeQuizStreakBonus(2)).toBe(10);
    expect(computeQuizStreakBonus(3)).toBe(15);
    expect(computeQuizStreakBonus(4)).toBe(15);
    expect(computeQuizStreakBonus(5)).toBe(25);
    expect(computeQuizStreakBonus(9)).toBe(25);
  });
});

describe("computeCardStreakBonus", () => {
  it("si ferma a +15 (card-select e hand-eval non hanno lo scalino da 5)", () => {
    expect(computeCardStreakBonus(1)).toBe(0);
    expect(computeCardStreakBonus(2)).toBe(10);
    expect(computeCardStreakBonus(3)).toBe(15);
    expect(computeCardStreakBonus(7)).toBe(15);
  });
});

describe("computeXpMultiplier", () => {
  it("passa a 2x da 3 e a 3x da 5 risposte consecutive", () => {
    expect(computeXpMultiplier(0)).toBe(1);
    expect(computeXpMultiplier(2)).toBe(1);
    expect(computeXpMultiplier(3)).toBe(2);
    expect(computeXpMultiplier(4)).toBe(2);
    expect(computeXpMultiplier(5)).toBe(3);
    expect(computeXpMultiplier(12)).toBe(3);
  });
});

describe("xpDeltaToPersist", () => {
  it("versa solo l'incremento", () => {
    expect(xpDeltaToPersist(0, 25)).toBe(25);
    expect(xpDeltaToPersist(25, 60)).toBe(35);
  });

  it("non riassegna XP a totale invariato o in calo (idempotenza)", () => {
    expect(xpDeltaToPersist(60, 60)).toBe(0);
    expect(xpDeltaToPersist(60, 10)).toBe(0);
  });

  it("ripetuto sullo stesso totale versa una volta sola", () => {
    let persisted = 0;
    let versato = 0;
    for (const totale of [20, 20, 20]) {
      const delta = xpDeltaToPersist(persisted, totale);
      versato += delta;
      if (delta > 0) persisted = totale;
    }
    expect(versato).toBe(20);
  });
});

describe("computeTotalModuleXp", () => {
  it("somma XP di sessione e premio del modulo", () => {
    expect(computeTotalModuleXp(85, 50)).toBe(135);
    expect(computeTotalModuleXp(0, 50)).toBe(50);
  });
});

// ── Tempo minimo di lettura e avanzamento ──────────────────────────────────

describe("needsReadTimer", () => {
  it("richiede il tempo minimo su un blocco di testo mai visto", () => {
    expect(needsReadTimer(block("text"), false)).toBe(true);
    expect(needsReadTimer(block("rule"), false)).toBe(true);
  });

  it("non lo richiede sui passi già visti", () => {
    expect(needsReadTimer(block("text"), true)).toBe(false);
  });

  it("non lo richiede sui quiz (li blocca già la risposta)", () => {
    expect(needsReadTimer(block("quiz"), false)).toBe(false);
    expect(needsReadTimer(block("bid-select"), false)).toBe(false);
  });

  it("non lo richiede se il blocco non esiste", () => {
    expect(needsReadTimer(undefined, false)).toBe(true);
  });
});

describe("withStepViewed", () => {
  it("aggiunge il passo senza mutare l'insieme originale", () => {
    const viewed = new Set([0, 1]);
    const next = withStepViewed(viewed, 2);
    expect([...next]).toEqual([0, 1, 2]);
    expect([...viewed]).toEqual([0, 1]);
    expect(next).not.toBe(viewed);
  });

  it("è idempotente su un passo già visto", () => {
    expect([...withStepViewed(new Set([0, 1]), 1)]).toEqual([0, 1]);
  });
});

describe("computeProgressPercent", () => {
  it("mostra il passo corrente come frazione completata", () => {
    expect(computeProgressPercent(0, 4)).toBe(25);
    expect(computeProgressPercent(3, 4)).toBe(100);
    expect(computeProgressPercent(0, 1)).toBe(100);
  });
});

describe("shouldRecordCompletion", () => {
  it("registra al raggiungimento dell'ultimo blocco", () => {
    expect(shouldRecordCompletion(3, 4, false)).toBe(true);
  });

  it("non registra prima dell'ultimo blocco", () => {
    expect(shouldRecordCompletion(2, 4, false)).toBe(false);
  });

  it("non registra due volte lo stesso modulo (idempotenza XP)", () => {
    expect(shouldRecordCompletion(3, 4, true)).toBe(false);
  });

  it("non registra un modulo senza contenuto", () => {
    expect(shouldRecordCompletion(0, 0, false)).toBe(false);
  });
});

// ── Serie giornaliera ──────────────────────────────────────────────────────

describe("todayIsoDate / yesterdayIsoDate", () => {
  it("rendono le date in formato YYYY-MM-DD", () => {
    const now = Date.UTC(2026, 7, 8, 12);
    expect(todayIsoDate(now)).toBe("2026-08-08");
    expect(yesterdayIsoDate(now)).toBe("2026-08-07");
  });

  it("attraversano il cambio di mese", () => {
    expect(yesterdayIsoDate(Date.UTC(2026, 7, 1, 12))).toBe("2026-07-31");
  });
});

describe("loginStreakAction", () => {
  it("non tocca la serie se si è già entrati oggi", () => {
    expect(loginStreakAction("2026-08-08", "2026-08-08", "2026-08-07")).toBe("none");
  });

  it("incrementa se l'ultimo accesso era ieri", () => {
    expect(loginStreakAction("2026-08-07", "2026-08-08", "2026-08-07")).toBe("increment");
  });

  it("azzera dopo un buco o al primo accesso", () => {
    expect(loginStreakAction("2026-08-01", "2026-08-08", "2026-08-07")).toBe("reset");
    expect(loginStreakAction(null, "2026-08-08", "2026-08-07")).toBe("reset");
  });
});

// ── Opzioni dei quiz ───────────────────────────────────────────────────────

describe("shuffleIndices", () => {
  it("è una permutazione degli indici", () => {
    const out = shuffleIndices(5, seededRandom([0.9, 0.1, 0.5, 0.3]));
    expect([...out].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("è deterministico a parità di generatore", () => {
    const seq = [0.42, 0.17, 0.99, 0.05];
    expect(shuffleIndices(5, seededRandom(seq))).toEqual(
      shuffleIndices(5, seededRandom(seq))
    );
  });

  it("gestisce liste vuote o di un solo elemento", () => {
    expect(shuffleIndices(0)).toEqual([]);
    expect(shuffleIndices(1)).toEqual([0]);
  });
});

describe("buildShuffledQuizOptions", () => {
  const content = [
    block("text"),
    block("quiz", { options: ["a", "b", "c", "d"], correctAnswer: 0 }),
    block("quiz", { options: ["si", "no"], correctAnswer: 0 }),
    block("bid-select", { options: ["1C", "1D", "1H"], correctAnswer: 1 }),
    block("true-false", { correctAnswer: 0 }),
  ];

  it("rimescola solo quiz e bid-select con più di due opzioni", () => {
    const map = buildShuffledQuizOptions(content, seededRandom([0.5]));
    expect(Object.keys(map).sort()).toEqual(["1", "3"]);
    expect([...map[1]].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    expect([...map[3]].sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it("lascia fuori i quiz a due opzioni (l'ordine resta l'originale)", () => {
    const map = buildShuffledQuizOptions(content);
    expect(map[2]).toBeUndefined();
    expect(map[4]).toBeUndefined();
  });

  it("è deterministico a parità di generatore (memoizzabile)", () => {
    const seq = [0.3, 0.8, 0.1, 0.6, 0.44];
    expect(buildShuffledQuizOptions(content, seededRandom(seq))).toEqual(
      buildShuffledQuizOptions(content, seededRandom(seq))
    );
  });
});

describe("pickFiftyFiftyEliminations", () => {
  it("elimina tutte le sbagliate tranne una, mai la corretta", () => {
    const out = pickFiftyFiftyEliminations(4, 2, seededRandom([0]));
    expect(out).not.toContain(2);
    expect(out).toHaveLength(2);
  });

  it("tiene la sbagliata estratta dal generatore", () => {
    // wrongIndices = [0,1,3]; random 0.5 -> floor(1.5) = 1 -> tiene l'indice 1
    expect(pickFiftyFiftyEliminations(4, 2, seededRandom([0.5]))).toEqual([0, 3]);
  });
});

describe("hintLetter", () => {
  it("usa la posizione nella lista rimescolata", () => {
    expect(hintLetter([2, 0, 1], 0)).toBe("B");
    expect(hintLetter([2, 0, 1], 2)).toBe("A");
  });

  it("ricade sull'indice originale senza rimescolamento", () => {
    expect(hintLetter(undefined, 3)).toBe("D");
    expect(hintLetter(undefined, undefined)).toBe("A");
  });
});

// ── Effetti celebrativi ────────────────────────────────────────────────────

describe("buildConfettiPieces", () => {
  it("produce un pezzo per ogni coriandolo richiesto", () => {
    expect(buildConfettiPieces(30, seededRandom([]))).toHaveLength(30);
    expect(buildConfettiPieces(0)).toEqual([]);
  });

  it("tiene ogni valore nel suo intervallo", () => {
    const pieces = buildConfettiPieces(30);
    for (const p of pieces) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThan(100);
      expect(Math.abs(p.driftFrom)).toBeLessThanOrEqual(50);
      expect(Math.abs(p.driftTo)).toBeLessThanOrEqual(100);
      expect(p.rotate).toBeGreaterThanOrEqual(0);
      expect(p.rotate).toBeLessThan(720);
      expect(p.duration).toBeGreaterThanOrEqual(2);
      expect(p.duration).toBeLessThan(3);
    }
  });

  it("è deterministico a parità di generatore", () => {
    const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.15];
    expect(buildConfettiPieces(2, seededRandom(seq))).toEqual(
      buildConfettiPieces(2, seededRandom(seq))
    );
  });
});

describe("confettiFallDistance", () => {
  it("non esplode senza finestra (SSR): usa il default", () => {
    // `window?.innerHeight` non protegge da nulla lato server — l'optional
    // chaining agisce sul valore, ma valutare l'identificatore non dichiarato
    // solleva già `ReferenceError`. Qui i test girano in node: se la guardia
    // non è `typeof`, questa riga lancia.
    expect("window" in globalThis).toBe(false);
    expect(confettiFallDistance()).toBe(CONFETTI_FALL_FALLBACK_PX);
  });

  it("nel browser cade per tutta l'altezza del viewport", () => {
    (globalThis as { window?: unknown }).window = { innerHeight: 1234 };
    try {
      expect(confettiFallDistance()).toBe(1234);
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});

describe("pickParticleSpin", () => {
  it("sceglie rotazione ed emoji dal set previsto", () => {
    const spin = pickParticleSpin(seededRandom([0.5, 0.5]));
    expect(spin.rotate).toBe(180);
    expect(PARTICLE_EMOJI).toContain(spin.emoji);
  });

  it("non esce mai dall'elenco delle emoji", () => {
    expect(pickParticleSpin(seededRandom([0, 0])).emoji).toBe(PARTICLE_EMOJI[0]);
    expect(pickParticleSpin(seededRandom([0, 0.999])).emoji).toBe(
      PARTICLE_EMOJI[PARTICLE_EMOJI.length - 1]
    );
  });
});

// ── Carte ──────────────────────────────────────────────────────────────────

describe("parseCardSelectHand", () => {
  it("separa i token carta per seme", () => {
    expect(parseCardSelectHand("♠AK7 ♥Q")).toEqual(["♠A", "♠K", "♠7", "♥Q"]);
  });

  it("tratta il 10 come una sola carta", () => {
    expect(parseCardSelectHand("♦10 9")).toEqual(["♦10", "♦9"]);
  });

  it("ignora spazi, virgole e caratteri prima del primo seme", () => {
    expect(parseCardSelectHand("AK ♣Q,J")).toEqual(["♣Q", "♣J"]);
    expect(parseCardSelectHand("")).toEqual([]);
  });
});

// ── Testo arricchito ───────────────────────────────────────────────────────

describe("splitTextByCards", () => {
  it("restituisce un solo frammento quando non ci sono carte", () => {
    const parts = splitTextByCards("Il dichiarante gioca per primo");
    expect(parts).toEqual([{ text: "Il dichiarante gioca per primo", isCard: false }]);
  });

  it("isola i gruppi di carte dal testo", () => {
    const parts = splitTextByCards("Con ♠AQ854 apri di 1♠");
    expect(parts.filter((p) => p.isCard).map((p) => p.text)).toEqual(["♠AQ854"]);
    expect(parts.map((p) => p.text).join("")).toBe("Con ♠AQ854 apri di 1♠");
  });

  it("marca ogni gruppo (la regex globale non perde colpi)", () => {
    const parts = splitTextByCards("♠AK e ♥Q9 e ♦J");
    expect(parts.filter((p) => p.isCard).map((p) => p.text)).toEqual([
      "♠AK",
      "♥Q9",
      "♦J",
    ]);
  });
});

describe("buildGlossaryTermMap", () => {
  it("mappa termine minuscolo → chiave, solo per le chiavi auto-linkabili", () => {
    const map = buildGlossaryTermMap({
      atout: glossaryEntry("atout", "Atout"),
      morto: glossaryEntry("morto", "Morto"),
      presa: glossaryEntry("presa", "Presa"),
    });
    expect(map.get("atout")).toBe("atout");
    expect(map.get("morto")).toBe("morto");
    expect(map.has("presa")).toBe(false);
  });

  it("è vuota senza glossario caricato", () => {
    expect(buildGlossaryTermMap({}).size).toBe(0);
  });
});

describe("splitTextByGlossaryTerms", () => {
  const termMap = new Map([
    ["atout", "atout"],
    ["morto", "morto"],
  ]);

  it("restituisce un solo frammento senza glossario", () => {
    expect(splitTextByGlossaryTerms("Il morto scende", new Map())).toEqual([
      { text: "Il morto scende", glossaryKey: null },
    ]);
  });

  it("restituisce un solo frammento se nessun termine compare", () => {
    expect(splitTextByGlossaryTerms("Apri di un fiori", termMap)).toEqual([
      { text: "Apri di un fiori", glossaryKey: null },
    ]);
  });

  it("aggancia il termine trovato, senza distinguere maiuscole", () => {
    const parts = splitTextByGlossaryTerms("Il Morto scende", termMap);
    expect(parts.find((p) => p.glossaryKey === "morto")?.text).toBe("Morto");
    expect(parts.map((p) => p.text).join("")).toBe("Il Morto scende");
  });

  it("aggancia solo la prima occorrenza di ogni termine", () => {
    const parts = splitTextByGlossaryTerms("morto e ancora morto", termMap);
    expect(parts.filter((p) => p.glossaryKey === "morto")).toHaveLength(1);
    expect(parts.map((p) => p.text).join("")).toBe("morto e ancora morto");
  });

  it("non spezza le parole a metà (confini di parola)", () => {
    const parts = splitTextByGlossaryTerms("mortadella", termMap);
    expect(parts.every((p) => p.glossaryKey === null)).toBe(true);
  });
});

// ── Navigazione ────────────────────────────────────────────────────────────

describe("findNextModule", () => {
  it("dà il modulo seguente della lezione", () => {
    expect(findNextModule(lesson(1, ["m1", "m2", "m3"]), "m2")?.id).toBe("m3");
  });

  it("dà null sull'ultimo modulo", () => {
    expect(findNextModule(lesson(1, ["m1", "m2"]), "m2")).toBeNull();
  });

  it("dà null su un id che non appartiene alla lezione", () => {
    // `findIndex` dà -1 e `-1 + 1` è il primo modulo: la lezione dichiarava di
    // avere un seguito e proponeva di ricominciare dall'inizio.
    expect(findNextModule(lesson(1, ["m1", "m2"]), "xxx")).toBeNull();
    expect(findNextModule(lesson(1, []), "m1")).toBeNull();
  });
});

describe("findNextLesson", () => {
  const worlds = [
    world(1, [lesson(1, ["a"]), lesson(2, ["a"])]),
    world(2, [lesson(3, ["a"])]),
  ];

  it("non propone lezioni se restano moduli da fare", () => {
    expect(findNextLesson(worlds, 1, true)).toBeNull();
  });

  it("dà la lezione successiva dello stesso mondo", () => {
    expect(findNextLesson(worlds, 1, false)?.id).toBe(2);
  });

  it("passa al mondo seguente dopo l'ultima lezione", () => {
    expect(findNextLesson(worlds, 2, false)?.id).toBe(3);
  });

  it("dà null alla fine del percorso o per una lezione sconosciuta", () => {
    expect(findNextLesson(worlds, 3, false)).toBeNull();
    expect(findNextLesson(worlds, 99, false)).toBeNull();
  });
});

describe("collectRuleTexts", () => {
  it("estrae i testi dei soli blocchi regola, nell'ordine del modulo", () => {
    const content = [
      block("text", { content: "intro" }),
      block("rule", { content: "prima regola" }),
      block("quiz", { content: "domanda" }),
      block("rule", { content: "seconda regola" }),
    ];
    expect(collectRuleTexts(content)).toEqual(["prima regola", "seconda regola"]);
  });

  it("è vuoto su un modulo senza regole", () => {
    expect(collectRuleTexts([block("text")])).toEqual([]);
  });
});
