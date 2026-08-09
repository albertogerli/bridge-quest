/**
 * Fix di contenuto per i quiz "eserciziario" del Gioco della carta (Supabase live).
 * Questi blocchi vivono SOLO nel DB (tabella lesson_modules, JSONB content[]),
 * non nei file @/data — quindi si correggono con PATCH mirati, non col seed.
 *
 * Uso:
 *   node scripts/fix-eserciziario-quizzes.mjs           # DRY-RUN: mostra i diff, non scrive
 *   node scripts/fix-eserciziario-quizzes.mjs --apply    # applica le UPDATE
 *
 * Ogni edit ha "guard": un frammento che DEVE essere presente nel blocco corrente,
 * altrimenti l'edit viene saltato (protegge da divergenze del DB).
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("Missing Supabase env"); process.exit(1); }
const APPLY = process.argv.includes("--apply");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// ─── Edits ───────────────────────────────────────────────────────────────
// patch(block) restituisce il blocco modificato; guard = frammento atteso.
const EDITS = [
  {
    label: "IMG6 — AK873/Q2 'Forza?' : a) Nessuna → TRE (AKQ)",
    lesson_id: 3, module_id: "eserciziario-3-3", index: 3,
    guard: "Nord: AK873 / Sud: Q2",
    patch: (b) => ({
      ...b,
      options: [
        "a) TRE (AKQ), b) DUE se 3-3, c) Sì",
        "a) QUATTRO, b) Nessuna, c) No",
        "a) Due, b) UNA, c) Sì",
        "a) Nessuna, b) TRE, c) No",
      ],
      correctAnswer: 0,
      explanation: "a) TRE prese di forza (AKQ). b) DUE prese di lunga se le 6 carte avversarie si dividono 3-3. c) Sì, le cartine residue (8,7) diventano vincenti.",
    }),
  },
  {
    label: "IMG7 — AKQ74/J1063 atout : avversari hanno 4 (non 3), opzioni/spiegazione riscritte",
    lesson_id: 4, module_id: "eserciziario-4-1", index: 2,
    guard: "Quante volte dobbiamo battere atout",
    patch: (b) => ({
      ...b,
      content: "Nord: ♠AKQ74 / Sud: ♠J1063. Quante volte dobbiamo battere atout se gli avversari ne hanno 4?",
      options: [
        "Sempre due volte",
        "Sempre quattro volte",
        "Dipende dalla divisione: 2-2 → 2 giri, 3-1 → 3 giri, 4-0 → 4 giri",
        "Non serve battere atout",
      ],
      correctAnswer: 2,
      explanation: "Nord 5 + Sud 4 = 9 atout, quindi gli avversari ne hanno 4. Se dividono 2-2 (≈40%) bastano 2 giri; se 3-1 (≈50%) servono 3 giri; se 4-0 (raro) ne servono 4. Con AKQJ10 non si perde comunque nessuna atout.",
    }),
  },
  {
    label: "IMG4 — A9763/Q8542 'Da dove?' : spiegazione placeholder riscritta",
    lesson_id: 3, module_id: "eserciziario-3-6", index: 2,
    guard: "Nord: A9763 / Sud: Q8542",
    patch: (b) => ({
      ...b,
      explanation: "Il tenace è spezzato: Asso in Nord, Dama in Sud. Si gioca piccola da Nord verso la Dama (b): se Est ha il Re, gioca prima della Dama e l'impasse riesce. Giocare la Dama da Sud (a) è inferiore — è un onore 'scoperto', manca il J sotto: se non viene coperta non promuovi nulla. Tirare l'Asso (c) spera solo nel Re secco.",
    }),
  },
  {
    label: "IMG2 — colpo di sonda AK103/Q9652 : testo corretto (incassa onore, non 'gioca la Q'; J in Ovest)",
    lesson_id: 55, module_id: "Q5-2", index: 2,
    guard: "Il colpo di sonda consiste",
    patch: (b) => ({
      ...b,
      content: "Il colpo di sonda consiste nell'incassare un onore alto PRIMA di effettuare l'impasse, per far cadere un'eventuale figura corta. Con AK103 in Nord e Q9652 in Sud: incassate prima un onore (per esempio l'Asso = il colpo di sonda); se il Fante non cade, giocate piccola da Sud verso il 10 di Nord. La forchetta K-10 cattura il Fante quando è in Ovest, davanti alla forchetta.",
    }),
  },
  // ── OPZIONALE (la risposta è già corretta; solo ritocchi cosmetici) ──
  {
    label: "IMG5 — QJ65/A1093 'K dove?' : fix '10 in mano' + opzione doppione [OPZIONALE]",
    optional: true,
    lesson_id: 3, module_id: "eserciziario-3-7", index: 2,
    guard: "Nord: QJ65 / Sud: A1093",
    patch: (b) => ({
      ...b,
      options: [
        "In Ovest: ripetiamo l'impasse",
        "In Est",
        "Indifferente",
        "In nessuno dei due",
      ],
      explanation: "K in Ovest! Giocando da Sud verso QJ del morto (col 10 in mano), l'impasse riesce e si ripete: prendiamo tutte le prese. Col Re in Est ne perderemmo una.",
    }),
  },
];

// ─── Run ───────────────────────────────────────────────────────────────────
async function getModule(lesson_id, module_id) {
  const r = await fetch(`${URL}/rest/v1/lesson_modules?lesson_id=eq.${lesson_id}&module_id=eq.${encodeURIComponent(module_id)}&select=lesson_id,module_id,content`, { headers: H });
  if (!r.ok) throw new Error(`GET ${lesson_id}/${module_id}: ${r.status} ${await r.text()}`);
  const rows = await r.json();
  return rows[0];
}
async function patchModule(lesson_id, module_id, content) {
  const r = await fetch(`${URL}/rest/v1/lesson_modules?lesson_id=eq.${lesson_id}&module_id=eq.${encodeURIComponent(module_id)}`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error(`PATCH ${lesson_id}/${module_id}: ${r.status} ${await r.text()}`);
}

console.log(APPLY ? "=== APPLY MODE (scrivo nel DB) ===\n" : "=== DRY-RUN (nessuna scrittura) ===\n");
let ok = 0, skipped = 0;
for (const e of EDITS) {
  const tag = e.optional ? "[OPZIONALE] " : "";
  console.log(`\n──────────────────────────────────────────\n${tag}${e.label}`);
  const mod = await getModule(e.lesson_id, e.module_id);
  if (!mod) { console.log("  ⚠️  modulo non trovato — SKIP"); skipped++; continue; }
  const blocks = Array.isArray(mod.content) ? mod.content : [];
  const cur = blocks[e.index];
  if (!cur) { console.log(`  ⚠️  block#${e.index} assente — SKIP`); skipped++; continue; }
  if (!JSON.stringify(cur).includes(e.guard)) {
    console.log(`  ⚠️  guard "${e.guard}" non trovato nel block#${e.index} — SKIP`); skipped++; continue;
  }
  const next = e.patch(cur);
  // diff campi cambiati
  for (const k of ["content", "options", "correctAnswer", "explanation"]) {
    const a = JSON.stringify(cur[k]); const z = JSON.stringify(next[k]);
    if (a !== z) {
      console.log(`  • ${k}:`);
      console.log(`      OLD: ${a}`);
      console.log(`      NEW: ${z}`);
    }
  }
  if (APPLY) {
    const newBlocks = blocks.slice();
    newBlocks[e.index] = next;
    await patchModule(e.lesson_id, e.module_id, newBlocks);
    console.log("  ✅ applicato");
  }
  ok++;
}
console.log(`\n=== ${APPLY ? "applicati" : "pronti"} ${ok}, skip ${skipped} ===`);
