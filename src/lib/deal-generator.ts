/**
 * Generatore di smazzate con vincoli.
 *
 * PERCHÉ ESISTE
 * Oggi tutte le mani di BridgeLab sono curate a mano nella tabella
 * `smazzate`. Un insegnante che voglia venti esempi di apertura di 1NT, o di
 * invito a slam, deve trovarli o costruirli uno per uno. È il limite che
 * l'articolo su Bridge Champ chiama bene: «l'allenamento non dipende più
 * dalla comparsa casuale della mano giusta».
 *
 * Qui si dichiara COSA deve avere la mano — forza, lunghezze, sagoma — e si
 * ottengono tutte le distribuzioni coerenti che servono.
 *
 * COME
 * Campionamento con rifiuto: si distribuiscono 52 carte a caso e si scarta il
 * risultato se non soddisfa i vincoli. È l'approccio dei generatori classici
 * (Dealer di Hans van Staveren) ed è corretto per costruzione: le smazzate
 * prodotte sono un campione UNIFORME fra tutte quelle che rispettano i
 * vincoli, senza le distorsioni che introdurrebbe un metodo costruttivo
 * (assegnare prima gli onori e poi riempire produce sagome innaturali).
 *
 * Il prezzo è che vincoli molto stretti costano molti tentativi. Per questo il
 * numero di tentativi è limitato e il risultato dice sempre quanti ne sono
 * serviti: un vincolo impossibile restituisce meno mani del richiesto, non un
 * blocco.
 *
 * DETERMINISMO
 * Il generatore non usa mai `Math.random`: prende un seme. Stesso seme e
 * stessi vincoli danno sempre le stesse mani. Serve a tre cose: un insegnante
 * può ridistribuire alla classe esattamente la stessa serie, un compito
 * assegnato resta riproducibile nel tempo, e i test sono deterministici.
 */

import type { Card, Position, Rank, Suit } from "./bridge-engine";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANKS: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const POSITIONS: Position[] = ["north", "east", "south", "west"];

const HCP_BY_RANK: Partial<Record<Rank, number>> = { A: 4, K: 3, Q: 2, J: 1 };

// ─── Vincoli ────────────────────────────────────────────────────────────────

/** Intervallo chiuso. Estremi omessi = nessun limite da quel lato. */
export interface Range {
  min?: number;
  max?: number;
}

export interface SeatConstraint {
  /** Punti onori (A=4, K=3, Q=2, J=1). */
  hcp?: Range;
  /** Lunghezza per singolo seme. */
  spade?: Range;
  heart?: Range;
  diamond?: Range;
  club?: Range;
  /**
   * Bilanciata secondo la definizione italiana: nessuna singola, nessun
   * vuoto, al massimo una doubleton. Sagome 4333, 4432, 5332.
   */
  balanced?: boolean;
  /**
   * Sagome ammesse, es. ["5332", "4432"]. Le cifre sono le lunghezze in
   * ordine DECRESCENTE, senza riguardo al seme: "5431" comprende sia 5 picche
   * e 4 cuori sia 5 fiori e 4 quadri.
   */
  shapes?: string[];
}

export interface DealConstraints {
  north?: SeatConstraint;
  east?: SeatConstraint;
  south?: SeatConstraint;
  west?: SeatConstraint;
  /** Punti onori combinati Nord+Sud: il vincolo tipico degli esercizi di licita. */
  nsHcp?: Range;
  /** Punti onori combinati Est+Ovest. */
  ewHcp?: Range;
}

export interface GenerateOptions {
  /** Quante smazzate produrre. */
  count: number;
  /** Seme: stesso seme e stessi vincoli danno sempre le stesse mani. */
  seed: number;
  /**
   * Tentativi massimi complessivi. Protegge da vincoli impossibili, che
   * altrimenti girerebbero all'infinito.
   */
  maxAttempts?: number;
}

export interface GenerateResult {
  deals: Record<Position, Card[]>[];
  /** Quante distribuzioni sono state provate in tutto. */
  attempts: number;
  /**
   * Vero se sono state prodotte meno mani di quelle richieste. Va mostrato:
   * un insegnante che ne chiede 20 e ne riceve 3 deve sapere che il vincolo è
   * troppo stretto, non pensare che il sistema sia lento.
   */
  exhausted: boolean;
}

// ─── Generatore pseudocasuale ───────────────────────────────────────────────

/**
 * Mulberry32: piccolo, veloce e con buona distribuzione.
 * Serve un PRNG con stato esplicito perché `Math.random` non è seminabile e
 * renderebbe irriproducibili sia i compiti che i test.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Valutazione di una mano ────────────────────────────────────────────────

/** Punti onori di una mano. */
export function handHcp(hand: readonly Card[]): number {
  let total = 0;
  for (const card of hand) total += HCP_BY_RANK[card.rank] ?? 0;
  return total;
}

/** Lunghezze per seme. */
export function suitLengths(hand: readonly Card[]): Record<Suit, number> {
  const lengths: Record<Suit, number> = { spade: 0, heart: 0, diamond: 0, club: 0 };
  for (const card of hand) lengths[card.suit]++;
  return lengths;
}

/** Sagoma in ordine decrescente, es. "5431". */
export function handShape(hand: readonly Card[]): string {
  const lengths = suitLengths(hand);
  return SUITS.map((s) => lengths[s])
    .sort((a, b) => b - a)
    .join("");
}

/**
 * Bilanciata: nessuna singola, nessun vuoto, al massimo una doubleton.
 * Corrisponde a 4333, 4432 e 5332.
 */
export function isBalanced(hand: readonly Card[]): boolean {
  const lengths = SUITS.map((s) => suitLengths(hand)[s]);
  if (lengths.some((l) => l < 2)) return false;
  return lengths.filter((l) => l === 2).length <= 1;
}

function inRange(value: number, range: Range | undefined): boolean {
  if (!range) return true;
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

/** Vero se la mano soddisfa il vincolo del posto. */
export function satisfiesSeat(hand: readonly Card[], constraint: SeatConstraint | undefined): boolean {
  if (!constraint) return true;
  if (!inRange(handHcp(hand), constraint.hcp)) return false;

  const lengths = suitLengths(hand);
  for (const suit of SUITS) {
    if (!inRange(lengths[suit], constraint[suit])) return false;
  }

  if (constraint.balanced === true && !isBalanced(hand)) return false;
  if (constraint.balanced === false && isBalanced(hand)) return false;

  if (constraint.shapes && constraint.shapes.length > 0) {
    if (!constraint.shapes.includes(handShape(hand))) return false;
  }
  return true;
}

/** Vero se l'intera smazzata soddisfa tutti i vincoli. */
export function satisfiesDeal(
  deal: Record<Position, Card[]>,
  constraints: DealConstraints
): boolean {
  for (const position of POSITIONS) {
    if (!satisfiesSeat(deal[position], constraints[position])) return false;
  }
  if (constraints.nsHcp && !inRange(handHcp(deal.north) + handHcp(deal.south), constraints.nsHcp)) {
    return false;
  }
  if (constraints.ewHcp && !inRange(handHcp(deal.east) + handHcp(deal.west), constraints.ewHcp)) {
    return false;
  }
  return true;
}

// ─── Distribuzione ──────────────────────────────────────────────────────────

function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

/**
 * Distribuisce un mazzo mescolato in quattro mani da 13.
 * Fisher-Yates con il PRNG seminato: ogni permutazione è equiprobabile.
 */
function dealOnce(random: () => number): Record<Position, Card[]> {
  const deck = fullDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    north: deck.slice(0, 13),
    east: deck.slice(13, 26),
    south: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };
}

/** Ordina una mano per seme e per rango decrescente, come si tiene al tavolo. */
export function sortHand(hand: readonly Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const bySuit = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    if (bySuit !== 0) return bySuit;
    return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank);
  });
}

/**
 * Genera smazzate che soddisfano i vincoli.
 *
 * Non lancia mai: vincoli impossibili producono `exhausted: true` con meno
 * mani del richiesto (eventualmente zero). Sta al chiamante dirlo all'utente.
 */
export function generateDeals(
  constraints: DealConstraints,
  options: GenerateOptions
): GenerateResult {
  const { count, seed } = options;
  // 2.000 tentativi per mano richiesta: abbondante per i vincoli didattici
  // consueti (un 15-17 bilanciato esce circa una volta su 25) e abbastanza
  // rapido da non bloccare l'interfaccia quando il vincolo è impossibile.
  const maxAttempts = options.maxAttempts ?? Math.max(1, count) * 2000;

  const random = mulberry32(seed);
  const deals: Record<Position, Card[]>[] = [];
  let attempts = 0;

  while (deals.length < count && attempts < maxAttempts) {
    attempts++;
    const deal = dealOnce(random);
    if (!satisfiesDeal(deal, constraints)) continue;
    deals.push({
      north: sortHand(deal.north),
      east: sortHand(deal.east),
      south: sortHand(deal.south),
      west: sortHand(deal.west),
    });
  }

  return { deals, attempts, exhausted: deals.length < count };
}

// ─── Modelli pronti ─────────────────────────────────────────────────────────

/**
 * Vincoli ricorrenti nella didattica federale, così l'insegnante non deve
 * comporli da zero per gli esercizi più comuni.
 */
export const DEAL_TEMPLATES: { id: string; label: string; description: string; constraints: DealConstraints }[] = [
  {
    id: "apertura-1nt",
    label: "Apertura di 1NT",
    description: "Sud bilanciato con 15-17 punti onori",
    constraints: { south: { hcp: { min: 15, max: 17 }, balanced: true } },
  },
  {
    id: "apertura-maggiore",
    label: "Apertura di 1 in maggiore",
    description: "Sud con 12-19 punti e almeno 5 carte in una maggiore",
    constraints: { south: { hcp: { min: 12, max: 19 }, spade: { min: 5 } } },
  },
  {
    id: "invito-manche",
    label: "Invito a manche",
    description: "Nord-Sud con 23-24 punti combinati: la zona in cui la scelta è difficile",
    constraints: { nsHcp: { min: 23, max: 24 } },
  },
  {
    id: "invito-slam",
    label: "Invito a slam",
    description: "Nord-Sud con 31-33 punti combinati",
    constraints: { nsHcp: { min: 31, max: 33 } },
  },
  {
    id: "manche-sicura",
    label: "Manche a colore",
    description: "Nord-Sud con 25+ punti e fit di almeno 8 carte a picche",
    constraints: { nsHcp: { min: 25 }, north: { spade: { min: 4 } }, south: { spade: { min: 4 } } },
  },
  {
    id: "bicolore",
    label: "Mano bicolore",
    description: "Sud con almeno 5-5 nei due maggiori",
    constraints: { south: { spade: { min: 5 }, heart: { min: 5 } } },
  },
  {
    id: "difesa-preventiva",
    label: "Apertura preventiva",
    description: "Sud debole (5-10 punti) con una lunga di 7 carte",
    constraints: { south: { hcp: { min: 5, max: 10 }, spade: { min: 7 } } },
  },
];
