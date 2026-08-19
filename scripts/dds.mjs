/**
 * Il double dummy solver, importabile da uno script `node` normale.
 *
 * Chi ha bisogno del DDS in uno script di manutenzione scrive:
 *
 *   import { loadDds, Dds } from "./dds.mjs";
 *
 * e non deve sapere niente del perché serve un hook (sta in
 * `scripts/dds-risoluzione.mjs`). L'`await import` dopo la registrazione è
 * necessario: un `import` statico si risolverebbe PRIMA che l'hook esista.
 */
import { register } from "node:module";

register("./dds-risoluzione.mjs", import.meta.url);

const modulo = await import("bridge-dds");
const api = modulo.default ?? modulo;

export const { loadDds, Dds } = api;
export default api;
