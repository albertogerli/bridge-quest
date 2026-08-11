/**
 * Estrae TUTTI i contenuti didattici dal database di produzione in
 * `_dump-contenuti.json`, passo intermedio di `genera-docx-revisione.py`.
 *
 * Perché dal database e non da `src/data/`: i contenuti live divergono dal
 * seed (vedi CLAUDE.md). Un documento generato dal seed farebbe revisionare
 * a un esperto testi che nessun allievo vede.
 *
 * Uso:
 *   node scripts/dump-contenuti.mjs && python3 scripts/genera-docx-revisione.py
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** PostgREST tronca a 1000 righe per risposta: senza paginazione mancherebbero contenuti. */
async function all(table, columns) {
  let out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out = out.concat(data);
    if (data.length < 1000) return out;
  }
}

const courses = await all("courses", "*");
// `lessons.world_id` punta a un MONDO, non al corso: senza course_worlds il
// collegamento non si chiude e il documento esce vuoto.
const worlds = await all("course_worlds", "*");
const lessons = await all("lessons", "*");
const modules = await all(
  "lesson_modules",
  "lesson_id,module_id,title,module_type,position,content"
);
const smazzate = await all(
  "smazzate",
  "id,lesson_id,board,title,contract,declarer,vulnerability,opening_lead,hands,bidding,commentary"
);
const glossary = await all("glossary", "*");

let eserc = [];
try {
  // Esiste solo nel database, non nel seed.
  eserc = await all("eserciziario_exercises", "*");
} catch (e) {
  console.warn("eserciziario non leggibile:", e.message);
}

writeFileSync(
  new URL("../_dump-contenuti.json", import.meta.url),
  JSON.stringify({ courses, worlds, lessons, modules, smazzate, glossary, eserc }, null, 1)
);

console.log(
  `corsi ${courses.length} · mondi ${worlds.length} · lezioni ${lessons.length} · ` +
    `moduli ${modules.length} · smazzate ${smazzate.length} · glossario ${glossary.length} · ` +
    `eserciziario ${eserc.length}`
);
