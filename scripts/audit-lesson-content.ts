/**
 * Audit automatico del contenuto lezioni.
 *
 * Carica i dataset delle lezioni FIGB e cerca incongruenze automaticamente
 * verificabili tra:
 *  - mani dichiarate (`cards` o ♠♥♦♣ inline)
 *  - claim su HCP nel testo/spiegazione
 *  - claim su lunghezza colore ("5+ carte di quadri" ecc.)
 *  - validità di `correctAnswer` rispetto a `options`
 *  - integrità della mano (somma = 13)
 *
 * Output:
 *  - report markdown su stdout
 *  - exit code != 0 se trovati errori "definiti" (🔴)
 */

import { allLessons } from "../src/data/lessons.ts";
import { allQuadriLessons } from "../src/data/quadri-lessons.ts";
import { cuoriLicitaLessons } from "../src/data/cuori-licita-lessons.ts";
import { cuoriGiocoLessons } from "../src/data/cuori-gioco-lessons.ts";
import { errorScenarios } from "../src/data/trova-errore-data.ts";
import { comprehensionData } from "../src/data/comprensione-data.ts";

type Suit = "S" | "H" | "D" | "C";
type Hand = Record<Suit, string[]>;

interface Issue {
  severity: "error" | "warning";
  source: string; // file:lesson:module:blockIdx
  block: string; // snippet del contenuto
  message: string;
}

const issues: Issue[] = [];

const RANK_HCP: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

function suitSymbolToKey(sym: string): Suit | null {
  if (sym === "♠") return "S";
  if (sym === "♥") return "H";
  if (sym === "♦") return "D";
  if (sym === "♣") return "C";
  return null;
}

const SUIT_NAME_IT: Record<string, Suit> = {
  picche: "S",
  cuori: "H",
  quadri: "D",
  fiori: "C",
};

const SUIT_LABEL: Record<Suit, string> = {
  S: "♠ picche",
  H: "♥ cuori",
  D: "♦ quadri",
  C: "♣ fiori",
};

function normalizeRanks(raw: string): string[] {
  // Sostituisce "10" con "T" prima di splittare, rimuove spazi e virgole.
  const cleaned = raw.replace(/10/g, "T").replace(/[\s,.]/g, "");
  const out: string[] = [];
  for (const ch of cleaned) {
    if ("AKQJT98765432".includes(ch)) out.push(ch);
    else if (ch === "x") out.push("x"); // carta piccola anonima
    else return []; // carattere strano → mano non parsabile
  }
  return out;
}

// Classe di caratteri "rango di carta" — include cifre 0-9 (per "10"), T, A K Q J e
// segnaposto x/X. Più whitespace/virgole/punti come separatori.
const RANK_CHARS = "AKQJT0123456789xX";
const RANK_CLASS = `[${RANK_CHARS}\\s,.]`;
const NON_RANK_CLASS = `[^${RANK_CHARS}\\s,.]`;

function parseHand(input: string): Hand | null {
  const re = new RegExp(
    `♠(${RANK_CLASS}*?)\\s*♥(${RANK_CLASS}*?)\\s*♦(${RANK_CLASS}*?)\\s*♣(${RANK_CLASS}+?)(?=$|${NON_RANK_CLASS})`,
  );
  const m = input.match(re);
  if (!m) return null;
  return {
    S: normalizeRanks(m[1]),
    H: normalizeRanks(m[2]),
    D: normalizeRanks(m[3]),
    C: normalizeRanks(m[4]),
  };
}

function findAllHands(input: string): Hand[] {
  const re = new RegExp(
    `♠(${RANK_CLASS}*?)\\s*♥(${RANK_CLASS}*?)\\s*♦(${RANK_CLASS}*?)\\s*♣(${RANK_CLASS}+?)(?=$|${NON_RANK_CLASS})`,
    "g",
  );
  const hands: Hand[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    hands.push({
      S: normalizeRanks(m[1]),
      H: normalizeRanks(m[2]),
      D: normalizeRanks(m[3]),
      C: normalizeRanks(m[4]),
    });
  }
  return hands;
}

function handHcp(h: Hand): number {
  let t = 0;
  for (const s of ["S", "H", "D", "C"] as Suit[]) {
    for (const r of h[s]) t += RANK_HCP[r] ?? 0;
  }
  return t;
}

function handLen(h: Hand): number {
  return h.S.length + h.H.length + h.D.length + h.C.length;
}

function handDescribe(h: Hand): string {
  return `♠${h.S.join("") || "—"} ♥${h.H.join("") || "—"} ♦${h.D.join("") || "—"} ♣${h.C.join("") || "—"} (${handLen(h)} carte, ${handHcp(h)} HCP)`;
}

// ------ Estrattori di claim ------

interface SuitLenClaim {
  suit: Suit;
  min?: number; // "5+"
  exact?: number; // "5"
  raw: string;
}

function extractSuitLengthClaims(text: string): SuitLenClaim[] {
  const claims: SuitLenClaim[] = [];
  // "5+ carte di quadri" / "5 carte di quadri" / "almeno 5 quadri"
  const reCarte =
    /\b(\d+)\s*\+\s*carte?\s+di\s+(picche|cuori|quadri|fiori)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = reCarte.exec(text))) {
    const suit = SUIT_NAME_IT[m[2].toLowerCase()];
    if (suit) claims.push({ suit, min: parseInt(m[1], 10), raw: m[0] });
  }
  const reCarteExact = /\b(\d+)\s+carte?\s+di\s+(picche|cuori|quadri|fiori)\b/gi;
  while ((m = reCarteExact.exec(text))) {
    const suit = SUIT_NAME_IT[m[2].toLowerCase()];
    // skip se già preso come "+"
    const raw = m[0];
    if (suit && !claims.some((c) => c.raw === raw)) {
      claims.push({ suit, exact: parseInt(m[1], 10), raw });
    }
  }
  return claims;
}

interface HcpClaim {
  value: number;
  kind: "exact" | "min";
  raw: string;
}

function extractHcpClaims(text: string): HcpClaim[] {
  const claims: HcpClaim[] = [];
  // "12 HCP", "14 HCP", "soli 11 HCP", "ha 14 HCP"
  const reExact = /\b(\d{1,2})\s*HCP\b/gi;
  let m: RegExpExecArray | null;
  while ((m = reExact.exec(text))) {
    claims.push({ value: parseInt(m[1], 10), kind: "exact", raw: m[0] });
  }
  // "12+ punti" / "15+ HCP"
  const reMin = /\b(\d{1,2})\s*\+\s*(HCP|punti(?:\s+onori)?)\b/gi;
  while ((m = reMin.exec(text))) {
    claims.push({ value: parseInt(m[1], 10), kind: "min", raw: m[0] });
  }
  return claims;
}

function isHypothetical(snippet: string, raw: string): boolean {
  // Cerca parole-chiave che indicano un'affermazione contro-fattuale, su mano
  // alternativa, sul compagno, o su un totale combinato.
  const idx = snippet.toLowerCase().indexOf(raw.toLowerCase());
  if (idx < 0) return false;
  const before = snippet.slice(Math.max(0, idx - 80), idx).toLowerCase();
  const after = snippet
    .slice(idx + raw.length, idx + raw.length + 40)
    .toLowerCase();

  // Range pattern: "0-7 HCP", "15-17 HCP" → not a claim about THIS hand
  // The raw match starts at idx; check if there's "N-" immediately before (within 4 chars)
  const justBefore = snippet.slice(Math.max(0, idx - 4), idx);
  if (/\d\s*[-–]\s*$/.test(justBefore)) return true;

  // Mano alternativa / contesto di compagno / totale
  const triggers = [
    "servire",
    "serv",
    "richieder",
    "se aves",
    "se la mano",
    "se avete",
    "con una mano",
    "ipote",
    "occorrer",
    "alternativa",
    "in caso di",
    "richiede",
    "altre mani",
    "ne avete solo",
    "partner",
    "compagn",
    "nord ha",
    "totale",
    "totali",
    "combinat",
    "il vostro apre",
    "apre 1nt",
    "apre 1 nt",
    "apre 2nt",
    "promette",
    "annuncia",
    "nord apre",
    "sud apre",
    "ovest apre",
    "est apre",
    "dichiara 1nt",
    "linea ha",
    "linea promette",
    "minimo in coppia",
    "punti in coppia",
    "fascia",
    "almeno",
    "garantisce",
    "delle prese",
    "prese totali",
    "atout in linea",
    "carte in coppia",
    "(0-",
    "(6-",
    "(7-",
    "(8-",
    "(11-",
    "(12-",
    "(15-",
    "(20-",
    "(21-",
    "(22-",
    "tra 12 e",
    "tra 15 e",
  ];
  return triggers.some((t) => before.includes(t) || after.includes(t));
}

function handHasPlaceholder(h: Hand): boolean {
  return ["S", "H", "D", "C"].some((s) =>
    h[s as Suit].some((r) => r === "x"),
  );
}

function splitMultiHand(input: string): string[] {
  // Esempi multi-mano: "♠... ♥... ♦... ♣... | ♠... ♥... ♦... ♣..."
  return input.split(/\|/).map((s) => s.trim()).filter((s) => s.length > 0);
}

// ------ Audit di un blocco ------

interface AuditCtx {
  source: string; // identifier human-readable
  block: string; // snippet
}

function auditBlock(
  ctx: AuditCtx,
  cardsField: string | undefined,
  contentText: string,
  explanationText: string,
  options?: string[],
  correctAnswer?: string | number,
): void {
  // 1. Hand integrity per `cards` field — supporta più mani separate da "|"
  const allText = `${contentText}\n${explanationText}`;
  const cardHands: Hand[] = [];
  if (cardsField) {
    const segments = splitMultiHand(cardsField);
    let anyParsed = false;
    for (const seg of segments) {
      const h = parseHand(seg);
      if (h) {
        anyParsed = true;
        cardHands.push(h);
        // Conta solo mani senza placeholder come "vere" mani da 13 carte
        if (!handHasPlaceholder(h)) {
          const total = handLen(h);
          if (total !== 13) {
            issues.push({
              severity: "error",
              source: ctx.source,
              block: ctx.block,
              message: `Mano in \`cards\` ha ${total} carte invece di 13: ${handDescribe(h)}`,
            });
          }
        }
      }
    }
    // Non emettere warning per cards non parsabili — usano notazioni varie
    // (es. "Morto: X  Mano: Y", "A+B/C+D"). Sono shorthand didattici, non bug.
    void anyParsed;
  }

  // Usa la prima mano da `cards` come "primary" (senza placeholder) per i claim,
  // altrimenti prova a estrarla dal contenuto.
  let primary: Hand | null =
    cardHands.find((h) => !handHasPlaceholder(h) && handLen(h) === 13) ?? null;
  if (!primary) {
    const inline = findAllHands(allText).filter(
      (h) => !handHasPlaceholder(h) && handLen(h) === 13,
    );
    if (inline.length === 1) primary = inline[0];
    // Più di una mano valida inline → ambiguo, skip claim check
  }

  // 2. Validità correctAnswer
  if (options && options.length > 0 && correctAnswer !== undefined) {
    if (typeof correctAnswer === "number") {
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        issues.push({
          severity: "error",
          source: ctx.source,
          block: ctx.block,
          message: `correctAnswer=${correctAnswer} fuori range (options.length=${options.length})`,
        });
      }
    }
  }

  // 3. Claim HCP (solo se abbiamo una sola mano identificata)
  if (primary && handLen(primary) === 13) {
    const actualHcp = handHcp(primary);
    const claims = extractHcpClaims(allText);
    for (const c of claims) {
      if (isHypothetical(allText, c.raw)) continue;
      if (c.kind === "exact" && c.value !== actualHcp) {
        // Filtra falsi positivi: "soli 11 HCP" potrebbe essere il claim del testo "ha aperto 1NT con SOLI 11 HCP"
        // dove gli 11 HCP sono PROPRIO la mano. Quindi tieni come potenziale issue.
        issues.push({
          severity: "warning",
          source: ctx.source,
          block: ctx.block,
          message: `Claim HCP "${c.raw}" non corrisponde alla mano (${actualHcp} HCP reali): ${handDescribe(primary)}`,
        });
      } else if (c.kind === "min" && actualHcp < c.value) {
        issues.push({
          severity: "warning",
          source: ctx.source,
          block: ctx.block,
          message: `Claim "${c.raw}" ma la mano ha solo ${actualHcp} HCP: ${handDescribe(primary)}`,
        });
      }
    }
  }

  // 4. Claim lunghezza colore
  if (primary && handLen(primary) === 13) {
    const claims = extractSuitLengthClaims(allText);
    for (const c of claims) {
      if (isHypothetical(allText, c.raw)) continue;
      const actual = primary[c.suit].length;
      if (c.min !== undefined && actual < c.min) {
        issues.push({
          severity: "error",
          source: ctx.source,
          block: ctx.block,
          message: `Claim "${c.raw}" ma la mano ha solo ${actual} carte di ${SUIT_LABEL[c.suit]}: ${handDescribe(primary)}`,
        });
      } else if (c.exact !== undefined && c.exact !== actual) {
        issues.push({
          severity: "warning",
          source: ctx.source,
          block: ctx.block,
          message: `Claim "${c.raw}" ma la mano ne ha ${actual}: ${handDescribe(primary)}`,
        });
      }
    }
  }
}

// ------ Iteratori sui dataset ------

function trim(s: string, n = 120): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function auditLessonsArray(label: string, lessons: any[]): void {
  for (const lesson of lessons) {
    for (const mod of lesson.modules ?? []) {
      const blocks: any[] = mod.content ?? [];
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const src = `${label} | Lez ${lesson.id} "${lesson.title}" / mod ${mod.id} "${mod.title}" / blocco ${i} (${b.type})`;
        const snippet = trim(b.content ?? "");
        auditBlock(
          { source: src, block: snippet },
          b.cards,
          b.content ?? "",
          b.explanation ?? "",
          b.options,
          b.correctAnswer,
        );
      }
    }
  }
}

function auditErrorScenarios(): void {
  for (const s of errorScenarios) {
    const src = `trova-errore | Scenario #${s.id} (${s.category} / ${s.difficulty})`;
    auditBlock(
      { source: src, block: trim(s.situation) },
      s.cards,
      `${s.situation}\n${s.errorDescription}`,
      s.explanation,
      s.options,
      s.correctAnswer,
    );
  }
}

function auditComprehension(): void {
  for (const lc of comprehensionData) {
    for (let i = 0; i < lc.questions.length; i++) {
      const q = lc.questions[i];
      const src = `comprensione | Lez ${lc.lessonId} "${lc.title}" / Q${i + 1}`;
      auditBlock(
        { source: src, block: trim(q.question) },
        undefined,
        q.question,
        q.explanation,
        q.options,
        q.correctAnswer,
      );
    }
  }
}

// ------ Esecuzione ------

auditLessonsArray("fiori (allLessons)", allLessons);
auditLessonsArray("quadri", allQuadriLessons);
auditLessonsArray("cuori-licita", cuoriLicitaLessons);
auditLessonsArray("cuori-gioco", cuoriGiocoLessons);
auditErrorScenarios();
auditComprehension();

// ------ Report ------

const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

let out = "# Audit Lezioni - Risultati\n\n";
out += `Totale: **${errors.length} errori**, **${warnings.length} warning**\n\n`;

if (errors.length > 0) {
  out += "## 🔴 Errori (probabili bug)\n\n";
  for (const e of errors) {
    out += `- **${e.source}**\n  > ${e.block}\n  ${e.message}\n\n`;
  }
}
if (warnings.length > 0) {
  out += "## 🟡 Warning (da verificare manualmente)\n\n";
  for (const w of warnings) {
    out += `- **${w.source}**\n  > ${w.block}\n  ${w.message}\n\n`;
  }
}

process.stdout.write(out);
process.exit(errors.length > 0 ? 1 : 0);
