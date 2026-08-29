/**
 * La QUALITÀ delle dichiarazioni di BEN, non la velocità.
 *
 *   node scripts/qualita-licita-ben.mjs --raccogli 75.json [--mani 30]
 *   node scripts/qualita-licita-ben.mjs --confronta 200.json 75.json
 *
 * (`BEN_API_URL` e `BEN_API_TOKEN` dall'ambiente, come per
 * `misura-ben-licita.mjs`. Le smazzate arrivano da `.env.local`.)
 *
 * PERCHÉ ESISTE. `sample_hands_auction` è sceso da 200 a 75 per far stare le
 * dichiarazioni difficili entro cinque secondi. Il guadagno di tempo è
 * misurato bene; la qualità no — era stata confrontata su TRE aste, il che
 * dice quasi niente. Un motore che risponde in fretta e dichiara peggio è un
 * peggioramento travestito da miglioramento, e non si vedrebbe da nessun
 * grafico di latenza.
 *
 * COME MISURA. Prende smazzate vere dal catalogo — mani costruite per
 * insegnare, quindi ricche di aperture, competizione, manche e slam — e fa
 * dichiarare a BEN TUTTI E QUATTRO i posti, dichiarazione dopo dichiarazione,
 * fino a fine asta. Di ogni mano registra l'asta intera e il contratto finale.
 *
 * Il confronto guarda tre cose, in ordine di gravità:
 *   1. il CONTRATTO FINALE cambia? È l'unica che l'allievo vede davvero.
 *   2. l'asta differisce in qualche dichiarazione, pur finendo uguale?
 *      Conta meno: strade diverse, stesso posto.
 *   3. il livello finale sale o scende? Un contratto più basso su una mano da
 *      manche è un errore più grave del contrario.
 *
 * NON DECIDE DA SOLO. Se i contratti finali cambiano su poche mani, quelle
 * vanno guardate da chi sa giocare: può darsi che il contratto nuovo sia
 * migliore. Il programma dice DOVE guardare, non chi ha ragione.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const url = (process.env.BEN_API_URL || "").replace(/\/$/, "");
const token = process.env.BEN_API_TOKEN || "";

const argv = process.argv;
const iRaccogli = argv.indexOf("--raccogli");
const iConfronta = argv.indexOf("--confronta");
const iMani = argv.indexOf("--mani");
const QUANTE = iMani > -1 ? Number(argv[iMani + 1]) : 30;

const ORDINE = ["N", "E", "S", "W"];
const SEATS = { north: "N", east: "E", south: "S", west: "W" };
/**
 * La vulnerabilità nella forma che vuole BEN.
 *
 * Veniva letta dal database e poi ignorata: a BEN andava sempre `None`. Non è
 * un dettaglio — in zona si dichiara diversamente, si rischia meno sulle
 * manche incerte e si contra di più — quindi un banco che la azzera misura
 * BEN in una situazione che nel torneo non capita quasi mai.
 */
const VULNERABILITA = {
  none: "None", nessuno: "None", "": "None",
  all: "Both", both: "Both", entrambi: "Both", tutti: "Both",
  ns: "N-S", "n-s": "N-S", "nord-sud": "N-S",
  ew: "E-W", "e-w": "E-W", "est-ovest": "E-W",
};
function vulBen(v) {
  return VULNERABILITA[String(v ?? "").trim().toLowerCase()] ?? "None";
}
const RANGHI = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

/** Da carte dell'app a mano PBN, come vuole BEN. */
function manoPbn(carte) {
  return ["spade", "heart", "diamond", "club"]
    .map((s) =>
      (carte || [])
        .filter((c) => c.suit === s)
        .sort((a, b) => RANGHI.indexOf(a.rank) - RANGHI.indexOf(b.rank))
        .map((c) => (c.rank === "10" ? "T" : c.rank))
        .join(""),
    )
    .join(".");
}

/** Da "1S"/"PASS"/"X" al codice a due caratteri che BEN si aspetta in `ctx`. */
function codice(bid) {
  const b = String(bid).trim().toUpperCase();
  if (b === "PASS" || b === "P") return "--";
  if (b === "X" || b === "DBL") return "Db";
  if (b === "XX" || b === "RDBL") return "Rd";
  return b.replace("NT", "N").slice(0, 2);
}

/** Tre passi dopo una dichiarazione, o quattro all'inizio, chiudono l'asta. */
function astaChiusa(bids) {
  const passi = (b) => String(b).toUpperCase().startsWith("P");
  if (bids.length < 4) return false;
  if (bids.every(passi)) return bids.length === 4;
  return bids.slice(-3).every(passi);
}

function contrattoFinale(bids) {
  for (let i = bids.length - 1; i >= 0; i--) {
    const m = String(bids[i]).toUpperCase().match(/^([1-7])(NT|N|S|H|D|C)$/);
    if (m) return `${m[1]}${m[2] === "N" ? "NT" : m[2]}`;
  }
  return "passata";
}

async function chiediBen(hand, seat, dealer, vul, ctx) {
  const q = new URLSearchParams({ hand, seat, dealer, vul, ctx });
  const res = await fetch(`${url}/bid?${q}`, {
    headers: token ? { "X-BEN-Token": token } : {},
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    // IL CORPO SERVE. Con il solo numero, un 400 di BEN («la mano non ha 13
    // carte») e un rifiuto della guardia diventano lo stesso messaggio, e si
    // finisce a indovinare — è già successo tre volte su questa catena.
    const corpo = (await res.text().catch(() => "")).trim().slice(0, 160);
    throw new Error(`BEN ${res.status} su ctx="${ctx}" seat=${seat}: ${corpo}`);
  }
  const d = await res.json();
  return { bid: d.bid ?? "PASS", chi: d.who ?? "?" };
}

async function raccogli(destinazione) {
  const env = Object.fromEntries(
    readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await db
    .from("smazzate")
    // L'ORDINAMENTO VA NELLA QUERY. Con `.limit()` da solo il database può
    // restituire righe diverse a ogni chiamata, e ordinarle DOPO ordinerebbe
    // un insieme già diverso: le due raccolte da confrontare finirebbero per
    // riguardare mani diverse, e il confronto non direbbe niente.
    .select("id,lesson_id,board,hands,bidding,vulnerability")
    .order("id", { ascending: true })
    .limit(400);
  if (error) throw new Error(error.message);

  // Ordinate per id: la scelta delle mani deve essere la STESSA fra una
  // raccolta e l'altra, altrimenti si confronterebbero insiemi diversi.
  const mani = (data ?? [])
    .filter((s) => s.hands && Object.keys(s.hands).length === 4)
    .slice(0, QUANTE);

  console.log(`${mani.length} smazzate, asta completa su ciascuna\n`);
  const risultati = [];
  for (const [i, s] of mani.entries()) {
    // Il mazziere non è una colonna: sta dentro la licita registrata. Dove
    // manca si parte da Nord — quello che conta è che la SCELTA sia la stessa
    // nelle due raccolte, non quale sia.
    const dealer = SEATS[s.bidding?.dealer] ?? "N";
    const vul = vulBen(s.vulnerability);
    let bids = [];
    let ctx = "";
    let simulazioni = 0;
    try {
      while (!astaChiusa(bids) && bids.length < 20) {
        const posto = ORDINE[(ORDINE.indexOf(dealer) + bids.length) % 4];
        const nomeLungo = Object.keys(SEATS).find((k) => SEATS[k] === posto);
        const { bid, chi } = await chiediBen(manoPbn(s.hands[nomeLungo]), posto, dealer, vul, ctx);
        if (chi === "Simulation") simulazioni++;
        bids.push(bid);
        ctx += codice(bid);
      }
      const c = contrattoFinale(bids);
      risultati.push({ id: s.id, dealer, bids, contratto: c, simulazioni });
      console.log(`  ${String(i + 1).padStart(3)}. ${String(s.id).padEnd(10)} ${c.padEnd(8)} ${bids.join(" ")}`);
    } catch (e) {
      console.log(`  ${String(i + 1).padStart(3)}. ${String(s.id).padEnd(10)} ERRORE: ${e.message}`);
      risultati.push({ id: s.id, errore: String(e.message) });
    }
  }
  writeFileSync(destinazione, JSON.stringify(risultati, null, 1));
  const ok = risultati.filter((r) => !r.errore);
  console.log(
    `\nscritto ${destinazione}: ${ok.length} aste, ` +
      `${ok.reduce((n, r) => n + (r.simulazioni ?? 0), 0)} dichiarazioni simulate`,
  );
}

function confronta(fileA, fileB) {
  const a = JSON.parse(readFileSync(fileA, "utf8"));
  const b = JSON.parse(readFileSync(fileB, "utf8"));
  const perId = new Map(b.map((r) => [r.id, r]));

  let confrontate = 0;
  const contrattiDiversi = [];
  const soloAsta = [];
  for (const ra of a) {
    const rb = perId.get(ra.id);
    if (!rb || ra.errore || rb.errore) continue;
    confrontate++;
    if (ra.contratto !== rb.contratto) contrattiDiversi.push({ id: ra.id, a: ra, b: rb });
    else if (ra.bids.join(" ") !== rb.bids.join(" ")) soloAsta.push({ id: ra.id, a: ra, b: rb });
  }

  const livello = (c) => (c === "passata" ? 0 : Number(c[0]));
  console.log(`Confronto su ${confrontate} aste\n`);
  console.log(`  contratto finale DIVERSO : ${contrattiDiversi.length}`);
  console.log(`  stesso contratto, altra strada: ${soloAsta.length}`);
  console.log(
    `  identiche                : ${confrontate - contrattiDiversi.length - soloAsta.length}`,
  );

  if (contrattiDiversi.length) {
    console.log(`\n── le mani da far guardare a un giocatore ──`);
    console.log(`  ${"mano".padEnd(10)} ${fileA.padEnd(12)} ${fileB.padEnd(12)} livello`);
    for (const d of contrattiDiversi) {
      const dl = livello(d.b.contratto) - livello(d.a.contratto);
      const segno = dl === 0 ? "uguale" : dl > 0 ? `+${dl}` : String(dl);
      console.log(`  ${String(d.id).padEnd(10)} ${d.a.contratto.padEnd(12)} ${d.b.contratto.padEnd(12)} ${segno}`);
    }
    console.log(
      `\nUn contratto diverso non è per forza peggiore: queste vanno lette,\n` +
        `non contate. Il programma dice dove guardare, non chi ha ragione.`,
    );
  }
  const quota = confrontate ? (contrattiDiversi.length / confrontate) * 100 : 0;
  console.log(`\ncontratti cambiati: ${quota.toFixed(1)}%`);
}

if (iRaccogli > -1) {
  if (!url) { console.error("Manca BEN_API_URL."); process.exit(2); }
  // NON SI CARICA IL BEN DI PRODUZIONE. Il 29/08/2026 questo banco lo ha messo
  // fuori uso: duecentoquaranta richieste di fila lo hanno fatto entrare in
  // uno stato in cui rispondeva 400 a tutto, e ci sono finiti dentro utenti
  // veri. La guardia adesso se ne accorge e riavvia, ma accorgersene dopo non
  // è come non romperlo.
  //
  // Serve un BEN separato — stessa immagine, stesso commit — acceso per il
  // confronto e spento dopo. Se proprio non c'è, `--anche-in-produzione` lo
  // consente: è esplicito apposta, così non capita per distrazione.
  if (!argv.includes("--anche-in-produzione")) {
    console.error(
      "Questo banco fa centinaia di richieste di fila e il 29/08/2026 ha messo\n" +
      "fuori uso il BEN di produzione. Puntalo a un servizio dedicato:\n\n" +
      "  BEN_API_URL=https://ben-di-prova… node scripts/qualita-licita-ben.mjs --raccogli …\n\n" +
      "Se sai quello che fai, aggiungi --anche-in-produzione.",
    );
    process.exit(2);
  }
  await raccogli(argv[iRaccogli + 1]);
} else if (iConfronta > -1) {
  confronta(argv[iConfronta + 1], argv[iConfronta + 2]);
} else {
  console.error("Uso: --raccogli <file> [--mani N]  oppure  --confronta <a> <b>");
  process.exit(2);
}
