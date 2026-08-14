// Prova END-TO-END del tavolo condiviso, con due utenti veri.
//
//   node scripts/prova-tavolo.mjs
//
// PERCHÉ ESISTE
// I test unitari coprono la logica di turno, e test:rls copre i permessi.
// Nessuno dei due dice se il giro COMPLETO funziona: l'insegnante apre, il
// posto viene assegnato, l'allievo gioca, la carta compare dall'altra parte.
// È la domanda che un insegnante fa davvero — «ma si gioca?» — e finché non
// la si verifica la risposta onesta è «non lo so».
//
// Crea due utenti usa-e-getta e una classe, e cancella tutto alla fine.
// Non simula il browser: usa le stesse identiche chiamate che fa il browser.
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

// Una smazzata qualsiasi, 13 carte a testa.
const SEMI = ["spade", "heart", "diamond", "club"];
const RANGHI = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const mazzo = SEMI.flatMap((suit) => RANGHI.map((rank) => ({ suit, rank })));
const hands = {
  north: mazzo.slice(0, 13), east: mazzo.slice(13, 26),
  south: mazzo.slice(26, 39), west: mazzo.slice(39, 52),
};

async function utente(prefisso, ruolo) {
  const email = `${prefisso}-${Date.now()}-${Math.random().toString(36).slice(2,6)}@bridgelab-test.invalid`;
  const password = `Tv!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  if (ruolo) await admin.from("profiles").update({ role: ruolo }).eq("id", data.user.id);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client: c };
}

const creati = [];
try {
  const prof = await utente("ist", "instructor"); creati.push(prof.id);
  const allievo = await utente("all", null);      creati.push(allievo.id);

  const { data: classe, error: eC } = await prof.client
    .from("classes").insert({ instructor_id: prof.id, name: "Prova tavolo" }).select("id").single();
  if (eC) throw new Error("classe: " + eC.message);
  await admin.from("class_members").insert({ class_id: classe.id, student_id: allievo.id, status: "active" });

  // 1. L'insegnante apre il tavolo
  const { data: tavolo, error: eT } = await prof.client.from("live_tables").insert({
    class_id: classe.id, instructor_id: prof.id, hands,
    contract: "3SA", declarer: "south", titolo: "Prova",
  }).select("id").single();
  if (eT) throw new Error("tavolo: " + eT.message);
  ok("l'insegnante apre il tavolo");

  // 2. L'allievo lo trova
  const { data: aperto } = await allievo.client.rpc("live_table_open", { p_class_id: classe.id });
  aperto === tavolo.id ? ok("l'allievo trova il tavolo aperto") : no("l'allievo NON trova il tavolo");

  // 3. Prima di avere un posto, non vede mani
  const { data: v0 } = await allievo.client.rpc("live_table_view", { p_table_id: tavolo.id });
  Object.keys(v0?.hands ?? {}).length === 0
    ? ok("senza posto non vede nessuna mano") : no(`senza posto vede ${Object.keys(v0.hands)} `);

  // 4. L'insegnante gli assegna Ovest (che attacca: dichiara Sud)
  await prof.client.from("live_tables").update({ seat_of: { [allievo.id]: "west" } }).eq("id", tavolo.id);
  const { data: v1 } = await allievo.client.rpc("live_table_view", { p_table_id: tavolo.id });
  const viste = Object.keys(v1?.hands ?? {});
  viste.length === 1 && viste[0] === "west"
    ? ok("con il posto vede SOLO la propria mano") : no(`vede ${JSON.stringify(viste)}`);
  v1?.seat === "west" ? ok("il tavolo gli dice che è Ovest") : no("posto non comunicato");

  // 5. Gioca una carta SUA
  const mia = v1.hands.west[0];
  const { data: p1 } = await allievo.client.rpc("live_table_play", {
    p_table_id: tavolo.id, p_seat: null, p_card: mia });
  p1?.ok === true ? ok(`l'allievo gioca ${mia.rank} di ${mia.suit}`) : no(`gioco rifiutato: ${p1?.errore}`);

  // 6. La carta è visibile a tutti
  const { data: v2 } = await prof.client.rpc("live_table_view", { p_table_id: tavolo.id });
  v2?.played?.length === 1 && v2.played[0].seat === "west"
    ? ok("l'insegnante vede la carta comparire") : no("la carta non arriva all'insegnante");
  const restaOvest = v2.hands.west.length;
  restaOvest === 12 ? ok("la carta esce dalla mano (13 → 12)") : no(`in mano restano ${restaOvest}`);

  // 7. NON deve poter giocare una carta di un altro
  const altrui = hands.north[0];
  const { data: p2 } = await allievo.client.rpc("live_table_play", {
    p_table_id: tavolo.id, p_seat: "north", p_card: altrui });
  p2?.ok !== true ? ok("non può giocare la carta di un altro posto") : no("HA GIOCATO LA CARTA DI UN ALTRO");

  // 8. Né rigiocare la stessa
  const { data: p3 } = await allievo.client.rpc("live_table_play", {
    p_table_id: tavolo.id, p_seat: null, p_card: mia });
  p3?.ok !== true ? ok("non può rigiocare una carta già uscita") : no("ha rigiocato la stessa carta");

  // 9. L'insegnante gioca al posto di Nord
  const { data: p4 } = await prof.client.rpc("live_table_play", {
    p_table_id: tavolo.id, p_seat: "north", p_card: hands.north[0] });
  p4?.ok === true ? ok("l'insegnante gioca per un allievo fermo") : no(`rifiutato: ${p4?.errore}`);

  // 10. L'insegnante annulla, l'allievo no
  const { data: u1 } = await allievo.client.rpc("live_table_undo", { p_table_id: tavolo.id });
  u1 !== true ? ok("l'allievo non può annullare") : no("l'allievo ha annullato");
  const { data: u2 } = await prof.client.rpc("live_table_undo", { p_table_id: tavolo.id });
  const { data: v3 } = await prof.client.rpc("live_table_view", { p_table_id: tavolo.id });
  u2 === true && v3.played.length === 1
    ? ok("l'insegnante annulla l'ultima carta") : no(`annullo non riuscito (${v3?.played?.length})`);

  await admin.from("classes").delete().eq("id", classe.id);
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\nIL TAVOLO GIOCA.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
