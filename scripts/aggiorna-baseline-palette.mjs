/**
 * Rigenera l'elenco del debito di colore usato da src/lib/palette.test.ts.
 * Da eseguire dopo aver ripulito un file: fissa il guadagno e impedisce che
 * il debito risalga di nascosto.
 *
 *   node scripts/aggiorna-baseline-palette.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BANNED = /\b(indigo|violet|purple|fuchsia|pink|rose|cyan|sky)-\d{2,3}\b/g;
const ROOTS = ["src/app", "src/components"];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

const base = {};
for (const f of ROOTS.flatMap(walk)) {
  const n = (readFileSync(f, "utf8").match(BANNED) ?? []).length;
  if (n) base[f] = n;
}
const ordinato = Object.fromEntries(Object.entries(base).sort());
writeFileSync("src/lib/__palette-baseline.json", JSON.stringify(ordinato, null, 1) + "\n");
console.log(
  `file con debito: ${Object.keys(base).length} | occorrenze: ${Object.values(base).reduce((a, b) => a + b, 0)}`
);
