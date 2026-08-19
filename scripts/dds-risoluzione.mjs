/**
 * Hook di risoluzione per far caricare `bridge-dds` da Node puro.
 *
 * IL PROBLEMA. Il pacchetto è pubblicato con dentro `import DdsLoader from
 * "./lib/dds"` — senza estensione — e senza `"type": "module"` nel suo
 * package.json. Node dalla 22 riconosce la sintassi ESM e da lì in poi applica
 * la risoluzione ESM, che l'estensione la pretende. Risultato:
 *
 *   Cannot find module .../node_modules/bridge-dds/dist/lib/dds
 *
 * Sotto Next e sotto vitest non si vede, perché a risolvere è il bundler, che
 * le estensioni le prova da solo. Da `node` puro no: ed è per questo che gli
 * script di manutenzione dicevano «modulo DDS non disponibile in questo
 * ambiente». Non mancava: era irrisolvibile.
 *
 * QUI si aggiunge `.js` quando la risoluzione normale fallisce. Vale SOLO per
 * i file dentro `bridge-dds`: un'estensione dimenticata nel nostro codice deve
 * continuare a fallire, non essere aggiustata di nascosto.
 *
 * Non si usa direttamente: `scripts/dds.mjs` lo registra e riesporta il DDS.
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (errore) {
    const interno =
      specifier.startsWith(".") &&
      !/\.(js|mjs|cjs|json|wasm)$/.test(specifier) &&
      (context.parentURL ?? "").includes("bridge-dds");
    if (!interno) throw errore;
    return nextResolve(`${specifier}.js`, context);
  }
}
