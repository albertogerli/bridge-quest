/**
 * Il torneo di licita, con l'asta tenuta dal server.
 *
 * PERCHÉ
 * Fino a ottobre 2026 il browser riceveva le quattro mani, la tabella double
 * dummy e le distribuzioni del valore atteso della smazzata in corso, e a fine
 * asta scriveva lui contratto, punteggio e stelle. Bastavano gli strumenti di
 * sviluppo per vedere le carte degli avversari o per darsi tre stelle.
 *
 * Adesso il browser vede solo la mano di Sud finché l'asta è aperta; le
 * dichiarazioni dei robot le chiede il server a BEN, e il voto lo calcola il
 * server da asta e smazzata. A asta chiusa la mano intera torna al browser,
 * che la mostra nel riepilogo come prima.
 *
 * Qui sta la parte pura, senza database né rete: la rotta
 * (`/api/licita/torneo`) la usa per decidere, e la pagina la usa per scrivere
 * il commento nella lingua di chi gioca. Lo stesso calcolo nei due posti è il
 * motivo per cui il commento non può contraddire le stelle registrate.
 */

import type { Card, Position } from "./bridge-engine";
import type { Vulnerability } from "./catalog";
import type { DdsTable } from "./dds-table";
import { astaChiusa, esitoAsta, turnoDi, type EsitoAsta } from "./licita-mano";
import { dichiarazioniLecite } from "./asta";
import { evDelContratto, riferimento, type ManoCondivisa } from "./mani-condivise";
import { contestoDaEsito, valutaLicita, type EsitoLicita, type Traduttore } from "./stelle-licita";

export type ManoTorneo = ManoCondivisa & { numero: number };

/** Ciò che il browser vede mentre l'asta è aperta: niente che riveli le altre mani. */
export interface VistaAperta {
  chiusa: false;
  manoId: string;
  numero: number;
  dealer: Position;
  vulnerability: Vulnerability;
  sud: Card[];
  bids: string[];
  turno: Position;
}

/** A asta chiusa: la mano intera e il risultato registrato. */
export interface VistaChiusa {
  chiusa: true;
  mano: ManoTorneo;
  bids: string[];
}

export function vistaAperta(mano: ManoTorneo, bids: string[]): VistaAperta {
  return {
    chiusa: false,
    manoId: mano.id,
    numero: mano.numero,
    dealer: mano.dealer,
    vulnerability: mano.vulnerability,
    sud: mano.hands.south,
    bids,
    turno: turnoDi(mano.dealer, bids),
  };
}

/** Vero se Sud può fare questa dichiarazione adesso. */
export function dichiarazioneDiSudAmmessa(dealer: Position, bids: readonly string[], bid: string): boolean {
  if (astaChiusa(bids) || turnoDi(dealer, bids) !== "south") return false;
  const l = dichiarazioniLecite(dealer, bids);
  if (bid === "P") return l.passo;
  if (bid === "X") return l.contro;
  if (bid === "XX") return l.surcontro;
  return l.contratti.includes(bid);
}

export interface VotoMano {
  esito: EsitoAsta | null;
  voto: EsitoLicita;
}

/**
 * Il voto di un'asta chiusa: lo stesso calcolo che la pagina faceva prima,
 * spostato qui perché lo facciano server e pagina insieme.
 *
 * Il server ne prende le stelle e il punteggio; la pagina il commento, nella
 * propria lingua (`tr`). Il commento non cambia le stelle (`valutaLicita`).
 */
export function votoMano(mano: ManoCondivisa, bids: readonly string[], tr?: Traduttore): VotoMano | null {
  if (!mano.dd_table) return null;
  const tavola = { tricks: mano.dd_table } as DdsTable;
  const e = esitoAsta(bids, mano.dealer, tavola, mano.vulnerability);
  const rif = riferimento(mano, "ns");
  const perStelle =
    e && rif.metro === "atteso"
      ? (evDelContratto(mano, { level: e.level, strain: e.strain, declarer: e.declarer, doppio: e.doppio }) ??
         e.punteggio)
      : (e?.punteggio ?? 0);
  const voto = valutaLicita(perStelle, rif.punteggio, rif.metro, e?.punteggio, {
    contesto: contestoDaEsito(e),
    tr,
  });
  return { esito: e, voto };
}
