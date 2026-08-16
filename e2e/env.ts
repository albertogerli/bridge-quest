import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Le chiavi per le prove dal browser: prima l'ambiente, poi `.env.local`.
 *
 * Sul portatile stanno nel file, su un runner di GitHub nei segreti. Qui la
 * differenza pesa più che altrove per via del TEARDOWN: se non trova le chiavi
 * lancia un'eccezione, e l'utente di prova creato in `global-setup` resta in
 * produzione — un `e2e-...@bridgelab-test.invalid` in più a ogni notte.
 * Gemello di `scripts/leggi-env.mjs`, per la stessa ragione.
 */
export function leggiEnv(richieste: string[] = []): Record<string, string> {
  const dalFile: Record<string, string> = {};
  try {
    const testo = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const riga of testo.split("\n")) {
      if (!riga.includes("=") || riga.trimStart().startsWith("#")) continue;
      const i = riga.indexOf("=");
      dalFile[riga.slice(0, i).trim()] = riga
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  } catch {
    // Nessun `.env.local`: è la norma in CI.
  }

  const env: Record<string, string> = { ...dalFile };
  for (const [k, v] of Object.entries(process.env)) if (v) env[k] = v;

  const mancanti = richieste.filter((k) => !env[k]);
  if (mancanti.length) {
    throw new Error(
      `Mancano queste chiavi: ${mancanti.join(", ")}. ` +
        "In locale vanno in .env.local; su GitHub nei segreti dell'ambiente `verifiche`."
    );
  }
  return env;
}
