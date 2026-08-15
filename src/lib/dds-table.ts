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

import type { Card, Position, Rank, Suit } from "./bridge-engine";
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

/**
 * Accesso al motore double dummy.
 *
 * ATTENZIONE ALLA CSP
 * È WebAssembly: senza `'wasm-unsafe-eval'` in `script-src` la compilazione
 * viene rifiutata, e Emscripten muore con un errore che non c'entra nulla
 * («startsWith is not a function», sollevato dal suo ripiego). In sviluppo il
 * problema non si vede perché lì la CSP include `'unsafe-eval'`, che copre
 * anche il wasm: è così che il difetto è arrivato in produzione senza che
 * nessuna prova lo cogliesse. La direttiva è in next.config.ts, e
 * `next-config.test.ts` verifica che non sparisca.
 */
type DdsApi = {
  CalcDDTablePBN(d: { cards: string }): { resTable: number[][] };
  DealerPar(t: { resTable: number[][] }, dealer: number, vul: number): { score: number; contracts: string[] };
  SolveBoardPBN(
    d: { trump: number; first: number; currentTrickSuit: number[]; currentTrickRank: number[]; remainCards: string },
    target: number, solutions: number, mode: number
  ): { cards: number; suit: number[]; rank: number[]; equals: number[]; score: number[] };
};

let ddsPromise: Promise<DdsApi> | null = null;

function loadModule(): Promise<{ Dds: new (m: unknown) => DdsApi; loadDds: () => Promise<unknown> }> {
  return import("bridge-dds") as unknown as Promise<{
    Dds: new (m: unknown) => DdsApi;
    loadDds: () => Promise<unknown>;
  }>;
}

function getDds(): Promise<DdsApi> {
  if (!ddsPromise) {
    ddsPromise = loadModule().then(async ({ Dds, loadDds }) => new Dds(await loadDds()));
  }
  return ddsPromise;
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
  const { table } = await calcTableAndPar(hands, "north", "none");
  return table;
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
  const { par } = await calcTableAndPar(hands, dealer, vulnerability);
  return par;
}

/** Tabella e par in una sola risoluzione, che è la parte costosa. */
export async function calcTableAndPar(
  hands: Record<Position, Card[]>,
  dealer: Position,
  vulnerability: Vulnerability
): Promise<{ table: DdsTable; par: ParResult }> {
  const dds = await getDds();
  const raw = dds.CalcDDTablePBN({ cards: dealToPbnString(hands) });
  const par = dds.DealerPar(raw, DECLARER_ORDER.indexOf(dealer), VULN_CODE[vulnerability]);

  const tricks = {} as Record<TableStrain, Record<Position, number>>;
  STRAIN_ORDER.forEach((strain, s) => {
    tricks[strain] = {} as Record<Position, number>;
    DECLARER_ORDER.forEach((declarer, d) => {
      tricks[strain][declarer] = raw.resTable[s][d];
    });
  });

  return { table: { tricks }, par: { score: par.score, contracts: par.contracts } };
}

/**
 * Fit minimo perché un contratto a colore sia dichiarabile davvero.
 *
 * A carte scoperte un 4♠ può "passare" con sei carte di picche in due: il
 * double dummy lo vede, nessun giocatore lo dichiarerebbe mai. Sotto questa
 * soglia un contratto a colore va segnalato all'insegnante, non proposto in
 * silenzio a una classe.
 */
export const FIT_MINIMO = 7;

/** Carte di un colore nelle due mani di una linea. */
export function fitFor(
  hands: Record<Position, Card[]>,
  side: "ns" | "ew",
  strain: TableStrain
): number | null {
  if (strain === "notrump") return null;
  const seats: Position[] = side === "ns" ? ["north", "south"] : ["east", "west"];
  return seats.reduce((n, seat) => n + hands[seat].filter((c) => c.suit === strain).length, 0);
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


/** Risoluzione di una posizione parziale, usata da `dds-replay.ts`. */
export async function solveBoard(pbn: string, trump: number, first: number) {
  const dds = await getDds();
  return dds.SolveBoardPBN(
    { trump, first, currentTrickSuit: [], currentTrickRank: [], remainCards: pbn },
    -1, 3, 1
  );
}

/** Ordine dei semi come li numera la libreria: 0 picche … 3 fiori. */
const DDS_SUIT: Record<Suit, number> = { spade: 0, heart: 1, diamond: 2, club: 3 };
const SUIT_BY_INDEX: Suit[] = ["spade", "heart", "diamond", "club"];
/** La libreria numera i ranghi 2…14; il fante è 11, l'asso 14. */
const RANK_BY_VALUE: Record<number, Rank> = {
  14: "A", 13: "K", 12: "Q", 11: "J", 10: "10",
  9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2",
};
const VALUE_BY_RANK: Record<Rank, number> = {
  A: 14, K: 13, Q: 12, J: 11, "10": 10,
  "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
};

export interface OpzioneCarta {
  card: Card;
  /** Prese che la linea di chi gioca ottiene ancora, giocando questa carta. */
  tricks: number;
}

/**
 * Ogni carta giocabile con il suo esito, a carte scoperte.
 *
 * PERCHÉ NON BASTA «LA CARTA MIGLIORE»
 * A lezione la domanda non è quale sia la carta giusta, ma QUANTO costano le
 * altre. Un errore che regala una presa e uno che ne regala tre sono due
 * discorsi diversi, e mostrarli insieme fa vedere subito dove sta il bivio
 * vero e dove invece la scelta è indifferente.
 *
 * La libreria restituisce anche le carte EQUIVALENTI in forma compressa (un
 * K con la Q sotto è la stessa carta, ai fini del risultato): qui vengono
 * espanse, altrimenti metà delle carte in mano risulterebbe senza valutazione
 * e sembrerebbe un difetto.
 *
 * `hands` sono le carte ANCORA IN MANO; `currentTrick` le carte già uscite in
 * questa presa, in ordine; `leader` chi ha aperto la presa — non chi deve
 * giocare adesso.
 */
export async function cardOptions(
  hands: Record<Position, Card[]>,
  trump: Suit | null,
  leader: Position,
  currentTrick: readonly Card[] = []
): Promise<OpzioneCarta[]> {
  // A mano finita non c'è più niente da valutare, e chiederlo lo stesso non
  // dà una lista vuota: il solver riceve una posizione senza carte e muore
  // dentro il WebAssembly con «null function», un errore che dallo stack non
  // si capisce e che non si può intercettare più a valle. Visto in produzione
  // il 15/08/2026 su /istruttori/studio, giocando la tredicesima presa.
  if (Object.values(hands).every((h) => h.length === 0)) return [];

  const dds = await getDds();
  const res = dds.SolveBoardPBN(
    {
      trump: trump === null ? 4 : DDS_SUIT[trump],
      first: DECLARER_ORDER.indexOf(leader),
      currentTrickSuit: currentTrick.map((c) => DDS_SUIT[c.suit]),
      currentTrickRank: currentTrick.map((c) => VALUE_BY_RANK[c.rank]),
      remainCards: dealToPbnString(hands),
    },
    -1,
    3,
    1
  );

  const out: OpzioneCarta[] = [];
  for (let i = 0; i < res.cards; i++) {
    const suit = SUIT_BY_INDEX[res.suit[i]];
    out.push({ card: { suit, rank: RANK_BY_VALUE[res.rank[i]] }, tricks: res.score[i] });
    // `equals` è una maschera di bit sui ranghi equivalenti a quello indicato.
    const eq = res.equals[i];
    for (let r = 2; r <= 14; r++) {
      if (eq & (1 << r)) out.push({ card: { suit, rank: RANK_BY_VALUE[r] }, tricks: res.score[i] });
    }
  }
  return out;
}
