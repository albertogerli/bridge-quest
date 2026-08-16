/**
 * Verifica che `scripts/sql/000-schema-baseline.sql` sia ancora allineato alla
 * produzione.
 *
 * PERCHÉ SERVE
 * Un file di schema generato una volta e mai più aggiornato è peggio che non
 * averlo: dà la sensazione che il database sia ricostruibile mentre non lo è
 * più. Questo controllo rende la divergenza visibile invece che silenziosa.
 *
 *   node scripts/verifica-schema.mjs
 *
 * Esce con 1 se il file è disallineato. Da eseguire prima di un rilascio che
 * tocchi lo schema, e ogni volta che si dubita che qualcuno abbia modificato
 * il database dalla dashboard senza passare da uno script.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { leggiEnv } from "./leggi-env.mjs";

const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: attuale, error } = await db.rpc("dump_schema");
if (error) {
  console.error("dump_schema() non riuscita:", error.message);
  process.exit(1);
}

const file = readFileSync(new URL("../scripts/sql/000-schema-baseline.sql", import.meta.url), "utf8");
// L'intestazione è aggiunta dallo script di dump e contiene una data: si
// confronta solo la parte generata dal database.
const inizio = file.indexOf("SET check_function_bodies = false;");
const committato = inizio >= 0 ? file.slice(inizio).trimEnd() : "";

if (committato === attuale.trimEnd()) {
  const righe = attuale.split("\n").length;
  console.log(`schema allineato (${righe} righe).`);
  process.exit(0);
}

// Differenza utile: quali oggetti ci sono di qua e non di là.
const oggetti = (testo) =>
  new Set(
    (testo.match(/^(CREATE TABLE IF NOT EXISTS|CREATE POLICY|CREATE OR REPLACE FUNCTION|CREATE TRIGGER|CREATE (UNIQUE )?INDEX)[^\n(]*/gm) ?? [])
      .map((r) => r.trim())
  );
const inProd = oggetti(attuale);
const inFile = oggetti(committato);
const soloProd = [...inProd].filter((o) => !inFile.has(o));
const soloFile = [...inFile].filter((o) => !inProd.has(o));

console.error("SCHEMA DISALLINEATO fra produzione e repository.\n");
if (soloProd.length) {
  console.error(`In produzione ma NON nel file (${soloProd.length}):`);
  for (const o of soloProd.slice(0, 15)) console.error("  + " + o);
}
if (soloFile.length) {
  console.error(`\nNel file ma NON in produzione (${soloFile.length}):`);
  for (const o of soloFile.slice(0, 15)) console.error("  - " + o);
}
if (!soloProd.length && !soloFile.length) {
  console.error("Stessi oggetti, ma definizioni diverse (corpo di funzione, policy, vincolo).");
}
console.error("\nRigenerare con:  node scripts/dump-schema.mjs");
process.exit(1);
