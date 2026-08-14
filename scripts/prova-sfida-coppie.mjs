/**
 * Prova della sfida 2 contro 2, con quattro utenti veri.
 *
 *   node scripts/prova-sfida-coppie.mjs
 *
 * Le cose che devono essere vere perché la sfida significhi qualcosa:
 *  · le due coppie ricevono LE STESSE smazzate;
 *  · nessuno vede cosa ha dichiarato l'altra coppia prima di aver finito;
 *  · il punteggio lo calcola il server dalle dichiarazioni, non il browser;
 *  · un estraneo non vede niente.
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
  const password = `Sf!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client: c };
}

/**
 * Porta la licita alla chiusura: il giocatore di turno dichiara quello che gli
 * si dice, gli avversari passano come farebbe il server.
 */
async function licita(sessione, sud, nord, dichiarazioni) {
  // Le dichiarazioni si consumano SOLO quando tocca a Sud: il mazziere è
  // quello della mano, non sempre Sud, e consumarle a ogni giro le farebbe
  // sparire nei turni degli avversari — con l'asta che finisce a passi.
  const coda = [...dichiarazioni];
  for (let i = 0; i < 16; i++) {
    const { data: v } = await sud.client.rpc("bidding_session_view", { p_id: sessione });
    if (v?.chiusa) return true;
    const t = v?.turno;
    if (t === "south") {
      await sud.client.rpc("bidding_session_bid", { p_id: sessione, p_bid: coda.shift() ?? "P" });
    } else if (t === "north") {
      await nord.client.rpc("bidding_session_bid", { p_id: sessione, p_bid: "P" });
    } else {
      await admin.rpc("bidding_session_bid_server", { p_id: sessione, p_bid: "P" });
    }
  }
  return false;
}

const creati = [];
let sfidaId;
try {
  const { count } = await admin
    .from("mani_generate").select("id", { count: "exact", head: true });
  if (!count) { no("scorta vuota: prima si genera, poi si sfida"); throw new Error("scorta vuota"); }

  const a1 = await utente("sfa1"); creati.push(a1.id);
  const a2 = await utente("sfa2"); creati.push(a2.id);
  const b1 = await utente("sfb1"); creati.push(b1.id);
  const b2 = await utente("sfb2"); creati.push(b2.id);
  const estraneo = await utente("sfx"); creati.push(estraneo.id);

  // Senza amicizia col compagno non si crea la sfida.
  const { data: senzaAmico } = await a1.client.rpc("sfida_coppie_crea", {
    p_compagno: a2.id, p_b1: b1.id, p_b2: b2.id, p_quante: 2,
  });
  senzaAmico === null ? ok("senza amicizia col compagno non si parte") : no("ha creato la sfida senza amicizia");

  await admin.from("friendships").insert([
    { user_id: a1.id, friend_id: a2.id, status: "accepted" },
    { user_id: b1.id, friend_id: b2.id, status: "accepted" },
  ]);

  // Quattro persone diverse: non ci si sfida da soli.
  const { data: seStesso } = await a1.client.rpc("sfida_coppie_crea", {
    p_compagno: a2.id, p_b1: a1.id, p_b2: b2.id, p_quante: 2,
  });
  seStesso === null ? ok("non si può essere avversario di sé stessi") : no("sfida con un doppione accettata");

  const { data: id } = await a1.client.rpc("sfida_coppie_crea", {
    p_compagno: a2.id, p_b1: b1.id, p_b2: b2.id, p_quante: 2,
  });
  sfidaId = id;
  id ? ok("la sfida nasce") : no("sfida non creata");

  const { data: vistaA } = await a1.client.rpc("sfida_coppie_vista", { p_id: sfidaId });
  const { data: vistaB } = await b1.client.rpc("sfida_coppie_vista", { p_id: sfidaId });
  vistaA?.miaCoppia === "A" && vistaB?.miaCoppia === "B"
    ? ok("ognuno sa in che coppia sta") : no("le coppie non tornano");
  vistaA?.board?.length === 2 ? ok("due board a testa") : no(`board: ${vistaA?.board?.length}`);

  const maniA = vistaA.board.map((b) => b.manoId).sort();
  const maniB = vistaB.board.map((b) => b.manoId).sort();
  JSON.stringify(maniA) === JSON.stringify(maniB)
    ? ok("LE STESSE SMAZZATE per tutte e due le coppie")
    : no("le due coppie hanno smazzate diverse");
  vistaA.board[0].sessioneId !== vistaB.board[0].sessioneId
    ? ok("ma licite separate") : no("le due coppie condividono la licita");

  const { data: cheCiFaccio } = await estraneo.client.rpc("sfida_coppie_vista", { p_id: sfidaId });
  cheCiFaccio === null ? ok("un estraneo non vede la sfida") : no("un estraneo vede la sfida");

  // La coppia A dichiara la prima board.
  const b0 = vistaA.board[0];
  const chiusa = await licita(b0.sessioneId, a1, a2, ["1♠"]);
  chiusa ? ok("la coppia A chiude la licita") : no("la licita di A non si chiude");

  // Un estraneo non può nemmeno chiudere la board.
  const { data: abuso } = await estraneo.client.rpc("sfida_board_chiudi", { p_sessione: b0.sessioneId });
  abuso?.ok === false ? ok("un estraneo non chiude la board") : no("un estraneo ha chiuso la board");

  const { data: esito } = await a1.client.rpc("sfida_board_chiudi", { p_sessione: b0.sessioneId });
  esito?.ok === true && Number.isInteger(esito.punteggio)
    ? ok(`il server calcola il punteggio: ${esito.contratto} da ${esito.dichiarante}, ${esito.prese} prese, ${esito.punteggio}`)
    : no(`punteggio non calcolato: ${JSON.stringify(esito)}`);

  // Il numero è quello vero: si ricontrolla dalla tabella double dummy.
  const { data: riga } = await admin
    .from("sfida_board").select("prese, punteggio, dichiarante, contratto")
    .eq("sessione_id", b0.sessioneId).single();
  const { data: mano } = await admin
    .from("mani_generate").select("dd_table, vulnerability").eq("id", b0.manoId).single();
  const den = { "♣": "club", "♦": "diamond", "♥": "heart", "♠": "spade" }[riga.contratto?.slice(1, 2)] ?? "notrump";
  riga.prese === mano.dd_table[den][riga.dichiarante]
    ? ok("le prese vengono dalla tabella double dummy, non dal client")
    : no(`prese ${riga.prese} contro ${mano.dd_table[den][riga.dichiarante]} della tabella`);

  // Finché B non ha finito, A non vede il suo risultato.
  const { data: dopo } = await a1.client.rpc("sfida_coppie_vista", { p_id: sfidaId });
  const board0 = dopo.board.find((b) => b.numero === b0.numero);
  board0.chiusa === true ? ok("la board risulta chiusa per A") : no("board non chiusa");
  board0.altroPunteggio === null && board0.altraChiusa === false
    ? ok("il risultato dell'altra coppia non si vede: non ha ancora dichiarato")
    : no("si vede il risultato di una coppia che non ha finito");

  // B dichiara la stessa mano, e ora il confronto c'è.
  const b0b = vistaB.board.find((b) => b.manoId === b0.manoId);
  await licita(b0b.sessioneId, b1, b2, ["1♠"]);
  await b1.client.rpc("sfida_board_chiudi", { p_sessione: b0b.sessioneId });

  const { data: finale } = await a1.client.rpc("sfida_coppie_vista", { p_id: sfidaId });
  const bf = finale.board.find((b) => b.numero === b0.numero);
  bf.altroPunteggio !== null && bf.altraChiusa === true
    ? ok("a board finita da entrambe, il confronto compare")
    : no("il confronto non compare nemmeno a board finita");

  // Le due coppie hanno dichiarato la stessa cosa sulla stessa mano.
  bf.punteggio === bf.altroPunteggio
    ? ok("stessa licita, stesso punteggio: il conto è deterministico")
    : no(`punteggi diversi a parità di contratto: ${bf.punteggio} contro ${bf.altroPunteggio}`);

  const { data: elenco } = await a1.client.rpc("mie_sfide_coppie");
  Array.isArray(elenco) && elenco[0]?.daFare === 1 && elenco[0]?.totale === 2
    ? ok("l'elenco dice quante board restano") : no(`elenco sbagliato: ${JSON.stringify(elenco)}`);

  // ── Le statistiche ────────────────────────────────────────────────────────
  // A metà sfida non c'è ancora nessun incontro concluso: contarlo fra le
  // sconfitte di chi non ha finito sarebbe sbagliato e pure irritante.
  const { data: primaDi } = await a1.client.rpc("mie_statistiche_sfide");
  primaDi?.incontri === 0
    ? ok("una sfida a metà non conta né come vittoria né come sconfitta")
    : no(`incontri contati troppo presto: ${primaDi?.incontri}`);

  // Si finisce la seconda board da entrambe le parti, con contratti diversi:
  // A dichiara manche, B resta al parziale.
  const b1a = vistaA.board[1];
  const b1b = vistaB.board.find((b) => b.manoId === b1a.manoId);
  await licita(b1a.sessioneId, a1, a2, ["4♠"]);
  await a1.client.rpc("sfida_board_chiudi", { p_sessione: b1a.sessioneId });
  await licita(b1b.sessioneId, b1, b2, ["1♠"]);
  await b1.client.rpc("sfida_board_chiudi", { p_sessione: b1b.sessioneId });

  const { data: statA } = await a1.client.rpc("mie_statistiche_sfide");
  const { data: statB } = await b1.client.rpc("mie_statistiche_sfide");
  statA?.incontri === 1 && statB?.incontri === 1
    ? ok("a sfida finita l'incontro si conta") : no(`incontri: ${statA?.incontri}`);
  statA.vinti + statA.persi + statA.pari === 1
    ? ok("l'incontro è vinto, perso o pari: uno solo dei tre")
    : no(`esiti incoerenti: ${JSON.stringify(statA)}`);
  statA.vinti === statB.persi && statA.persi === statB.vinti
    ? ok("quello che uno vince l'altro lo perde")
    : no(`le due parti non concordano: ${statA.vinti}-${statA.persi} contro ${statB.vinti}-${statB.persi}`);
  statA.impFatti === statB.impSubiti && statA.impSubiti === statB.impFatti
    ? ok("gli IMP tornano da tutte e due le parti") : no("gli IMP non tornano");

  const comp = statA.perCompagno?.[0];
  comp?.id === a2.id && comp?.incontri === 1
    ? ok("le statistiche per compagno ci sono") : no(`per compagno: ${JSON.stringify(comp)}`);
  const avvs = (statA.perAvversario ?? []).map((x) => x.id).sort();
  JSON.stringify(avvs) === JSON.stringify([b1.id, b2.id].sort())
    ? ok("le statistiche per avversario contano tutti e due") : no(`per avversario: ${JSON.stringify(avvs)}`);

  const { data: statX } = await estraneo.client.rpc("mie_statistiche_sfide");
  statX?.incontri === 0
    ? ok("chi non ha giocato non compare in nessuna statistica")
    : no("un estraneo vede statistiche non sue");
} catch (e) {
  no("prova interrotta: " + e.message);
} finally {
  if (sfidaId) await admin.from("sfide_coppie").delete().eq("id", sfidaId);
  for (const id of creati) await admin.auth.admin.deleteUser(id);
  console.log(ko === 0 ? "\nSFIDA 2 CONTRO 2: FUNZIONA.\n" : `\n${ko} PROVE FALLITE\n`);
  process.exit(ko ? 1 : 0);
}
