/**
 * La traduzione inglese usa i termini di bridge giusti?
 *
 *   node scripts/verifica-terminologia.mjs
 *
 * PERCHÉ ESISTE. Nel bridge le parole sono tecniche, e una sbagliata non è un
 * refuso: è una regola sbagliata che l'allievo impara e porta al tavolo. Se
 * «manche» diventa *match* o «presa» diventa *hand*, la frase resta
 * grammaticale e nessuno se ne accorge rileggendo — il difetto arriva intatto
 * fino a chi studia.
 *
 * Su 1.600 frasi e 49 dispense la rilettura umana non scala, e su una
 * traduzione fatta da una macchina è proprio il controllo che serve: il
 * modello sbaglia sempre allo stesso modo, quindi un errore si trova cercando
 * il pattern invece della singola frase.
 *
 * COSA CONTROLLA
 *   1. il dizionario dell'interfaccia (`src/traduzioni/en.json`);
 *   2. i prompt tradotti delle dispense, salvati accanto alle immagini.
 *
 * Esce con 1 se trova qualcosa. Pensato per la CI.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RADICE = new URL("..", import.meta.url).pathname;

/**
 * Le parole che in un testo di bridge americano non devono comparire, con il
 * perché e il termine giusto.
 *
 * Sono gli errori che una macchina fa davvero: traduzioni letterali di parole
 * italiane che in inglese significano un'altra cosa.
 */
const VIETATE = [
  { sbagliato: /\bmatch\b/i, giusto: "game", nota: "«manche» è game; match è l'incontro fra squadre" },
  { sbagliato: /\bcut\b/i, giusto: "ruff", nota: "«taglio» è ruff; cut è il taglio del mazzo" },
  { sbagliato: /\bimpasse\b/i, giusto: "finesse", nota: "«impasse» in inglese è finesse" },
  { sbagliato: /\batout\b/i, giusto: "trump", nota: "«atout» è francese: in inglese trump" },
  { sbagliato: /\bmanche\b/i, giusto: "game", nota: "parola italiana rimasta" },
  { sbagliato: /\bpresa\b|\bprese\b/i, giusto: "trick(s)", nota: "parola italiana rimasta" },
  { sbagliato: /\bsmazzata\b/i, giusto: "deal", nota: "parola italiana rimasta" },
  { sbagliato: /\blicita\b/i, giusto: "bidding", nota: "parola italiana rimasta" },
  { sbagliato: /\bdead\b/i, giusto: "dummy", nota: "«morto» è dummy, non dead" },
  { sbagliato: /\bpartial score\b/i, giusto: "part score", nota: "si dice part score" },
];

/**
 * Frasi in cui una parola «vietata» è invece legittima.
 *
 * «match» è il caso spinoso: come sostantivo sarebbe la traduzione sbagliata
 * di «manche», ma come VERBO è inglese corretto e ricorrente — «no cards match
 * these filters», «match the cards to the concepts». Senza queste eccezioni il
 * controllo grida al lupo su frasi giuste, e un controllo che grida sempre
 * viene spento: è il modo in cui una guardia smette di guardare.
 */
const PERDONATE = [
  /\bmatch(es)?\s+(these|the|your|any)\b/i, // verbo: «match these filters»
  /\bmatch(es|ing)?\s+(the\s+)?cards?\b/i, // «match the cards to…»
  /\bmatch(ing)?\s+cards?\s+and\s+concepts?\b/i,
  /\bmatch\b.*\bmemory\b/i,
  /\bno\b.*\bmatch\b/i, // «no players found / nothing matches»
  // «cut communications» / «cut the links» è inglese di bridge corretto:
  // interrompere i collegamenti fra le mani avversarie, non tagliare con
  // l'atout. Chi difende «taglia le comunicazioni» anche in italiano.
  /\bcut\b.*\b(communication|link|entry|entries)/i,
];

let problemi = 0;

function controlla(dove, testo) {
  if (PERDONATE.some((p) => p.test(testo))) return;
  for (const v of VIETATE) {
    if (v.sbagliato.test(testo)) {
      problemi++;
      console.error(`\n${dove}`);
      console.error(`  «${testo.slice(0, 110)}»`);
      console.error(`  → dovrebbe usare «${v.giusto}»: ${v.nota}`);
    }
  }
}

// ── 1. Il dizionario dell'interfaccia ───────────────────────────────────────
const dizionario = JSON.parse(
  readFileSync(join(RADICE, "src/traduzioni/en.json"), "utf8")
);
let voci = 0;
for (const [italiano, inglese] of Object.entries(dizionario)) {
  if (italiano.startsWith("_") || !inglese) continue;
  voci++;
  controlla(`dizionario · «${italiano.slice(0, 60)}»`, inglese);
}

// ── 2. I prompt delle dispense ──────────────────────────────────────────────
const dispense = join(RADICE, "public/infografiche/en");
let prompt = 0;
if (existsSync(dispense)) {
  for (const corso of readdirSync(dispense)) {
    const cartella = join(dispense, corso);
    for (const f of readdirSync(cartella)) {
      if (!f.endsWith(".prompt.txt")) continue;
      prompt++;
      const testo = readFileSync(join(cartella, f), "utf8");
      // Riga per riga: un prompt intero darebbe un solo errore per file e
      // nasconderebbe gli altri.
      for (const riga of testo.split("\n")) {
        if (riga.trim().length > 10) controlla(`${corso}/${f}`, riga.trim());
      }
    }
  }
}

console.log(
  `\ncontrollate ${voci} frasi del dizionario e ${prompt} prompt di dispense.`
);
if (problemi) {
  console.error(`${problemi} termini da rivedere.`);
  process.exit(1);
}
console.log("terminologia coerente con il glossario.");
