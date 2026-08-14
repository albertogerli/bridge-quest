/**
 * La tavola degli IMP scritta due volte deve dare lo stesso numero.
 *
 *   node scripts/prova-imp-sql.mjs
 *
 * Come per il punteggio: `imp_da_differenza` in SQL rifà `rawToIMP` di
 * src/lib/bridge-scoring.ts, perché le statistiche si contano nel database e
 * non nel browser. Due copie della stessa tavola divergono, se nessuno le
 * confronta. Qui si confrontano su tutte le differenze da -4500 a 4500.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SOGLIE = [
  10, 40, 80, 120, 160, 210, 260, 310, 360, 420, 490, 590, 740, 890, 1090,
  1290, 1490, 1740, 1990, 2240, 2490, 2990, 3490, 3990,
];
const rawToIMP = (diff) => {
  const a = Math.abs(diff);
  for (let i = 0; i < SOGLIE.length; i++) if (a <= SOGLIE[i]) return i;
  return 24;
};

// Si prova ogni valore intorno alle soglie (dove stanno gli errori) e un
// campione fitto altrove.
const casi = new Set();
for (const s of SOGLIE) for (let d = -3; d <= 3; d++) { casi.add(s + d); casi.add(-(s + d)); }
for (let d = -4500; d <= 4500; d += 10) casi.add(d);
const elenco = [...casi];

const righe = [];
const BLOCCO = 300;
for (let i = 0; i < elenco.length; i += BLOCCO) {
  const parte = elenco.slice(i, i + BLOCCO);
  const risposte = await Promise.all(
    parte.map((d) => admin.rpc("imp_da_differenza", { p_diff: d }).then((r) => r.data))
  );
  parte.forEach((d, k) => righe.push({ d, sql: risposte[k] }));
  process.stdout.write(`  ${righe.length}/${elenco.length}\r`);
}

let diversi = 0;
for (const r of righe) {
  const atteso = rawToIMP(r.d);
  if (r.sql !== atteso) {
    if (diversi < 10) console.log(`  DIVERSI ${r.d}: SQL ${r.sql}, TypeScript ${atteso}`);
    diversi++;
  }
}

console.log(
  diversi === 0
    ? `\nLe due tavole degli IMP coincidono su tutti i ${righe.length} valori provati.\n`
    : `\n${diversi} valori su ${righe.length} DIVERGONO.\n`
);
process.exit(diversi ? 1 : 0);
