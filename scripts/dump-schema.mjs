/**
 * Scrive lo schema completo del database in `scripts/sql/000-schema-baseline.sql`.
 *
 * PERCHÉ ESISTE
 * Il database non era ricostruibile dal solo repository: 33 script applicati a
 * mano in un ordine documentato a parole, nessuno schema base, e una storia
 * delle migrazioni che copre solo le ultime settimane. Chi dovesse ripartire da
 * zero — un nuovo ambiente, un ripristino, un secondo sviluppatore — non aveva
 * da dove cominciare.
 *
 * Il contenuto lo genera `public.dump_schema()` dentro il database (vedi
 * scripts/sql/dump-schema-2026-08.sql): così il file si rigenera con un
 * comando invece di essere una fotografia che invecchia in silenzio.
 *
 *   node scripts/dump-schema.mjs
 *
 * Da rieseguire dopo ogni modifica allo schema, e da committare insieme allo
 * script che l'ha causata.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await db.rpc("dump_schema");
if (error) {
  console.error("dump_schema() non riuscita:", error.message);
  process.exit(1);
}

const intestazione = `-- ============================================================================
-- SCHEMA DI RIFERIMENTO — public
--
-- GENERATO AUTOMATICAMENTE. Non modificare a mano: si rigenera con
--   node scripts/dump-schema.mjs
--
-- A cosa serve: ricostruire il database da zero. Gli script numerati in
-- questa cartella sono la STORIA delle modifiche, applicate a mano una alla
-- volta; questo file e' lo STATO attuale, ed e' l'unico punto da cui partire
-- per un ambiente nuovo o un ripristino.
--
-- Ordine di esecuzione su un database vuoto:
--   1. questo file
--   2. i dati di partenza (contenuti didattici, catalogo circoli)
--
-- Rigenerare e committare dopo OGNI modifica allo schema, insieme allo script
-- che l'ha causata.
--
-- Estratto il: ${new Date().toISOString().slice(0, 10)}
-- ============================================================================

`;

const out = new URL("../scripts/sql/000-schema-baseline.sql", import.meta.url);
writeFileSync(out, intestazione + data + "\n");

const righe = data.split("\n").length;
console.log(`schema scritto in scripts/sql/000-schema-baseline.sql (${righe} righe, ${Math.round(data.length / 1024)} kB)`);
