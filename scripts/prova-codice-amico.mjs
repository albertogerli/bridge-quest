// Prova del codice amico, con utenti veri.
//
//   node scripts/prova-codice-amico.mjs
//
// La proprietà da difendere: un codice indovinato non deve diventare una
// finestra sul profilo di uno sconosciuto.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let ko = 0;
const ok = (m) => console.log(`  OK   ${m}`);
const no = (m) => { console.log(`  FAIL ${m}`); ko++; };

async function utente(pre) {
  const email = `${pre}-${Date.now()}-${Math.random().toString(36).slice(2,6)}@bridgelab-test.invalid`;
  const password = `Cd!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client: c };
}

const creati = [];
try {
  const a = await utente("cda"); creati.push(a.id);
  const b = await utente("cdb"); creati.push(b.id);

  const { data: codice } = await a.client.rpc("mio_codice_amico");
  typeof codice === "string" && codice.length === 6
    ? ok(`il codice si genera: ${codice.length} caratteri`) : no(`codice sbagliato: ${codice}`);

  /^[ABCDEFGHJKMNPQRTUVWXYZ2346789]+$/.test(codice)
    ? ok("nessuna lettera che si confonde a voce (niente O/0, I/1, L, S/5)")
    : no(`alfabeto sbagliato: ${codice}`);

  const { data: dinuovo } = await a.client.rpc("mio_codice_amico");
  dinuovo === codice ? ok("richiamandolo resta lo stesso") : no("il codice cambia a ogni chiamata");

  const { data: trovato } = await b.client.rpc("amico_da_codice", { p_codice: codice });
  trovato?.id === a.id ? ok("un altro utente lo trova col codice") : no("codice non risolto");
  Object.keys(trovato ?? {}).sort().join(",") === "id,nome"
    ? ok("escono SOLO id e nome, nient'altro") : no(`escono anche: ${Object.keys(trovato ?? {})}`);

  const { data: minuscolo } = await b.client.rpc("amico_da_codice", { p_codice: codice.toLowerCase() });
  minuscolo?.id === a.id ? ok("funziona anche scritto in minuscolo") : no("maiuscole/minuscole contano");

  const { data: seStesso } = await a.client.rpc("amico_da_codice", { p_codice: codice });
  seStesso === null ? ok("non ci si aggiunge da soli") : no("un utente trova se stesso");

  const { data: inventato } = await b.client.rpc("amico_da_codice", { p_codice: "ZZZZZZ" });
  inventato === null ? ok("un codice inventato non trova nessuno") : no("codice inventato risolto");

  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: daAnonimo } = await anon.rpc("amico_da_codice", { p_codice: codice });
  daAnonimo === null ? ok("un anonimo non risolve nessun codice") : no("un anonimo ha risolto un codice");
  const { error: eAnon } = await anon.rpc("mio_codice_amico");
  eAnon ? ok("un anonimo non può generarsi un codice") : no("un anonimo ha generato un codice");
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\nIL CODICE AMICO FUNZIONA.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
