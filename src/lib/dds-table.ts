/**
 * Tabella double dummy e contratto par, tramite la libreria ufficiale
 * `dds-bridge/dds` compilata in WebAssembly (pacchetto `bridge-dds`).
 *
 * PERCHÉ UNA LIBRERIA ESTERNA
 * `dds-solver.ts` fa ricerca esatta solo fino a 6 carte per mano: su una
 * smazzata intera restituisce una stima euristica. Un motore esatto scritto in
 * casa (`dds-exact.ts`) è corretto ma impiega 11-20 secondi per singolo atout,
 * e il par ne richiede dieci. Questa libreria calcola l'intera tabella in
 * 25-340 ms perché è il motore C++ di riferimento, con vent'anni di verifiche
 * alle spalle.
 *
 * VERIFICATA, NON PRESA SULLA FIDUCIA
 * I suoi risultati sono stati incrociati con `dds-exact.ts` su smazzate
 * intere, a senza atout e a colore: concordano. `dds-exact.ts` resta in
 * codice proprio come riscontro indipendente — è ciò che permette di
 * accorgersi se un aggiornamento della libreria cambiasse i numeri.
 *
 * IL MODULO SI CARICA UNA VOLTA SOLA
 * `loadDds()` inizializza il WebAssembly: ripeterlo per ogni mano
 * sprecherebbe centinaia di millisecondi. La promessa è condivisa.
 */

import { Dds, loadDds } from "bridge-dds";
import type { Card, Position, Suit } from "./bridge-engine";
import { dealToPbnString } from "./pbn";
import type { Vulnerability } from "./catalog";

/** Ordine dei semi nella tabella di DDS: picche, cuori, quadri, fiori, senza. */
const STRAIN_ORDER = ["spade", "heart", "diamond", "club", "notrump"] as const;
export type TableStrain = (typeof STRAIN_ORDER)[number];

/** Ordine dei dichiaranti nella tabella. */
const DECLARER_ORDER: Position[] = ["north", "east", "south", "west"];

const SYMBOL: Record<TableStrain, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
  notrump: "SA",
};

/** Codici di vulnerabilità attesi da `DealerPar`. */
const VULN_CODE: Record<Vulnerability, number> = { none: 0, both: 1, ns: 2, ew: 3 };

let modulePromise: Promise<Dds> | null = null;

/** Istanza condivisa: il WebAssembly si inizializza una volta per sessione. */
function getDds(): Promise<Dds> {
  if (!modulePromise) {
    modulePromise = loadDds().then((m) => new Dds(m));
  }
  return modulePromise;
}

export interface DdsTable {
  /** Prese del dichiarante per ogni combinazione seme/dichiarante. */
  tricks: Record<TableStrain, Record<Position, number>>;
}

export interface ParResult {
  /** Punteggio del par dal punto di vista di Nord-Sud. */
  score: number;
  /** Contratti par, es. ["5D-NS", "3N-NS"]. */
  contracts: string[];
}

/** Tabella completa: 5 semi × 4 dichiaranti. */
export async function calcDdsTable(hands: Record<Position, Card[]>): Promise<DdsTable> {
  const dds = await getDds();
  const res = dds.CalcDDTablePBN({ cards: dealToPbnString(hands) }).resTable;

  const tricks = {} as Record<TableStrain, Record<Position, number>>;
  STRAIN_ORDER.forEach((strain, s) => {
    tricks[strain] = {} as Record<Position, number>;
    DECLARER_ORDER.forEach((declarer, d) => {
      tricks[strain][declarer] = res[s][d];
    });
  });
  return { tricks };
}

/**
 * Contratto par: il risultato che si otterrebbe se entrambe le linee
 * dichiarassero in modo ottimale conoscendo tutte le carte.
 *
 * Dipende da dichiarante e vulnerabilità perché il par è un fatto di
 * punteggio, non solo di prese: a favore di zona una manche vale il sacrificio
 * che in altra zona non converrebbe.
 */
export async function calcPar(
  hands: Record<Position, Card[]>,
  dealer: Position,
  vulnerability: Vulnerability
): Promise<ParResult> {
  const dds = await getDds();
  const table = dds.CalcDDTablePBN({ cards: dealToPbnString(hands) });
  const par = dds.DealerPar(table, DECLARER_ORDER.indexOf(dealer), VULN_CODE[vulnerability]);
  return { score: par.score, contracts: par.contracts };
}

/** Tabella e par in una sola risoluzione, che è la parte costosa. */
export async function calcTableAndPar(
  hands: Record<Position, Card[]>,
  dealer: Position,
  vulnerability: Vulnerability
): Promise<{ table: DdsTable; par: ParResult }> {
  const dds = await getDds();
  const raw = dds.CalcDDTablePBN({ cards: dealToPbnString(hands) });

  const tricks = {} as Record<TableStrain, Record<Position, number>>;
  STRAIN_ORDER.forEach((strain, s) => {
    tricks[strain] = {} as Record<Position, number>;
    DECLARER_ORDER.forEach((declarer, d) => {
      tricks[strain][declarer] = raw.resTable[s][d];
    });
  });

  const par = dds.DealerPar(raw, DECLARER_ORDER.indexOf(dealer), VULN_CODE[vulnerability]);
  return { table: { tricks }, par: { score: par.score, contracts: par.contracts } };
}

/**
 * Contratto giocabile più alto per una coppia, dedotto dalla tabella.
 *
 * Serve al generatore: invece di far scegliere all'insegnante un contratto
 * uguale per tutte le mani — che su alcune sarebbe impossibile e su altre
 * troppo timido — si propone quello che le carte reggono davvero.
 * Restituisce `null` se la coppia non mantiene nemmeno un contratto a livello 1.
 */
export function bestContractFor(
  table: DdsTable,
  side: "ns" | "ew"
): { contract: string; declarer: Position; tricks: number } | null {
  const seats: Position[] = side === "ns" ? ["north", "south"] : ["east", "west"];
  let best: { contract: string; declarer: Position; tricks: number } | null = null;

  for (const strain of STRAIN_ORDER) {
    for (const declarer of seats) {
      const tricks = table.tricks[strain][declarer];
      const level = tricks - 6;
      if (level < 1) continue;
      // A parità di livello si preferisce il senza atout, che vale di più:
      // è l'ordine in cui STRAIN_ORDER mette per ultimo il senza, quindi si
      // confronta esplicitamente invece di affidarsi all'ordine di scansione.
      if (
        !best ||
        level > best.tricks - 6 ||
        (level === best.tricks - 6 && strain === "notrump" && !best.contract.endsWith("SA"))
      ) {
        best = { contract: `${level}${SYMBOL[strain]}`, declarer, tricks };
      }
    }
  }
  return best;
}

/** Simbolo del seme per una colonna della tabella. */
export function strainSymbol(strain: TableStrain): string {
  return SYMBOL[strain];
}

/** Semi nell'ordine della tabella, per l'interfaccia. */
export const TABLE_STRAINS: readonly TableStrain[] = STRAIN_ORDER;

/** Converte un seme di gioco nella colonna corrispondente. */
export function strainOf(suit: Suit | null): TableStrain {
  return suit === null ? "notrump" : suit;
}
