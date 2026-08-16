/**
 * Le chiavi, da dove ci sono.
 *
 * Sul portatile stanno in `.env.local`; su un runner di GitHub non esiste
 * nessun file — arrivano dall'ambiente, dai segreti. Gli script che leggevano
 * solo il file morivano in CI con un ENOENT che non dice niente a chi lo
 * incontra («no such file or directory: .env.local»), ed è esattamente come è
 * fallita la prima esecuzione delle verifiche notturne, il 16/08/2026.
 *
 * L'ordine è: prima l'ambiente, poi il file. Così in CI funziona senza file, e
 * in locale si può ancora scavalcare una chiave per un singolo comando
 * (`SUPABASE_SERVICE_ROLE_KEY=... node scripts/...`) senza toccare `.env.local`.
 */
import { readFileSync } from "node:fs";

/**
 * @param {string[]} richieste nomi che devono esserci; se ne manca uno lo dice
 *   e termina, invece di far fallire più avanti una chiamata con `undefined`.
 * @returns {Record<string, string>}
 */
export function leggiEnv(richieste = []) {
  const dalFile = {};
  try {
    const testo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const riga of testo.split("\n")) {
      if (!riga.includes("=") || riga.trimStart().startsWith("#")) continue;
      const i = riga.indexOf("=");
      dalFile[riga.slice(0, i).trim()] = riga.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // Nessun `.env.local`: è la norma in CI, non un problema.
  }

  const env = { ...dalFile, ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v)) };

  const mancanti = richieste.filter((k) => !env[k]);
  if (mancanti.length) {
    console.error(
      `Mancano queste chiavi: ${mancanti.join(", ")}.\n` +
        "In locale vanno in .env.local; su GitHub nei segreti dell'ambiente `verifiche`."
    );
    process.exit(1);
  }
  return env;
}
