// Prova END-TO-END della licita fra due amici, con avversari BEN.
//
//   node scripts/prova-licita-a-due.mjs
//
// La proprietà che regge tutto: durante la licita nessuno dei due deve vedere
// la mano dell'altro — nemmeno quella del compagno, perché l'esercizio è
// proprio intendersi senza vederla.
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

const SEMI = ["spade", "heart", "diamond", "club"];
const RANGHI = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const mazzo = SEMI.flatMap((suit) => RANGHI.map((rank) => ({ suit, rank })));
const hands = { north: mazzo.slice(0,13), east: mazzo.slice(13,26), south: mazzo.slice(26,39), west: mazzo.slice(39,52) };

async function utente(pre) {
  const email = `${pre}-${Date.now()}-${Math.random().toString(36).slice(2,6)}@bridgelab-test.invalid`;
  const password = `Lc!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client: c };
}

const creati = [];
try {
  const sud = await utente("sud"); creati.push(sud.id);
  const nord = await utente("nord"); creati.push(nord.id);
  const estraneo = await utente("estr"); creati.push(estraneo.id);

  // Prima: senza amicizia non si può invitare nessuno.
  const { data: senzaAmicizia } = await sud.client.rpc("bidding_session_create", {
    p_partner: nord.id, p_hands: hands, p_dealer: "south" });
  senzaAmicizia === null ? ok("non si invita chi non è amico") : no("ha invitato un non-amico");

  await admin.from("friendships").insert({ user_id: sud.id, friend_id: nord.id, status: "accepted" });

  const { data: sessId, error: eS } = await sud.client.rpc("bidding_session_create", {
    p_partner: nord.id, p_hands: hands, p_dealer: "south" });
  if (eS || !sessId) throw new Error("sessione: " + (eS?.message ?? "nessun id"));
  const sess = { id: sessId };
  ok("Sud apre una licita col compagno");

  // Ognuno vede SOLO la propria mano
  const { data: vS } = await sud.client.rpc("bidding_session_view", { p_id: sess.id });
  const { data: vN } = await nord.client.rpc("bidding_session_view", { p_id: sess.id });
  Object.keys(vS.hands).length === 1 && vS.hands.south ? ok("Sud vede solo la mano di Sud") : no(`Sud vede ${Object.keys(vS.hands)}`);
  Object.keys(vN.hands).length === 1 && vN.hands.north ? ok("Nord vede solo la mano di Nord") : no(`Nord vede ${Object.keys(vN.hands)}`);
  vS.turno === "south" ? ok("tocca al mazziere, cioè Sud") : no(`turno: ${vS.turno}`);

  // Un estraneo non vede niente
  const { data: vX } = await estraneo.client.rpc("bidding_session_view", { p_id: sess.id });
  vX === null ? ok("un estraneo non vede la licita") : no("un estraneo vede la sessione");

  // Nord non può dichiarare fuori turno
  const { data: b1 } = await nord.client.rpc("bidding_session_bid", { p_id: sess.id, p_bid: "1♠" });
  b1?.ok !== true ? ok("Nord non può dichiarare quando tocca a Sud") : no("Nord ha dichiarato fuori turno");

  // Sud apre
  const { data: b2 } = await sud.client.rpc("bidding_session_bid", { p_id: sess.id, p_bid: "1♠" });
  b2?.ok === true ? ok("Sud apre 1♠") : no(`apertura rifiutata: ${b2?.errore}`);

  // Ora tocca a Ovest (avversario). Un GIOCATORE non deve poterlo fare: le
  // mani degli avversari le ha solo il server, ed è lui a farle dichiarare.
  const { data: b3no } = await sud.client.rpc("bidding_session_bid", { p_id: sess.id, p_bid: "P" });
  b3no?.ok !== true ? ok("un giocatore NON dichiara per gli avversari") : no("un giocatore ha dichiarato per un avversario");

  // E l'allievo non deve nemmeno poter chiamare la funzione del server.
  const { error: eServer } = await sud.client.rpc("bidding_session_bid_server", { p_id: sess.id, p_bid: "P" });
  eServer ? ok("la funzione del server non è eseguibile da un giocatore") : no("un giocatore ha chiamato la funzione del server");

  // Il server (service_role) fa dichiarare l'avversario, come fa la route.
  const { data: b3 } = await admin.rpc("bidding_session_bid_server", { p_id: sess.id, p_bid: "P" });
  b3?.ok === true ? ok("il server fa passare l'avversario") : no(`avversario rifiutato: ${b3?.errore}`);

  // Adesso tocca a Nord
  const { data: v2 } = await nord.client.rpc("bidding_session_view", { p_id: sess.id });
  v2.turno === "north" ? ok("ora tocca a Nord") : no(`turno: ${v2.turno}`);
  const { data: b4 } = await sud.client.rpc("bidding_session_bid", { p_id: sess.id, p_bid: "4♠" });
  b4?.ok !== true ? ok("Sud non può dichiarare al posto del compagno") : no("SUD HA DICHIARATO PER NORD");

  const { data: b5 } = await nord.client.rpc("bidding_session_bid", { p_id: sess.id, p_bid: "4♠" });
  b5?.ok === true ? ok("Nord alza a 4♠") : no(`rifiutato: ${b5?.errore}`);

  // Tre passi chiudono. Dopo il 4♠ di Nord tocca a Est (avversario, lo fa il
  // server), poi a Sud (giocatore), poi a Ovest (avversario).
  const passi = [
    () => admin.rpc("bidding_session_bid_server", { p_id: sess.id, p_bid: "P" }),
    () => sud.client.rpc("bidding_session_bid", { p_id: sess.id, p_bid: "P" }),
    () => admin.rpc("bidding_session_bid_server", { p_id: sess.id, p_bid: "P" }),
  ];
  for (const passo of passi) {
    const { data: r } = await passo();
    if (r?.ok !== true) no(`passo rifiutato: ${r?.errore}`);
  }

  // E il server non deve poter dichiarare al posto dei due amici.
  const { data: abuso } = await admin.rpc("bidding_session_bid_server", { p_id: sess.id, p_bid: "P" });
  abuso?.ok !== true ? ok("il server non dichiara al posto dei giocatori") : no("il server ha dichiarato per un giocatore");
  const { data: v3 } = await sud.client.rpc("bidding_session_view", { p_id: sess.id });
  v3.chiusa === true ? ok("tre passi chiudono la licita") : no("la licita non si è chiusa");
  Object.keys(v3.hands).length === 4 ? ok("a licita chiusa si vedono tutte le mani") : no("le mani non si aprono a fine licita");

  const { data: elenco } = await sud.client.rpc("my_bidding_sessions");
  Array.isArray(elenco) && elenco.length >= 1 ? ok("la licita compare nel proprio elenco") : no("elenco vuoto");

  await admin.from("bidding_sessions").delete().eq("id", sess.id);
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\nLA LICITA A DUE FUNZIONA.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
