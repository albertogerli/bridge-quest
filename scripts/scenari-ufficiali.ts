/**
 * Mette in tabella gli scenari ufficiali.
 *
 *   npx tsx scripts/scenari-ufficiali.ts
 *
 * Gli scenari ufficiali sono i vincoli didattici che la piattaforma garantisce:
 * quelli su cui si costruiscono gli esercizi dei corsi e su cui ha senso
 * confrontarsi col campo, perché tutti li incontrano. Un insegnante può
 * crearne dei propri, ma questi ci sono sempre.
 *
 * La fonte è `DEAL_TEMPLATES`: i vincoli stanno nel codice, dove sono testati,
 * e da lì arrivano al database. Si riesegue senza duplicare — la chiave è lo
 * `slug` — e senza staccare le mani già generate dal loro scenario.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { DEAL_TEMPLATES } from "../src/lib/deal-generator";

const testo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const E = Object.fromEntries(
  testo
    .split("\n")
    .filter((r) => r.includes("=") && !r.trimStart().startsWith("#"))
    .map((r) => [r.slice(0, r.indexOf("=")).trim(), r.slice(r.indexOf("=") + 1).trim()])
);

const supabase = createClient(E.NEXT_PUBLIC_SUPABASE_URL, E.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const righe = DEAL_TEMPLATES.map((t) => ({
  slug: t.id,
  nome: t.label,
  descrizione: t.description,
  vincoli: t.constraints,
  ufficiale: true,
  pubblico: true,
}));

async function main() {
  const { error } = await supabase.from("scenari").upsert(righe, { onConflict: "slug" });
  if (error) {
    console.error(`Scenari non scritti: ${error.message}`);
    process.exit(1);
  }
  console.log(`${righe.length} scenari ufficiali aggiornati.`);
}

void main();
