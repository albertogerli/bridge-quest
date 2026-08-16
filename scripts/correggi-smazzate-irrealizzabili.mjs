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
 * Quasi tutte cadono di UNA presa, e cadono anche contro la difesa perfetta:
 * non è l'attacco indicato a essere sbagliato, è il contratto di un gradino
 * troppo alto. Quindi:
 *
 *   1. si resta nella STESSA denominazione e con lo stesso dichiarante, e si
 *      scende al livello che le prese consentono. Una lezione sulle picche
 *      resta una lezione sulle picche: 4♠ diventa 3♠, e tutto quello che
 *      insegnava continua a valere;
 *   2. solo se non regge nemmeno il primo livello — il dichiarante fa meno di
 *      sette prese in quel colore — si cambia denominazione, prendendo il
 *      contratto migliore per la sua linea. Lì la mano cambia lezione, e va
 *      RIVISTA A MANO: lo script la segnala e non la tocca.
 *
 * Non si tocca `dd_tricks`: lo ricalcola `valida-smazzate-dds.mjs`.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
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

const scrivi = (l, d) => `${l}${SIMBOLO[d]}`;

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

    const nuovoLivello = prese - 6;
    if (prese >= 7 && c.livello - nuovoLivello === 1) {
      // UN SOLO GRADINO, stessa denominazione: la lezione resta quella che era.
      // 4♠ che diventa 3♠ insegna ancora il fit a picche e il gioco d'atout.
      daCorreggere.push({
        ...s,
        nuovo: scrivi(nuovoLivello, c.denominazione),
        perche: `${s.contract} chiede ${servono} prese, il dichiarante ne fa ${prese}`,
      });
    } else if (prese >= 7) {
      // Più di un gradino: qui la mano cambia lezione anche restando nello
      // stesso colore — 7♠ che diventa 4♠ non insegna più lo slam, e un 3SA
      // che diventa 1SA non è più una manche. Decide una persona.
      daRivedere.push({
        ...s,
        prese,
        alternativa: `${scrivi(nuovoLivello, c.denominazione)} (${prese} prese): sono ${c.livello - nuovoLivello} gradini`,
      });
    } else {
      // Nemmeno al primo livello: qui cambia la lezione, e decide una persona.
      let migliore = null;
      for (const [den, idx] of Object.entries(STRAIN_INDEX)) {
        // Solo la linea del dichiarante, e il suo posto migliore.
        const compagno = (posto + 2) % 4;
        const p = Math.max(tabella[idx][posto], tabella[idx][compagno]);
        if (p >= 7 && (!migliore || p > migliore.prese)) migliore = { den, prese: p };
      }
      daRivedere.push({
        ...s,
        prese,
        alternativa: migliore ? `${scrivi(migliore.prese - 6, migliore.den)} (${migliore.prese} prese)` : "nessun contratto regge",
      });
    }
  }

  console.log(`── ${daCorreggere.length} da abbassare, stessa denominazione ──\n`);
  for (const r of daCorreggere) {
    console.log(`  lez.${r.lesson_id} board ${r.board} [${r.id}]  ${r.contract} → ${r.nuovo}   (${r.perche})`);
  }

  if (daRivedere.length) {
    console.log(`\n── ${daRivedere.length} DA RIVEDERE A MANO: cambia la denominazione, cioè la lezione ──\n`);
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
