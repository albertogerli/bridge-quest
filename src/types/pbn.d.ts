/**
 * Il pacchetto `pbn` non porta i propri tipi.
 *
 * Serve solo nei test, per rileggere il nostro export con un parser che non è
 * il nostro: qui basta dire a TypeScript che esiste e che restituisce uno
 * stream di trasformazione. Descriverne meglio gli eventi vorrebbe dire
 * ricopiare la forma che il test deve verificare, invece di darla per buona.
 */
declare module "pbn" {
  import type { Transform } from "node:stream";
  function pbn(): Transform;
  export = pbn;
}
