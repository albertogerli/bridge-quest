import type { Card, Position } from "@/lib/bridge-engine";
import type { PresaGiocata } from "@/lib/giornale-mano";

/**
 * La mano da stampare passa alla pagina di stampa attraverso il browser.
 *
 * Non per indirizzo: una mano intera con il gioco sono centinaia di caratteri
 * e finirebbe nei log del server. Non per database: stampare non deve
 * richiedere di essere collegati. `localStorage` perché la scheda nuova non
 * eredita sempre la `sessionStorage` di quella che l'ha aperta.
 */
export const CHIAVE_STAMPA = "bq_stampa_mano";

export interface ManoDaStampare {
  titolo?: string;
  mani: Record<Position, Card[]>;
  prese: PresaGiocata[];
  contratto: string;
  dichiarante: Position;
  risultato?: string;
}

/** Una mano, o una cartella intera: una per pagina. */
export function apriStampaMano(mano: ManoDaStampare | ManoDaStampare[]): void {
  try {
    const quando = new Date().toISOString();
    const lista = Array.isArray(mano) ? mano : [mano];
    localStorage.setItem(CHIAVE_STAMPA, JSON.stringify(lista.map((m) => ({ ...m, quando }))));
  } catch {
    // Senza memoria del browser la pagina di stampa dirà che non ha la mano.
  }
  window.open("/stampa-mano", "_blank", "noopener");
}

export function leggiManiDaStampare(): (ManoDaStampare & { quando?: string })[] | null {
  try {
    const grezzo = localStorage.getItem(CHIAVE_STAMPA);
    if (!grezzo) return null;
    const dati = JSON.parse(grezzo);
    // Il formato di prima era una mano sola: la si accetta ancora.
    return Array.isArray(dati) ? dati : [dati];
  } catch {
    return null;
  }
}
