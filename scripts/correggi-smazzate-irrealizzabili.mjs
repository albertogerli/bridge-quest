/**
 * Le mani del catalogo il cui contratto non si mantiene: proposta e correzione.
 *
 *   node scripts/correggi-smazzate-irrealizzabili.mjs            # solo proposta
 *   node scripts/correggi-smazzate-irrealizzabili.mjs --applica  # scrive sul DB
 *
 * IL PROBLEMA. Alcune smazzate hanno un contratto che non regge nemmeno a
 * carte scoperte: l'allievo non può farcela, per quanto giochi bene. In un
 * prodotto didattico è un difetto di contenuto — il motore ha ragione, la mano
 * no.
 *
 * PRIMA DI TUTTO: DI CHI È IL CONTRATTO.
 * Un contratto che cade è un difetto SOLO se a giocarlo è l'allievo. Delle 272
 * smazzate, 129 hanno il dichiarante in Est/Ovest: lì l'allievo DIFENDE, e il
 * contratto che cade non è un errore, è la lezione — «Il punto di vista dei
 * difensori», «I colori da muovere in difesa», «La prima presa» esistono
 * apposta per far battere quel contratto. Abbassarlo perché «non si mantiene»
 * significa cancellare l'esercizio. (È successo davvero, il 15/08/2026: 25 mani
 * di controgioco abbassate per questo motivo e poi ripristinate dal seed.)
 * Quindi qui si guardano solo le mani con dichiarante Nord o Sud.
 *
 * IL CRITERIO, scelto per cambiare il MENO possibile.
 *
 *   1. si resta nella STESSA denominazione e con lo stesso dichiarante, e si
 *      scende al livello che le prese consentono. L'atout non cambia, quindi
 *      non cambia il problema di gioco: 7♠ che diventa 4♠ è la stessa mano da
 *      giocare, con l'asticella dove le carte la mettono davvero;
 *   2. finché si resta al SECONDO livello o sopra. Sotto, il contratto smette
 *      di essere una cosa che qualcuno dichiarerebbe — «1SA» con ventisei
 *      punti in linea insegnerebbe una cosa falsa — e allora si prende la
 *      denominazione migliore per lo STESSO dichiarante;
 *   3. il livello non sale mai sopra quello di partenza. Un 3SA che non si
 *      mantiene può diventare 3♠, non 4♠: l'allievo deve dover fare MENO
 *      prese di prima, non una di più.
 *
 * Il dichiarante non si sposta mai, nemmeno al compagno: l'attacco scritto
 * nella lezione è la carta di chi siede alla sua sinistra, e cambiare posto lo
 * trasformerebbe nella carta di un altro giocatore.
 *
 * Non si tocca `dd_tricks`: lo ricalcola `valida-smazzate-dds.mjs`.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { loadDds, Dds } from "./dds.mjs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const APPLICA = process.argv.includes("--applica");

const ORDER = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const SEATS = ["north", "east", "south", "west"];
const SUIT_LETTER = { spade: "S", heart: "H", diamond: "D", club: "C" };
const STRAIN_INDEX = { S: 0, H: 1, D: 2, C: 3, NT: 4 };
const SIMBOLO = { S: "♠", H: "♥", D: "♦", C: "♣", NT: "SA" };

function toPbn(hands) {
  const suits = ["spade", "heart", "diamond", "club"];
  const mano = (cards) =>
    suits.map((s) =>
      (cards || []).filter((c) => c.suit === s)
        .sort((a, b) => ORDER.indexOf(a.rank) - ORDER.indexOf(b.rank))
        .map((c) => (c.rank === "10" ? "T" : c.rank)).join("")
    ).join(".");
  return `N:${mano(hands.north)} ${mano(hands.east)} ${mano(hands.south)} ${mano(hands.west)}`;
}

/** Da "4♠"/"3SA"/"4S" a livello e denominazione. */
function leggiContratto(testo) {
  const t = String(testo).trim().toUpperCase()
    .replace("♠", "S").replace("♥", "H").replace("♦", "D").replace("♣", "C")
    .replace("SA", "NT").replace("SENZA", "NT");
  const m = t.match(/^([1-7])\s*(NT|N|S|H|D|C)/);
  if (!m) return null;
  return { livello: Number(m[1]), denominazione: m[2] === "N" ? "NT" : m[2] };
}

/**
 * Il contratto nuovo si scrive con la NOTAZIONE DI QUELLO VECCHIO.
 * Nel catalogo convivono due stili — "4S" e "4♠", "3NT" e "3SA" — perché le
 * lezioni sono state caricate in momenti diversi. Chi legge li accetta
 * entrambi, ma cambiare stile a una riga sola la fa sembrare toccata da
 * un'altra mano: qui si resta nello stile che quella riga aveva.
 */
function scrivi(livello, denominazione, originale) {
  const simboli = /[♠♥♦♣]/.test(originale) || /SA/i.test(originale);
  if (!simboli) return `${livello}${denominazione}`;
  return `${livello}${SIMBOLO[denominazione]}`;
}

async function main() {
  const dds = new Dds(await loadDds());

  let tutte = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("smazzate")
      .select("id,lesson_id,board,title,contract,declarer,hands")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    tutte = tutte.concat(data ?? []);
    if ((data ?? []).length < 1000) break;
  }
  console.log(`${tutte.length} smazzate nel catalogo\n`);

  const daCorreggere = [];
  const daRivedere = [];

  for (const s of tutte) {
    const c = leggiContratto(s.contract);
    const posto = SEATS.indexOf(s.declarer);
    if (!c || posto < 0 || !s.hands) continue;
    // Dichiarante avversario: l'allievo difende, e il contratto deve cadere.
    if (s.declarer === "east" || s.declarer === "west") continue;

    const tabella = dds.CalcDDTablePBN({ cards: toPbn(s.hands) }).resTable;
    const prese = tabella[STRAIN_INDEX[c.denominazione]][posto];
    const servono = c.livello + 6;
    if (prese >= servono) continue; // il contratto regge: non si tocca

    // (a) STESSA DENOMINAZIONE, al livello che le carte consentono. È la
    //     correzione che costa meno: l'atout non cambia, quindi il problema di
    //     gioco della lezione resta identico — cambia solo l'asticella. Vale
    //     però finché si resta al secondo livello o sopra: un 3SA che diventa
    //     1SA non è più un contratto che qualcuno dichiarerebbe, e all'allievo
    //     leggere «1SA» con ventisei punti in linea insegna una cosa falsa.
    if (prese >= 8) {
      daCorreggere.push({
        ...s,
        nuovo: scrivi(prese - 6, c.denominazione, s.contract),
        perche: `chiedeva ${servono} prese, il dichiarante ne fa ${prese}`,
      });
      continue;
    }

    // (b) La denominazione non regge nemmeno al secondo livello: si cerca il
    //     colore migliore PER LO STESSO DICHIARANTE. Deve restare lui:
    //     l'attacco memorizzato nella lezione è la carta di chi siede alla sua
    //     sinistra, e spostare la dichiarazione al compagno lo renderebbe la
    //     carta di un altro giocatore — cioè un attacco impossibile.
    let migliore = null;
    for (const [den, idx] of Object.entries(STRAIN_INDEX)) {
      const p = tabella[idx][posto];
      if (p >= 7 && (!migliore || p > migliore.prese)) migliore = { den, prese: p };
    }
    if (!migliore) {
      daRivedere.push({ ...s, prese, alternativa: "nessun contratto regge, in nessun colore" });
      continue;
    }

    // Il livello non sale MAI sopra quello di partenza. Senza questo paletto
    // un 3SA che non si mantiene diventerebbe 4♠ — un contratto realizzabile,
    // ma che chiede all'allievo una presa IN PIÙ di prima. La richiesta era
    // l'opposto: abbassare l'asticella, non spostarla.
    const livello = Math.min(migliore.prese - 6, c.livello);
    daCorreggere.push({
      ...s,
      nuovo: scrivi(livello, migliore.den, s.contract),
      perche:
        `chiedeva ${servono} prese e in ${SIMBOLO[c.denominazione]} ne fa ${prese}; ` +
        `in ${SIMBOLO[migliore.den]} ne fa ${migliore.prese}`,
      cambiaColore: true,
    });
  }

  const stesse = daCorreggere.filter((r) => !r.cambiaColore);
  const cambi = daCorreggere.filter((r) => r.cambiaColore);

  console.log(`── ${stesse.length} da abbassare, stessa denominazione: nemmeno una carta si sposta ──\n`);
  for (const r of stesse) {
    console.log(`  lez.${r.lesson_id} board ${r.board} [${r.id}]  ${r.contract} → ${r.nuovo}   (${r.perche})`);
  }

  if (cambi.length) {
    console.log(`\n── ${cambi.length} che cambiano anche denominazione: qui cambia l'atout, non solo il livello ──\n`);
    for (const r of cambi) {
      console.log(`  lez.${r.lesson_id} board ${r.board} [${r.id}]  ${r.contract} di ${r.declarer} → ${r.nuovo}   (${r.perche})`);
    }
  }

  if (daRivedere.length) {
    console.log(`\n── ${daRivedere.length} DA RIVEDERE A MANO ──\n`);
    for (const r of daRivedere) {
      console.log(`  lez.${r.lesson_id} board ${r.board} [${r.id}]  ${r.contract} di ${r.declarer}: solo ${r.prese} prese → ${r.alternativa}`);
    }
  }

  if (!APPLICA) {
    console.log(`\nNessuna modifica scritta. Rilancia con --applica per correggere le ${daCorreggere.length} sicure.`);
    return;
  }

  let fatte = 0;
  for (const r of daCorreggere) {
    const { error } = await db.from("smazzate").update({ contract: r.nuovo }).eq("id", r.id);
    if (error) { console.log(`  ! ${r.id}: ${error.message}`); continue; }
    fatte++;
  }
  console.log(`\n${fatte} contratti corretti sul database.`);
  console.log("Le mani da rivedere restano come sono: cambiarle da qui vorrebbe dire scegliere");
  console.log("quale lezione insegnano, e non è una decisione da script.");
}

main().catch((e) => { console.error(e); process.exit(1); });
