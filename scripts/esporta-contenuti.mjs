/**
 * Fotografia dei contenuti didattici di produzione in `scripts/contenuti/`.
 *
 *   node scripts/esporta-contenuti.mjs
 *
 * PERCHÉ. I contenuti vivi (lezioni, moduli, smazzate, eserciziario…) stanno
 * nel database e si correggono lì; il seed in `src/data/` è rimasto quello
 * iniziale e ne diverge. Questo script ne fa una copia leggibile: chi
 * ricostruisce un ambiente parte da qui, non dal seed, e due esportazioni a
 * distanza di tempo si confrontano con un `diff`.
 *
 * NON SI COMMITTA. La cartella è in `.gitignore`: dentro ci sono i commenti
 * delle smazzate e le soluzioni, che il database nasconde agli allievi finché
 * non hanno giocato, e il repository è pubblico. Pubblicarli qui annullerebbe
 * quella regola.
 *
 * Solo tabelle di contenuto, senza dati personali. Ordinamento stabile per
 * chiave, così due esportazioni uguali producono file identici.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TABELLE = [
  "courses",
  "course_worlds",
  "lessons",
  "lesson_modules",
  "smazzate",
  "eserciziario_exercises",
  "glossary",
  "guided_hands",
  "trova_errore_scenarios",
  "collectible_cards",
];

const dir = new URL("./contenuti/", import.meta.url);
mkdirSync(dir, { recursive: true });

function ordinaChiavi(v) {
  if (Array.isArray(v)) return v.map(ordinaChiavi);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, ordinaChiavi(v[k])]));
  return v;
}

for (const tabella of TABELLE) {
  const righe = [];
  for (let da = 0; ; da += 1000) {
    const { data, error } = await db.from(tabella).select("*").range(da, da + 999);
    if (error) throw new Error(`${tabella}: ${error.message}`);
    righe.push(...data);
    if (data.length < 1000) break;
  }
  const chiave = (r) => String(r.id ?? r.slug ?? r.code ?? JSON.stringify(r));
  righe.sort((a, b) => chiave(a).localeCompare(chiave(b), "en", { numeric: true }));
  writeFileSync(new URL(`${tabella}.json`, dir), JSON.stringify(righe.map(ordinaChiavi), null, 1) + "\n");
  console.log(`${tabella}: ${righe.length} righe`);
}
