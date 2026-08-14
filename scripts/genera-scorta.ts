/**
 * Riempie la scorta di mani degli scenari.
 *
 *   npx tsx scripts/genera-scorta.ts [--scorta 30] [--scenario <id>] [--secco]
 *
 * PERCHÉ UNA SCORTA E NON UNA GENERAZIONE A RICHIESTA
 * Una mano buona costa: la ricerca con vincoli stretti prova migliaia di
 * distribuzioni, e sopra ci vanno il par, la tabella double dummy e una
 * ventina di risoluzioni per il valore atteso. Farlo mentre l'allievo aspetta
 * significa un minuto di clessidra su un telefono. Farlo qui significa che
 * l'allievo trova la mano già pronta — e che due allievi trovano LA STESSA
 * mano, senza cui la percentuale di campo non esisterebbe.
 *
 * SI RIESEGUE SENZA DANNI. Per ogni scenario conta le mani già in scorta e
 * genera solo quelle che mancano. Il seme dipende da scenario e progressivo:
 * la mano numero 7 di uno scenario è sempre la stessa, anche rilanciando.
 *
 * COSA FA SE UNO SCENARIO È IMPOSSIBILE
 * Lo dice e passa oltre. Un vincolo che non si soddisfa mai è un errore
 * dell'insegnante, non del generatore, e va visto — non nascosto sotto una
 * scorta che resta misteriosamente vuota.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateDeals, type DealConstraints } from "../src/lib/deal-generator";
import { calcTableAndPar } from "../src/lib/dds-table";
import { migliorContrattoAtteso } from "../src/lib/valore-atteso";
import type { Position } from "../src/lib/bridge-engine";

// ─── Ambiente ───────────────────────────────────────────────────────────────

function env(): Record<string, string> {
  const testo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  return Object.fromEntries(
    testo
      .split("\n")
      .filter((r) => r.includes("=") && !r.trimStart().startsWith("#"))
      .map((r) => [r.slice(0, r.indexOf("=")).trim(), r.slice(r.indexOf("=") + 1).trim()])
  );
}

const E = env();
const supabase = createClient(E.NEXT_PUBLIC_SUPABASE_URL, E.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Argomenti ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function opzione(nome: string): string | undefined {
  const i = argv.indexOf(`--${nome}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
const SCORTA = Number(opzione("scorta") ?? 30);
const SOLO = opzione("scenario");
/** Salta il valore atteso: venti volte più veloce, mani senza il metro buono. */
const SECCO = argv.includes("--secco");
/** Distribuzioni provate per il valore atteso. Venti danno già un ordine stabile. */
const PROVE = Number(opzione("prove") ?? 20);

const DEALERS: Position[] = ["north", "east", "south", "west"];
const VULN = ["none", "ns", "ew", "both"] as const;

// ─── Lavoro ─────────────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  nome: string;
  vincoli: DealConstraints;
}

async function scenari(): Promise<Scenario[]> {
  let q = supabase.from("scenari").select("id, nome, vincoli").order("created_at");
  if (SOLO) q = q.eq("id", SOLO);
  const { data, error } = await q;
  if (error) throw new Error(`scenari non letti: ${error.message}`);
  return (data ?? []) as Scenario[];
}

/** Seme riproducibile: la mano n di uno scenario è sempre la stessa mano. */
function seme(scenarioId: string, indice: number): number {
  let h = 2166136261;
  for (const ch of scenarioId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (Math.imul(h ^ indice, 16777619) >>> 0) % 2 ** 31;
}

async function riempi(s: Scenario) {
  const { count, error } = await supabase
    .from("mani_generate")
    .select("id", { count: "exact", head: true })
    .eq("scenario_id", s.id);
  if (error) throw new Error(`conteggio fallito: ${error.message}`);

  const presenti = count ?? 0;
  const mancanti = Math.max(0, SCORTA - presenti);
  if (mancanti === 0) {
    console.log(`  ${s.nome}: già ${presenti} mani, niente da fare`);
    return;
  }
  console.log(`  ${s.nome}: ${presenti} in scorta, ne genero ${mancanti}`);

  for (let i = 0; i < mancanti; i++) {
    const indice = presenti + i;
    const { deals, exhausted } = generateDeals(s.vincoli, { count: 1, seed: seme(s.id, indice) });
    if (exhausted || deals.length === 0) {
      console.log(`    ! vincoli non soddisfatti: scenario "${s.nome}" saltato`);
      return;
    }
    const hands = deals[0];
    const dealer = DEALERS[indice % 4];
    const vulnerability = VULN[indice % 4];

    const { table, par } = await calcTableAndPar(hands, dealer, vulnerability);

    let valoreAtteso: Record<string, unknown> | null = null;
    if (!SECCO) {
      const vulnNs = vulnerability === "ns" || vulnerability === "both";
      const vulnEw = vulnerability === "ew" || vulnerability === "both";
      const [ns, ew] = [
        await migliorContrattoAtteso(hands, "ns", { prove: PROVE, seed: indice + 1, vulnerable: vulnNs }),
        await migliorContrattoAtteso(hands, "ew", { prove: PROVE, seed: indice + 1, vulnerable: vulnEw }),
      ];
      valoreAtteso = { ns, ew, prove: PROVE };
    }

    const { error: insErr } = await supabase.from("mani_generate").insert({
      scenario_id: s.id,
      hands,
      dealer,
      vulnerability,
      par_contracts: par.contracts,
      par_score: par.score,
      dd_table: table.tricks,
      valore_atteso: valoreAtteso,
    });
    if (insErr) throw new Error(`inserimento fallito: ${insErr.message}`);
    process.stdout.write(`    ${indice + 1}/${SCORTA}\r`);
  }
  console.log(`    ${SCORTA}/${SCORTA} — fatto`);
}

async function main() {
  const elenco = await scenari();
  if (elenco.length === 0) {
    console.log("Nessuno scenario: prima se ne crea uno, poi si riempie la scorta.");
    return;
  }
  console.log(
    `Scorta di ${SCORTA} mani per ${elenco.length} scenari${SECCO ? " (senza valore atteso)" : ""}\n`
  );
  for (const s of elenco) await riempi(s);
  console.log("\nScorta aggiornata.");
}

void main();
