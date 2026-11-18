import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Soglia minima del testo.
 *
 * PERCHÉ ESISTE
 * I giocatori che hanno segnalato «non è bello» hanno fra i 45 e i 65 anni:
 * un'età in cui la presbiozia è la norma. L'interfaccia usava 380 misure a
 * 10px, 153 a 11px e 69 a 9px — oltre seicento testi che una buona parte del
 * pubblico non riesce a leggere senza occhiali.
 *
 * Un tema più leggibile esisteva già, ma legato al profilo «55+ anni»: chi ne
 * ha 52 sceglie «adulto» e resta col testo minuscolo. L'etichetta chiede
 * un'identità, non una preferenza.
 *
 * 12px è un PAVIMENTO per le etichette secondarie, non un obiettivo: il corpo
 * del testo dovrebbe stare sui 14-16. Serve a impedire che si scenda ancora.
 */

const ROOTS = ["src/app", "src/components"];
// Dal 18/11/2026 il pavimento è 13px: `text-xs` vale 13px (globals.css) e
// anche `text-[12px]` è vietato, perché scavalcava il pavimento.
const TROPPO_PICCOLO = /text-\[([0-9]|1[012])px\]/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("nessun testo sotto i 13 pixel", () => {
  it("in tutta l'interfaccia", () => {
    const colpevoli: string[] = [];
    for (const file of ROOTS.flatMap(walk)) {
      const trovati = readFileSync(file, "utf8").match(TROPPO_PICCOLO);
      if (trovati) colpevoli.push(`${file}: ${[...new Set(trovati)].join(", ")}`);
    }
    expect(
      colpevoli,
      "Sotto i 13px il testo diventa illeggibile per buona parte del pubblico " +
        "di BridgeLab (45-65 anni). Per un'etichetta molto secondaria usare " +
        "text-xs (13px); per il corpo del testo 14px o più."
    ).toEqual([]);
  });
});
