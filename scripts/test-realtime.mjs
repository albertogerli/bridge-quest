// Verifica Supabase Realtime su `friendships` e `challenges`.
//
//   node scripts/test-realtime.mjs        (o: npm run test:realtime)
//
// Sostituisce a mano quello che in produzione fanno use-friends / use-challenges:
// crea TRE utenti usa-e-getta (A destinatario, B mittente, C estraneo) e verifica
//   1. A riceve entro pochi secondi l'INSERT di una richiesta di amicizia di B;
//   2. A riceve entro pochi secondi l'INSERT di una sfida lanciata da B;
//   3. C, sottoscritto SENZA filtro alle stesse tabelle, non riceve nulla —
//      cioè le RLS filtrano davvero il flusso Realtime, non solo le SELECT.
//
// C si sottoscrive senza filtro di proposito: con un filtro lato server non si
// saprebbe se il silenzio viene dalle RLS o dal filtro.
//
// Exit code 1 se una verifica attesa fallisce. Gli utenti di test vengono
// eliminati anche in caso di errore.

import { createClient } from "@supabase/supabase-js";
import { leggiEnv } from "./leggi-env.mjs";
import { assertTestTarget } from "./test-target.mjs";
const env = leggiEnv(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
assertTestTarget(URL_, env.BRIDGELAB_TEST_SUPABASE_URL);

if (!URL_ || !ANON || !SERVICE) {
  console.log("  FAIL .env.local incompleto (servono URL, ANON key e SERVICE ROLE key)");
  process.exit(1);
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

let failures = 0;
const ok = (msg) => console.log(`  OK   ${msg}`);
const fail = (msg) => {
  console.log(`  FAIL ${msg}`);
  failures++;
};
const info = (msg) => console.log(`  ..   ${msg}`);

const SUBSCRIBE_TIMEOUT = 15_000; // handshake WebSocket + join del canale
const EVENT_TIMEOUT = 10_000; // "entro pochi secondi": tetto generoso
const SILENCE_GRACE = 4_000; // margine per dimostrare che l'estraneo NON riceve

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Utente usa-e-getta: creato via service role, loggato con la chiave anon
 *  perché il JWT dell'utente è ciò che le RLS (e il Realtime) valutano. */
async function makeUser(tag) {
  const email = `realtime-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@bridgelab-test.invalid`;
  const password = `Rt!${Math.random().toString(36).slice(2, 14)}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(`creazione utente ${tag}: ${error?.message}`);

  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  // Track immediately: failed login must not leak the already-created user.
  const user = { id: created.user.id, client, tag };
  users.push(user);
  const { data: session, error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw new Error(`login utente ${tag}: ${signInErr.message}`);
  // Va atteso: `setAuth` è asincrona e senza il JWT applicato il socket resta
  // sul ruolo anon, il canale si sottoscrive lo stesso ma le RLS scartano ogni
  // evento — un falso negativo che sembra "il Realtime non funziona".
  await client.realtime.setAuth(session.session.access_token);

  return user;
}

/** Resolve only after BOTH channel join and PostgreSQL CDC readiness.
 * SUBSCRIBED alone can precede the database subscription on a cold start.
 *  `bindings` = [{ table, filter? }]. Restituisce { channel, events, waitFor }. */
async function listen(user, name, bindings) {
  const events = [];
  const lifecycle = [];
  const startedAt = Date.now();
  let channel = user.client.channel(`test-${name}-${Math.random().toString(36).slice(2, 10)}`);
  channel.on("system", {}, (payload) => {
    if (payload?.extension === 'postgres_changes') {
      lifecycle.push({ kind: 'postgres', status: payload.status, ms: Date.now() - startedAt });
    }
  });

  for (const b of bindings) {
    const opts = { event: "*", schema: "public", table: b.table };
    if (b.filter) opts.filter = b.filter;
    channel = channel.on("postgres_changes", opts, (payload) => {
      events.push({ at: Date.now(), table: b.table, type: payload.eventType, row: payload.new, old: payload.old });
    });
  }

  await new Promise((resolve, reject) => {
    let joined = false;
    let databaseReady = false;
    const complete = () => {
      if (joined && databaseReady) { clearTimeout(timer); resolve(); }
    };
    const timer = setTimeout(
      () => reject(new Error(`canale ${name}: join=${joined}, postgres=${databaseReady} entro ${SUBSCRIBE_TIMEOUT} ms`)),
      SUBSCRIBE_TIMEOUT
    );
    channel.on('system', {}, payload => {
      if (payload?.extension !== 'postgres_changes') return;
      if (payload.status === 'ok') { databaseReady = true; complete(); }
      else if (payload.status === 'error') {
        clearTimeout(timer);
        reject(new Error(`canale ${name}: sottoscrizione PostgreSQL rifiutata`));
      }
    });
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        lifecycle.push({ kind: 'channel', status, ms: Date.now() - startedAt });
        joined = true;
        complete();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timer);
        reject(new Error(`canale ${name}: stato ${status}${err ? ` (${err.message})` : ""}`));
      }
    });
  });
  info(JSON.stringify({channel:name,lifecycle}));

  return {
    channel,
    events,
    lifecycle,
    startedAt,
    /** Attende il primo evento che soddisfa `match`; null se scade il tempo. */
    async waitFor(match, timeout = EVENT_TIMEOUT) {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        const hit = events.find(match);
        if (hit) return hit;
        await sleep(100);
      }
      return null;
    },
  };
}

const users = [];
const createdChallengeIds = [];

try {
  console.log("\n[0] Setup — tre utenti di test (A destinatario, B mittente, C estraneo)");
  // Wait for every creation before entering cleanup, even if one fails.
  const setup = await Promise.allSettled([makeUser("a"), makeUser("b"), makeUser("c")]);
  const rejected = setup.find(result => result.status === 'rejected');
  if (rejected) throw rejected.reason;
  const [A, B, C] = setup.map(result => result.value);
  ok("utenti creati e autenticati");

  // -------------------------------------------------------------------------
  // 1. Amicizie
  // -------------------------------------------------------------------------
  console.log("\n[1] Amicizie — A riceve la richiesta di B, C no");

  // Tutti i canali si aprono qui e restano aperti fino al `finally`: chiudere
  // l'ultimo canale di un client fa cadere il socket, e la riapertura a metà
  // run risultava intermittente (TIMED_OUT sul join successivo).
  // Stessi filtri di use-friends.ts
  const listenA = await listen(A, "friends-a", [
    { table: "friendships", filter: `friend_id=eq.${A.id}` },
    { table: "friendships", filter: `user_id=eq.${A.id}` },
  ]);
  // Nessun filtro: solo le RLS possono tenere C all'oscuro
  const listenC = await listen(C, "friends-c", [{ table: "friendships" }]);
  // Stessi filtri di use-challenges.ts
  const chListenA = await listen(A, "challenges-a", [
    { table: "challenges", filter: `opponent_id=eq.${A.id}` },
    { table: "challenges", filter: `challenger_id=eq.${A.id}` },
  ]);
  const chListenC = await listen(C, "challenges-c", [{ table: "challenges" }]);
  ok("canali sottoscritti (A filtrato sul proprio id, C senza filtro)");

  const sentAt = Date.now();
  const { data: friendship, error: friendErr } = await B.client
    .from("friendships")
    .insert({ user_id: B.id, friend_id: A.id, status: "pending" })
    .select("id")
    .single();
  if (friendErr) throw new Error(`insert friendship: ${friendErr.message}`);

  const gotFriend = await listenA.waitFor((e) => e.table === "friendships" && e.row?.id === friendship.id);
  if (gotFriend) {
    ok(`A riceve l'INSERT della richiesta in ${gotFriend.at - sentAt} ms`);
  } else {
    fail(`A NON ha ricevuto l'evento entro ${EVENT_TIMEOUT} ms`);
    info(JSON.stringify({diagnostic:'recipient INSERT',insertMs:sentAt-listenA.startedAt,lifecycle:listenA.lifecycle,received:listenA.events.map(e=>({type:e.type,idType:typeof e.row?.id,idMatches:String(e.row?.id)===String(friendship.id)})),expectedIdType:typeof friendship.id}));
  }

  // Controprova: il canale di C deve essere VIVO, altrimenti "C non riceve
  // nulla" passerebbe anche con una sottoscrizione rotta. C manda una propria
  // richiesta e deve vederla arrivare sullo stesso canale senza filtro.
  const { data: ownFriendship, error: ownErr } = await C.client
    .from("friendships")
    .insert({ user_id: C.id, friend_id: B.id, status: "pending" })
    .select("id")
    .single();
  if (ownErr) throw new Error(`insert friendship di controprova: ${ownErr.message}`);

  const gotOwn = await listenC.waitFor((e) => e.row?.id === ownFriendship.id);
  if (gotOwn) ok("il canale di C è vivo (riceve la propria richiesta)");
  else fail("il canale di C non riceve nemmeno i propri eventi — verifica RLS non attendibile");

  // DELETE — richiede REPLICA IDENTITY FULL sulla tabella: con la replica
  // identity di default il WAL registra solo la chiave primaria, il record
  // `old` non contiene le colonne su cui filtriamo e Realtime scarta l'evento.
  // Prima della migrazione del 2026-08-10 questi eventi non arrivavano mai, e
  // "un amico ti ha rimosso" restava a carico del refresh lento.
  const beforeDelete = Date.now();
  const { error: delErr } = await B.client.from("friendships").delete().eq("id", friendship.id);
  if (delErr) throw new Error(`delete friendship: ${delErr.message}`);

  const gotDelete = await listenA.waitFor(
    (e) => e.type === "DELETE" && e.table === "friendships" && e.old?.id === friendship.id && e.at >= beforeDelete
  );
  if (gotDelete) {
    ok(`A riceve il DELETE della richiesta in ${gotDelete.at - beforeDelete} ms`);
  } else {
    fail("A non riceve il DELETE — REPLICA IDENTITY FULL non è attiva sulla tabella");
  }

  await sleep(SILENCE_GRACE);
  const leakedFriend = listenC.events.filter((e) => e.row?.id === friendship.id);
  if (leakedFriend.length === 0) {
    ok("C (estraneo, senza filtro) non riceve la richiesta A/B — le RLS filtrano il Realtime");
  } else {
    fail(`C ha ricevuto ${leakedFriend.length} eventi sulla richiesta A/B — RLS non applicate al Realtime`);
  }

  // -------------------------------------------------------------------------
  // 2. Sfide
  // -------------------------------------------------------------------------
  console.log("\n[2] Sfide — A riceve la sfida di B, C no");

  const chSentAt = Date.now();
  const { data: challenge, error: chErr } = await B.client
    .from("challenges")
    .insert({
      challenger_id: B.id,
      opponent_id: A.id,
      board_count: 1,
      hands: ["test-seed"],
      status: "pending",
    })
    .select("id")
    .single();
  if (chErr) throw new Error(`insert challenge: ${chErr.message}`);
  createdChallengeIds.push(challenge.id);

  const gotChallenge = await chListenA.waitFor((e) => e.table === "challenges" && e.row?.id === challenge.id);
  if (gotChallenge) {
    ok(`A riceve l'INSERT della sfida in ${gotChallenge.at - chSentAt} ms`);
  } else {
    fail(`A NON ha ricevuto l'evento sfida entro ${EVENT_TIMEOUT} ms`);
  }

  // Bonus: l'UPDATE di stato (B rifiuta/accetta) deve arrivare anche esso, è il
  // caso che in app fa sparire la sfida dal banner senza aspettare il polling.
  const updateAt = Date.now();
  const { error: updErr } = await B.client
    .from("challenges")
    .update({ status: "accepted" })
    .eq("id", challenge.id);
  if (updErr) throw new Error(`update challenge: ${updErr.message}`);

  const gotUpdate = await chListenA.waitFor(
    (e) => e.table === "challenges" && e.row?.id === challenge.id && e.type === "UPDATE"
  );
  if (gotUpdate) {
    ok(`A riceve anche l'UPDATE di stato in ${gotUpdate.at - updateAt} ms`);
  } else {
    fail(`A NON ha ricevuto l'UPDATE di stato entro ${EVENT_TIMEOUT} ms`);
  }

  // Controprova di canale vivo, come per le amicizie.
  const { data: ownChallenge, error: ownChErr } = await C.client
    .from("challenges")
    .insert({
      challenger_id: C.id,
      opponent_id: B.id,
      board_count: 1,
      hands: ["test-seed"],
      status: "pending",
    })
    .select("id")
    .single();
  if (ownChErr) throw new Error(`insert challenge di controprova: ${ownChErr.message}`);
  createdChallengeIds.push(ownChallenge.id);

  const gotOwnCh = await chListenC.waitFor((e) => e.row?.id === ownChallenge.id);
  if (gotOwnCh) ok("il canale di C è vivo (riceve la propria sfida)");
  else fail("il canale di C non riceve nemmeno i propri eventi — verifica RLS non attendibile");

  await sleep(SILENCE_GRACE);
  const leakedChallenge = chListenC.events.filter((e) => e.row?.id === challenge.id);
  if (leakedChallenge.length === 0) {
    ok("C (estraneo, senza filtro) non riceve la sfida A/B");
  } else {
    fail(`C ha ricevuto ${leakedChallenge.length} eventi sulla sfida A/B — RLS non applicate al Realtime`);
  }
} catch (e) {
  fail(`verifica non eseguita: ${e.message}`);
} finally {
  for (const id of createdChallengeIds) {
    await admin.from("challenges").delete().eq("id", id);
  }
  for (const u of users) {
    await admin.from("friendships").delete().or(`user_id.eq.${u.id},friend_id.eq.${u.id}`);
  }
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) fail(`pulizia utente sintetico ${u.tag} fallita (${error.message})`);
    try {
      await u.client.removeAllChannels();
      u.client.realtime.disconnect();
    } catch {
      // il socket può essere già chiuso: irrilevante per l'esito
    }
  }
  if (users.length) info("pulizia degli utenti sintetici eseguita; eventuali fallimenti segnalati sopra");
}

console.log(
  failures === 0
    ? "\nRealtime verificato: eventi consegnati agli interessati, RLS rispettate.\n"
    : `\n${failures} verifiche Realtime FALLITE.\n`
);
process.exit(failures ? 1 : 0);
