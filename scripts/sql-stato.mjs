/**
 * Quali script di `scripts/sql/` non sono ancora stati applicati in produzione.
 *
 *   node scripts/sql-stato.mjs
 *
 * Confronta i file del repository con la tabella `public.script_applicati`
 * (vedi scripts/sql/registro-script-2026-10.sql). Ogni script nuovo si
 * registra da solo con la sua ultima riga; questo comando dice quali mancano.
 * Esce con 1 se ne manca qualcuno, così si può usare anche in un controllo.
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const nelRepo = readdirSync(new URL("./sql/", import.meta.url))
  .filter((f) => f.endsWith(".sql") && !f.includes("rollback") && !f.startsWith("000-") && !f.startsWith("test-"))
  .sort();

const { data, error } = await db.from("script_applicati").select("nome, applicato_il, retroattivo");
if (error) {
  console.error("Non riesco a leggere public.script_applicati:", error.message);
  console.error("Se la tabella non esiste ancora, esegui scripts/sql/registro-script-2026-10.sql.");
  process.exit(2);
}
const applicati = new Set(data.map((r) => r.nome));
const mancanti = nelRepo.filter((f) => !applicati.has(f));
const sconosciuti = data.filter((r) => !nelRepo.includes(r.nome)).map((r) => r.nome);

console.log(`script nel repository: ${nelRepo.length} · registrati: ${data.length}`);
if (sconosciuti.length) console.log(`registrati ma non più nel repository: ${sconosciuti.join(", ")}`);
if (mancanti.length) {
  console.log(`DA APPLICARE (${mancanti.length}):`);
  for (const f of mancanti) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("Tutti gli script del repository risultano applicati.");
