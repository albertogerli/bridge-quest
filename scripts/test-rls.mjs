// Verifica RLS di BridgeLab. Sola lettura, nessun dato personale in output.
//
//   node scripts/test-rls.mjs        (o: npm run test:rls)
//
// Due livelli di verifica:
//   1. ANON  — cosa vede un visitatore non loggato (deve essere: nulla di personale)
//   2. AUTH  — cosa vede un utente loggato QUALSIASI sui dati ALTRUI
//              (crea un utente di test usa-e-getta e lo elimina a fine run)
//
// Exit code 1 se una verifica attesa fallisce.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

let failures = 0;
const ok = (msg) => console.log(`  OK   ${msg}`);
const fail = (msg) => {
  console.log(`  FAIL ${msg}`);
  failures++;
};
const info = (msg) => console.log(`  ..   ${msg}`);

// ---------------------------------------------------------------------------
// 1. Visitatore anonimo
// ---------------------------------------------------------------------------
console.log("\n[1] Visitatore ANONIMO — nessun dato personale deve essere leggibile");

const PRIVATE_TABLES = [
  "profiles",
  "login_history",
  "game_results",
  "friendships",
  "email_events",
  "completed_modules",
  "tournament_results",
  "challenges",
  "review_items",
  "classes",
  "class_members",
  "instructor_requests",
];

for (const t of PRIVATE_TABLES) {
  const { data, error } = await anon.from(t).select("*").limit(3);
  const visible = error ? 0 : data?.length ?? 0;
  if (visible === 0) ok(`${t}: 0 righe`);
  else fail(`${t}: ANON vede ${visible} righe`);
}

// Contenuti che DEVONO restare pubblici (glossario è SSR indicizzato da Google)
console.log("\n[2] Contenuti pubblici — devono restare leggibili");
for (const t of ["glossary", "lessons", "courses", "asd_clubs"]) {
  const { data, error } = await anon.from(t).select("*").limit(1);
  const visible = error ? 0 : data?.length ?? 0;
  if (visible > 0) ok(`${t}: leggibile`);
  else fail(`${t}: NON leggibile da anonimo (regressione SEO/onboarding)`);
}

// ---------------------------------------------------------------------------
// 3. Utente autenticato qualsiasi — esposizione sui dati altrui
// ---------------------------------------------------------------------------
console.log("\n[3] Utente AUTENTICATO — accesso ai dati ALTRUI");

const email = `rls-test-${Date.now()}@bridgelab-test.invalid`;
const password = `Rls!${Math.random().toString(36).slice(2, 12)}`;
let testUserId = null;

try {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(createErr?.message || "creazione fallita");
  testUserId = created.user.id;

  const user = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: signInErr } = await user.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(`login fallito: ${signInErr.message}`);

  // Colonne che l'app mostra legittimamente fra utenti (classifica, amici, forum)
  const { data: pub, error: pubErr } = await user
    .from("profiles")
    .select("id, display_name, xp")
    .neq("id", testUserId)
    .limit(3);
  if (!pubErr && (pub?.length ?? 0) > 0) {
    ok(`profiles: colonne pubbliche leggibili (${pub.length} righe) — atteso: classifica/amici`);
  } else {
    fail("profiles: colonne pubbliche NON leggibili — classifica e amici si romperebbero");
  }

  // Colonne che NON dovrebbero essere leggibili sugli altri utenti
  const SENSITIVE = [
    "marketing_consent",
    "marketing_consent_date",
    "last_login",
    "platform",
    "total_minutes",
  ];
  for (const col of SENSITIVE) {
    const { data, error } = await user
      .from("profiles")
      .select(`id, ${col}`)
      .neq("id", testUserId)
      .limit(1);
    const leaked = !error && (data?.length ?? 0) > 0;
    if (leaked) fail(`profiles.${col}: leggibile sugli ALTRI utenti (dato personale)`);
    else ok(`profiles.${col}: non leggibile sugli altri`);
  }

  // Le altre tabelle personali non devono essere leggibili fra utenti
  for (const t of ["login_history", "game_results", "completed_modules", "review_items"]) {
    const { data, error } = await user.from(t).select("user_id").neq("user_id", testUserId).limit(1);
    const leaked = !error && (data?.length ?? 0) > 0;
    if (leaked) fail(`${t}: un utente legge le righe ALTRUI`);
    else ok(`${t}: righe altrui non leggibili`);
  }

  // Il proprio profilo deve restare completamente leggibile (serve all'app)
  const { data: own, error: ownErr } = await user
    .from("profiles")
    .select("*")
    .eq("id", testUserId)
    .single();
  if (!ownErr && own) ok("profiles: il proprio profilo è leggibile per intero (select *)");
  else fail(`profiles: il proprio profilo NON è leggibile (${ownErr?.message}) — rompe use-auth`);
} catch (e) {
  fail(`verifica autenticata non eseguita: ${e.message}`);
} finally {
  if (testUserId) {
    const { error } = await admin.auth.admin.deleteUser(testUserId);
    if (error) info(`utente di test NON eliminato (${error.message}) — rimuoverlo a mano`);
    else info("utente di test eliminato");
  }
}

console.log(
  failures === 0
    ? "\nTutte le verifiche RLS sono passate.\n"
    : `\n${failures} verifiche RLS FALLITE.\n`
);
process.exit(failures ? 1 : 0);
