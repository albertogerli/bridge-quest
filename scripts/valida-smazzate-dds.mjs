/**
 * Verifica double dummy di tutte le smazzate del catalogo.
 *
 * Controlla che il contratto dichiarato in ogni lezione sia effettivamente
 * realizzabile a carte scoperte dal dichiarante indicato. È lo stesso genere di
 * controllo meccanico che sui punti onori ha trovato due errori veri: qui la
 * superficie è di 272 mani e non è mai stata verificata.
 *
 * A carte scoperte è il metro GIUSTO per questo controllo: se un contratto non
 * si mantiene nemmeno vedendo tutte e 52 le carte, allora è sbagliato nel
 * contenuto, non difficile da giocare.
 *
 * Uso:  node scripts/valida-smazzate-dds.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
// Il pacchetto e' pubblicato in un formato che Node in ESM puro non risolve
// (import interni senza estensione .js). Si importa il modulo per intero e si
// estraggono le funzioni: funziona sia con tsx sia con vite-node.
import bridgeDds from "bridge-dds";
const { loadDds, Dds } = bridgeDds;

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SUIT_LETTER = { spade: "S", heart: "H", diamond: "D", club: "C" };
const ORDER = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const SEATS = ["north", "east", "south", "west"];
// Ordine della tabella DDS: picche, cuori, quadri, fiori, senza atout.
const STRAIN_INDEX = { S: 0, H: 1, D: 2, C: 3, NT: 4 };
const DDS_SUIT = { spade: 0, heart: 1, diamond: 2, club: 3 };
const RANK_VALUE = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14 };

function toPbn(hands) {
  const suits = ["spade", "heart", "diamond", "club"];
  const hand = (cards) =>
    suits.map((s) =>
      (cards || []).filter((c) => c.suit === s)
        .sort((a, b) => ORDER.indexOf(a.rank) - ORDER.indexOf(b.rank))
        .map((c) => (c.rank === "10" ? "T" : c.rank)).join("")
    ).join(".");
  return `N:${SEATS.map((s) => hand(hands[s])).join(" ")}`;
}

/** "4♠" -> { level: 4, strain: "S" }; null se non interpretabile. */
function parseContract(raw) {
  if (!raw) return null;
  const m = String(raw).trim().match(/^([1-7])\s*(NT|SA|N|[♠♥♦♣SHDC])/i);
  if (!m) return null;
  const sym = m[2].toUpperCase();
  const strain =
    sym === "NT" || sym === "SA" || sym === "N" ? "NT" :
    { "♠": "S", "♥": "H", "♦": "D", "♣": "C" }[sym] || sym;
  return { level: Number(m[1]), strain };
}

let rows = [], from = 0;
for (;;) {
  const { data, error } = await db.from("smazzate")
    .select("id,lesson_id,board,title,contract,declarer,hands,opening_lead").range(from, from + 999);
  if (error) throw error;
  rows = rows.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

const dds = new Dds(await loadDds());
const problemi = [];
const daScrivere = [];
let esaminate = 0;
// `--scrivi` salva le prese calcolate su smazzate.dd_tricks; senza, il
// programma si limita a riferire.
const scrivi = process.argv.includes("--scrivi");

for (const s of rows) {
  const hands = s.hands || {};
  const totale = SEATS.reduce((n, p) => n + (hands[p] || []).length, 0);
  if (totale !== 52) {
    problemi.push({ id: s.id, lezione: s.lesson_id, tipo: "carte", det: `${totale} carte invece di 52` });
    continue;
  }
  const c = parseContract(s.contract);
  if (!c) {
    problemi.push({ id: s.id, lezione: s.lesson_id, tipo: "contratto", det: `contratto illeggibile: "${s.contract}"` });
    continue;
  }
  const declarer = SEATS.indexOf(s.declarer);
  if (declarer < 0) {
    problemi.push({ id: s.id, lezione: s.lesson_id, tipo: "dichiarante", det: `dichiarante ignoto: "${s.declarer}"` });
    continue;
  }

  const pbn = toPbn(hands);
  const strainIdx = STRAIN_INDEX[c.strain];
  const servono = c.level + 6;
  esaminate++;

  // (a) Difesa perfetta, attacco migliore compreso.
  const preseControDifesaPerfetta = dds.CalcDDTablePBN({ cards: pbn }).resTable[strainIdx][declarer];

  // (b) Dopo l'ATTACCO INDICATO nella lezione, che è il vero punto di partenza
  //     dell'esercizio. La tabella assume l'attacco migliore: giudicare con
  //     quella una mano che parte da un attacco diverso significa bocciarla
  //     per una difesa che l'allievo non vedrà mai.
  let preseDopoAttacco = null;
  const lead = s.opening_lead;
  if (lead && lead.suit && lead.rank) {
    const leader = (declarer + 1) % 4; // attacca chi siede a sinistra
    const fut = dds.SolveBoardPBN(
      { trump: strainIdx, first: leader, currentTrickSuit: [], currentTrickRank: [], remainCards: pbn },
      -1, 3, 1
    );
    const leadSuit = DDS_SUIT[lead.suit];
    const leadRank = RANK_VALUE[lead.rank];
    for (let i = 0; i < fut.cards; i++) {
      // DDS raggruppa le carte equivalenti: la carta cercata può essere la
      // capofila oppure trovarsi nella maschera `equals`.
      const stessoGruppo = fut.rank[i] === leadRank || (fut.equals[i] & (1 << leadRank)) !== 0;
      if (fut.suit[i] === leadSuit && stessoGruppo) {
        preseDopoAttacco = 13 - fut.score[i]; // score = prese della DIFESA
        break;
      }
    }
  }

  const prese = preseDopoAttacco ?? preseControDifesaPerfetta;
  daScrivere.push({ id: s.id, dd_tricks: prese });
  if (prese < servono) {
    problemi.push({
      id: s.id, lezione: s.lesson_id, tipo: preseDopoAttacco === null ? "irrealizzabile-senza-attacco" : "irrealizzabile",
      det: `${s.contract} ${s.declarer}: servono ${servono}, con l'attacco indicato ne fa ${prese} (cade di ${servono - prese}); contro difesa perfetta ${preseControDifesaPerfetta}`,
      caduta: servono - prese,
      titolo: s.title,
    });
  }
}

console.log(`Smazzate nel catalogo: ${rows.length} | analizzate con DDS: ${esaminate}`);
console.log(`Problemi: ${problemi.length}\n`);
const perTipo = {};
for (const p of problemi) perTipo[p.tipo] = (perTipo[p.tipo] || 0) + 1;
for (const [t, n] of Object.entries(perTipo)) console.log(`  ${t}: ${n}`);
console.log();
for (const p of problemi) console.log(`  [${p.id}] lez.${p.lezione} ${p.tipo}: ${p.det}`);
writeFileSync(new URL("../validazione-smazzate.json", import.meta.url), JSON.stringify(problemi, null, 2));

if (scrivi) {
  // A blocchi: un upsert da 272 righe supera i limiti di una singola richiesta.
  let salvate = 0;
  for (let i = 0; i < daScrivere.length; i += 50) {
    const blocco = daScrivere.slice(i, i + 50);
    for (const r of blocco) {
      const { error } = await db.from("smazzate").update({ dd_tricks: r.dd_tricks }).eq("id", r.id);
      if (error) console.error(`  errore su ${r.id}: ${error.message}`);
      else salvate++;
    }
  }
  console.log(`\nScritte ${salvate} righe su smazzate.dd_tricks.`);
}
