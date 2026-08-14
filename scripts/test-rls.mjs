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
  // get_engagement_targets() restituisce le EMAIL degli iscritti ed esisteva
  // per il solo cron delle email (che usa la service role). L'11/08/2026 era
  // eseguibile da QUALSIASI utente autenticato: un account creato al momento
  // otteneva indirizzi reali. Causa: le funzioni nascono eseguibili da PUBLIC
  // e `authenticated` eredita da lì — stessa causa del caso `search_users`.
  {
    const { data, error } = await user.rpc("get_engagement_targets", { p_limit: 5 });
    const rows = Array.isArray(data) ? data : [];
    const withEmail = rows.filter((r) => typeof r?.email === "string" && r.email.includes("@")).length;
    if (error && rows.length === 0) {
      ok("get_engagement_targets(): negata a un utente qualunque");
    } else {
      fail(`get_engagement_targets(): un utente qualunque ottiene ${rows.length} righe, ${withEmail} con email`);
    }
  }

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

// ---------------------------------------------------------------------------
// 6. Storico personale del torneo — my_tournament_history()
//    (vedi scripts/sql/tournament-history-2026-08.sql)
//
//    La funzione non prende l'utente come parametro: usa auth.uid(). La
//    proprietà da difendere è che non esista modo di farsi restituire lo
//    storico di un altro, e che un anonimo non la possa nemmeno chiamare.
//
//    Il permesso a `anon` va tolto a PUBLIC, non ad `anon`: Postgres concede
//    EXECUTE a PUBLIC su ogni nuova funzione e `anon` eredita da lì. Con un
//    `revoke ... from anon` la funzione restava eseguibile — verificato.
// ---------------------------------------------------------------------------
console.log("\n[6] Storico del torneo — my_tournament_history");

try {
  // (a) un anonimo non deve poter eseguire la funzione
  {
    const { data, error } = await anon.rpc("my_tournament_history", {});
    const rows = Array.isArray(data) ? data.length : 0;
    if (error) ok("(a) my_tournament_history(): negata all'anonimo");
    else if (rows === 0) ok("(a) my_tournament_history(): nessuna riga per l'anonimo");
    else fail(`(a) un anonimo ottiene ${rows} righe di storico`);
  }

  // (b) un utente vero non deve vedere lo storico di nessun altro: la
  //     funzione non espone un parametro utente, e le righe che tornano sono
  //     solo le sue (qui: nessuna, perché non ha mai giocato).
  {
    const email = `th-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Th!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(b) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });
      const { data, error } = await u.rpc("my_tournament_history", {});
      if (error) fail(`(b) un utente autenticato non riesce a leggere il proprio storico: ${error.message}`);
      else if (Array.isArray(data) && data.length === 0)
        ok("(b) chi non ha mai giocato riceve uno storico vuoto, non quello altrui");
      else fail(`(b) un utente nuovo riceve ${Array.isArray(data) ? data.length : "?"} righe di storico`);
      await admin.auth.admin.deleteUser(created.user.id);
      info("utente storico di test eliminato");
    }
  }
} catch (e) {
  fail(`verifica storico torneo non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 7. Accessi per il pannello admin — admin_login_history()
//    (vedi scripts/sql/admin-login-history-2026-08.sql)
//
//    È SECURITY DEFINER e scavalca la policy di `login_history`: se fosse
//    eseguibile da chiunque, restituirebbe gli accessi di tutti gli iscritti.
//    L'unica cosa che lo impedisce è il controllo is_admin() nel corpo.
// ---------------------------------------------------------------------------
console.log("\n[7] Accessi admin — admin_login_history");

try {
  {
    const { data, error } = await anon.rpc("admin_login_history", { p_days: 7 });
    const rows = Array.isArray(data) ? data.length : 0;
    if (error || rows === 0) ok("(a) admin_login_history(): non eseguibile da anonimo");
    else fail(`(a) un anonimo ottiene ${rows} accessi`);
  }

  {
    const email = `alh-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Alh!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(b) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });
      const { data, error } = await u.rpc("admin_login_history", { p_days: 7 });
      const rows = Array.isArray(data) ? data.length : 0;
      if (error) ok("(b) un utente NON admin riceve un errore, non gli accessi altrui");
      else if (rows === 0) ok("(b) un utente NON admin non ottiene alcun accesso");
      else fail(`(b) un utente qualunque ottiene ${rows} accessi di tutti gli iscritti`);
      await admin.auth.admin.deleteUser(created.user.id);
      info("utente accessi di test eliminato");
    }
  }
} catch (e) {
  fail(`verifica accessi admin non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 8. Tavolo condiviso — live_tables
//    (vedi scripts/sql/tavolo-condiviso-2026-08.sql)
//
//    La proprietà che regge tutto: le mani coperte non devono ARRIVARE al
//    browser dell'allievo. Non basta non disegnarle — chi apre gli strumenti
//    per sviluppatori le leggerebbe. Perciò la tabella non è leggibile e si
//    passa da live_table_view(), che filtra dentro il database.
// ---------------------------------------------------------------------------
console.log("\n[8] Tavolo condiviso — live_tables");

try {
  {
    const { data, error } = await anon.from("live_tables").select("hands").limit(1);
    const rows = error ? 0 : data?.length ?? 0;
    if (rows === 0) ok("(a) live_tables: nessuna riga per l'anonimo");
    else fail(`(a) un anonimo legge ${rows} tavoli, mani comprese`);
  }

  for (const fn of ["live_table_view", "live_table_open"]) {
    const args = fn === "live_table_view"
      ? { p_table_id: "00000000-0000-0000-0000-000000000000" }
      : { p_class_id: "00000000-0000-0000-0000-000000000000" };
    const { data, error } = await anon.rpc(fn, args);
    if (error || data === null) ok(`(b) ${fn}(): non eseguibile da anonimo`);
    else fail(`(b) ${fn}(): un anonimo ottiene una risposta`);
  }

  {
    const email = `lt-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Lt!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(c) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });
      const { data, error } = await u.from("live_tables").select("hands").limit(1);
      const rows = error ? 0 : data?.length ?? 0;
      if (rows === 0) ok("(c) un utente qualunque non legge le mani dalla tabella");
      else fail(`(c) un utente qualunque legge ${rows} tavoli con le mani dentro`);
      await admin.auth.admin.deleteUser(created.user.id);
      info("utente tavolo di test eliminato");
    }
  }
} catch (e) {
  fail(`verifica tavolo condiviso non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 9. Bacheca del circolo — club_posts
//    (vedi scripts/sql/bacheca-circolo-2026-08.sql)
//
//    Gli avvisi sono PER I SOCI: chi non è del circolo non deve leggerli, e
//    soprattutto nessuno deve poter pubblicare a nome di un circolo che non è
//    il suo. Non esisteva un ruolo «amministratore di circolo»: la regola è
//    ruolo istruttore PIÙ lo stesso asd_code.
// ---------------------------------------------------------------------------
console.log("\n[9] Bacheca del circolo — club_posts");

try {
  {
    const { data, error } = await anon.from("club_posts").select("titolo").limit(1);
    const rows = error ? 0 : data?.length ?? 0;
    if (rows === 0) ok("(a) club_posts: nessun avviso per l'anonimo");
    else fail(`(a) un anonimo legge ${rows} avvisi`);
  }

  {
    const email = `bc-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Bc!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(b) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });

      // (b) un utente normale non può pubblicare per nessun circolo
      const { error: insErr } = await u.from("club_posts").insert({
        asd_code: "F0150", author_id: created.user.id,
        titolo: "prova", corpo: "prova",
      });
      if (insErr) ok("(b) un utente senza ruolo NON pubblica per un circolo");
      else fail("(b) un utente qualunque ha pubblicato un avviso di circolo");

      // (c) e non può nemmeno spacciarsi per un altro autore
      const { error: fakeErr } = await u.from("club_posts").insert({
        asd_code: "F0150", author_id: "00000000-0000-0000-0000-000000000000",
        titolo: "prova", corpo: "prova",
      });
      if (fakeErr) ok("(c) non si può pubblicare a nome di un altro");
      else fail("(c) è stato possibile pubblicare a nome di un altro utente");

      // (d) can_post_for_asd() deve dire di no
      const { data: puo } = await u.rpc("can_post_for_asd", { p_asd_code: "F0150" });
      if (puo !== true) ok("(d) can_post_for_asd(): no per chi non ha il ruolo");
      else fail("(d) can_post_for_asd(): sì a un utente senza ruolo");

      await admin.auth.admin.deleteUser(created.user.id);
      info("utente bacheca di test eliminato");
    }
  }

  {
    const { data, error } = await anon.rpc("my_asd_code", {});
    if (error || data === null) ok("(e) my_asd_code(): non eseguibile da anonimo");
    else fail("(e) my_asd_code(): un anonimo ottiene una risposta");
  }
} catch (e) {
  fail(`verifica bacheca non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 10. Tavolo giocabile — live_table_play / live_table_undo
//     (vedi scripts/sql/tavolo-giocabile-2026-08.sql)
//
//     Le carte ora si giocano. La proprietà da difendere è che nessuno possa
//     giocare una carta che non ha: la funzione conosce le mani (è SECURITY
//     DEFINER) e non deve diventare un modo per indovinarle.
// ---------------------------------------------------------------------------
console.log("\n[10] Tavolo giocabile — live_table_play");

try {
  for (const [fn, args] of [
    ["live_table_play", { p_table_id: "00000000-0000-0000-0000-000000000000", p_seat: "north", p_card: { suit: "spade", rank: "A" } }],
    ["live_table_undo", { p_table_id: "00000000-0000-0000-0000-000000000000" }],
  ]) {
    const { data, error } = await anon.rpc(fn, args);
    if (error || data === null) ok(`(a) ${fn}(): non eseguibile da anonimo`);
    else fail(`(a) ${fn}(): un anonimo ottiene una risposta`);
  }

  {
    const email = `lp-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Lp!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(b) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });

      // Un utente che non fa parte di nessuna classe non deve poter giocare
      // su un tavolo, nemmeno indicando un posto.
      const { data } = await u.rpc("live_table_play", {
        p_table_id: "00000000-0000-0000-0000-000000000000",
        p_seat: "north",
        p_card: { suit: "spade", rank: "A" },
      });
      if (!data || data.ok !== true) ok("(b) un estraneo non gioca su un tavolo");
      else fail("(b) un estraneo ha giocato una carta");

      // E non deve poter annullare le mosse altrui.
      const { data: undo } = await u.rpc("live_table_undo", {
        p_table_id: "00000000-0000-0000-0000-000000000000",
      });
      if (undo !== true) ok("(c) un estraneo non annulla le mosse");
      else fail("(c) un estraneo ha annullato una mossa");

      await admin.auth.admin.deleteUser(created.user.id);
      info("utente tavolo giocabile di test eliminato");
    }
  }
} catch (e) {
  fail(`verifica tavolo giocabile non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 11. Archivio delle mani — saved_hands
//     (vedi scripts/sql/archivio-mani-2026-08.sql)
//
//     L'archivio è personale: le mani di un insegnante non sono affari di
//     nessun altro, nemmeno di un collega.
// ---------------------------------------------------------------------------
console.log("\n[11] Archivio delle mani — saved_hands");

try {
  {
    const { data, error } = await anon.from("saved_hands").select("titolo").limit(1);
    const rows = error ? 0 : data?.length ?? 0;
    if (rows === 0) ok("(a) saved_hands: niente per l'anonimo");
    else fail(`(a) un anonimo legge ${rows} mani salvate`);
  }

  {
    const email = `sh-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Sh!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(b) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });

      const { data: mie } = await u.from("saved_hands").select("id").limit(5);
      if ((mie?.length ?? 0) === 0) ok("(b) un utente nuovo non vede le mani di altri");
      else fail(`(b) un utente nuovo vede ${mie.length} mani altrui`);

      const { error: insErr } = await u.from("saved_hands").insert({
        owner_id: "00000000-0000-0000-0000-000000000000",
        titolo: "prova", hands: {},
      });
      if (insErr) ok("(c) non si salva una mano a nome di un altro");
      else fail("(c) è stato possibile salvare a nome di un altro utente");

      await admin.auth.admin.deleteUser(created.user.id);
      info("utente archivio di test eliminato");
    }
  }
} catch (e) {
  fail(`verifica archivio non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 12. Scenari, mani condivise e confronto col campo
//     (vedi scripts/sql/scenari-e-mani-2026-08.sql)
//
//     Qui la regola è asimmetrica ed è voluta: le MANI sono di tutti — senza
//     riuso non esiste la percentuale di campo — ma chi le mette in circolo
//     deve insegnare, e il confronto non deve mai dire CHI ha sbagliato.
// ---------------------------------------------------------------------------
console.log("\n[12] Scenari e mani condivise");

try {
  for (const t of ["scenari", "mani_generate", "risultati_mano"]) {
    const { data, error } = await anon.from(t).select("id").limit(1);
    const rows = error ? 0 : data?.length ?? 0;
    if (rows === 0) ok(`(a) ${t}: niente per l'anonimo`);
    else fail(`(a) un anonimo legge ${rows} righe da ${t}`);
  }

  {
    const email = `sce-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Sc!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(b) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });

      const { error: scErr } = await u.from("scenari").insert({
        nome: "abusivo", vincoli: {}, autore_id: created.user.id,
      });
      if (scErr) ok("(b) un allievo non crea scenari");
      else fail("(b) un allievo ha creato uno scenario");

      const { error: mnErr } = await u.from("mani_generate").insert({
        hands: {}, dealer: "south",
      });
      if (mnErr) ok("(c) un allievo non mette mani in circolo");
      else fail("(c) un allievo ha inserito una mano generata");

      const { error: riErr } = await u.from("risultati_mano").insert({
        mano_id: "00000000-0000-0000-0000-000000000000",
        user_id: "00000000-0000-0000-0000-000000000000",
        punteggio: 2220, stelle: 3,
      });
      if (riErr) ok("(d) non si registra il risultato di un altro");
      else fail("(d) è stato registrato un risultato a nome altrui");

      await admin.auth.admin.deleteUser(created.user.id);
      info("utente scenari di test eliminato");
    }
  }

  {
    const { data, error } = await anon.rpc("confronto_campo", {
      p_mano_id: "00000000-0000-0000-0000-000000000000",
    });
    if (error || data === null) ok("(e) confronto_campo muto per l'anonimo");
    else fail("(e) un anonimo ottiene il confronto col campo");
  }
} catch (e) {
  fail(`verifica scenari non eseguita: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 13. Sfide 2 contro 2 — sfide_coppie, sfida_board e statistiche
//     (vedi scripts/sql/sfida-coppie-2026-08.sql e statistiche-sfide-2026-08.sql)
//
//     Il punteggio di una sfida non deve poterlo scrivere il browser, e le
//     statistiche di uno non sono affari di nessun altro.
// ---------------------------------------------------------------------------
console.log("\n[13] Sfide 2 contro 2");

try {
  for (const t of ["sfide_coppie", "sfida_board"]) {
    const { data, error } = await anon.from(t).select("*").limit(1);
    const rows = error ? 0 : data?.length ?? 0;
    if (rows === 0) ok(`(a) ${t}: niente per l'anonimo`);
    else fail(`(a) un anonimo legge ${rows} righe da ${t}`);
  }

  for (const fn of ["sfida_coppie_crea", "sfida_board_chiudi", "mie_statistiche_sfide"]) {
    const { error } = await anon.rpc(fn, {});
    if (error) ok(`(b) ${fn}(): non eseguibile da anonimo`);
    else fail(`(b) un anonimo ha eseguito ${fn}()`);
  }

  {
    const email = `sfc-test-${Date.now()}@bridgelab-test.invalid`;
    const password = `Sc!${Math.random().toString(36).slice(2, 12)}`;
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr) {
      fail(`(c) utente di prova non creato: ${createErr.message}`);
    } else {
      const u = createClient(URL_, ANON, { auth: { persistSession: false } });
      await u.auth.signInWithPassword({ email, password });

      // Un utente nuovo non vede sfide di altri...
      const { data: sue } = await u.from("sfide_coppie").select("id").limit(5);
      if ((sue?.length ?? 0) === 0) ok("(c) un utente nuovo non vede sfide altrui");
      else fail(`(c) un utente nuovo vede ${sue.length} sfide altrui`);

      // ...e non può scrivere un punteggio a mano: è il punto di tutto.
      const { error: insErr } = await u.from("sfida_board").insert({
        sfida_id: "00000000-0000-0000-0000-000000000000",
        mano_id: "00000000-0000-0000-0000-000000000000",
        coppia: "A", numero: 1,
        sessione_id: "00000000-0000-0000-0000-000000000000",
        punteggio: 99999,
      });
      if (insErr) ok("(d) il punteggio non si scrive dal client");
      else fail("(d) è stato possibile scrivere un punteggio a mano");

      const { data: stat } = await u.rpc("mie_statistiche_sfide");
      if (stat?.incontri === 0) ok("(e) le statistiche di un utente nuovo sono vuote");
      else fail(`(e) statistiche non vuote per un utente nuovo: ${JSON.stringify(stat)}`);

      await admin.auth.admin.deleteUser(created.user.id);
      info("utente sfide di test eliminato");
    }
  }
} catch (e) {
  fail(`verifica sfide non eseguita: ${e.message}`);
}

console.log(
  failures === 0
    ? "\nTutte le verifiche RLS sono passate.\n"
    : `\n${failures} verifiche RLS FALLITE.\n`
);
process.exit(failures ? 1 : 0);
