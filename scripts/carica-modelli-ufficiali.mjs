import { createClient } from "@supabase/supabase-js";
import { leggiEnv } from "./leggi-env.mjs";
import { readFileSync } from "node:fs";

const env = leggiEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// I modelli stanno in TypeScript: si estraggono con una valutazione del solo
// letterale, senza compilare tutto il progetto per un caricamento una-tantum.
const sorgente = readFileSync("src/lib/modelli-corso-fiori.ts", "utf8");
const inizio = sorgente.indexOf("export const MODELLI_CORSO_FIORI");
const corpo = sorgente.slice(sorgente.indexOf("[", inizio), sorgente.lastIndexOf("];") + 1);
const senzaTipi = corpo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const modelli = eval(senzaTipi);

let creati = 0, aggiornati = 0;
for (const m of modelli) {
  const { data: esistente } = await admin
    .from("modelli_mani").select("id").eq("lesson_id", m.lessonId).eq("ufficiale", true).maybeSingle();
  const riga = {
    nome: m.nome, descrizione: m.descrizione, vincoli: m.vincoli,
    lesson_id: m.lessonId, ufficiale: true, condiviso: true,
    updated_at: new Date().toISOString(),
  };
  if (esistente) {
    const { error } = await admin.from("modelli_mani").update(riga).eq("id", esistente.id);
    if (error) throw error;
    aggiornati++;
  } else {
    const { error } = await admin.from("modelli_mani").insert(riga);
    if (error) throw error;
    creati++;
  }
}
console.log(`modelli ufficiali — creati ${creati}, aggiornati ${aggiornati}`);
