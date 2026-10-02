import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ogni script SQL nuovo deve registrarsi in `public.script_applicati`.
 *
 * Gli script si eseguono a mano: senza l'ultima riga che li registra,
 * `node scripts/sql-stato.mjs` non può dire se sono passati, e dimenticarne
 * uno torna a essere invisibile. Quelli anteriori al registro sono elencati
 * come retroattivi dentro `registro-script-2026-10.sql`.
 */
const DIR = join(process.cwd(), "scripts/sql");

describe("registro degli script SQL", () => {
  const registro = readFileSync(join(DIR, "registro-script-2026-10.sql"), "utf8");
  const retroattivi = new Set([...registro.matchAll(/\('([^']+\.sql)', true\)/g)].map((m) => m[1]));

  it("ogni script non retroattivo si registra da solo", () => {
    const senza = readdirSync(DIR)
      .filter((f) => f.endsWith(".sql") && !f.includes("rollback") && !f.startsWith("000-") && !f.startsWith("test-") && !retroattivi.has(f))
      .filter((f) => {
        const testo = readFileSync(join(DIR, f), "utf8");
        return !testo.includes("insert into public.script_applicati") || !testo.includes(`'${f}'`);
      });
    expect(senza).toEqual([]);
  });
});
