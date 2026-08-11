/**
 * Converte le mani generate in `Smazzata`, il formato che i compiti già
 * conoscono.
 *
 * PERCHÉ
 * `createAssignment` accetta da tempo `customHands: Smazzata[]` — è la strada
 * che usa l'import PBN. Il generatore produce solo la distribuzione delle
 * carte, quindi manca ciò che serve per giocarla: contratto, dichiarante,
 * attacco e vulnerabilità.
 *
 * Contratto e dichiarante NON vengono indovinati. Calcolare il contratto
 * ottimale richiederebbe venti risoluzioni double dummy per mano — lente — e
 * soprattutto sceglierebbe al posto dell'insegnante: in un esercizio didattico
 * il contratto è la cornice dell'esercizio, non un dato della mano. Li decide
 * chi assegna il compito.
 *
 * L'attacco invece si ricava: è la carta di uscita naturale del giocatore alla
 * sinistra del dichiarante, con la stessa funzione usata dall'import PBN, così
 * mani importate e mani generate si comportano allo stesso modo.
 */

import type { Card, Position } from "./bridge-engine";
import { nextPlayer } from "./bridge-engine";
import type { Smazzata, Vulnerability } from "./catalog";
import { defaultOpeningLead } from "./pbn";

/** Rotazione standard della vulnerabilità sui board di torneo. */
const VULNERABILITY_CYCLE: Vulnerability[] = [
  "none", "ns", "ew", "both",
  "ns", "ew", "both", "none",
  "ew", "both", "none", "ns",
  "both", "none", "ns", "ew",
];

/** Lettera del seme di atout in un contratto, o `null` a senza atout. */
function trumpLetterOf(contract: string): string | null {
  const normalized = contract.trim().toUpperCase();
  if (/^[1-7]\s*(NT|SA)/.test(normalized)) return null;
  const symbol = normalized.match(/^[1-7]\s*([SHDC♠♥♦♣])/)?.[1];
  if (!symbol) return null;
  // L'import PBN ragiona in lettere: qui si traduce, così una sola funzione
  // decide l'attacco per entrambe le strade.
  return { "♠": "S", "♥": "H", "♦": "D", "♣": "C", S: "S", H: "H", D: "D", C: "C" }[symbol] ?? null;
}

export interface ToSmazzateOptions {
  /** Prefisso degli id, deve essere stabile dentro un compito. */
  idPrefix: string;
  /** Contratto applicato a tutte le mani, es. "3NT" o "4♠". */
  contract: string;
  declarer: Position;
  /** Compare come titolo di ogni mano ("Apertura di 1NT — mano 3"). */
  title: string;
  /** Nota didattica ripetuta su ogni mano; di norma la descrizione del modello. */
  commentary?: string;
}

/**
 * Trasforma le distribuzioni in smazzate assegnabili.
 * Non lancia: un contratto malformato produce comunque mani giocabili, con
 * l'attacco calcolato come se fosse a senza atout.
 */
export function dealsToSmazzate(
  deals: readonly Record<Position, Card[]>[],
  options: ToSmazzateOptions
): Smazzata[] {
  const trump = trumpLetterOf(options.contract);

  return deals.map((hands, index) => {
    const leader = nextPlayer(options.declarer);
    return {
      id: `${options.idPrefix}-${index + 1}`,
      // 0 = non appartiene a nessuna lezione del catalogo: sono mani del
      // compito, non contenuto federale.
      lesson: 0,
      board: index + 1,
      title: `${options.title} — mano ${index + 1}`,
      contract: options.contract,
      declarer: options.declarer,
      openingLead: defaultOpeningLead(hands[leader], trump),
      vulnerability: VULNERABILITY_CYCLE[index % VULNERABILITY_CYCLE.length],
      hands: {
        north: hands.north,
        south: hands.south,
        east: hands.east,
        west: hands.west,
      },
      commentary: options.commentary ?? "",
    };
  });
}
