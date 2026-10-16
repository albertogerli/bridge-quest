/**
 * La pagina del torneo di licita parla con `/api/licita/torneo`.
 *
 * Tutte le risposte della rotta finiscono in un tipo solo, così la pagina ha
 * un `switch` e non una fila di `if` su campi opzionali. Vedi
 * `torneo-licita-server.ts` per il perché dell'asta sul server.
 */

import { motivoDa, type MotivoBen } from "./ben-client";
import type { EsitoRegistrazione } from "./mani-condivise";
import type { ManoTorneo, VistaAperta } from "./torneo-licita-server";

export type AzioneTorneo = "stato" | "dichiara" | "robot";

export type RispostaTorneo =
  /** Nessuna mano da dichiarare: torneo finito o chiuso. */
  | { tipo: "finito" }
  | {
      tipo: "aperta";
      vista: VistaAperta;
      avversarioMuto: boolean;
      /** Il compagno non ha dichiarato: perché, per dire se riprovare serve. */
      compagnoMuto: MotivoBen | null;
    }
  | {
      tipo: "chiusa";
      mano: ManoTorneo;
      bids: string[];
      avversarioMuto: boolean;
      registrazione: EsitoRegistrazione;
    }
  | { tipo: "errore"; registrazione: EsitoRegistrazione };

export async function chiamaTorneo(torneoId: string, azione: AzioneTorneo, bid?: string): Promise<RispostaTorneo> {
  let res: Response;
  try {
    res = await fetch("/api/licita/torneo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ torneoId, azione, bid }),
    });
  } catch {
    return { tipo: "errore", registrazione: "errore" };
  }
  const dati = await res.json().catch(() => null);
  return leggiRisposta(res.status, dati);
}

/** Separata dalla rete perché si possa provare senza un server. */
export function leggiRisposta(status: number, dati: unknown): RispostaTorneo {
  const d = (dati ?? {}) as Record<string, unknown>;
  if (status === 401) return { tipo: "errore", registrazione: "sessione-scaduta" };
  if (d.finito === true) return { tipo: "finito" };
  if (d.chiusa === true && d.mano) {
    return {
      tipo: "chiusa",
      mano: d.mano as ManoTorneo,
      bids: (d.bids as string[]) ?? [],
      avversarioMuto: d.avversarioMuto === true,
      registrazione: d.registrazione === "gia-presente" ? "gia-presente" : "salvato",
    };
  }
  // Anche il 409 (dichiarazione rifiutata) porta lo stato dell'asta: la
  // pagina si riallinea a quello invece di restare su un'asta che il server
  // non ha.
  if (d.chiusa === false && Array.isArray(d.sud)) {
    const vista = d as unknown as VistaAperta;
    return {
      tipo: "aperta",
      vista,
      avversarioMuto: d.avversarioMuto === true,
      compagnoMuto: d.compagnoMuto === true ? motivoDa(Number(d.benStatus) || 502, d.benErrore) : null,
    };
  }
  return { tipo: "errore", registrazione: "errore" };
}

/**
 * La mano come la pagina la tiene in stato, mentre l'asta è aperta: solo Sud
 * ha carte, e niente tabella né distribuzioni. A asta chiusa la sostituisce
 * la mano intera che manda il server.
 */
export function manoParziale(v: VistaAperta): ManoTorneo {
  return {
    id: v.manoId,
    numero: v.numero,
    dealer: v.dealer,
    vulnerability: v.vulnerability,
    hands: { south: v.sud, north: [], east: [], west: [] },
    par_contracts: null,
    par_score: null,
    dd_table: null,
    valore_atteso: null,
    distribuzioni: null,
    scenario: null,
  };
}
