/**
 * Riempie la scorta di mani condivise.
 *
 *   npx tsx scripts/genera-scorta.ts --quante 600 --media-ns 23 --min-ns 20
 *   npx tsx scripts/genera-scorta.ts --scenari                  # i modelli didattici
 *   npx tsx scripts/genera-scorta.ts --quante 200 --processi 1  # senza parallelismo
 *
 * PERCHÉ UNA SCORTA E NON UNA GENERAZIONE A RICHIESTA
 * Una mano buona costa: la ricerca con vincoli prova migliaia di distribuzioni,
 * e sopra ci vanno il par, la tabella double dummy e una ventina di risoluzioni
 * per le distribuzioni attese. Farlo mentre l'allievo aspetta significa un
 * minuto di clessidra su un telefono. Farlo qui significa che l'allievo trova
 * la mano già pronta — e che due allievi trovano LA STESSA mano, senza cui la
 * percentuale di campo non esisterebbe.
 *
 * I PUNTI DI NORD-SUD SI DECIDONO, NON SI SUBISCONO. Una smazzata a caso dà in
 * media venti punti per linea e finisce quasi sempre in un parziale senza
 * storia: niente da decidere, niente da imparare. Con `--media-ns` e
 * `--min-ns` la scorta si centra dove la dichiarazione conta (vedi
 * `src/lib/scorta-hcp.ts`), e alla fine la media VERA viene misurata e
 * stampata: promessa e verifica non sono la stessa cosa.
 *
 * PARALLELO PERCHÉ IL DOUBLE DUMMY È SERIALE. Il motore è WebAssembly a un
 * filo solo: l'unico modo di usare dieci nuclei è far girare dieci processi.
 * Ognuno prende una fetta di semi diversi, quindi non generano le stesse mani.
 *
 * SI RIESEGUE SENZA DANNI: aggiunge a quello che c'è, e ogni mano è nuova.
 */

import { readFileSync } from "node:fs";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";
import { createClient } from "@supabase/supabase-js";
import {
  DEAL_TEMPLATES, generateDeals, handHcp, type DealConstraints,
} from "../src/lib/deal-generator";
import { calcTableAndPar } from "../src/lib/dds-table";
import { analizzaLato } from "../src/lib/valore-atteso";
import { bersaglio, mediaRealizzata } from "../src/lib/scorta-hcp";
import type { Position } from "../src/lib/bridge-engine";

// ─── Ambiente ───────────────────────────────────────────────────────────────

const E = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((r) => r.includes("=") && !r.trimStart().startsWith("#"))
    .map((r) => [r.slice(0, r.indexOf("=")).trim(), r.slice(r.indexOf("=") + 1).trim()])
);
const supabase = createClient(E.NEXT_PUBLIC_SUPABASE_URL, E.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Argomenti ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const opzione = (nome: string) => {
  const i = argv.indexOf(`--${nome}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const QUANTE = Number(opzione("quante") ?? 300);
const MEDIA_NS = Number(opzione("media-ns") ?? 23);
const MIN_NS = Number(opzione("min-ns") ?? 20);
const PROVE = Number(opzione("prove") ?? 20);
const PROCESSI = Math.max(1, Number(opzione("processi") ?? Math.max(1, cpus().length - 2)));
const SOLO_SCENARI = argv.includes("--scenari");
/** Un solo modello didattico, per poterli lanciare in parallelo. */
const SOLO_SLUG = opzione("slug");
/** Fetta assegnata a un processo figlio: `--fetta indice:totale`. */
const FETTA = opzione("fetta");
const SEME_BASE = Number(opzione("seme") ?? 20260814);

const DEALERS: Position[] = ["north", "east", "south", "west"];
const VULN = ["none", "ns", "ew", "both"] as const;

// ─── Una mano ───────────────────────────────────────────────────────────────

/** Seme riproducibile: la mano n è sempre la stessa mano. */
function seme(indice: number): number {
  let h = SEME_BASE >>> 0;
  h = Math.imul(h ^ indice, 2654435761);
  return (h >>> 0) % 2 ** 31;
}

async function preparaMano(indice: number, vincoli: DealConstraints, hcpTarget: number | null) {
  const { deals } = generateDeals(vincoli, { count: 1, seed: seme(indice), maxAttempts: 60_000 });
  if (!deals.length) return null;

  const hands = deals[0];
  const dealer = DEALERS[indice % 4];
  const vulnerability = VULN[indice % 4];
  const vulnNs = vulnerability === "ns" || vulnerability === "both";
  const vulnEw = vulnerability === "ew" || vulnerability === "both";

  const { table, par } = await calcTableAndPar(hands, dealer, vulnerability);

  // Una serie di rimescolate per linea, e basta: da lì escono sia il contratto
  // migliore sia le distribuzioni. Chiederli separatamente raddoppierebbe il
  // tempo per lo stesso risultato.
  const ns = await analizzaLato(hands, "ns", { prove: PROVE, seed: indice + 1, vulnerable: vulnNs });
  const ew = await analizzaLato(hands, "ew", { prove: PROVE, seed: indice + 1, vulnerable: vulnEw });

  return {
    hands,
    dealer,
    vulnerability,
    par_contracts: par.contracts,
    par_score: par.score,
    dd_table: table.tricks,
    valore_atteso: { ns: ns.migliore, ew: ew.migliore, prove: PROVE },
    distribuzioni: { ns: ns.distribuzioni, ew: ew.distribuzioni, prove: PROVE },
    ns_hcp: handHcp(hands.north) + handHcp(hands.south),
    /** Solo per il resoconto: quanto si era chiesto contro quanto è uscito. */
    _target: hcpTarget,
  };
}

// ─── Il lavoro ──────────────────────────────────────────────────────────────

/** I vincoli di una mano da partita: solo i punti della linea, il resto libero. */
function vincoliDaPunti(punti: number): DealConstraints {
  return { nsHcp: { min: punti, max: punti } };
}

async function generaLotto(da: number, a: number, scenarioId: string | null) {
  let fatte = 0;
  let saltate = 0;
  const hcp: number[] = [];

  for (let i = da; i < a; i++) {
    const target = bersaglio(MEDIA_NS, MIN_NS, ((seme(i) % 10_000) / 10_000 + 0.00005) % 1);
    const mano = await preparaMano(i, vincoliDaPunti(target), target);
    if (!mano) { saltate++; continue; }

    const { _target, ...riga } = mano;
    void _target;
    const { error } = await supabase
      .from("mani_generate")
      .insert({ ...riga, scenario_id: scenarioId });
    if (error) throw new Error(`inserimento fallito: ${error.message}`);

    hcp.push(mano.ns_hcp);
    fatte++;
    if (fatte % 10 === 0) {
      process.stdout.write(`  ${process.pid}: ${fatte}/${a - da}\n`);
    }
  }
  return { fatte, saltate, hcp };
}

/** Le mani legate ai modelli didattici, che restano quelle di prima. */
async function generaScenari() {
  let q = supabase.from("scenari").select("id, nome, slug, vincoli").not("slug", "is", null);
  if (SOLO_SLUG) q = q.eq("slug", SOLO_SLUG);
  const { data: scenari, error } = await q;
  if (error) throw new Error(error.message);

  for (const s of (scenari ?? []) as { id: string; nome: string; vincoli: DealConstraints }[]) {
    const { count } = await supabase
      .from("mani_generate").select("id", { count: "exact", head: true }).eq("scenario_id", s.id);
    const mancanti = Math.max(0, QUANTE - (count ?? 0));
    if (!mancanti) { console.log(`  ${s.nome}: già ${count} mani`); continue; }
    console.log(`  ${s.nome}: ne genero ${mancanti}`);
    for (let i = 0; i < mancanti; i++) {
      const mano = await preparaMano((count ?? 0) + i + s.id.charCodeAt(0) * 977, s.vincoli, null);
      if (!mano) { console.log(`    ! vincoli non soddisfatti, scenario saltato`); break; }
      const { _target, ...riga } = mano;
      void _target;
      const { error: eIns } = await supabase
        .from("mani_generate").insert({ ...riga, scenario_id: s.id });
      if (eIns) throw new Error(eIns.message);
      if ((i + 1) % 10 === 0) process.stdout.write(`    ${i + 1}/${mancanti}\n`);
    }
  }
}

// ─── Avvio ──────────────────────────────────────────────────────────────────

async function main() {
  if (SOLO_SCENARI) {
    console.log(`Mani per i modelli didattici, fino a ${QUANTE} ciascuno\n`);
    await generaScenari();
    console.log("\nFatto.");
    return;
  }

  // Figlio: fa la sua fetta e riferisce.
  if (FETTA) {
    const [indice, totale] = FETTA.split(":").map(Number);
    const per = Math.ceil(QUANTE / totale);
    const da = indice * per;
    const a = Math.min(QUANTE, da + per);
    const esito = await generaLotto(da, a, null);
    process.send?.(esito);
    return;
  }

  console.log(
    `Scorta: ${QUANTE} mani, Nord-Sud in media ${MEDIA_NS} punti (minimo ${MIN_NS}), ` +
      `${PROVE} rimescolate, ${PROCESSI} processi\n` +
      `La media dei bersagli è ${mediaRealizzata(MEDIA_NS, MIN_NS).toFixed(2)}.\n`
  );

  if (PROCESSI === 1) {
    const esito = await generaLotto(0, QUANTE, null);
    resoconto([esito]);
    return;
  }

  const questo = fileURLToPath(import.meta.url);
  const esiti = await Promise.all(
    Array.from({ length: PROCESSI }, (_, i) =>
      new Promise<{ fatte: number; saltate: number; hcp: number[] }>((risolvi, rifiuta) => {
        const figlio = fork(questo, [...argv, "--fetta", `${i}:${PROCESSI}`], {
          execArgv: ["--import", "tsx"],
        });
        let ultimo = { fatte: 0, saltate: 0, hcp: [] as number[] };
        figlio.on("message", (m) => { ultimo = m as typeof ultimo; });
        figlio.on("exit", (codice) =>
          codice === 0 ? risolvi(ultimo) : rifiuta(new Error(`processo uscito con ${codice}`))
        );
      })
    )
  );
  resoconto(esiti);
}

function resoconto(esiti: { fatte: number; saltate: number; hcp: number[] }[]) {
  const fatte = esiti.reduce((s, e) => s + e.fatte, 0);
  const saltate = esiti.reduce((s, e) => s + e.saltate, 0);
  const hcp = esiti.flatMap((e) => e.hcp);
  const media = hcp.length ? hcp.reduce((a, b) => a + b, 0) / hcp.length : 0;
  console.log(
    `\n${fatte} mani${saltate ? `, ${saltate} saltate per vincoli impossibili` : ""}.\n` +
      `Punti di Nord-Sud: media ${media.toFixed(2)}, minimo ${Math.min(...hcp)}, ` +
      `massimo ${Math.max(...hcp)}.`
  );
}

void main();
