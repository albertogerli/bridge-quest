/**
 * Funzioni pure del modulo di lezione (conteggio quiz, punteggio, XP, stelle,
 * avanzamento passi, arricchimento del testo con glossario e carte).
 *
 * Estratte da `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` senza cambi di
 * comportamento: la logica è identica riga per riga, qui è solo testabile in
 * isolamento (`src/lib/lesson-module.test.ts`). L'orologio di sistema e il
 * generatore casuale restano nel chiamante e vengono passati come argomenti.
 */

import type {
  ContentBlock,
  GlossaryEntry,
  Lesson,
  LessonModule,
  World,
} from "@/lib/catalog";

// ─── Costanti ───────────────────────────────────────────────────────────────

/** Tipi di blocco interattivi: contano per il punteggio del modulo. */
export const QUIZ_BLOCK_TYPES = [
  "quiz",
  "true-false",
  "card-select",
  "hand-eval",
  "bid-select",
];

/**
 * Tempo minimo di lettura per passo, in secondi: evita di cliccare «Avanti»
 * all'istante solo per incassare XP.
 */
export const MIN_READ_SECONDS = 5;

/** XP riconosciuti per ogni nuovo passo di sola lettura. */
export const READ_STEP_XP = 5;

/** Termini di bridge sicuri per l'auto-link al glossario (nessuna parola italiana comune). */
export const GLOSSARY_AUTO_KEYS = [
  "atout","dichiarante","morto","licita","fit","taglio","impasse",
  "surtaglio","sottomano","rientro","onori","manche","slam","libro",
  "bilanciata","forzante","ruff","eliminazione","squeeze","parziale",
  "stayman","transfer","ducking","mazziere","vulnerabile","hold_up",
  "cue_bid","presa_sicura","seme_lungo",
] as const;

// ─── Blocchi e punteggio ────────────────────────────────────────────────────

/** Vero se il blocco è uno dei tipi interattivi che contano per il punteggio. */
export function isQuizBlock(block: ContentBlock | undefined): boolean {
  return !!block && QUIZ_BLOCK_TYPES.includes(block.type);
}

/** Numero di blocchi interattivi del modulo. */
export function countQuizzes(content: ContentBlock[]): number {
  return content.filter((b) => QUIZ_BLOCK_TYPES.includes(b.type)).length;
}

/**
 * Risposta corretta del blocco, **nella stessa unità in cui viene registrata**
 * in `quizAnswers`. Ogni tipo interattivo conserva la soluzione in un campo
 * diverso: `card-select` nell'indice della carta dentro la mano, `hand-eval`
 * nel valore in punti, gli altri nell'indice dell'opzione (`correctAnswer`).
 *
 * `undefined` quando il blocco non dichiara nessuna soluzione; `-1` quando la
 * carta indicata da `correctCard` non compare nella mano del blocco.
 *
 * Unico punto di verità: `isAnswerCorrect` e il power-up «salta» la leggono da
 * qui, così non possono divergere (il salta assegnava sempre `correctAnswer`,
 * cioè una soluzione sbagliata su `card-select` e `hand-eval`).
 */
export function correctAnswerFor(
  block: ContentBlock | undefined
): number | undefined {
  if (!block) return undefined;
  if (block.type === "card-select") {
    const cards = block.cards ? parseCardSelectHand(block.cards) : [];
    return cards.findIndex((c) => c === block.correctCard);
  }
  if (block.type === "hand-eval") return block.correctValue;
  return block.correctAnswer;
}

/** Vero se la risposta data al blocco è quella corretta. */
export function isAnswerCorrect(
  block: ContentBlock | undefined,
  answer: number
): boolean {
  if (!block) return false;
  return answer === correctAnswerFor(block);
}

/** Risposte corrette date finora (le chiavi sono gli indici dei blocchi). */
export function countCorrectAnswers(
  content: ContentBlock[],
  quizAnswers: Record<number, number>
): number {
  return Object.entries(quizAnswers).filter(([idx]) =>
    isAnswerCorrect(content[parseInt(idx)], quizAnswers[parseInt(idx)])
  ).length;
}

/** Stelle finali: 3 se tutto corretto, 2 da 70%, 1 da 40%, altrimenti 0. */
export function computeStars(correctAnswers: number, totalQuizzes: number): number {
  const pct = totalQuizzes > 0 ? correctAnswers / totalQuizzes : 0;
  return pct >= 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
}

// ─── XP ─────────────────────────────────────────────────────────────────────

/** Bonus di serie del quiz a risposta multipla: +25 da 5, +15 da 3, +10 da 2. */
export function computeQuizStreakBonus(streak: number): number {
  return streak >= 5 ? 25 : streak >= 3 ? 15 : streak >= 2 ? 10 : 0;
}

/** Bonus di serie di `card-select` e `hand-eval`: +15 da 3, +10 da 2. */
export function computeCardStreakBonus(streak: number): number {
  return streak >= 3 ? 15 : streak >= 2 ? 10 : 0;
}

/** Moltiplicatore XP in base alla serie corrente: 3x da 5, 2x da 3, altrimenti 1x. */
export function computeXpMultiplier(correctStreak: number): number {
  if (correctStreak >= 5) return 3;
  if (correctStreak >= 3) return 2;
  return 1;
}

/**
 * XP ancora da versare allo store globale: solo l'incremento rispetto a quanto
 * già versato. Idempotente — a parità di totale non versa nulla, così un
 * modulo già completato non riassegna XP.
 */
export function xpDeltaToPersist(persistedXp: number, xpEarned: number): number {
  return xpEarned > persistedXp ? xpEarned - persistedXp : 0;
}

/** Totale mostrato a fine modulo: XP guadagnati sul campo più il premio fisso. */
export function computeTotalModuleXp(xpEarned: number, xpReward: number): number {
  return xpEarned + xpReward;
}

// ─── Avanzamento dei passi ──────────────────────────────────────────────────

/**
 * Vero se il passo richiede il tempo minimo di lettura prima di sbloccare
 * «Avanti»: i passi già visti e i quiz ne sono esenti.
 */
export function needsReadTimer(
  block: ContentBlock | undefined,
  alreadyViewed: boolean
): boolean {
  if (alreadyViewed) return false;
  return !isQuizBlock(block);
}

/** Nuovo insieme dei passi visti (non muta quello ricevuto). */
export function withStepViewed(viewed: Set<number>, step: number): Set<number> {
  return new Set(viewed).add(step);
}

/** Percentuale di avanzamento mostrata dalla barra in cima. */
export function computeProgressPercent(currentStep: number, totalSteps: number): number {
  return ((currentStep + 1) / totalSteps) * 100;
}

/**
 * Vero se va registrato il completamento del modulo: si è raggiunto l'ultimo
 * blocco e non è già stato registrato in questa sessione.
 */
export function shouldRecordCompletion(
  currentStep: number,
  contentLength: number,
  alreadySaved: boolean
): boolean {
  return contentLength > 0 && currentStep >= contentLength - 1 && !alreadySaved;
}

// ─── Serie giornaliera ──────────────────────────────────────────────────────

/** Data odierna in formato `YYYY-MM-DD` (UTC, come `toISOString`). */
export function todayIsoDate(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** Data di ieri in formato `YYYY-MM-DD` (24 ore prima, come `toISOString`). */
export function yesterdayIsoDate(nowMs: number): string {
  return new Date(nowMs - 86400000).toISOString().slice(0, 10);
}

/**
 * Cosa fare della serie di accessi al completamento di un modulo: la home
 * gestisce già l'accesso giornaliero, qui è solo una rete di sicurezza.
 */
export function loginStreakAction(
  lastLogin: string | null,
  today: string,
  yesterday: string
): "none" | "increment" | "reset" {
  if (lastLogin === today) return "none";
  return lastLogin === yesterday ? "increment" : "reset";
}

// ─── Opzioni dei quiz ───────────────────────────────────────────────────────

/**
 * Permutazione Fisher-Yates degli indici `0..length-1`. `random` è iniettabile
 * per rendere il rimescolamento deterministico nei test.
 */
export function shuffleIndices(
  length: number,
  random: () => number = Math.random
): number[] {
  const indices = Array.from({ length }, (_, idx) => idx);
  for (let j = indices.length - 1; j > 0; j--) {
    const k = Math.floor(random() * (j + 1));
    [indices[j], indices[k]] = [indices[k], indices[j]];
  }
  return indices;
}

/**
 * Ordine di presentazione delle opzioni per ogni blocco `quiz`/`bid-select`
 * con più di due opzioni, così la risposta corretta non è sempre la prima.
 * I blocchi senza voce nella mappa mantengono l'ordine originale.
 */
export function buildShuffledQuizOptions(
  content: ContentBlock[],
  random: () => number = Math.random
): Record<number, number[]> {
  const map: Record<number, number[]> = {};
  content.forEach((block, i) => {
    if (
      (block.type === "quiz" || block.type === "bid-select") &&
      block.options &&
      block.options.length > 2
    ) {
      map[i] = shuffleIndices(block.options.length, random);
    }
  });
  return map;
}

/**
 * Opzioni da nascondere col power-up 50/50: si tengono la corretta e una sola
 * sbagliata, estratta a sorte.
 */
export function pickFiftyFiftyEliminations(
  optionCount: number,
  correctIdx: number,
  random: () => number = Math.random
): number[] {
  const wrongIndices = Array.from({ length: optionCount }, (_, i) => i).filter(
    (i) => i !== correctIdx
  );
  const keep = wrongIndices[Math.floor(random() * wrongIndices.length)];
  return wrongIndices.filter((i) => i !== keep);
}

/** Lettera della risposta corretta mostrata dal suggerimento (profilo senior). */
export function hintLetter(
  shuffledOptions: number[] | undefined,
  correctAnswer: number | undefined
): string {
  const correct = correctAnswer ?? 0;
  return String.fromCharCode(65 + (shuffledOptions?.indexOf(correct) ?? correct));
}

// ─── Effetti celebrativi ────────────────────────────────────────────────────

/** Un coriandolo della pioggia di fine modulo. */
export interface ConfettiPiece {
  /** Percentuale di partenza sull'asse orizzontale. */
  left: number;
  /** Deriva orizzontale, da inizio a fine caduta (px). */
  driftFrom: number;
  driftTo: number;
  /** Rotazione finale in gradi. */
  rotate: number;
  /** Durata della caduta in secondi. */
  duration: number;
}

/**
 * Coriandoli della schermata di completamento. `random` è iniettabile: tenere
 * il sorteggio qui (fuori dal render) è anche ciò che chiede
 * `react-hooks/purity`.
 */
export function buildConfettiPieces(
  count: number,
  random: () => number = Math.random
): ConfettiPiece[] {
  return Array.from({ length: count }, () => ({
    left: random() * 100,
    driftFrom: (random() - 0.5) * 100,
    driftTo: (random() - 0.5) * 200,
    rotate: random() * 720,
    duration: 2 + random(),
  }));
}

/** Altezza di caduta usata dai coriandoli quando non c'è un viewport (SSR). */
export const CONFETTI_FALL_FALLBACK_PX = 800;

/**
 * Quanto in basso devono cadere i coriandoli: l'altezza del viewport, o un
 * default se non c'è finestra.
 *
 * `window?.innerHeight` NON protegge dal server: l'optional chaining agisce sul
 * valore, ma `window` lì non è nemmeno dichiarato e la sola valutazione
 * dell'identificatore solleva `ReferenceError`. Serve `typeof`.
 */
export function confettiFallDistance(): number {
  return typeof window === "undefined"
    ? CONFETTI_FALL_FALLBACK_PX
    : window.innerHeight;
}

/** Emoji sorteggiabili dalla pioggia di particelle (profilo giovane). */
export const PARTICLE_EMOJI = ["⚡", "🔥", "💥", "✨", "🎯", "💫", "⭐", "🏆"];

/** Rotazione ed emoji di una particella celebrativa. */
export function pickParticleSpin(random: () => number = Math.random): {
  rotate: number;
  emoji: string;
} {
  return {
    rotate: random() * 360,
    emoji: PARTICLE_EMOJI[Math.floor(random() * PARTICLE_EMOJI.length)],
  };
}

// ─── Carte ──────────────────────────────────────────────────────────────────

/**
 * Scompone una mano scritta come `"♠AK7 ♥Q10"` nei singoli token carta
 * (`["♠A", "♠K", "♠7", "♥Q", "♥10"]`) per il quiz «scegli la carta».
 */
export function parseCardSelectHand(cards: string): string[] {
  const result: string[] = [];
  const suits = ["♠", "♥", "♦", "♣"];
  let currentSuit = "";
  let i = 0;
  while (i < cards.length) {
    const ch = cards[i];
    if (suits.includes(ch)) {
      currentSuit = ch;
      i++;
    } else if (ch === " " || ch === ",") {
      i++;
    } else if (currentSuit) {
      if (ch === "1" && i + 1 < cards.length && cards[i + 1] === "0") {
        result.push(currentSuit + "10");
        i += 2;
      } else {
        result.push(currentSuit + ch);
        i++;
      }
    } else {
      i++;
    }
  }
  return result;
}

// ─── Testo arricchito ───────────────────────────────────────────────────────

/** Frammento di testo, con l'indicazione se va reso come gruppo di carte. */
export interface CardTextPart {
  text: string;
  isCard: boolean;
}

/**
 * Divide il testo isolando i gruppi di carte (`♠AQ854`). Un unico frammento
 * significa che non c'è nessuna carta da rendere.
 */
export function splitTextByCards(text: string): CardTextPart[] {
  // Find card patterns like ♠AQ854 or ♥K9 within text
  const suitPattern = /([♠♥♦♣][AKQJ10-9876543]+)/g;
  const parts = text.split(suitPattern);
  if (parts.length === 1) return [{ text, isCard: false }];
  return parts.map((part) => {
    const isCard = suitPattern.test(part);
    suitPattern.lastIndex = 0; // reset regex
    return { text: part, isCard };
  });
}

/** Frammento di testo, con la chiave di glossario da agganciare (se c'è). */
export interface GlossaryTextPart {
  text: string;
  glossaryKey: string | null;
}

/**
 * Mappa termine (minuscolo) → chiave di glossario, limitata ai termini di
 * `GLOSSARY_AUTO_KEYS` effettivamente presenti nel catalogo.
 */
export function buildGlossaryTermMap(
  glossary: Record<string, GlossaryEntry>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of GLOSSARY_AUTO_KEYS) {
    const entry = glossary[key];
    if (entry) map.set(entry.term.toLowerCase(), key);
  }
  return map;
}

/**
 * Divide il testo isolando i termini di glossario. Solo la prima occorrenza di
 * ogni termine riceve il tooltip, per non tempestare di link il paragrafo.
 * Un unico frammento significa che non c'è nessun termine da agganciare.
 */
export function splitTextByGlossaryTerms(
  text: string,
  termMap: Map<string, string>
): GlossaryTextPart[] {
  const terms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return [{ text, glossaryKey: null }];

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return [{ text, glossaryKey: null }];

  const matched = new Set<string>();
  return parts.map((part) => {
    const key = termMap.get(part.toLowerCase());
    if (key && !matched.has(key)) {
      matched.add(key);
      return { text: part, glossaryKey: key };
    }
    return { text: part, glossaryKey: null };
  });
}

// ─── Navigazione fra moduli e lezioni ───────────────────────────────────────

/**
 * Modulo successivo nella stessa lezione, o `null` se questo era l'ultimo —
 * oppure se `moduleId` non appartiene alla lezione.
 *
 * Il caso «modulo sconosciuto» va reso esplicito: `findIndex` restituisce -1 e
 * `-1 + 1` è il **primo** modulo, quindi la pagina avrebbe proposto «continua»
 * verso l'inizio della lezione invece di dichiarare che non c'è un seguito.
 */
export function findNextModule(
  lesson: Lesson,
  moduleId: string
): LessonModule | null {
  const moduleIndex = lesson.modules.findIndex((m) => m.id === moduleId);
  if (moduleIndex < 0) return null;
  return moduleIndex < lesson.modules.length - 1
    ? lesson.modules[moduleIndex + 1]
    : null;
}

/**
 * Lezione successiva quando la corrente è finita: la prossima dello stesso
 * mondo, altrimenti la prima del mondo seguente. `null` se restano moduli da
 * fare in questa lezione o se non c'è un seguito.
 */
export function findNextLesson(
  worlds: World[],
  lessonId: number,
  hasNextModule: boolean
): Lesson | null {
  if (hasNextModule) return null; // Still have modules in this lesson
  for (const world of worlds) {
    const lessonIdx = world.lessons.findIndex((l) => l.id === lessonId);
    if (lessonIdx >= 0) {
      // Next lesson in same world
      if (lessonIdx < world.lessons.length - 1) return world.lessons[lessonIdx + 1];
      // Next world's first lesson
      const worldIdx = worlds.indexOf(world);
      if (worldIdx < worlds.length - 1) return worlds[worldIdx + 1].lessons[0];
    }
  }
  return null;
}

/** Testi delle regole del modulo, salvati negli appunti a fine modulo. */
export function collectRuleTexts(content: ContentBlock[]): string[] {
  return content.filter((b) => b.type === "rule").map((b) => b.content);
}
