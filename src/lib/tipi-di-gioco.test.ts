import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'unione `GameType` e il CHECK del database dicono la stessa cosa.
 *
 * COSA È SUCCESSO IL 26/09/2026. Ho strumentato cinque giochi che non
 * lasciavano traccia e ho aggiunto i loro nomi all'unione TypeScript. Il
 * database però ha un CHECK con l'elenco dei valori ammessi per
 * `game_results.game_type`, e quei cinque non c'erano: ogni partita finita
 * veniva rifiutata con 23514.
 *
 * L'instrumentazione non ha salvato UNA riga. Il giorno prima avevo scritto
 * che «contare zero righe di una tabella in cui nessuno scrive non dice che
 * nessuno gioca» — e poi ho fatto scrivere in una tabella che rifiutava.
 *
 * DUE ELENCHI IN DUE LINGUAGGI CHE DEVONO COINCIDERE. Il tipo non lo può
 * garantire: TypeScript non sa cosa c'è nel database, e il database non sa
 * cosa c'è nel tipo. L'unica cosa che può accorgersene è questo confronto,
 * e infatti finché non c'era non se n'è accorto nessuno per un giorno.
 */
const RADICE = join(__dirname, "..");

function tipiDalTypeScript(): string[] {
  const sorgente = readFileSync(join(RADICE, "hooks", "use-game-results.ts"), "utf8");
  const blocco = sorgente.slice(
    sorgente.indexOf("export type GameType ="),
    sorgente.indexOf(";", sorgente.indexOf("export type GameType =")),
  );
  return [...blocco.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]).sort();
}

function tipiDalDatabase(): string[] {
  const baseline = readFileSync(join(RADICE, "..", "scripts", "sql", "000-schema-baseline.sql"), "utf8");
  const riga = baseline
    .split("\n")
    .find((r) => r.includes("game_results_game_type_check"));
  if (!riga) throw new Error("game_results_game_type_check non trovato nella baseline");
  return [...riga.matchAll(/'([a-z-]+)'::text/g)].map((m) => m[1]).sort();
}

describe("i tipi di gioco: TypeScript e database", () => {
  it("l'elenco si trova da tutte e due le parti", () => {
    expect(tipiDalTypeScript().length).toBeGreaterThan(10);
    expect(tipiDalDatabase().length).toBeGreaterThan(10);
  });

  it("i due elenchi coincidono, uno a uno", () => {
    const ts = tipiDalTypeScript();
    const db = tipiDalDatabase();
    expect(
      ts.filter((t) => !db.includes(t)),
      "tipi nel TypeScript che il database RIFIUTA: aggiungili al CHECK con " +
        "uno script in scripts/sql/, o le partite di quei giochi non si salvano",
    ).toEqual([]);
    expect(
      db.filter((t) => !ts.includes(t)),
      "tipi ammessi dal database che il TypeScript non conosce: o è codice " +
        "morto, o manca una voce nell'unione GameType",
    ).toEqual([]);
  });
});
