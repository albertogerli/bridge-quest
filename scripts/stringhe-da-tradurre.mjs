/**
 * Quanto manca alla versione inglese, area per area.
 *
 *   node scripts/stringhe-da-tradurre.mjs            # il quadro d'insieme
 *   node scripts/stringhe-da-tradurre.mjs gioca      # solo un'area
 *   node scripts/stringhe-da-tradurre.mjs --mancanti # le frasi già passate da
 *                                                    # t() ma senza inglese
 *
 * A COSA SERVE. La fase 2 è lunga e si fa un'area alla volta: senza un numero,
 * «quanto manca» diventa una sensazione, e le aree meno visibili restano
 * indietro per mesi senza che nessuno se ne accorga. Qui il numero c'è, ed è
 * la stessa misura prima e dopo.
 *
 * COSA CONTA, e con che precisione. Le frasi già avvolte in `t("…")` si contano
 * esattamente. Quelle ancora da avvolgere si STIMANO leggendo il testo fra i
 * tag JSX: è una stima per eccesso — prende anche qualche etichetta tecnica —
 * e va letta come ordine di grandezza, non come inventario. Il numero che
 * conta davvero è il primo: quello dice quanto lavoro è già stato fatto.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RADICE = new URL("..", import.meta.url).pathname;
const SRC = join(RADICE, "src");

/** Le aree in cui è diviso il lavoro, nell'ordine in cui conviene farle. */
const AREE = [
  { nome: "navigazione", dove: ["components/bottom-nav.tsx", "components/desktop-nav.tsx", "components/site-footer.tsx"] },
  { nome: "gioca", dove: ["app/gioca", "components/bridge"] },
  { nome: "lezioni", dove: ["app/lezioni", "app/impara", "app/dispense"] },
  { nome: "profilo", dove: ["app/profilo", "app/impostazioni"] },
  { nome: "sociale", dove: ["app/amici", "app/classifica", "app/forum"] },
  { nome: "istruttori", dove: ["app/istruttori", "app/classi", "app/scuola"] },
  { nome: "resto", dove: ["app", "components"] },
];

function fileDi(percorso) {
  const pieno = join(SRC, percorso);
  if (!existsSync(pieno)) return [];
  const st = readdirSync(pieno, { withFileTypes: true }).length !== undefined;
  if (!st) return [];
  const raccolti = [];
  const cammina = (d) => {
    for (const v of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, v.name);
      if (v.isDirectory()) cammina(p);
      else if (/\.tsx?$/.test(v.name) && !/\.test\.tsx?$/.test(v.name)) raccolti.push(p);
    }
  };
  try {
    cammina(pieno);
  } catch {
    raccolti.push(pieno);
  }
  return raccolti;
}

function fileSingolo(percorso) {
  const pieno = join(SRC, percorso);
  return existsSync(pieno) ? [pieno] : [];
}

const dizionario = JSON.parse(
  readFileSync(join(SRC, "traduzioni/en.json"), "utf8")
);

/**
 * Frasi già passate da `t("…")`.
 *
 * Il delimitatore di chiusura dev'essere lo STESSO di apertura: con una classe
 * che accetta indifferentemente `"`, `'` e backtick, una frase come
 * `t("Cosa apri: scegli l'apertura giusta")` si fermava all'apostrofo e
 * risultava «Cosa apri: scegli l» — una chiave che non esiste, contata come
 * non tradotta. Il codice era giusto: sbagliava il metro.
 */
const GIA = /\bt\(\s*(["'`])((?:(?!\1)[^\\])*?)\1/g;
/** Testo fra tag JSX, come stima di quel che resta. */
const DA_FARE = />\s*([A-ZÀ-Ù][^<>{}\n]{5,120})\s*</g;

let totaleFatte = 0;
let totaleDaFare = 0;
const senzaInglese = new Set();
const visti = new Set();

const soloArea = process.argv.find((a) => !a.startsWith("-") && !a.endsWith(".mjs") && !a.includes("/"));

console.log("area           tradotte   da fare (stima)");
console.log("──────────────────────────────────────────");

for (const area of AREE) {
  if (soloArea && area.nome !== soloArea) continue;
  let fatte = 0;
  let daFare = 0;
  for (const dove of area.dove) {
    const elenco = dove.endsWith(".tsx") ? fileSingolo(dove) : fileDi(dove);
    for (const f of elenco) {
      if (visti.has(f)) continue; // l'area «resto» non riconta quel che c'è sopra
      visti.add(f);
      const testo = readFileSync(f, "utf8");
      for (const m of testo.matchAll(GIA)) {
        const frase = m[2];
        if (frase.length < 2) continue;
        fatte++;
        if (!dizionario[frase]) senzaInglese.add(frase);
      }
      daFare += [...testo.matchAll(DA_FARE)].length;
    }
  }
  totaleFatte += fatte;
  totaleDaFare += daFare;
  console.log(`${area.nome.padEnd(14)} ${String(fatte).padStart(8)} ${String(daFare).padStart(17)}`);
}

console.log("──────────────────────────────────────────");
console.log(`${"totale".padEnd(14)} ${String(totaleFatte).padStart(8)} ${String(totaleDaFare).padStart(17)}`);

const voci = Object.keys(dizionario).filter((k) => !k.startsWith("_")).length;
console.log(`\ndizionario inglese: ${voci} frasi`);
if (senzaInglese.size) {
  console.log(`frasi passate da t() ma senza inglese: ${senzaInglese.size}`);
  if (process.argv.includes("--mancanti") || process.argv.includes("--controlla")) {
    for (const f of [...senzaInglese].sort()) console.log(`  ${f}`);
  } else {
    console.log("  (--mancanti per l'elenco)");
  }
}

/**
 * `--controlla`: esce con errore se una frase passa da `t()` e non ha inglese.
 *
 * PERCHÉ SERVE UN GUARDIANO E NON UNA REGOLA SCRITTA. La regola in CLAUDE.md
 * dice di aggiornare il dizionario nello stesso commit, e vale finché qualcuno
 * se la ricorda. Il 19/08/2026 sono stati aggiunti venticinque file di
 * interfaccia in una sessione sola e il dizionario è rimasto indietro di
 * sessanta frasi: non per distrazione di un momento, ma perché niente lo
 * impediva. Una frase senza inglese non rompe niente in italiano — è per
 * questo che passa.
 *
 * Il conto delle frasi NON ANCORA avvolte in `t()` resta un rapporto e non un
 * errore: quelle non fanno danno, si vedono solo in italiano sotto `/en`, e
 * bloccare la CI su un lavoro di allineamento in corso vorrebbe dire insegnare
 * a disattivare il controllo.
 */
if (process.argv.includes("--controlla")) {
  if (senzaInglese.size > 0) {
    console.error(
      `\nCI: ${senzaInglese.size} frasi passano da t() senza traduzione inglese.\n` +
        "Aggiungile a src/traduzioni/en.json nello stesso commit che le introduce."
    );
    process.exit(1);
  }
  console.log("\nOgni frase passata da t() ha la sua traduzione inglese.");
}
