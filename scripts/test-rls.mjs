// Verifica RLS con la ANON key (stessa visibilità di un visitatore non loggato).
// Atteso dopo security-fixes-2026-08.sql: 0 righe / errore su tutte le tabelle PII.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
let failed = 0;
for (const t of ["profiles", "login_history", "game_results", "friendships", "email_events", "completed_modules", "tournament_results"]) {
  const { data, error } = await anon.from(t).select("*").limit(3);
  const visible = error ? 0 : (data?.length ?? 0);
  const ok = visible === 0;
  if (!ok) failed++;
  console.log(`${ok ? "OK " : "FAIL"} ${t}: anon vede ${visible} righe${error ? " (err: " + error.message + ")" : ""}`);
}
// Contenuti pubblici che DEVONO restare leggibili (glossario è SSR anon)
for (const t of ["glossary", "lessons"]) {
  const { data, error } = await anon.from(t).select("*").limit(1);
  const visible = error ? 0 : (data?.length ?? 0);
  console.log(`INFO ${t}: anon vede ${visible} righe${error ? " (err: " + error.message + ")" : ""}`);
}
process.exit(failed ? 1 : 0);
