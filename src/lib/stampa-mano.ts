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

export function apriStampaMano(mano: ManoDaStampare): void {
  try {
    localStorage.setItem(CHIAVE_STAMPA, JSON.stringify({ ...mano, quando: new Date().toISOString() }));
  } catch {
    // Senza memoria del browser la pagina di stampa dirà che non ha la mano.
  }
  window.open("/stampa-mano", "_blank", "noopener");
}

export function leggiManoDaStampare(): (ManoDaStampare & { quando?: string }) | null {
  try {
    const grezzo = localStorage.getItem(CHIAVE_STAMPA);
    return grezzo ? JSON.parse(grezzo) : null;
  } catch {
    return null;
  }
}
