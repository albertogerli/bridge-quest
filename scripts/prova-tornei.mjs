/**
 * Prova dei tornei di licita, con utenti veri.
 *
 *   node scripts/prova-tornei.mjs
 *
 * Le cose che devono essere vere perché una classifica significhi qualcosa:
 *  · tutti ricevono LE STESSE mani, nello stesso ordine;
 *  · le mani arrivano una per volta, non tutte insieme;
 *  · una mano si dichiara una volta sola;
 *  · le mani del torneo non si incontrano in allenamento finché è aperto;
 *  · la classifica ordina per stelle e ognuno ci si trova.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

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
  const email = `${pre}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@bridgelab-test.invalid`;
  const password = `Tr!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client: c };
}

const creati = [];
try {
  const a = await utente("toa"); creati.push(a.id);
  const b = await utente("tob"); creati.push(b.id);

  // ── Il torneo nasce alla prima apertura ──────────────────────────────────
  const { data: tA } = await a.client.rpc("torneo_corrente", { p_tipo: "giornaliero" });
  const { data: tB } = await b.client.rpc("torneo_corrente", { p_tipo: "giornaliero" });
  tA?.id && tA.id === tB.id
    ? ok("un solo torneo giornaliero per tutti") : no(`tornei diversi: ${tA?.id} / ${tB?.id}`);
  tA?.quante === 8 ? ok("otto mani nel giornaliero") : no(`mani: ${tA?.quante}`);

  const { data: tSett } = await a.client.rpc("torneo_corrente", { p_tipo: "settimanale" });
  tSett?.quante === 24 ? ok("ventiquattro nel settimanale") : no(`mani settimanali: ${tSett?.quante}`);
  tSett?.id !== tA?.id ? ok("e sono due tornei distinti") : no("giornaliero e settimanale coincidono");

  const { data: tipoStrano } = await a.client.rpc("torneo_corrente", { p_tipo: "mensile" });
  tipoStrano === null ? ok("un tipo che non esiste non crea niente") : no("ha creato un torneo mensile");

  // ── Le mani: le stesse, una per volta ────────────────────────────────────
  const { data: m1a } = await a.client.rpc("torneo_mano", { p_torneo: tA.id });
  const { data: m1b } = await b.client.rpc("torneo_mano", { p_torneo: tA.id });
  m1a?.id && m1a.id === m1b.id
    ? ok("i due giocatori ricevono LA STESSA prima mano") : no("prime mani diverse");
  m1a?.numero === 1 ? ok("ed è la numero uno") : no(`numero: ${m1a?.numero}`);
  m1a?.hands?.north?.length === 13 ? ok("con le carte dentro") : no("mano senza carte");
  m1a?.distribuzioni ? ok("e con le distribuzioni: le stelle avranno il metro buono")
                     : no("mano senza distribuzioni");

  // ── Si dichiara, e la mano successiva arriva ─────────────────────────────
  const scrivi = (u, mano, stelle) =>
    u.client.from("risultati_torneo").insert({
      torneo_id: tA.id, mano_id: mano.id, user_id: u.id,
      contratto: "4♠", dichiarante: "south", punteggio: 420, stelle,
    });

  const { error: e1 } = await scrivi(a, m1a, 3);
  !e1 ? ok("il risultato si registra") : no(`registrazione: ${e1.message}`);

  const { data: m2a } = await a.client.rpc("torneo_mano", { p_torneo: tA.id });
  m2a?.numero === 2 ? ok("e arriva la mano due") : no(`dopo la prima: ${m2a?.numero}`);

  const { error: eBis } = await scrivi(a, m1a, 1);
  eBis ? ok("la stessa mano non si rigioca") : no("ha rigiocato la mano uno");

  const { error: eAltrui } = await a.client.from("risultati_torneo").insert({
    torneo_id: tA.id, mano_id: m2a.id, user_id: b.id,
    contratto: "4♠", dichiarante: "south", punteggio: 420, stelle: 3,
  });
  eAltrui ? ok("non si scrive il risultato di un altro") : no("ha scritto per un altro");

  // Le mezze stelle valgono anche qui.
  const { error: eMezza } = await scrivi(a, m2a, 2.5);
  !eMezza ? ok("le mezze stelle entrano nel torneo") : no(`mezza stella rifiutata: ${eMezza.message}`);
  const { error: eStorta } = await a.client.from("risultati_torneo").insert({
    torneo_id: tA.id, mano_id: m1a.id, user_id: b.id,
    contratto: "3SA", punteggio: 400, stelle: 2.3,
  });
  eStorta ? ok("un voto storto (2,3) viene rifiutato") : no("ha accettato 2,3 stelle");

  // ── L'allenamento non serve le mani del torneo ───────────────────────────
  const impegnate = new Set();
  const { data: tutteLeMani } = await admin
    .from("torneo_mani").select("mano_id").eq("torneo_id", tA.id);
  for (const r of tutteLeMani ?? []) impegnate.add(r.mano_id);

  let trovata = false;
  for (let i = 0; i < 25; i++) {
    const { data: allenamento } = await b.client.rpc("mano_da_fare", {});
    if (allenamento && impegnate.has(allenamento.id)) { trovata = true; break; }
  }
  !trovata
    ? ok("in allenamento non escono le mani del torneo aperto")
    : no("l'allenamento ha servito una mano del torneo in corso");

  // ── La classifica ────────────────────────────────────────────────────────
  await scrivi(b, m1a, 1);

  const { data: cl } = await a.client.rpc("classifica_torneo", { p_torneo: tA.id });
  cl?.totale === 2 ? ok("la classifica conta due giocatori") : no(`in classifica: ${cl?.totale}`);
  Number(cl?.mia?.stelle) === 5.5
    ? ok("le mie stelle sono la somma (3 + 2,5)") : no(`stelle mie: ${cl?.mia?.stelle}`);
  cl?.mia?.posizione === 1 ? ok("e sono primo") : no(`posizione: ${cl?.mia?.posizione}`);
  cl?.righe?.[0]?.sonoIo === true ? ok("la prima riga sono io") : no("la prima riga non sono io");
  cl?.righe?.[1] && Number(cl.righe[1].stelle) === 1
    ? ok("il secondo ha una stella") : no(`secondo: ${JSON.stringify(cl?.righe?.[1])}`);

  const { data: clB } = await b.client.rpc("classifica_torneo", { p_torneo: tA.id });
  clB?.mia?.posizione === 2 ? ok("e per lui la seconda posizione è la sua") : no(`per B: ${clB?.mia?.posizione}`);

  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: clAnon } = await anon.rpc("classifica_torneo", { p_torneo: tA.id });
  clAnon === null ? ok("un anonimo non vede la classifica") : no("un anonimo vede la classifica");
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\nTORNEI DI LICITA: FUNZIONANO.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
