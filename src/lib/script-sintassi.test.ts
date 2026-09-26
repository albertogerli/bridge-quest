import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Gli script in `scripts/` almeno si compilano.
 *
 * PERCHÉ SERVE. `npx tsc --noEmit` guarda TypeScript, `npm test` guarda i
 * `*.test.ts`, `npx eslint src` guarda `src/`. Gli `.mjs` dentro `scripts/`
 * non li guarda nessuno, e alcuni non si possono nemmeno eseguire qui:
 * `test-rls.mjs` si rifiuta di girare contro la produzione — giustamente — e
 * quindi in pratica gira solo in CI, contro un progetto isolato.
 *
 * Il 26/09/2026 ci ho aggiunto due casi mettendo una parentesi graffa nel
 * posto sbagliato. Il file è rimasto rotto per un'ora senza che niente lo
 * dicesse: `SyntaxError` si vede solo eseguendolo, e quello lì non si
 * eseguiva. Un controllo di sintassi costa un decimo di secondo a file ed è
 * esattamente il livello di garanzia che manca.
 *
 * NON DICE CHE FUNZIONANO. Dice che si leggono. È poco, ed è infinitamente
 * più di zero.
 */
const CARTELLA = join(__dirname, "..", "..", "scripts");

const script = readdirSync(CARTELLA, { withFileTypes: true })
  .filter((v) => v.isFile() && v.name.endsWith(".mjs"))
  .map((v) => v.name)
  .sort();

describe("gli script in scripts/ si leggono", () => {
  it("ce n'è più d'uno da controllare", () => {
    expect(script.length).toBeGreaterThan(5);
  });

  it.each(script)("%s", (nome) => {
    expect(() =>
      execFileSync(process.execPath, ["--check", join(CARTELLA, nome)], { stdio: "pipe" }),
    ).not.toThrow();
  });
});
