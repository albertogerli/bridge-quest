/**
 * BridgeQuest - Double Dummy Solver (DDS)
 *
 * A pure TypeScript minimax/alpha-beta solver for bridge card play.
 * - Full exact search for positions with <= 6 cards per hand (endgame)
 * - Heuristic estimation for larger positions
 * - Timeout support (falls back to contract-based estimate after 2s)
 *
 * Double-dummy means all 4 hands are visible and all players play optimally.
 * This gives the theoretical maximum tricks for declarer.
 *
 * Can be upgraded to full WASM DDS (Bo Haglund's dds-bridge/dds) in the future.
 */

// ──────────────────────────────────────────────────────────────
// Types (standalone, no imports from bridge-engine to keep worker-safe)
// ──────────────────────────────────────────────────────────────

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export type Position = "north" | "south" | "east" | "west";
export type Partnership = "ns" | "ew";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface DDSResult {
  /** Optimal tricks for declarer (double-dummy) */
  tricks: number;
  /** True if full computation completed (not a fallback estimate) */
  available: boolean;
  /** Computation time in ms */
  timeMs: number;
}

export interface DDSRequest {
  hands: Record<Position, Card[]>;
  contract: string;
  declarer: Position;
  leader?: Position;
  openingLead?: Card;
  /** Timeout in ms (default 2000) */
  timeout?: number;
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const RANK_VALUE: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

const NEXT_PLAYER: Record<Position, Position> = {
  north: "east",
  east: "south",
  south: "west",
  west: "north",
};

const PARTNER: Record<Position, Position> = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

/** Max cards per hand for full minimax search */
const FULL_SEARCH_THRESHOLD = 6;

/** Default timeout in ms */
const DEFAULT_TIMEOUT = 2000;

// ──────────────────────────────────────────────────────────────
// Contract parsing
// ──────────────────────────────────────────────────────────────

function parseContractDDS(contract: string): { level: number; trumpSuit: Suit | null; tricksNeeded: number } {
  const level = parseInt(contract[0]);
  const suitStr = contract.slice(1).toUpperCase();

  const suitMap: Record<string, Suit | null> = {
    NT: null, SA: null,
    S: "spade", "\u2660": "spade",
    H: "heart", "\u2665": "heart",
    D: "diamond", "\u2666": "diamond",
    C: "club", "\u2663": "club",
  };

  return {
    level,
    trumpSuit: suitMap[suitStr] ?? null,
    tricksNeeded: level + 6,
  };
}

function partnershipOf(pos: Position): Partnership {
  return pos === "north" || pos === "south" ? "ns" : "ew";
}

// ──────────────────────────────────────────────────────────────
// Bit-encoded card representation for fast solving
// Each card: suit * 13 + rankIndex (0..51)
// Each hand: a bitmask of 52 bits (stored as two 32-bit numbers or bigint)
// For simplicity and performance with <= 6 cards, we use arrays.
// ──────────────────────────────────────────────────────────────

interface SolverState {
  /** Cards in each hand */
  hands: Card[][];
  /** Index: 0=north, 1=east, 2=south, 3=west */
  currentPlayer: number;
  /** Cards played in current trick (max 4) */
  currentTrick: { playerIdx: number; card: Card }[];
  /** Who led current trick */
  trickLeader: number;
  /** Tricks won by NS */
  nsTricks: number;
  /** Tricks won by EW */
  ewTricks: number;
  /** Trump suit (null = NT) */
  trumpSuit: Suit | null;
  /** Total remaining tricks */
  remainingTricks: number;
}

const POS_TO_IDX: Record<Position, number> = { north: 0, east: 1, south: 2, west: 3 };

function nextPlayerIdx(idx: number): number {
  return (idx + 1) % 4;
}

function isNS(playerIdx: number): boolean {
  return playerIdx === 0 || playerIdx === 2;
}

// ──────────────────────────────────────────────────────────────
// Trick winner determination
// ──────────────────────────────────────────────────────────────

function determineTrickWinnerSolver(
  trick: { playerIdx: number; card: Card }[],
  trumpSuit: Suit | null
): number {
  const leadSuit = trick[0].card.suit;
  let bestIdx = 0;

  for (let i = 1; i < trick.length; i++) {
    const current = trick[bestIdx].card;
    const candidate = trick[i].card;

    if (trumpSuit) {
      const currentIsTrump = current.suit === trumpSuit;
      const candidateIsTrump = candidate.suit === trumpSuit;

      if (candidateIsTrump && !currentIsTrump) {
        bestIdx = i;
      } else if (candidateIsTrump && currentIsTrump) {
        if (RANK_VALUE[candidate.rank] > RANK_VALUE[current.rank]) {
          bestIdx = i;
        }
      } else if (!candidateIsTrump && !currentIsTrump) {
        if (candidate.suit === leadSuit && current.suit === leadSuit) {
          if (RANK_VALUE[candidate.rank] > RANK_VALUE[current.rank]) {
            bestIdx = i;
          }
        } else if (candidate.suit === leadSuit) {
          bestIdx = i;
        }
      }
    } else {
      if (candidate.suit === leadSuit && current.suit === leadSuit) {
        if (RANK_VALUE[candidate.rank] > RANK_VALUE[current.rank]) {
          bestIdx = i;
        }
      } else if (candidate.suit === leadSuit && current.suit !== leadSuit) {
        bestIdx = i;
      }
    }
  }

  return trick[bestIdx].playerIdx;
}

// ──────────────────────────────────────────────────────────────
// Valid cards for current player
// ──────────────────────────────────────────────────────────────

function getValidCardsSolver(hand: Card[], currentTrick: { playerIdx: number; card: Card }[]): Card[] {
  if (currentTrick.length === 0) return hand;

  const leadSuit = currentTrick[0].card.suit;
  const suitCards = hand.filter(c => c.suit === leadSuit);
  return suitCards.length > 0 ? suitCards : hand;
}

// ──────────────────────────────────────────────────────────────
// Card equivalence: reduce equivalent cards to speed up search.
// Cards in sequence (K-Q when no A above is out) are equivalent.
// We pick the highest of each equivalence class.
// ──────────────────────────────────────────────────────────────

function deduplicateEquivalentCards(validCards: Card[], allRemainingCards: Card[], trumpSuit: Suit | null): Card[] {
  if (validCards.length <= 1) return validCards;

  // Group by suit
  const bySuit: Record<string, Card[]> = {};
  for (const c of validCards) {
    if (!bySuit[c.suit]) bySuit[c.suit] = [];
    bySuit[c.suit].push(c);
  }

  const result: Card[] = [];

  for (const suit of SUITS) {
    const cards = bySuit[suit];
    if (!cards || cards.length === 0) continue;

    // Sort descending by rank value
    const sorted = [...cards].sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank]);

    // Find all cards of this suit across all remaining hands
    const allInSuit = allRemainingCards
      .filter(c => c.suit === suit)
      .map(c => RANK_VALUE[c.rank])
      .sort((a, b) => b - a);

    // Two cards are equivalent if they are adjacent in the ranking
    // of all remaining cards (no other card between them).
    result.push(sorted[0]);
    for (let i = 1; i < sorted.length; i++) {
      const prevVal = RANK_VALUE[sorted[i - 1].rank];
      const currVal = RANK_VALUE[sorted[i].rank];

      // Check if there's any card between them in allInSuit
      const hasBetween = allInSuit.some(v => v < prevVal && v > currVal);
      if (hasBetween) {
        result.push(sorted[i]);
      }
      // else: equivalent, skip (we already added the higher one)
    }
  }

  return result;
}

// ──────────────────────────────────────────────────────────────
// Transposition table (hash -> { nsTricks lower bound })
// ──────────────────────────────────────────────────────────────

function hashState(state: SolverState): string {
  // Simple hash: sorted cards per hand + current player + trick state
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    const h = state.hands[i]
      .map(c => `${c.suit[0]}${c.rank}`)
      .sort()
      .join(",");
    parts.push(h);
  }
  parts.push(String(state.currentPlayer));
  parts.push(String(state.nsTricks));
  // Current trick cards
  for (const tp of state.currentTrick) {
    parts.push(`${tp.playerIdx}:${tp.card.suit[0]}${tp.card.rank}`);
  }
  return parts.join("|");
}

// ──────────────────────────────────────────────────────────────
// Alpha-beta minimax solver
// ──────────────────────────────────────────────────────────────

let solverTimedOut = false;
let solverDeadline = 0;
let nodesSearched = 0;
const transpositionTable = new Map<string, number>();

/**
 * Returns the maximum number of tricks NS can make from this position.
 * alpha: best NS can guarantee so far
 * beta: best EW can guarantee (from NS perspective, upper bound for NS)
 */
function minimax(
  state: SolverState,
  alpha: number,
  beta: number,
): number {
  // Check timeout periodically
  if (++nodesSearched % 1000 === 0) {
    if (Date.now() > solverDeadline) {
      solverTimedOut = true;
      return state.nsTricks; // Return current count as estimate
    }
  }

  if (solverTimedOut) return state.nsTricks;

  // Base case: no more cards
  if (state.remainingTricks === 0 && state.currentTrick.length === 0) {
    return state.nsTricks;
  }

  // Check transposition table
  const hash = hashState(state);
  const cached = transpositionTable.get(hash);
  if (cached !== undefined) return cached;

  // Quick bounds check: can NS still reach alpha? Can they still be below beta?
  const maxPossibleNS = state.nsTricks + state.remainingTricks;
  if (maxPossibleNS <= alpha) {
    return maxPossibleNS; // NS can't reach alpha even winning all remaining
  }
  if (state.nsTricks >= beta) {
    return state.nsTricks; // NS already exceeded beta
  }

  const playerIdx = state.currentPlayer;
  const hand = state.hands[playerIdx];
  const nsMaximizing = isNS(playerIdx);

  const validCards = getValidCardsSolver(hand, state.currentTrick);

  // Deduplicate equivalent cards
  const allRemaining = state.hands.flat();
  const candidates = deduplicateEquivalentCards(validCards, allRemaining, state.trumpSuit);

  let bestValue = nsMaximizing ? -1 : 999;

  for (const card of candidates) {
    if (solverTimedOut) break;

    // Play the card
    const newHand = hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
    const newHands = [...state.hands];
    newHands[playerIdx] = newHand;

    const newTrick = [...state.currentTrick, { playerIdx, card }];

    let childState: SolverState;

    if (newTrick.length === 4) {
      // Trick complete
      const winnerIdx = determineTrickWinnerSolver(newTrick, state.trumpSuit);
      const nsWon = isNS(winnerIdx);

      childState = {
        hands: newHands,
        currentPlayer: winnerIdx,
        currentTrick: [],
        trickLeader: winnerIdx,
        nsTricks: state.nsTricks + (nsWon ? 1 : 0),
        ewTricks: state.ewTricks + (nsWon ? 0 : 1),
        trumpSuit: state.trumpSuit,
        remainingTricks: state.remainingTricks - 1,
      };
    } else {
      // Trick continues
      childState = {
        hands: newHands,
        currentPlayer: nextPlayerIdx(playerIdx),
        currentTrick: newTrick,
        trickLeader: state.trickLeader,
        nsTricks: state.nsTricks,
        ewTricks: state.ewTricks,
        trumpSuit: state.trumpSuit,
        remainingTricks: state.remainingTricks,
      };
    }

    const value = minimax(childState, alpha, beta);

    if (nsMaximizing) {
      if (value > bestValue) bestValue = value;
      if (value > alpha) alpha = value;
    } else {
      if (value < bestValue) bestValue = value;
      if (value < beta) beta = value;
    }

    // Alpha-beta cutoff
    if (alpha >= beta) break;
  }

  // Store in transposition table
  if (!solverTimedOut) {
    transpositionTable.set(hash, bestValue);
  }

  return bestValue;
}

// ──────────────────────────────────────────────────────────────
// Heuristic estimator for large hands
// ──────────────────────────────────────────────────────────────

function heuristicEstimate(
  hands: Record<Position, Card[]>,
  trumpSuit: Suit | null,
  declarer: Position,
): number {
  const partner = PARTNER[declarer];
  const declarerCards = [...hands[declarer], ...hands[partner]];

  let estimatedTricks = 0;

  // Count sure winners per suit
  for (const suit of SUITS) {
    const declarerSuit = declarerCards
      .filter(c => c.suit === suit)
      .sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank]);

    if (declarerSuit.length === 0) continue;

    // Count top winners (sequential from Ace down)
    let winners = 0;
    let expectedRank = 14; // Ace

    for (const card of declarerSuit) {
      if (RANK_VALUE[card.rank] === expectedRank) {
        winners++;
        expectedRank--;
      } else if (RANK_VALUE[card.rank] === expectedRank - 1) {
        // One missing card above - might win if opponents' card is played
        // Count as 0.5
        winners += 0.5;
        expectedRank = RANK_VALUE[card.rank] - 1;
      } else {
        break;
      }
    }

    // Trump tricks: count extra trump length
    if (suit === trumpSuit) {
      const dummyTrumps = hands[partner].filter(c => c.suit === suit).length;
      // Extra short-suit ruffs in dummy
      for (const s of SUITS) {
        if (s === trumpSuit) continue;
        const dummyInSuit = hands[partner].filter(c => c.suit === s).length;
        if (dummyInSuit === 0 && dummyTrumps > 0) {
          winners += Math.min(1, dummyTrumps); // Can ruff at least once
        } else if (dummyInSuit === 1 && dummyTrumps > 0) {
          winners += 0.5; // Potential ruff after one round
        }
      }
    }

    // Length winners: if we have more cards than opponents in the suit
    const totalInSuit = declarerSuit.length;
    if (totalInSuit > 7 && suit !== trumpSuit) {
      winners += Math.min(totalInSuit - 7, 2); // Long cards might be winners
    }

    estimatedTricks += winners;
  }

  return Math.min(13, Math.max(0, Math.round(estimatedTricks)));
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Solve a bridge position double-dummy.
 * Returns the optimal number of tricks for the declarer's side.
 *
 * For positions with <= FULL_SEARCH_THRESHOLD cards per hand: exact minimax.
 * For larger positions: heuristic estimate.
 * Times out after the specified timeout (default 2000ms) and falls back to estimate.
 */
export function solveDDS(request: DDSRequest): DDSResult {
  const startTime = Date.now();
  const timeout = request.timeout ?? DEFAULT_TIMEOUT;
  const { trumpSuit, tricksNeeded } = parseContractDDS(request.contract);
  const declarerPartnership = partnershipOf(request.declarer);

  // Deep-clone hands
  const hands: Record<Position, Card[]> = {
    north: request.hands.north.map(c => ({ ...c })),
    south: request.hands.south.map(c => ({ ...c })),
    east: request.hands.east.map(c => ({ ...c })),
    west: request.hands.west.map(c => ({ ...c })),
  };

  // Apply opening lead if specified
  let leader: Position;
  if (request.leader) {
    leader = request.leader;
  } else {
    // Default: left of declarer
    leader = NEXT_PLAYER[request.declarer];
  }

  const cardsPerHand = hands.north.length;

  // If opening lead specified, play it first
  let currentTrick: { playerIdx: number; card: Card }[] = [];
  let currentPlayer = POS_TO_IDX[leader];

  if (request.openingLead) {
    const leadCard = request.openingLead;
    const leaderIdx = POS_TO_IDX[leader];
    // Remove from leader's hand
    const leaderHand = hands[leader];
    const cardIdx = leaderHand.findIndex(c => c.suit === leadCard.suit && c.rank === leadCard.rank);
    if (cardIdx >= 0) {
      leaderHand.splice(cardIdx, 1);
      currentTrick = [{ playerIdx: leaderIdx, card: leadCard }];
      currentPlayer = nextPlayerIdx(leaderIdx);
    }
  }

  // Determine if we can do full search
  const maxCards = Math.max(
    hands.north.length,
    hands.south.length,
    hands.east.length,
    hands.west.length,
  );

  // Count remaining tricks
  const remainingTricks = maxCards; // Each player plays one card per trick

  if (maxCards > FULL_SEARCH_THRESHOLD) {
    // Heuristic mode: try minimax with timeout
    // Reset solver state
    solverTimedOut = false;
    solverDeadline = startTime + timeout;
    nodesSearched = 0;
    transpositionTable.clear();

    const solverHands: Card[][] = [
      hands.north,
      hands.east,
      hands.south,
      hands.west,
    ];

    const initialState: SolverState = {
      hands: solverHands,
      currentPlayer,
      currentTrick,
      trickLeader: currentTrick.length > 0 ? currentTrick[0].playerIdx : currentPlayer,
      nsTricks: 0,
      ewTricks: 0,
      trumpSuit,
      remainingTricks,
    };

    const nsTricks = minimax(initialState, -1, 14);
    const timeMs = Date.now() - startTime;

    if (solverTimedOut) {
      // Timed out: use heuristic as fallback
      const estimated = heuristicEstimate(hands, trumpSuit, request.declarer);
      return {
        tricks: declarerPartnership === "ns" ? estimated : 13 - estimated,
        available: false,
        timeMs,
      };
    }

    const declarerTricks = declarerPartnership === "ns" ? nsTricks : 13 - nsTricks;
    return {
      tricks: declarerTricks,
      available: true,
      timeMs,
    };
  }

  // Full minimax search (small endgame positions)
  solverTimedOut = false;
  solverDeadline = startTime + timeout;
  nodesSearched = 0;
  transpositionTable.clear();

  const solverHands: Card[][] = [
    hands.north,
    hands.east,
    hands.south,
    hands.west,
  ];

  const initialState: SolverState = {
    hands: solverHands,
    currentPlayer,
    currentTrick,
    trickLeader: currentTrick.length > 0 ? currentTrick[0].playerIdx : currentPlayer,
    nsTricks: 0,
    ewTricks: 0,
    trumpSuit,
    remainingTricks,
  };

  const nsTricks = minimax(initialState, -1, 14);
  const timeMs = Date.now() - startTime;

  const declarerTricks = declarerPartnership === "ns" ? nsTricks : 13 - nsTricks;

  return {
    tricks: declarerTricks,
    available: !solverTimedOut,
    timeMs,
  };
}

/**
 * Quick estimate: just use the contract target as DD estimate.
 * Used as final fallback if even the heuristic is not desired.
 */
export function estimateFromContract(contract: string): number {
  const { tricksNeeded } = parseContractDDS(contract);
  return tricksNeeded;
}
