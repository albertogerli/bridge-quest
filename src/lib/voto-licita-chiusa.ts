import type { Card, Position } from "@/lib/bridge-engine";
import type { Vulnerability } from "@/lib/catalog";
import type { DdsTable, ParResult } from "@/lib/dds-table";
import { esitoAsta, type EsitoAsta } from "@/lib/licita-mano";
import { contestoDaEsito, valutaLicita, type EsitoLicita, type Traduttore } from "@/lib/stelle-licita";

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
  tr?: Traduttore,
): { esito: EsitoAsta | null; voto: EsitoLicita } {
  const esito = esitoAsta(bids, dealer, dati.table, vulnerability);
  // Il contesto serve al commento: chi ha giocato e se è caduto decidono se
  // si parla di manche mancata, di sacrificio o di difesa.
  const voto = valutaLicita(esito ? esito.punteggio : 0, dati.par.score, "esatto", undefined, {
    contesto: contestoDaEsito(esito),
    tr,
  });
  return { esito, voto };
}

export type ManiComplete = Record<Position, Card[]>;
