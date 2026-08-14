// Prova di scenari, mani condivise e confronto col campo.
//
//   node scripts/prova-campo.mjs
//
// La proprietà che regge la Fase 3: due persone devono poter ricevere LA
// STESSA mano e confrontarsi. Senza riuso non c'è percentuale di campo.
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

const SEMI = ["spade","heart","diamond","club"], RANGHI = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const mazzo = SEMI.flatMap((suit) => RANGHI.map((rank) => ({ suit, rank })));
const hands = { north: mazzo.slice(0,13), east: mazzo.slice(13,26), south: mazzo.slice(26,39), west: mazzo.slice(39,52) };

async function utente(pre, ruolo) {
  const email = `${pre}-${Date.now()}-${Math.random().toString(36).slice(2,6)}@bridgelab-test.invalid`;
  const password = `Cp!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  if (ruolo) await admin.from("profiles").update({ role: ruolo }).eq("id", data.user.id);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client: c };
}

const creati = []; let scenarioId, manoId;
try {
  const ist = await utente("sci", "instructor"); creati.push(ist.id);
  const a = await utente("sca", null); creati.push(a.id);
  const b = await utente("scb", null); creati.push(b.id);

  // Un allievo NON deve poter creare scenari: uno scenario mal costruito è un
  // esercizio che insegna una cosa sbagliata.
  const { error: eNo } = await a.client.from("scenari")
    .insert({ nome: "abusivo", vincoli: {}, autore_id: a.id });
  eNo ? ok("un allievo non crea scenari") : no("un allievo ha creato uno scenario");

  const slug = `prova-campo-${Date.now()}`;
  const { data: sc, error: eSc } = await ist.client.from("scenari")
    .insert({ nome: "Prova campo", slug, vincoli: { south: { hcp: { min: 12 } } }, autore_id: ist.id, pubblico: true })
    .select("id").single();
  if (eSc) throw new Error("scenario: " + eSc.message);
  scenarioId = sc.id;
  ok("l'istruttore crea uno scenario");

  const { data: mano, error: eM } = await ist.client.from("mani_generate")
    .insert({ scenario_id: scenarioId, hands, dealer: "south", par_score: 420, par_contracts: ["4S-NS"] })
    .select("id").single();
  if (eM) throw new Error("mano: " + eM.message);
  manoId = mano.id;
  ok("l'istruttore mette una mano in scorta");

  // LA PROPRIETÀ CHIAVE: la stessa mano è visibile a entrambi gli allievi.
  const { data: vA } = await a.client.from("mani_generate").select("id, hands").eq("id", manoId).single();
  const { data: vB } = await b.client.from("mani_generate").select("id, hands").eq("id", manoId).single();
  vA?.id === manoId && vB?.id === manoId
    ? ok("DUE allievi ricevono la stessa mano — il riuso funziona") : no("la mano non è condivisa");

  // La pesca: prima la mano c'è...
  const { data: pescata } = await a.client.rpc("mano_da_fare", { p_slug: slug });
  pescata?.id === manoId && pescata?.hands?.north?.length === 13
    ? ok("mano_da_fare consegna la mano, con le carte dentro")
    : no(`mano_da_fare non ha consegnato la mano: ${JSON.stringify(pescata)?.slice(0, 120)}`);
  pescata?.scenario?.nome === "Prova campo" && pescata?.scenario?.vincoli === undefined
    ? ok("porta il nome dello scenario ma non i suoi vincoli")
    : no("lo scenario non arriva come dovrebbe");

  // Ognuno scrive il proprio risultato...
  const { error: e1 } = await a.client.from("risultati_mano")
    .insert({ mano_id: manoId, user_id: a.id, contratto: "4♠", punteggio: 420, stelle: 3 });
  const { error: e2 } = await b.client.from("risultati_mano")
    .insert({ mano_id: manoId, user_id: b.id, contratto: "2♠", punteggio: 170, stelle: 1 });
  !e1 && !e2 ? ok("ognuno registra il proprio risultato") : no(`registrazione fallita: ${e1?.message ?? e2?.message}`);

  // ...e non quello di un altro.
  const { error: e3 } = await a.client.from("risultati_mano")
    .insert({ mano_id: manoId, user_id: b.id, contratto: "7SA", punteggio: 2220, stelle: 3 });
  e3 ? ok("non si scrive il risultato di un altro") : no("ha scritto il risultato di un altro");

  // Né due volte la stessa mano: falserebbe il confronto.
  const { error: e4 } = await a.client.from("risultati_mano")
    .insert({ mano_id: manoId, user_id: a.id, contratto: "6♠", punteggio: 980, stelle: 3 });
  e4 ? ok("una mano si dichiara una volta sola") : no("ha rigiocato la stessa mano");

  // ...e poi non torna più: rifarla falserebbe il confronto, perché le carte
  // avversarie ormai le conosci.
  const { data: ripescata } = await a.client.rpc("mano_da_fare", { p_slug: slug });
  ripescata === null ? ok("una mano già fatta non torna più") : no("ha ripescato una mano già fatta");

  // Il confronto col campo.
  const { data: conf } = await a.client.rpc("confronto_campo", { p_mano_id: manoId });
  conf?.totale === 2 ? ok("il campo conta due risultati") : no(`totale: ${conf?.totale}`);
  conf?.mio?.contratto === "4♠" ? ok("riconosce il proprio risultato") : no("il proprio risultato non torna");
  conf?.percentile === 100 ? ok("percentile: meglio del 100% del campo") : no(`percentile: ${conf?.percentile}`);
  Array.isArray(conf?.contratti) && conf.contratti.length === 2
    ? ok("mostra la distribuzione dei contratti") : no("distribuzione mancante");
  JSON.stringify(conf).includes(a.id) || JSON.stringify(conf).includes("display_name")
    ? no("il confronto espone identità") : ok("il confronto NON espone chi ha dichiarato cosa");

  // ── Il confronto ristretto a un gruppo ───────────────────────────────────
  const { data: soloAmici } = await a.client.rpc("confronto_campo_filtrato", {
    p_mano_id: manoId, p_filtro: "amici",
  });
  soloAmici?.totale === 1
    ? ok("senza amici il confronto «amici» conta solo te")
    : no(`filtro amici: ${soloAmici?.totale} risultati invece di 1`);

  await admin.from("friendships").insert({ user_id: a.id, friend_id: b.id, status: "accepted" });
  const { data: conAmico } = await a.client.rpc("confronto_campo_filtrato", {
    p_mano_id: manoId, p_filtro: "amici",
  });
  conAmico?.totale === 2
    ? ok("diventati amici, il confronto lo comprende") : no(`filtro amici: ${conAmico?.totale}`);
  conAmico?.persone?.length === 1 && conAmico.persone[0].contratto === "2♠"
    ? ok("fra amici i nomi si vedono, ed è il senso della cosa")
    : no(`i nomi degli amici non arrivano: ${JSON.stringify(conAmico?.persone)}`);

  const { data: tutti } = await a.client.rpc("confronto_campo_filtrato", {
    p_mano_id: manoId, p_filtro: "tutti",
  });
  tutti?.totale === 2 && tutti?.persone === null
    ? ok("col campo intero escono i numeri, mai i nomi")
    : no(`filtro tutti: totale ${tutti?.totale}, persone ${JSON.stringify(tutti?.persone)}`);

  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: filtroAnon } = await anon.rpc("confronto_campo_filtrato", {
    p_mano_id: manoId, p_filtro: "tutti",
  });
  filtroAnon === null ? ok("un anonimo non vede nemmeno il confronto filtrato")
                      : no("un anonimo vede il confronto filtrato");

  const { data: cAnon } = await anon.rpc("confronto_campo", { p_mano_id: manoId });
  cAnon === null ? ok("un anonimo non vede il confronto") : no("un anonimo vede il confronto");
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  if (scenarioId) await admin.from("scenari").delete().eq("id", scenarioId);
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\nMANI CONDIVISE E CONFRONTO COL CAMPO: FUNZIONANO.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
