import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import baseline from "./__palette-baseline.json";

/**
 * Presidio della tavolozza.
 *
 * PERCHÉ ESISTE
 * Il 13/08/2026 il conteggio era di 16 famiglie di colore Tailwind diverse su
 * 315 gradienti in 113 file. Sulla sola pagina "Gioca" convivevano sette mondi
 * cromatici, e lo STESSO badge XP era colorato in sette modi. Il risultato non
 * legge come vivace: legge come assemblato da persone diverse in momenti
 * diversi — che è la ragione più probabile del riscontro «non è bello».
 *
 * Il sistema dichiarato è: blu FIGB per l'azione, oro per la ricompensa, verde
 * per il successo, rosso per l'errore e per i semi rossi, neutri per tutto il
 * resto. I colori dei quattro corsi restano perché sono identità, non
 * decorazione.
 *
 * COME FUNZIONA — È UN CRICCHETTO, NON UN DIVIETO
 * Il debito accumulato non si può sanare in un colpo solo senza rischiare di
 * rompere ciò che funziona. Questo test fissa il debito ESISTENTE in un
 * elenco (`__palette-baseline.json`) e impedisce che cresca:
 *
 *   * un file NUOVO che usa colori fuori sistema fallisce;
 *   * un file già in elenco che ne aggiunge fallisce;
 *   * un file che ne toglie fa scendere il livello — e va aggiornato
 *     l'elenco, così il debito non può risalire di nascosto.
 *
 * Aggiornare l'elenco: `node scripts/aggiorna-baseline-palette.mjs`.
 */

const BANNED = /\b(indigo|violet|purple|fuchsia|pink|rose|cyan|sky)-\d{2,3}\b/g;
const ROOTS = ["src/app", "src/components"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

function countBanned(file: string): number {
  return (readFileSync(file, "utf8").match(BANNED) ?? []).length;
}

const files = ROOTS.flatMap(walk);
const known = baseline as Record<string, number>;

describe("tavolozza — il debito di colore può solo scendere", () => {
  it("nessun file nuovo introduce colori fuori sistema", () => {
    const nuovi = files
      .filter((f) => !(f in known) && countBanned(f) > 0)
      .map((f) => `${f} (${countBanned(f)})`);

    expect(
      nuovi,
      "Usa i colori del sistema: figb (azione), gold (ricompensa), emerald " +
        "(successo), red (errore e semi rossi), muted/neutri. Se un colore " +
        "fuori tavolozza è davvero necessario, va aggiunto al sistema in " +
        "globals.css, non usato al volo."
    ).toEqual([]);
  });

  it("nessun file esistente ne aggiunge altri", () => {
    const peggiorati = files
      .filter((f) => f in known && countBanned(f) > known[f])
      .map((f) => `${f}: ${known[f]} → ${countBanned(f)}`);

    expect(peggiorati, "Il debito di colore non deve crescere.").toEqual([]);
  });

  it("l'elenco del debito è aggiornato", () => {
    // Se un file è stato ripulito, l'elenco va rigenerato: altrimenti resterebbe
    // spazio per reintrodurre colori senza che nessun test se ne accorga.
    const migliorati = files
      .filter((f) => f in known && countBanned(f) < known[f])
      .map((f) => `${f}: ${known[f]} → ${countBanned(f)}`);

    expect(
      migliorati,
      "Ottimo, il debito è sceso: rigenera l'elenco con " +
        "`node scripts/aggiorna-baseline-palette.mjs` per bloccare il guadagno."
    ).toEqual([]);
  });

  it("le pagine già bonificate restano pulite", () => {
    // Le prime due schermate sistemate il 13/08: se qualcuno ci rimette un
    // viola, deve saltare fuori qui e non da un audit fra sei mesi.
    for (const f of ["src/app/gioca/page.tsx"]) {
      expect(countBanned(f), `${f} deve restare senza colori fuori sistema`).toBe(0);
    }
  });
});
