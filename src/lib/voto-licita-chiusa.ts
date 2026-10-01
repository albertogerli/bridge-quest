import type { Card, Position } from "@/lib/bridge-engine";
import type { Vulnerability } from "@/lib/catalog";
import type { DdsTable, ParResult } from "@/lib/dds-table";
import { esitoAsta, type EsitoAsta } from "@/lib/licita-mano";
import { valutaLicita, type EsitoLicita } from "@/lib/stelle-licita";

/**
 * Il voto di una licita chiusa, dato tabella e par della smazzata.
 *
 * UNA FUNZIONE SOLA per il riquadro di fine mano e per il riepilogo della
 * serie: se le stelle di una mano si calcolassero in due posti, prima o poi il
 * totale della serie direbbe un numero e la mano un altro — è il difetto delle
 * stelline che «non combaciano» visto il 01/10/2026 su un'altra pagina.
 *
 * Il metro è il par ESATTO, dal punto di vista di Nord-Sud: nella licita con
 * un amico i due amici sono Nord e Sud, e le mani non hanno il valore atteso
 * pre-calcolato delle mani della scorta.
 */
export function votoLicitaChiusa(
  bids: readonly string[],
  dealer: Position,
  vulnerability: Vulnerability,
  dati: { table: DdsTable; par: ParResult },
): { esito: EsitoAsta | null; voto: EsitoLicita } {
  const esito = esitoAsta(bids, dealer, dati.table, vulnerability);
  const voto = valutaLicita(esito ? esito.punteggio : 0, dati.par.score, "esatto");
  return { esito, voto };
}

export type ManiComplete = Record<Position, Card[]>;
