import { headers } from "next/headers";
import { traduci, type Dizionario } from "@/lib/traduzioni";
import { LINGUA_PREDEFINITA, type Lingua } from "@/lib/lingua";
import en from "@/traduzioni/en.json";

/**
 * Tradurre in un componente SERVER.
 *
 * PERCHÉ NON BASTA `useT()`. È un hook: in un componente server non gira. E il
 * server non può nemmeno leggere la lingua dall'indirizzo, perché `/en/...` è
 * una RISCRITTURA — il browser mostra `/en`, il server riceve `/`. Il risultato
 * era che le pagine rese sul server restavano in italiano anche sotto `/en`
 * senza che niente lo segnalasse: `/accessibilita`, per dirne una, sono
 * quarantatré frasi che nessun controllo vedeva.
 *
 * La lingua arriva da un'intestazione che mette il proxy (`src/proxy.ts`).
 *
 * IL DIZIONARIO SI IMPORTA, non si carica a runtime: sul server è un file
 * dell'applicazione, e importarlo lo rende parte del pacchetto invece di una
 * lettura da fare a ogni richiesta.
 *
 * PERCHÉ NON SI SPOSTANO QUESTE PAGINE SUL CLIENT. Sono testi lunghi e statici
 * — accessibilità, note legali — e renderle sul client vorrebbe dire perdere
 * l'indicizzazione e mostrare uno scheletro vuoto a chi arriva da una ricerca.
 * Il costo di questo file è dieci righe; quello sarebbe una pagina peggiore.
 */
export async function tServer(): Promise<(frase: string) => string> {
  const h = await headers();
  const lingua = (h.get("x-bridgelab-lingua") as Lingua | null) ?? LINGUA_PREDEFINITA;
  const dizionario: Dizionario | null =
    lingua === LINGUA_PREDEFINITA ? null : (en as Dizionario);
  return (frase: string) => traduci(frase, dizionario);
}

/** La lingua di questa richiesta, per chi deve solo saperla. */
export async function linguaServer(): Promise<Lingua> {
  const h = await headers();
  return (h.get("x-bridgelab-lingua") as Lingua | null) ?? LINGUA_PREDEFINITA;
}
