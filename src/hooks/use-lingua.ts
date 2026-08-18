"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { conLingua, linguaDaPercorso, senzaLingua, type Lingua } from "@/lib/lingua";

/**
 * La lingua della pagina, letta dall'indirizzo.
 *
 * NON DA UN CONTESTO E NON DA UN COOKIE: l'indirizzo è già la verità, e
 * qualunque copia di quella verità può divergere da essa. `usePathname`
 * restituisce l'indirizzo che si vede — `/en/lezioni` — anche quando il proxy
 * ha riscritto internamente verso `/lezioni`, che è esattamente ciò che serve.
 *
 * Imposta anche `lang` sull'elemento radice: il layout è statico e non può
 * saperlo al momento della generazione, ma senza quell'attributo i lettori di
 * schermo pronunciano l'inglese con le regole dell'italiano, e i browser
 * offrono di tradurre una pagina già tradotta.
 */
export function useLingua(): {
  lingua: Lingua;
  /** L'indirizzo corrente in un'altra lingua, per il selettore. */
  versoLingua: (l: Lingua) => string;
} {
  const percorso = usePathname() ?? "/";
  const lingua = linguaDaPercorso(percorso);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lingua;
    }
  }, [lingua]);

  return {
    lingua,
    versoLingua: (l: Lingua) => conLingua(percorso, l),
  };
}

/**
 * Il percorso SENZA il prefisso di lingua: quello con cui l'applicazione
 * ragiona da sempre.
 *
 * PERCHÉ ESISTE, e perché va usato ovunque si confronti un percorso con una
 * rotta. `usePathname()` restituisce `/en/gioca`, e ogni confronto scritto
 * prima dell'inglese — `pathname === "/"`, `pathname.startsWith("/gioca")` —
 * diventa falso sotto `/en`. Il difetto non si manifesta come un errore ma
 * come un comportamento assurdo: il 18/08/2026 il controllo delle rotte
 * pubbliche non riconosceva `/en` come pubblica e spediva al login chiunque
 * aprisse la home inglese.
 *
 * È una classe di errori, non un errore: ogni confronto di percorso scritto da
 * qui in avanti deve passare da questa funzione. La barra di navigazione che
 * non evidenzia la voce giusta è la versione innocua; il controllo d'accesso
 * che sbaglia è quella che conta.
 */
export function usePercorso(): string {
  const percorso = usePathname() ?? "/";
  return senzaLingua(percorso);
}
