/**
 * Quanto regge l'aula con quaranta tavoli e centosessanta persone.
 *
 * PERCHÉ QUESTO E NON «160 BROWSER». Chi ha scritto l'aula ha misurato la
 * distribuzione — 40 tavoli in 3 ms — e ha annotato onestamente di NON aver
 * misurato centosessanta browser veri insieme. Quella prova qui non si può
 * fare; quella che si può fare è la parte che in una sala cede per prima.
 *
 * E LA PARTE CHE CEDE PER PRIMA NON SONO LE CONNESSIONI. Ogni tavolo aperto in
 * un browser, a OGNI aggiornamento, richiama la lettura del tavolo — e in più
 * la richiama da solo ogni cinque secondi. Quindi centosessanta persone sono
 * trentadue letture al secondo a vuoto, più una raffica di centosessanta ogni
 * volta che l'insegnante distribuisce una mano.
 *
 * Si misurano quelle due cose: la raffica e il regime.
 */
import https from "node:https";
import dns from "node:dns/promises";

const URL_BASE = process.argv[2];
const KEY = process.argv[3];
const TAVOLO = process.argv[4];
const HOST = new URL(URL_BASE).hostname;

/**
 * IL NOME SI RISOLVE UNA VOLTA SOLA, e questa riga è già un risultato: al primo
 * tentativo, centosessanta `fetch` insieme hanno fatto cedere il resolver DNS
 * della macchina con `ENOTFOUND` — un limite LOCALE, non del server, che senza
 * accorgersene si sarebbe scambiato per «il server non regge». Un browser vero
 * non ha questo problema: risolve una volta e tiene la connessione aperta.
 */
const risolti = await dns.lookup(HOST, { all: true });
const agente = new https.Agent({
  keepAlive: true,
  maxSockets: 256,
  // `all` cambia la forma di quello che il chiamante si aspetta: senza
  // rispettarla, Node rifiuta l'indirizzo con `ERR_INVALID_IP_ADDRESS`.
  lookup: (_h, opzioni, cb) =>
    opzioni?.all ? cb(null, risolti) : cb(null, risolti[0].address, risolti[0].family),
});
console.log(`${HOST} → ${risolti.map((r) => r.address).join(", ")}\n`);

function letturaSingola() {
  return new Promise((risolvi) => {
    const t0 = performance.now();
    const corpo = JSON.stringify({ p_table_id: TAVOLO });
    const req = https.request(
      {
        host: HOST, servername: HOST, path: "/rest/v1/rpc/carico_prova_lettura",
        method: "POST", agent: agente,
        headers: {
          apikey: KEY, Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json", "Content-Length": Buffer.byteLength(corpo),
        },
      },
      (res) => {
        res.resume();
        res.on("end", () => risolvi({ ok: res.statusCode < 400, stato: res.statusCode, ms: performance.now() - t0 }));
      },
    );
    req.on("error", (e) => risolvi({ ok: false, stato: e.code ?? "errore", ms: performance.now() - t0 }));
    req.end(corpo);
  });
}

function statistiche(tempi) {
  const s = [...tempi].sort((a, b) => a - b);
  const q = (p) => Math.round(s[Math.min(s.length - 1, Math.floor(s.length * p))]);
  return { p50: q(0.5), p95: q(0.95), max: Math.round(s[s.length - 1]) };
}

async function raffica(n) {
  const t0 = performance.now();
  const esiti = await Promise.all(Array.from({ length: n }, letturaSingola));
  const totale = performance.now() - t0;
  const errori = esiti.filter((e) => !e.ok);
  const st = statistiche(esiti.map((e) => e.ms));
  console.log(
    `raffica di ${String(n).padStart(3)}  ` +
    `tutte in ${Math.round(totale)} ms  ·  singola p50 ${st.p50} ms, p95 ${st.p95}, max ${st.max}` +
    (errori.length ? `  ·  ERRORI ${errori.length} (${[...new Set(errori.map((e) => e.stato))].join(",")})` : "  ·  nessun errore")
  );
  return errori.length === 0;
}

async function regime(perSecondo, secondi) {
  const tempi = [];
  let errori = 0;
  const t0 = performance.now();
  for (let s = 0; s < secondi; s++) {
    const inizio = performance.now();
    const esiti = await Promise.all(Array.from({ length: perSecondo }, letturaSingola));
    for (const e of esiti) { tempi.push(e.ms); if (!e.ok) errori++; }
    const resta = 1000 - (performance.now() - inizio);
    if (resta > 0) await new Promise((r) => setTimeout(r, resta));
  }
  const st = statistiche(tempi);
  console.log(
    `regime ${perSecondo}/s per ${secondi}s  ·  ${tempi.length} letture  ·  ` +
    `p50 ${st.p50} ms, p95 ${st.p95}, max ${st.max}  ·  ` +
    (errori ? `ERRORI ${errori}` : "nessun errore") +
    `  ·  durata reale ${Math.round((performance.now() - t0) / 1000)}s`
  );
  return errori === 0;
}

console.log("— la raffica: l'insegnante distribuisce, tutti rileggono insieme —");
for (const n of [10, 40, 80, 160]) {
  if (!(await raffica(n))) { console.log("  interrotto: errori"); break; }
}
console.log("\n— il regime: nessuno tocca niente, il polling va da solo —");
await regime(32, 30);
console.log("\n— il caso peggiore: raffica DURANTE il regime —");
await Promise.all([regime(32, 10), (async () => {
  await new Promise((r) => setTimeout(r, 3000));
  await raffica(160);
})()]);
