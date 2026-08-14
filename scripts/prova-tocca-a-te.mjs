/**
 * Prova del richiamo «tocca a te».
 *
 *   node scripts/prova-tocca-a-te.mjs
 *
 * Le cose che devono essere vere:
 *  · una licita che aspetta TE da più di dodici ore ti mette in lista;
 *  · una che aspetta il compagno no;
 *  · l'orologio riparte da solo quando qualcuno dichiara (il trigger);
 *  · la lista non esce da service_role, perché contiene indirizzi email.
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

const SEMI = ["spade", "heart", "diamond", "club"];
const RANGHI = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const mazzo = SEMI.flatMap((suit) => RANGHI.map((rank) => ({ suit, rank })));
const hands = {
  north: mazzo.slice(0, 13), east: mazzo.slice(13, 26),
  south: mazzo.slice(26, 39), west: mazzo.slice(39, 52),
};

async function utente(pre) {
  const email = `${pre}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@bridgelab-test.invalid`;
  const password = `Tt!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, email, client: c };
}

const creati = [];
let sessione;
try {
  const sud = await utente("ttS"); creati.push(sud.id);
  const nord = await utente("ttN"); creati.push(nord.id);

  // Mazziere Sud: senza dichiarazioni, il turno è suo.
  const { data: s, error: eS } = await admin
    .from("bidding_sessions")
    .insert({ south_id: sud.id, north_id: nord.id, hands, dealer: "south" })
    .select("id, last_bid_at").single();
  if (eS) throw new Error("sessione non creata: " + eS.message);
  sessione = s.id;

  // Appena creata non aspetta da nessuna parte.
  const { data: subito } = await admin.rpc("licite_in_attesa", { p_user: sud.id, p_ore: 12 });
  subito === 0 ? ok("una licita appena aperta non è «in attesa»") : no(`subito in attesa: ${subito}`);

  // La si fa invecchiare.
  await admin.from("bidding_sessions")
    .update({ last_bid_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString() })
    .eq("id", sessione);

  const { data: perSud } = await admin.rpc("licite_in_attesa", { p_user: sud.id, p_ore: 12 });
  perSud === 1 ? ok("dopo venti ore la licita aspetta Sud") : no(`per Sud: ${perSud}`);

  const { data: perNord } = await admin.rpc("licite_in_attesa", { p_user: nord.id, p_ore: 12 });
  perNord === 0 ? ok("e NON aspetta Nord: non è il suo turno") : no(`per Nord: ${perNord}`);

  // Il cron la vede, e con la priorità giusta.
  const { data: bersagli } = await admin.rpc("get_engagement_targets", { p_limit: 500 });
  const riga = (bersagli ?? []).find((b) => b.user_id === sud.id);
  riga?.kind === "turno_licita"
    ? ok("il cron sceglie «tocca a te» per Sud") : no(`il cron ha scelto: ${riga?.kind ?? "niente"}`);
  riga?.ctx?.licite_ferme === 1
    ? ok("e sa che di licita ferma ce n'è una") : no(`conteggio: ${riga?.ctx?.licite_ferme}`);
  (bersagli ?? []).find((b) => b.user_id === nord.id)
    ? no("il cron scrive anche a Nord, che non deve fare niente")
    : ok("a Nord non scrive nessuno");

  // Chi non ha dato il consenso al marketing riceve lo stesso questa: è una
  // email di servizio su una partita che ha aperto lui.
  const { data: prof } = await admin.from("profiles")
    .select("marketing_consent").eq("id", sud.id).single();
  prof?.marketing_consent === true
    ? no("l'utente di prova ha il consenso: la prova non dimostra niente")
    : ok("vale anche senza consenso al marketing, perché è transazionale");

  // Il trigger: appena qualcuno dichiara, l'orologio riparte.
  const { data: mossa } = await sud.client.rpc("bidding_session_bid", { p_id: sessione, p_bid: "P" });
  mossa?.ok === true ? ok("Sud dichiara") : no(`dichiarazione rifiutata: ${mossa?.errore}`);
  const { data: dopo } = await admin.from("bidding_sessions")
    .select("last_bid_at").eq("id", sessione).single();
  Date.now() - new Date(dopo.last_bid_at).getTime() < 60_000
    ? ok("il trigger ha rimesso l'orologio a zero")
    : no(`last_bid_at non aggiornato: ${dopo.last_bid_at}`);

  // Dopo Sud tocca a Ovest, che è un avversario: la licita è ferma su un robot
  // e non riparte da sola. Il richiamo va comunque a chi parlerà per primo dopo
  // di lui — cioè Nord.
  const { data: fermaSuRobot } = await admin.rpc("licite_in_attesa", { p_user: nord.id, p_ore: 0 });
  fermaSuRobot === 1
    ? ok("ferma sul turno di un avversario, il richiamo va a chi parla dopo")
    : no(`con il turno all'avversario, per Nord: ${fermaSuRobot}`);
  const { data: nonASud } = await admin.rpc("licite_in_attesa", { p_user: sud.id, p_ore: 0 });
  nonASud === 0 ? ok("e non va a Sud, che ha appena dichiarato") : no(`per Sud: ${nonASud}`);

  // Gli indirizzi email non escono da lì.
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: eAnon } = await anon.rpc("get_engagement_targets", { p_limit: 5 });
  eAnon ? ok("la lista con le email resta al service_role") : no("un anonimo legge la lista delle email");
  const { error: eUt } = await sud.client.rpc("get_engagement_targets", { p_limit: 5 });
  eUt ? ok("nemmeno un utente autenticato la legge") : no("un utente qualunque legge la lista delle email");
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  if (sessione) await admin.from("bidding_sessions").delete().eq("id", sessione);
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\n«TOCCA A TE»: FUNZIONA.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
