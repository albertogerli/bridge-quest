"use client";

import { useEffect, useState } from "react";

/** Il numero da cui il server parte, uguale per tutti: lo si cambia subito dopo il mount. */
const SERIE_DEL_SERVER = 2026;

/** Un numero della serie a sei cifre, facile da annotare e da ridettare. */
export function serieCasuale(): number {
  return 100_000 + Math.floor(Math.random() * 900_000);
}

/**
 * Il numero della serie da cui si generano le mani, scelto a caso a ogni
 * apertura della pagina.
 *
 * Partiva fisso da 2026 in sei pagine: ogni insegnante, ogni volta, riceveva
 * la stessa serie, e «Altre mani» passava a 2027, 2028… sempre nello stesso
 * ordine. Un'insegnante che aveva generato 44 volte ha creduto che le mani
 * venissero da un archivio di poche decine (25/10/2026). Il generatore
 * mescola davvero tutto il mazzo: era il punto di partenza a ripetersi.
 *
 * La serie resta riproducibile — il numero si vede, si annota e si riscrive —
 * ma il punto di partenza non è più lo stesso per tutti.
 *
 * Il primo render usa un numero fisso perché la pagina passa anche dal server,
 * e un numero diverso fra server e browser romperebbe l'idratazione.
 */
export function useSerieCasuale(): [number, React.Dispatch<React.SetStateAction<number>>] {
  const [serie, setSerie] = useState(SERIE_DEL_SERVER);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- il numero casuale si può scegliere solo nel browser, dopo l'idratazione: sul server sarebbe diverso
    setSerie(serieCasuale());
  }, []);
  return [serie, setSerie];
}
