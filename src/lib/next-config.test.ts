import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Presidio della CSP.
 *
 * PERCHÉ ESISTE
 * Il 13/08/2026 il quiz "Quante prese?" è arrivato in produzione rotto: la CSP
 * bloccava la compilazione del WebAssembly del double dummy solver. Non se ne
 * era accorto nessuno perché in sviluppo `script-src` include `'unsafe-eval'`,
 * che copre anche il wasm — quindi le prove E2E, che girano in sviluppo,
 * passavano tutte.
 *
 * È una classe di difetti che nessuna prova E2E potrà mai cogliere finché
 * girano in sviluppo: la CSP è DIVERSA fra i due ambienti. L'unico modo di
 * proteggersi è verificare direttamente la direttiva.
 */

const config = readFileSync(join(__dirname, "..", "..", "next.config.ts"), "utf8");

describe("Content-Security-Policy", () => {
  it("consente WebAssembly anche in produzione", () => {
    // Senza questa, il double dummy solver non parte: quiz "Quante prese?",
    // par nel generatore di mani e analisi del punto di svolta smettono di
    // funzionare, con un errore che non nomina né wasm né CSP.
    expect(config).toContain("'wasm-unsafe-eval'");
  });

  it("`wasm-unsafe-eval` non è confinato allo sviluppo", () => {
    // Il difetto originale era esattamente questo: `'unsafe-eval'` c'è solo in
    // sviluppo, e con esso spariva la possibilità di compilare wasm.
    const riga = config
      .split("\n")
      .find((l) => l.includes("'wasm-unsafe-eval'") && !l.trimStart().startsWith("//"));
    expect(riga, "la direttiva deve essere incondizionata").toBeTruthy();
    expect(riga).not.toContain("NODE_ENV");
  });

  it("non concede `unsafe-eval` in produzione", () => {
    // `wasm-unsafe-eval` autorizza SOLO WebAssembly. Se qualcuno "risolvesse"
    // un problema simile aprendo `unsafe-eval` anche in produzione, aprirebbe
    // anche l'esecuzione di JavaScript arbitrario.
    expect(config).toMatch(/development"\s*\?\s*\["'unsafe-eval'"\]/);
  });
});
