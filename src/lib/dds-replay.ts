/**
 * Dove la mano è cambiata.
 *
 * Rigioca la smazzata presa per presa e, dopo ognuna, chiede al double dummy
 * quante prese il dichiarante possa ancora fare. Finché il totale ottenibile
 * resta uguale, il gioco non ha inciso; quando scende, quella è la presa in cui
 * la mano è cambiata.
 *
 * PERCHÉ NON DIRE «HAI SBAGLIATO»
 * Il double dummy vede tutte e 52 le carte. Una presa persa qui poteva essere
 * imperdibile al tavolo, dove le mani avversarie sono coperte: chiamarla errore
 * sarebbe falso, e insegnerebbe all'allievo che avrebbe dovuto indovinare.
 * Il valore di questo strumento è indicare il MOMENTO su cui vale la pena
 * ragionare, non emettere un giudizio.
 *
 * Vale anche il contrario: se il totale ottenibile SALE, è la difesa ad aver
 * lasciato qualcosa. Va detto, altrimenti l'allievo attribuisce a sé un merito
 * che non ha e impara la lezione sbagliata.
 */

import type { Card, Position, Rank, Suit } from "./bridge-engine";
import { cardOptions, solveBoard } from "./dds-table";

const SUIT_ORDER: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const SEATS: Position[] = ["north", "east", "south", "west"];
const DDS_SEAT: Record<Position, number> = { north: 0, east: 1, south: 2, west: 3 };
const DDS_STRAIN: Record<string, number> = { spade: 0, heart: 1, diamond: 2, club: 3, notrump: 4 };

function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/** Mani in formato PBN, per la posizione corrente. */
function toPbn(hands: Record<Position, Card[]>): string {
  const hand = (cards: Card[]) =>
    SUIT_ORDER.map((s) =>
      cards
        .filter((c) => c.suit === s)
        .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
        .map((c) => (c.rank === "10" ? "T" : c.rank))
        .join("")
    ).join(".");
  return `N:${SEATS.map((s) => hand(hands[s])).join(" ")}`;
}

export interface PlayedTrick {
  cards: { player: string; card: Card }[];
  winner: string;
}

export interface TurningPoint {
  /** Numero di presa, da 1. */
  trick: number;
  /** Prese già vinte dal dichiarante dopo questa presa. */
  won: number;
  /** Totale ancora ottenibile dal dichiarante, a carte scoperte. */
  potential: number;
  /** Variazione rispetto alla presa precedente: negativa = si è perso qualcosa. */
  delta: number;
  /**
   * Prese perse dalle carte della linea del dichiarante in questa presa,
   * carta per carta (≥ 0). Il `delta` è il saldo della presa: un errore del
   * dichiarante e un regalo della difesa nella stessa presa si annullavano,
   * e il pannello diceva «senza sbandamenti» (revisione 26/11/2026).
   */
  calo: number;
  /** Prese regalate dalle carte della difesa in questa presa (≥ 0). */
  regalo: number;
}

export interface ReplayAnalysis {
  /** Una voce per presa giocata. */
  points: TurningPoint[];
  /** Totale ottenibile all'inizio, prima di qualsiasi carta. */
  initialPotential: number;
  /** Prese effettivamente fatte dal dichiarante. */
  finalTricks: number;
}

const isDeclarerSide = (seat: Position, declarer: Position) =>
  (DDS_SEAT[seat] % 2) === (DDS_SEAT[declarer] % 2);

/**
 * Ricostruisce la posizione dopo ogni presa e calcola quante prese il
 * dichiarante possa ancora ottenere.
 *
 * `strain` è il seme d'atout, `null` a senza atout. Le prese devono essere
 * complete (quattro carte) e nell'ordine di gioco.
 */
export async function analyseReplay(
  hands: Record<Position, Card[]>,
  tricks: readonly PlayedTrick[],
  strain: Suit | null,
  declarer: Position
): Promise<ReplayAnalysis> {
  const trumpIndex = DDS_STRAIN[strain ?? "notrump"];

  // Copia di lavoro: le carte vengono tolte man mano.
  const remaining: Record<Position, Card[]> = {
    north: [...hands.north],
    east: [...hands.east],
    south: [...hands.south],
    west: [...hands.west],
  };

  /** Prese ancora ottenibili dal dichiarante con `leader` di mano. */
  const potentialFrom = async (leader: Position, cardsLeft: number): Promise<number> => {
    if (cardsLeft === 0) return 0;
    const res = await solveBoard(toPbn(remaining), trumpIndex, DDS_SEAT[leader]);
    // `score` è riferito alla linea che deve giocare: se non è quella del
    // dichiarante, va complementato rispetto alle prese ancora in palio.
    const best = res.cards > 0 ? Math.max(...res.score.slice(0, res.cards)) : 0;
    return isDeclarerSide(leader, declarer) ? best : cardsLeft - best;
  };

  const firstLeader = tricks[0]?.cards[0]?.player as Position | undefined;
  const initialPotential = firstLeader ? await potentialFrom(firstLeader, 13) : 0;

  const points: TurningPoint[] = [];
  let won = 0;
  let previous = initialPotential;

  for (const [index, trick] of tricks.entries()) {
    const leader = trick.cards[0]?.player as Position;
    const giocate: Card[] = [];
    let calo = 0;
    let regalo = 0;
    for (const { player, card } of trick.cards) {
      const seat = player as Position;
      // Quanto costa questa carta rispetto alla migliore, per chi la gioca.
      const opzioni = await cardOptions(remaining, strain, leader, giocate);
      const sua = opzioni.find((o) => sameCard(o.card, card));
      if (sua && opzioni.length > 0) {
        const costo = Math.max(...opzioni.map((o) => o.tricks)) - sua.tricks;
        if (isDeclarerSide(seat, declarer)) calo += costo;
        else regalo += costo;
      }
      const pos = remaining[seat].findIndex((c) => sameCard(c, card));
      if (pos >= 0) remaining[seat].splice(pos, 1);
      giocate.push(card);
    }
    if (isDeclarerSide(trick.winner as Position, declarer)) won++;

    const left = 13 - (index + 1);
    const potential = won + (await potentialFrom(trick.winner as Position, left));
    points.push({ trick: index + 1, won, potential, delta: potential - previous, calo, regalo });
    previous = potential;
  }

  return { points, initialPotential, finalTricks: won };
}

/**
 * Le prese in cui il totale ottenibile è cambiato, dalla più significativa.
 * Un cambiamento di zero non è un evento: mostrarlo seppellirebbe i due o tre
 * momenti che contano sotto tredici righe indistinguibili.
 */
export function significantMoments(analysis: ReplayAnalysis): TurningPoint[] {
  return analysis.points
    .filter((p) => p.calo > 0 || p.regalo > 0)
    .sort((a, b) => b.calo - a.calo || b.regalo - a.regalo);
}
