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
  "partner_profiles",
];

for (const t of PRIVATE_TABLES) {
  const { data, error } = await anon.from(t).select("*").limit(3);
  const visible = error ? 0 : data?.length ?? 0;
  if (visible === 0) ok(`${t}: 0 righe`);
  else fail(`${t}: ANON vede ${visible} righe`);
}

// Le funzioni SECURITY DEFINER scavalcano RLS e privilegi di colonna: se sono
// eseguibili da anonimo riaprono da sola porta tutto ciò che si è chiuso.
// Il 2026-08-09 `search_users` restituiva 20 profili completi a un chiamante
// non autenticato. Nota: nascono eseguibili da PUBLIC, e `anon` eredita da lì.
console.log("\n[1b] Funzioni SECURITY DEFINER — non eseguibili da anonimo");
{
  const probes = [
    ["search_users", { p_query: "a", p_user_id: "00000000-0000-0000-0000-000000000000" }],
    ["get_challenge_stats", { p_user_id: "00000000-0000-0000-0000-000000000000" }],
    ["get_game_leaderboard", { p_game_type: "smazzata", p_limit: 5 }],
    ["is_admin", {}],
    ["admin_game_stats", {}],
  ];
  for (const [fn, args] of probes) {
    const { data, error } = await anon.rpc(fn, args);
    const rows = Array.isArray(data) ? data.length : data == null ? 0 : 1;
    if (error || rows === 0) ok(`${fn}(): non eseguibile da anonimo`);
    else fail(`${fn}(): un anonimo ottiene ${rows} righe`);
  }
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

  // Il proprio profilo deve restare completamente leggibile, ma NON con una
  // SELECT diretta: i privilegi di colonna valgono per ruolo e non per riga,
  // quindi dopo la revoca l'unica via è la RPC SECURITY DEFINER.
  const { data: own, error: ownErr } = await user.rpc("get_own_profile");
  const ownRow = Array.isArray(own) ? own[0] : own;
  if (!ownErr && ownRow?.marketing_consent !== undefined) {
    ok("get_own_profile(): il proprio profilo è leggibile per intero");
  } else {
    fail(
      `get_own_profile() non restituisce il profilo completo (${ownErr?.message ?? "colonne mancanti"}) — rompe use-auth`
    );
  }

  // Corollario: la SELECT diretta di tutte le colonne DEVE fallire, altrimenti
  // la revoca non è attiva.
  const { error: rawErr } = await user
    .from("profiles")
    .select("*")
    .eq("id", testUserId)
    .single();
  if (rawErr) ok("profiles: select(*) diretta negata anche sulla propria riga (atteso)");
  else fail("profiles: select(*) diretta ancora permessa — la revoca delle colonne non è attiva");

  // admin_list_users() restituisce le EMAIL di tutti gli iscritti. È eseguibile
  // dal ruolo `authenticated`, quindi l'unica cosa che separa un utente
  // qualunque dall'anagrafica completa è il controllo is_admin() dentro il
  // corpo. Se qualcuno lo togliesse, o ricreasse la funzione dimenticandolo,
  // questa riga è ciò che se ne accorge.
  const { data: adminRows, error: adminErr } = await user.rpc("admin_list_users");
  const leakedRows = Array.isArray(adminRows) ? adminRows.length : 0;
  if (adminErr && leakedRows === 0) {
    ok("admin_list_users(): negata a un utente non amministratore");
  } else {
    fail(
      `admin_list_users(): un utente qualunque ottiene ${leakedRows} righe con le email di tutti`
    );
  }
} catch (e) {
  fail(`verifica autenticata non eseguita: ${e.message}`);
} finally {
  if (testUserId) {
    const { error } = await admin.auth.admin.deleteUser(testUserId);
    if (error) info(`utente di test NON eliminato (${error.message}) — rimuoverlo a mano`);
    else info("utente di test eliminato");
  }
}

// ---------------------------------------------------------------------------
// 4. Unicità del nome BBO — is_bbo_username_taken()
//    (vedi scripts/sql/bbo-username-unique-2026-08.sql)
// ---------------------------------------------------------------------------
console.log("\n[4] Nome BBO unico — is_bbo_username_taken()");

const bboEmail = `bbo-test-${Date.now()}@bridgelab-test.invalid`;
const bboPassword = `Bbo!${Math.random().toString(36).slice(2, 12)}`;
// Handle usa-e-getta: non può collidere con un handle BBO reale.
const bboHandle = `bqtest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const bboFree = `${bboHandle}-libero`;
let bboUserId = null;

try {
  // (a) un handle mai visto risulta libero, anche da anonimo (registrazione)
  {
    const { data, error } = await anon.rpc("is_bbo_username_taken", {
      p_bbo_username: bboFree,
    });
    if (error) fail(`anonimo non può chiamare is_bbo_username_taken (${error.message}) — la registrazione si romperebbe`);
    else if (data === false) ok("(a) handle mai usato: libero (chiamata da anonimo)");
    else fail(`(a) handle mai usato riportato come occupato (${JSON.stringify(data)})`);
  }

  // Campo facoltativo: vuoto/spazi/NULL non sono mai "occupati"
  for (const [label, value] of [["vuoto", ""], ["spazi", "   "], ["NULL", null]]) {
    const { data, error } = await anon.rpc("is_bbo_username_taken", { p_bbo_username: value });
    if (!error && data === false) ok(`(a) handle ${label}: non occupato — il campo resta facoltativo`);
    else fail(`(a) handle ${label} riportato come occupato o in errore (${error?.message ?? JSON.stringify(data)})`);
  }

  // Utente di test con un handle noto
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: bboEmail,
    password: bboPassword,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(createErr?.message || "creazione fallita");
  bboUserId = created.user.id;
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert({ id: bboUserId, display_name: "RLS BBO test", bbo_username: bboHandle }, { onConflict: "id" });
  if (upsertErr) throw new Error(`profilo di test non scritto: ${upsertErr.message}`);

  // (b) l'handle ora è occupato per chiunque altro, anche ignorando maiuscole e spazi
  for (const [label, probe] of [
    ["identico", bboHandle],
    ["maiuscole", bboHandle.toUpperCase()],
    ["spazi ai bordi", `  ${bboHandle}  `],
  ]) {
    const { data, error } = await anon.rpc("is_bbo_username_taken", { p_bbo_username: probe });
    if (!error && data === true) ok(`(b) handle già in uso (${label}): occupato`);
    else fail(`(b) handle già in uso (${label}) NON riportato come occupato (${error?.message ?? JSON.stringify(data)})`);
  }

  // (c) per il proprietario, il proprio handle non risulta occupato
  {
    const owner = createClient(URL_, ANON, { auth: { persistSession: false } });
    const { error: signInErr } = await owner.auth.signInWithPassword({
      email: bboEmail,
      password: bboPassword,
    });
    if (signInErr) throw new Error(`login utente BBO fallito: ${signInErr.message}`);

    const { data, error } = await owner.rpc("is_bbo_username_taken", {
      p_bbo_username: bboHandle.toUpperCase(),
    });
    if (!error && data === false) ok("(c) il proprio handle non risulta occupato per sé stesso");
    else fail(`(c) il proprietario viene bloccato sul proprio handle (${error?.message ?? JSON.stringify(data)})`);

    // (d) la risposta è SOLO un booleano: nessun dato personale può uscire da qui
    const { data: shape } = await owner.rpc("is_bbo_username_taken", { p_bbo_username: bboHandle });
    if (typeof shape === "boolean") ok("(d) la risposta è un booleano — nessun dato personale");
    else fail(`(d) la funzione restituisce ${typeof shape} invece di un booleano: ${JSON.stringify(shape)}`);
  }

  // (d bis) stessa verifica da anonimo, il caso che conta di più
  {
    const { data } = await anon.rpc("is_bbo_username_taken", { p_bbo_username: bboHandle });
    if (typeof data === "boolean") ok("(d) anche da anonimo la risposta è un booleano");
    else fail(`(d) da anonimo la funzione restituisce ${typeof data}: ${JSON.stringify(data)}`);
  }

  // Corollario: l'handle altrui resta illeggibile con una SELECT diretta.
  {
    const { data, error } = await anon.from("profiles").select("bbo_username").limit(1);
    const leaked = !error && (data?.length ?? 0) > 0;
    if (leaked) fail("profiles.bbo_username: leggibile da anonimo — la RPC non sarebbe l'unica via");
    else ok("profiles.bbo_username: non leggibile da anonimo");
  }
} catch (e) {
  fail(`verifica nome BBO non eseguita: ${e.message}`);
} finally {
  if (bboUserId) {
    const { error } = await admin.auth.admin.deleteUser(bboUserId);
    if (error) info(`utente BBO di test NON eliminato (${error.message}) — rimuoverlo a mano`);
    else info("utente BBO di test eliminato");
  }
}


// ---------------------------------------------------------------------------
// 5. Trova un compagno — partner_profiles + list_partner_candidates
//    (vedi scripts/sql/partner-matching-2026-08.sql)
//
//    La funzione pubblica nome, livello, provincia e disponibilità: la
//    proprietà che conta è che vi finisca SOLO chi l'ha chiesto, e che
//    nessuno possa scrivere la scheda di un altro.
// ---------------------------------------------------------------------------
console.log("\n[5] Trova un compagno — partner_profiles");

const pmEmail = `pm-test-${Date.now()}@bridgelab-test.invalid`;
const pmEmail2 = `pm2-test-${Date.now()}@bridgelab-test.invalid`;
const pmPassword = `Pm!${Math.random().toString(36).slice(2, 12)}`;
let pmId = null;
let pmId2 = null;

try {
  // (a) un anonimo non deve poter chiamare l'elenco
  {
    const { data, error } = await anon.rpc("list_partner_candidates", {});
    const rows = Array.isArray(data) ? data.length : 0;
    if (error || rows === 0) ok("(a) list_partner_candidates(): nessun risultato per anonimi");
    else fail(`(a) un anonimo ottiene ${rows} schede di partner`);
  }

  // Due utenti veri: A si mette in cerca, B no.
  const a = createClient(URL_, ANON, { auth: { persistSession: false } });
  const b = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: sa } = await a.auth.signUp({ email: pmEmail, password: pmPassword });
  const { data: sb } = await b.auth.signUp({ email: pmEmail2, password: pmPassword });
  pmId = sa?.user?.id ?? null;
  pmId2 = sb?.user?.id ?? null;
  if (!pmId || !pmId2) throw new Error("creazione utenti di test non riuscita");
  await admin.from("profiles").upsert([
    { id: pmId, display_name: "PM Uno" },
    { id: pmId2, display_name: "PM Due" },
  ]);

  // (b) A entra nell'elenco
  {
    const { error } = await a.from("partner_profiles").upsert({
      user_id: pmId, looking: true, level: "intermedio",
      province: "MI", availability: ["sera"],
    });
    if (!error) ok("(b) un utente può creare la PROPRIA scheda");
    else fail(`(b) un utente non riesce a creare la propria scheda: ${error.message}`);
  }

  // (c) B prova a scrivere la scheda di A — deve fallire
  {
    const { error } = await b.from("partner_profiles").upsert({
      user_id: pmId, looking: true, level: "avanzato", province: "RM", availability: [],
    });
    if (error) ok("(c) scrivere la scheda di un ALTRO utente è negato");
    else fail("(c) un utente ha potuto sovrascrivere la scheda di un altro");
  }

  // (d) B prova a modificare la riga di A con UPDATE diretto
  {
    const { data } = await b.from("partner_profiles")
      .update({ province: "NA" }).eq("user_id", pmId).select("user_id");
    if ((data?.length ?? 0) === 0) ok("(d) UPDATE sulla riga altrui non tocca nulla");
    else fail("(d) un utente ha modificato la riga di un altro");
  }

  // (e) B, che non si è messo in cerca, NON deve comparire a nessuno
  {
    const { data } = await a.rpc("list_partner_candidates", {});
    const rows = Array.isArray(data) ? data : [];
    if (!rows.some((r) => r.user_id === pmId2)) ok("(e) chi non si è iscritto non compare nell'elenco");
    else fail("(e) un utente che NON si è messo in cerca compare fra i candidati");
  }

  // (f) nessuno deve vedere sé stesso fra i candidati
  {
    const { data } = await a.rpc("list_partner_candidates", {});
    const rows = Array.isArray(data) ? data : [];
    if (!rows.some((r) => r.user_id === pmId)) ok("(f) non si compare mai fra i propri candidati");
    else fail("(f) l'utente vede sé stesso fra i candidati");
  }

  // (g) A si ritira: sparisce per gli altri ma continua a vedere la propria
  {
    await a.from("partner_profiles").update({ looking: false }).eq("user_id", pmId);
    const { data: visibileAB } = await b.from("partner_profiles").select("user_id").eq("user_id", pmId);
    if ((visibileAB?.length ?? 0) === 0) ok("(g) chi esce dall'elenco non è più visibile agli altri");
    else fail("(g) una scheda ritirata resta visibile agli altri utenti");

    const { data: propria } = await a.from("partner_profiles").select("user_id").eq("user_id", pmId);
    if ((propria?.length ?? 0) === 1) ok("(g) la propria scheda resta leggibile anche da ritirati");
    else fail("(g) dopo il ritiro l'utente non vede più le proprie impostazioni");
  }

  // (h) il livello è un elenco chiuso lato database, non solo nella UI
  {
    const { error } = await a.from("partner_profiles").upsert({
      user_id: pmId, looking: true, level: "campione-del-mondo", availability: [],
    });
    if (error) ok("(h) un livello inventato è rifiutato dal database");
    else fail("(h) il database accetta un livello arbitrario");
  }

  // (i) idem per le fasce di disponibilità
  {
    const { error } = await a.from("partner_profiles").upsert({
      user_id: pmId, looking: true, level: "intermedio", availability: ["notte-fonda"],
    });
    if (error) ok("(i) una fascia inventata è rifiutata dal database");
    else fail("(i) il database accetta una fascia di disponibilità arbitraria");
  }
} catch (e) {
  fail(`verifica partner matching non eseguita: ${e.message}`);
} finally {
  for (const id of [pmId, pmId2]) {
    if (!id) continue;
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) info(`utente partner di test NON eliminato (${error.message}) — rimuoverlo a mano`);
  }
  if (pmId || pmId2) info("utenti partner di test eliminati");
}

console.log(
  failures === 0
    ? "\nTutte le verifiche RLS sono passate.\n"
    : `\n${failures} verifiche RLS FALLITE.\n`
);
process.exit(failures ? 1 : 0);
