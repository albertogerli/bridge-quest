/**
 * Le sette smazzate il cui contratto non si mantiene: contratto E licita.
 *
 *   node scripts/mani-irrealizzabili-2026-08.mjs            # solo proposta
 *   node scripts/mani-irrealizzabili-2026-08.mjs --applica  # scrive sul DB
 *
 * PERCHÉ ESISTE, visto che c'è già `correggi-smazzate-irrealizzabili.mjs`.
 * Quello sceglie il contratto nuovo e lo sa fare da solo. Ma ogni smazzata si
 * porta dietro anche la LICITA, e abbassare il contratto senza toccarla lascia
 * in pagina una dichiarazione che finisce su un contratto diverso da quello
 * che l'allievo gioca. La licita nuova non è una cosa che uno script possa
 * dedurre: il dichiarante è il primo della linea che ha NOMINATO quel colore,
 * quindi cambiare denominazione può spostare la dichiarazione al compagno — e
 * con lei l'attacco, che è la carta di chi siede alla sinistra del
 * dichiarante. Qui le sette licite sono scritte a mano e verificate una per
 * una: il dichiarante resta dov'era in tutte e sette.
 *
 * DUE COSE CHE L'UTENTE DEVE SAPERE, e che nessuno script può decidere:
 *
 *  - `1-7` e `CG7-6` sono mani sbagliate alla radice, non contratti troppo
 *    alti. In `1-7` Nord-Sud hanno 22 punti onori e sette prese in tutto: il
 *    contratto che si mantiene è 1♠, che nessuno dichiarerebbe mai con quelle
 *    carte. In `CG7-6` Nord-Sud ne hanno 19 e il massimo è 1♦. Le lascio
 *    giocabili — meglio un esercizio vincibile che uno impossibile — ma per
 *    tornare a essere buone lezioni vanno RIDISEGNATE, spostando una carta.
 *  - `CG7-6` aveva anche la licita incoerente con il proprio dichiarante: le
 *    dichiarazioni memorizzate facevano giocare OVEST, la colonna `declarer`
 *    diceva Nord. L'attacco memorizzato (♠3, che è una carta di Est) dà
 *    ragione alla colonna, quindi la licita è quella che si riscrive.
 *
 * Non si tocca `dd_tricks`: lo ricalcola `valida-smazzate-dds.mjs --scrivi`.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const APPLICA = process.argv.includes("--applica");

/**
 * Per ogni mano: il contratto nuovo, la licita nuova, e il motivo.
 * `prese` è quello che il dichiarante fa davvero a carte scoperte.
 */
const CORREZIONI = [
  {
    id: "CG3-8",
    contratto: "2S",
    prese: 8,
    bidding: { bids: ["1C", "P", "1H", "P", "1S", "P", "2S", "P", "P", "P"], dealer: "north" },
    nota: "4♠ chiedeva 10 prese, Nord ne fa 8. Stesso colore, stesso dichiarante: Sud alza a 2♠ invece che a 4♠.",
  },
  {
    id: "CG6-6",
    contratto: "4S",
    prese: 10,
    bidding: { bids: ["1D", "P", "1S", "P", "2S", "P", "4S", "P", "P", "P"], dealer: "south" },
    nota: "7♠ chiedeva 13 prese, Nord ne fa 10 (mancano ♦A K J). Via la Blackwood: dopo 2♠ Nord chiude a 4♠.",
  },
  {
    id: "CG3-4",
    contratto: "4S",
    prese: 10,
    bidding: { bids: ["1H", "X", "4H", "P", "4S", "P", "P", "P"], dealer: "south" },
    nota: "6♠ chiedeva 12 prese, Sud ne fa 10: Ovest ha ♥A K Q e taglia. Sud corregge a 4♠ invece che a 6♠.",
  },
  {
    id: "12-5",
    contratto: "4D",
    prese: 10,
    bidding: { bids: ["1D", "1S", "X", "P", "2D", "P", "3D", "P", "4D", "P", "P", "P"], dealer: "north" },
    nota:
      "4♥ chiedeva 10 prese e Nord ne fa 7: Ovest ha ♦4 secco e taglia due volte. " +
      "A quadri il suo singolo è atout e le prese diventano 10. Nord aveva già nominato quadri per primo, quindi resta lui a giocare.",
  },
  {
    id: "Q11-6",
    contratto: "3D",
    prese: 9,
    bidding: { bids: ["P", "P", "P", "1S", "P", "2D", "P", "3D", "P", "P", "P"], dealer: "east" },
    nota:
      "3SA chiedeva 9 prese e Sud a senza ne fa 7. A picche ne farebbe 10, ma le picche le ha nominate NORD " +
      "per primo: 4♠ sposterebbe la dichiarazione a lui e l'attacco (♥3, carta di Ovest) diventerebbe impossibile. " +
      "3♦ tiene fermi dichiarante e attacco e chiede le stesse 9 prese di prima.",
  },
  {
    id: "1-7",
    contratto: "1S",
    prese: 7,
    bidding: { bids: ["1S", "P", "P", "P"], dealer: "south" },
    nota:
      "MANO DA RIDISEGNARE. 1SA chiedeva 7 prese e Sud a senza ne fa 5: la difesa ne incassa sei di fila " +
      "(♦A K J e ♣A K) prima che il dichiarante tocchi le sue. A picche si tagliano le quadri e le prese sono 7. " +
      "Con 22 punti onori in linea, però, 1♠ non è un contratto che qualcuno dichiarerebbe.",
  },
  {
    id: "CG7-6",
    contratto: "1D",
    prese: 7,
    bidding: { bids: ["P", "P", "1D", "P", "P", "P"], dealer: "south" },
    nota:
      "MANO DA RIDISEGNARE. 3SA con 19 punti onori in linea: Nord a senza fa 6 prese, e il suo massimo in " +
      "qualunque colore è 7. La licita vecchia era anche incoerente — faceva giocare Ovest.",
  },
];

const SEATS = ["north", "east", "south", "west"];

/** Chi dichiara, secondo la licita: il primo della linea che ha nominato quel colore. */
function dichiaranteDallaLicita({ bids, dealer }) {
  const partenza = SEATS.indexOf(dealer);
  let contratto = null;
  const nominato = {};
  bids.forEach((bid, i) => {
    const m = String(bid).toUpperCase().match(/^([1-7])(NT|S|H|D|C)$/);
    if (!m) return;
    const posto = SEATS[(partenza + i) % 4];
    const linea = posto === "north" || posto === "south" ? "NS" : "EW";
    const chiave = `${linea}${m[2]}`;
    if (!(chiave in nominato)) nominato[chiave] = posto;
    contratto = { testo: `${m[1]}${m[2]}`, denominazione: m[2], dichiarante: nominato[chiave] };
  });
  return contratto;
}

/** Una licita è legale se ogni dichiarazione supera la precedente. */
function licitaLegale({ bids }) {
  const ordine = ["C", "D", "H", "S", "NT"];
  let ultimo = 0;
  for (const bid of bids) {
    const m = String(bid).toUpperCase().match(/^([1-7])(NT|S|H|D|C)$/);
    if (!m) continue;
    const valore = (Number(m[1]) - 1) * 5 + ordine.indexOf(m[2]) + 1;
    if (valore <= ultimo) return false;
    ultimo = valore;
  }
  return true;
}

const { data: righe, error } = await db
  .from("smazzate")
  .select("id,lesson_id,board,contract,declarer,bidding,opening_lead")
  .in("id", CORREZIONI.map((c) => c.id));
if (error) throw new Error(error.message);
const perId = new Map((righe ?? []).map((r) => [r.id, r]));

let bloccanti = 0;
for (const c of CORREZIONI) {
  const riga = perId.get(c.id);
  if (!riga) { console.log(`  ! ${c.id}: non esiste sul database`); bloccanti++; continue; }

  const dedotto = dichiaranteDallaLicita(c.bidding);
  const problemi = [];
  if (!licitaLegale(c.bidding)) problemi.push("licita illegale: una dichiarazione non supera la precedente");
  if (!dedotto) problemi.push("la licita non arriva a un contratto");
  else {
    if (dedotto.testo !== c.contratto) problemi.push(`la licita finisce su ${dedotto.testo}, non su ${c.contratto}`);
    if (dedotto.dichiarante !== riga.declarer)
      problemi.push(`la licita fa dichiarare ${dedotto.dichiarante}, la mano dice ${riga.declarer}`);
  }
  if (Number(c.contratto[0]) + 6 > c.prese) problemi.push(`${c.contratto} chiede più delle ${c.prese} prese disponibili`);

  console.log(`\n${c.id}  lez.${riga.lesson_id} board ${riga.board}`);
  console.log(`  ${riga.contract} → ${c.contratto} di ${riga.declarer} (${c.prese} prese a carte scoperte)`);
  console.log(`  licita: ${c.bidding.bids.join(" ")}   (mazziere ${c.bidding.dealer})`);
  console.log(`  ${c.nota}`);
  for (const p of problemi) { console.log(`  ✗ ${p}`); bloccanti++; }
}

if (bloccanti) {
  console.log(`\n${bloccanti} controlli falliti: non scrivo niente.`);
  process.exit(1);
}
console.log(`\nTutti i controlli passati sulle ${CORREZIONI.length} mani.`);

if (!APPLICA) {
  console.log("Nessuna modifica scritta. Rilancia con --applica.");
  process.exit(0);
}

let fatte = 0;
for (const c of CORREZIONI) {
  const { error: err } = await db
    .from("smazzate")
    .update({ contract: c.contratto, bidding: c.bidding })
    .eq("id", c.id);
  if (err) { console.log(`  ! ${c.id}: ${err.message}`); continue; }
  fatte++;
}
console.log(`\n${fatte} smazzate corrette sul database.`);
console.log("Ora: node scripts/valida-smazzate-dds.mjs --scrivi");
