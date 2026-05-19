/**
 * Genera documenti markdown per review esperto FIGB del contenuto lezioni.
 *
 * Per ogni corso produce un file in `_bmad-output/lesson-review/<corso>.md`
 * elencando tutti i quiz/example/hand-eval/bid-select/true-false/card-select
 * con: file:line di provenienza, mano, opzioni (risposta corretta evidenziata),
 * spiegazione. Pensato per essere letto da un esperto FIGB e annotato.
 *
 * Esecuzione:
 *   npx tsx scripts/generate-review-doc.ts
 */

import fs from "node:fs";
import path from "node:path";
import { allLessons } from "../src/data/lessons.ts";
import { allQuadriLessons } from "../src/data/quadri-lessons.ts";
import { cuoriLicitaLessons } from "../src/data/cuori-licita-lessons.ts";
import { cuoriGiocoLessons } from "../src/data/cuori-gioco-lessons.ts";
import { errorScenarios } from "../src/data/trova-errore-data.ts";
import { comprehensionData } from "../src/data/comprensione-data.ts";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "_bmad-output", "lesson-review");

// ------ File scanner per ottenere il numero di riga di un quiz nel sorgente ------

interface SourceIndex {
  // Mappa contenuto → numero di riga nella source ts (best-effort)
  lookup: (needle: string) => number | null;
  file: string;
}

function buildIndex(file: string): SourceIndex {
  const fullPath = path.join(PROJECT_ROOT, file);
  const lines = fs.readFileSync(fullPath, "utf8").split("\n");
  return {
    file,
    lookup: (needle: string) => {
      // Cerca la prima riga che contiene una porzione distintiva del needle
      // Estrae i primi 40 caratteri non-banali del needle
      const snippet = needle.replace(/\s+/g, " ").trim().slice(0, 40);
      if (!snippet) return null;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(snippet)) return i + 1;
      }
      return null;
    },
  };
}

const idxLessons = buildIndex("src/data/lessons.ts");
const idxQuadri = buildIndex("src/data/quadri-lessons.ts");
const idxCuoriLicita = buildIndex("src/data/cuori-licita-lessons.ts");
const idxCuoriGioco = buildIndex("src/data/cuori-gioco-lessons.ts");
const idxTrovaErrore = buildIndex("src/data/trova-errore-data.ts");
const idxComprensione = buildIndex("src/data/comprensione-data.ts");

// ------ Rendering blocchi ------

function safeIdx(blocks: any[], i: number): any {
  return blocks[i] ?? {};
}

const SUIT_MAP: Record<string, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

function renderQuizBlock(
  block: any,
  source: SourceIndex,
  ctx: { lesson: string; module: string },
  index: number,
): string {
  const interactive = [
    "quiz",
    "card-select",
    "hand-eval",
    "bid-select",
    "true-false",
    "sequence",
  ].includes(block.type);
  if (!interactive) return "";

  const lineNo = source.lookup(block.content ?? "");
  const ref = lineNo
    ? `\`${source.file}:${lineNo}\``
    : `\`${source.file}\``;

  let md = `#### Blocco ${index} (${block.type}) — ${ref}\n\n`;
  md += `**Domanda:** ${block.content ?? "(vuoto)"}\n\n`;

  if (block.cards) {
    md += `**Mano:** \`${block.cards}\`\n\n`;
  }

  if (block.options && block.options.length > 0) {
    md += `**Opzioni:**\n`;
    for (let i = 0; i < block.options.length; i++) {
      const isCorrect =
        (typeof block.correctAnswer === "number" && block.correctAnswer === i) ||
        block.correctAnswer === block.options[i];
      const tfTrue = block.type === "true-false" && i === 0 && block.correctAnswer === 0;
      const tfFalse = block.type === "true-false" && i === 1 && block.correctAnswer === 1;
      const mark = isCorrect || tfTrue || tfFalse ? " ✅" : "";
      md += `- ${block.options[i]}${mark}\n`;
    }
    md += "\n";
  } else if (block.type === "true-false") {
    md += `**Risposta corretta:** ${block.correctAnswer === 0 ? "Vero ✅" : "Falso ✅"}\n\n`;
  } else if (block.type === "card-select" && block.correctCard) {
    md += `**Risposta corretta:** \`${block.correctCard}\` ✅\n\n`;
  } else if (block.type === "hand-eval" && block.correctValue !== undefined) {
    md += `**Risposta corretta:** ${block.correctValue} ✅\n\n`;
  }

  if (block.explanation) {
    md += `**Spiegazione:** ${block.explanation}\n\n`;
  }

  md += `**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_\n\n---\n\n`;
  return md;
}

function renderExampleBlock(
  block: any,
  source: SourceIndex,
  ctx: { lesson: string; module: string },
  index: number,
): string {
  if (block.type !== "example") return "";
  const lineNo = source.lookup(block.content ?? "");
  const ref = lineNo ? `\`${source.file}:${lineNo}\`` : `\`${source.file}\``;
  let md = `#### Esempio ${index} — ${ref}\n\n`;
  md += `**Testo:** ${block.content}\n\n`;
  if (block.cards) md += `**Mano(i):** \`${block.cards}\`\n\n`;
  md += `**Review esperto:** ☐ OK ☐ Da correggere → _scrivi qui le note_\n\n---\n\n`;
  return md;
}

// ------ Iteratori per corso ------

function renderLessonsCourse(
  title: string,
  lessons: any[],
  source: SourceIndex,
): string {
  let md = `# Review esperto — ${title}\n\n`;
  md += `> Documento generato automaticamente.\n`;
  md += `> Sorgente: \`${source.file}\`\n`;
  md += `> Per ogni voce, segna ✅ OK o annota la correzione.\n\n`;

  for (const lesson of lessons) {
    md += `\n## Lezione ${lesson.id}: ${lesson.title}\n\n`;
    if (lesson.subtitle) md += `_${lesson.subtitle}_\n\n`;
    for (const mod of lesson.modules ?? []) {
      const blocks: any[] = mod.content ?? [];
      const interactive = blocks.filter(
        (b: any) =>
          [
            "quiz",
            "card-select",
            "hand-eval",
            "bid-select",
            "true-false",
            "sequence",
            "example",
          ].includes(b.type),
      );
      if (interactive.length === 0) continue;

      md += `\n### Modulo ${mod.id}: ${mod.title}\n\n`;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const ctx = {
          lesson: `Lez ${lesson.id} (${lesson.title})`,
          module: `${mod.id} (${mod.title})`,
        };
        if (b.type === "example") {
          md += renderExampleBlock(b, source, ctx, i);
        } else {
          md += renderQuizBlock(b, source, ctx, i);
        }
      }
    }
  }
  return md;
}

function renderTrovaErrore(): string {
  let md = `# Review esperto — Trova l'Errore\n\n`;
  md += `> Sorgente: \`src/data/trova-errore-data.ts\`\n\n`;
  for (const s of errorScenarios) {
    const lineNo = idxTrovaErrore.lookup(s.situation);
    const ref = lineNo
      ? `\`src/data/trova-errore-data.ts:${lineNo}\``
      : "`src/data/trova-errore-data.ts`";
    md += `\n## Scenario #${s.id} (${s.category} / ${s.difficulty})\n\n`;
    md += `${ref}\n\n`;
    md += `**Situazione:** ${s.situation}\n\n`;
    if (s.cards) md += `**Mano:** \`${s.cards}\`\n\n`;
    if (s.sequence) md += `**Sequenza:** ${s.sequence.join(" - ")}\n\n`;
    md += `**Errore atteso:** ${s.errorDescription}\n\n`;
    md += `**Opzioni:**\n`;
    s.options.forEach((opt, i) => {
      md += `- ${opt}${i === s.correctAnswer ? " ✅" : ""}\n`;
    });
    md += `\n**Spiegazione:** ${s.explanation}\n\n`;
    md += `**Review esperto:** ☐ OK ☐ Da correggere → _note_\n\n---\n\n`;
  }
  return md;
}

function renderComprensione(): string {
  let md = `# Review esperto — Domande di Comprensione\n\n`;
  md += `> Sorgente: \`src/data/comprensione-data.ts\`\n\n`;
  for (const lc of comprehensionData) {
    md += `\n## Lezione ${lc.lessonId}: ${lc.title}\n\n`;
    for (let i = 0; i < lc.questions.length; i++) {
      const q = lc.questions[i];
      const lineNo = idxComprensione.lookup(q.question);
      const ref = lineNo
        ? `\`src/data/comprensione-data.ts:${lineNo}\``
        : "`src/data/comprensione-data.ts`";
      md += `### Q${i + 1}\n\n${ref}\n\n`;
      md += `**Domanda:** ${q.question}\n\n`;
      md += `**Opzioni:**\n`;
      q.options.forEach((opt, idx) => {
        md += `- ${opt}${idx === q.correctAnswer ? " ✅" : ""}\n`;
      });
      md += `\n**Spiegazione:** ${q.explanation}\n\n`;
      md += `**Review esperto:** ☐ OK ☐ Da correggere → _note_\n\n---\n\n`;
    }
  }
  return md;
}

// ------ Esecuzione ------

fs.mkdirSync(OUT_DIR, { recursive: true });

const outputs: Array<{ name: string; content: string }> = [
  {
    name: "fiori.md",
    content: renderLessonsCourse(
      "Corso Fiori (lezioni base)",
      allLessons,
      idxLessons,
    ),
  },
  {
    name: "quadri.md",
    content: renderLessonsCourse(
      "Corso Quadri (Approfondimenti)",
      allQuadriLessons,
      idxQuadri,
    ),
  },
  {
    name: "cuori-licita.md",
    content: renderLessonsCourse(
      "Corso Cuori - Licita Avanzata",
      cuoriLicitaLessons,
      idxCuoriLicita,
    ),
  },
  {
    name: "cuori-gioco.md",
    content: renderLessonsCourse(
      "Corso Cuori - Gioco della Carta",
      cuoriGiocoLessons,
      idxCuoriGioco,
    ),
  },
  {
    name: "trova-errore.md",
    content: renderTrovaErrore(),
  },
  {
    name: "comprensione.md",
    content: renderComprensione(),
  },
];

let totalKb = 0;
for (const f of outputs) {
  const target = path.join(OUT_DIR, f.name);
  fs.writeFileSync(target, f.content, "utf8");
  const kb = Buffer.byteLength(f.content) / 1024;
  totalKb += kb;
  console.log(`✓ ${f.name.padEnd(20)} ${kb.toFixed(1)} KB`);
}
console.log(`\nTotale: ${totalKb.toFixed(1)} KB in ${OUT_DIR}`);

// Indice
const indexMd = `# Review Lezioni — Indice

Documenti generati per review esperto del contenuto FIGB.

| File | Contenuto |
|---|---|
${outputs.map((o) => `| [${o.name}](./${o.name}) | ${o.name.replace(".md", "")} |`).join("\n")}

## Come usarli

1. Apri il file relativo al corso di interesse.
2. Per ogni voce trovi: domanda, mano (se presente), opzioni con la risposta corretta marcata ✅, spiegazione.
3. Sotto ogni voce c'è una riga "Review esperto" da spuntare/annotare.
4. Le note vanno scritte direttamente nel markdown — un dev poi le riprende e applica le correzioni nei file \`src/data/*.ts\`.

## Errori auto-rilevati (audit)

Vedi \`audit-results.md\` per la lista degli errori trovati automaticamente
(mani con != 13 carte, claim HCP/lunghezza colore contraddittori, ecc.).
`;
fs.writeFileSync(path.join(OUT_DIR, "README.md"), indexMd, "utf8");
console.log(`✓ README.md`);
