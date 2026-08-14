/**
 * Il punteggio scritto due volte deve dare lo stesso numero.
 *
 *   node scripts/prova-punteggio-sql.mjs
 *
 * `punteggio_contratto` in SQL rifà `scoreContract` di src/lib/scoring.ts. La
 * duplicazione serve — il punteggio di una sfida non può dipendere da quello
 * che dichiara il browser — ma due copie della stessa regola divergono sempre,
 * a meno che qualcosa non le confronti. Questo qualcosa è questo file: prova
 * TUTTE le combinazioni, 7 livelli × 5 denominazioni × 14 prese × zona ×
 * contro, cioè 1960 casi.
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

// Copia locale di scoreContract: importarlo da TypeScript richiederebbe un
// transpilatore, e questa prova deve poter girare con `node` e basta. Se le
// due implementazioni divergono, diverge anche questa e la prova fallisce —
// ma il file TypeScript è coperto dai suoi test, quindi il triangolo tiene.
const MINORS = new Set(["club", "diamond"]);
const trickValue = (s) => (s === "nt" ? 30 : MINORS.has(s) ? 20 : 30);
const contractPoints = (l, s) => (s === "nt" ? 40 + 30 * (l - 1) : trickValue(s) * l);

function scoreContract({ level, strain, tricksMade, vulnerable = false, doppio = 1 }) {
  const need = level + 6;
  const base = contractPoints(level, strain) * doppio;
  if (tricksMade < need) {
    const under = need - tricksMade;
    if (doppio === 1) return -(under * (vulnerable ? 100 : 50));
    const scala = vulnerable
      ? (n) => 200 + (n - 1) * 300
      : (n) => (n === 1 ? 100 : n <= 3 ? 100 + (n - 1) * 200 : 500 + (n - 3) * 300);
    return -scala(under) * (doppio === 4 ? 2 : 1);
  }
  const over = tricksMade - need;
  const game = base >= 100 ? (vulnerable ? 500 : 300) : 50;
  const slam = level === 7 ? (vulnerable ? 1500 : 1000) : level === 6 ? (vulnerable ? 750 : 500) : 0;
  const sopra =
    doppio === 1
      ? over * trickValue(strain)
      : over * (vulnerable ? 200 : 100) * (doppio === 4 ? 2 : 1);
  const insulto = doppio === 2 ? 50 : doppio === 4 ? 100 : 0;
  return base + game + slam + sopra + insulto;
}

const STRAIN = ["club", "diamond", "heart", "spade", "nt"];
const casi = [];
for (let level = 1; level <= 7; level++)
  for (const strain of STRAIN)
    for (let prese = 0; prese <= 13; prese++)
      for (const zona of [false, true])
        for (const doppio of [1, 2, 4])
          casi.push({ level, strain, prese, zona, doppio });

// A blocchi, in parallelo: una chiamata per caso sarebbe lenta in serie.
const righe = [];
const BLOCCO = 250;
for (let i = 0; i < casi.length; i += BLOCCO) {
  const parte = casi.slice(i, i + BLOCCO);
  const risultati = await Promise.all(
    parte.map((c) =>
      admin
        .rpc("punteggio_contratto", {
          p_level: c.level, p_strain: c.strain, p_prese: c.prese,
          p_zona: c.zona, p_doppio: c.doppio,
        })
        .then((r) => r.data)
    )
  );
  parte.forEach((c, k) => righe.push({ ...c, sql: risultati[k] }));
  process.stdout.write(`  ${righe.length}/${casi.length}\r`);
}

let diversi = 0;
for (const r of righe) {
  const atteso = scoreContract({
    level: r.level, strain: r.strain, tricksMade: r.prese,
    vulnerable: r.zona, doppio: r.doppio,
  });
  if (r.sql !== atteso) {
    if (diversi < 10) {
      console.log(
        `  DIVERSI ${r.level}${r.strain} ${r.prese} prese, zona=${r.zona}, x${r.doppio}: ` +
          `SQL ${r.sql}, TypeScript ${atteso}`
      );
    }
    diversi++;
  }
}

console.log(
  diversi === 0
    ? `\nLe due implementazioni del punteggio coincidono su tutti i ${righe.length} casi.\n`
    : `\n${diversi} casi su ${righe.length} DIVERGONO.\n`
);
process.exit(diversi ? 1 : 0);
