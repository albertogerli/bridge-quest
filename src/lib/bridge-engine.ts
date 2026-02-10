/**
 * BridgeQuest - Core Bridge Game Engine
 * Handles trick-by-trick play logic, card validation, winner determination
 */

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export type Position = "north" | "south" | "east" | "west";
export type Partnership = "ns" | "ew";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface TrickPlay {
  position: Position;
  card: Card;
}

export interface Trick {
  plays: TrickPlay[];
  leader: Position;
  winner?: Position;
}

export interface GameState {
  hands: Record<Position, Card[]>;
  tricks: Trick[];
  currentTrick: TrickPlay[];
  currentPlayer: Position;
  leader: Position;
  trumpSuit: Suit | null; // null = No Trump
  declarer: Position;
  dummy: Position;
  contract: string;
  trickCount: { ns: number; ew: number };
  phase: "playing" | "finished";
  openingLead: Card | null;
}

// Card ordering for determining trick winner (index 0 = highest)
const RANK_ORDER: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

// Standard bridge suit ordering for hand display
const SUIT_ORDER: Suit[] = ["spade", "heart", "diamond", "club"];

export function rankValue(rank: Rank): number {
  return RANK_ORDER.length - RANK_ORDER.indexOf(rank);
}

export function cardToString(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

/** Sort cards by suit (S > H > D > C), then by rank within suit */
export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
  });
}

/** Get the next player clockwise */
export function nextPlayer(position: Position): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  const idx = order.indexOf(position);
  return order[(idx + 1) % 4];
}

/** Get partner position */
export function partnerOf(position: Position): Position {
  const partners: Record<Position, Position> = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
  };
  return partners[position];
}

/** Get partnership of a position */
export function partnershipOf(position: Position): Partnership {
  return position === "north" || position === "south" ? "ns" : "ew";
}

/** Get the dummy position from the declarer */
export function getDummy(declarer: Position): Position {
  return partnerOf(declarer);
}

/** Get valid cards the current player can play */
export function getValidCards(hand: Card[], currentTrick: TrickPlay[]): Card[] {
  if (currentTrick.length === 0) {
    // Leader can play any card
    return hand;
  }

  const leadSuit = currentTrick[0].card.suit;
  const suitCards = hand.filter((c) => c.suit === leadSuit);

  if (suitCards.length > 0) {
    // Must follow suit
    return suitCards;
  }

  // Can't follow suit — play anything
  return hand;
}

/** Determine the winner of a completed trick */
export function determineTrickWinner(
  trick: TrickPlay[],
  trumpSuit: Suit | null
): Position {
  if (trick.length !== 4) {
    throw new Error("Trick must have exactly 4 plays");
  }

  const leadSuit = trick[0].card.suit;
  let winningPlay = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const play = trick[i];
    const currentWinSuit = winningPlay.card.suit;
    const playSuit = play.card.suit;

    if (trumpSuit) {
      // Trump game
      if (playSuit === trumpSuit && currentWinSuit !== trumpSuit) {
        // Trumping beats non-trump
        winningPlay = play;
      } else if (playSuit === trumpSuit && currentWinSuit === trumpSuit) {
        // Higher trump wins
        if (rankValue(play.card.rank) > rankValue(winningPlay.card.rank)) {
          winningPlay = play;
        }
      } else if (playSuit === leadSuit && currentWinSuit === leadSuit) {
        // Both following suit — higher rank wins
        if (rankValue(play.card.rank) > rankValue(winningPlay.card.rank)) {
          winningPlay = play;
        }
      }
      // else: non-trump, non-lead suit -> can't win
    } else {
      // No Trump
      if (playSuit === leadSuit && currentWinSuit === leadSuit) {
        if (rankValue(play.card.rank) > rankValue(winningPlay.card.rank)) {
          winningPlay = play;
        }
      } else if (playSuit === leadSuit && currentWinSuit !== leadSuit) {
        // This shouldn't happen in valid play, but handle it
        winningPlay = play;
      }
    }
  }

  return winningPlay.position;
}

/** Parse contract string like "3NT", "4S", "2H", "6D", "7C" */
export function parseContract(contract: string): {
  level: number;
  trumpSuit: Suit | null;
  tricksNeeded: number;
} {
  const level = parseInt(contract[0]);
  const suitStr = contract.slice(1).toUpperCase();

  const suitMap: Record<string, Suit | null> = {
    NT: null,
    SA: null, // Senza Atout (Italian)
    S: "spade",
    "♠": "spade",
    H: "heart",
    "♥": "heart",
    D: "diamond",
    "♦": "diamond",
    C: "club",
    "♣": "club",
  };

  const trumpSuit = suitMap[suitStr] ?? null;

  return {
    level,
    trumpSuit,
    tricksNeeded: level + 6,
  };
}

/** Create initial game state */
export function createGame(
  hands: Record<Position, Card[]>,
  contract: string,
  declarer: Position,
  openingLead?: Card
): GameState {
  const { trumpSuit } = parseContract(contract);
  const dummy = getDummy(declarer);

  // Opening leader is to the left of declarer
  const leader = nextPlayer(declarer);

  // Sort all hands
  const sortedHands: Record<Position, Card[]> = {
    north: sortHand(hands.north),
    south: sortHand(hands.south),
    east: sortHand(hands.east),
    west: sortHand(hands.west),
  };

  return {
    hands: sortedHands,
    tricks: [],
    currentTrick: [],
    currentPlayer: leader,
    leader,
    trumpSuit,
    declarer,
    dummy,
    contract,
    trickCount: { ns: 0, ew: 0 },
    phase: "playing",
    openingLead: openingLead ?? null,
  };
}

/** Play a card from a position, returns new state */
export function playCard(state: GameState, position: Position, card: Card): GameState {
  if (state.phase === "finished") {
    throw new Error("Game is already finished");
  }

  if (position !== state.currentPlayer) {
    throw new Error(`Not ${position}'s turn. Current player: ${state.currentPlayer}`);
  }

  const hand = state.hands[position];
  const validCards = getValidCards(hand, state.currentTrick);

  const isValid = validCards.some(
    (c) => c.suit === card.suit && c.rank === card.rank
  );

  if (!isValid) {
    throw new Error(`Invalid card: ${cardToString(card)}. Must follow suit.`);
  }

  // Remove card from hand
  const newHand = hand.filter(
    (c) => !(c.suit === card.suit && c.rank === card.rank)
  );

  const newHands = { ...state.hands, [position]: newHand };
  const newTrickPlays = [...state.currentTrick, { position, card }];

  // Track opening lead
  const openingLead =
    state.tricks.length === 0 && state.currentTrick.length === 0
      ? card
      : state.openingLead;

  // Check if trick is complete
  if (newTrickPlays.length === 4) {
    const winner = determineTrickWinner(newTrickPlays, state.trumpSuit);
    const winnerPartnership = partnershipOf(winner);

    const newTrickCount = { ...state.trickCount };
    newTrickCount[winnerPartnership]++;

    const completedTrick: Trick = {
      plays: newTrickPlays,
      leader: state.leader,
      winner,
    };

    const newTricks = [...state.tricks, completedTrick];

    // Check if game is over (13 tricks)
    if (newTricks.length === 13) {
      return {
        ...state,
        hands: newHands,
        tricks: newTricks,
        currentTrick: [],
        currentPlayer: winner,
        leader: winner,
        trickCount: newTrickCount,
        phase: "finished",
        openingLead,
      };
    }

    // Next trick — winner leads
    return {
      ...state,
      hands: newHands,
      tricks: newTricks,
      currentTrick: [],
      currentPlayer: winner,
      leader: winner,
      trickCount: newTrickCount,
      openingLead,
    };
  }

  // Trick not complete — next player
  return {
    ...state,
    hands: newHands,
    currentTrick: newTrickPlays,
    currentPlayer: nextPlayer(position),
    openingLead,
  };
}

/** Find the currently winning play in a partial trick (1-4 cards) */
function currentWinningPlay(
  plays: TrickPlay[],
  trumpSuit: Suit | null
): TrickPlay {
  if (plays.length === 0) throw new Error("No plays");
  const leadSuit = plays[0].card.suit;
  let best = plays[0];

  for (let i = 1; i < plays.length; i++) {
    const play = plays[i];
    const bestIsTrump = trumpSuit && best.card.suit === trumpSuit;
    const playIsTrump = trumpSuit && play.card.suit === trumpSuit;

    if (playIsTrump && !bestIsTrump) {
      best = play;
    } else if (playIsTrump && bestIsTrump) {
      if (rankValue(play.card.rank) > rankValue(best.card.rank)) best = play;
    } else if (!playIsTrump && !bestIsTrump) {
      if (play.card.suit === leadSuit && best.card.suit === leadSuit) {
        if (rankValue(play.card.rank) > rankValue(best.card.rank)) best = play;
      } else if (play.card.suit === leadSuit) {
        best = play;
      }
    }
  }
  return best;
}

// ═══════════════════════════════════════════════════════════════
// ADVANCED BRIDGE AI ENGINE
// Features: card counting, sequences, second-hand-low,
// third-hand-high, covering honors, finesse awareness,
// smart opening leads, trump management, entry preservation
// ═══════════════════════════════════════════════════════════════

const ALL_RANKS: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

/** High Card Points for a single card */
function hcp(rank: Rank): number {
  if (rank === "A") return 4;
  if (rank === "K") return 3;
  if (rank === "Q") return 2;
  if (rank === "J") return 1;
  return 0;
}

/** Build a set of all 52 cards that have already been played */
function getPlayedCards(state: GameState): Set<string> {
  const played = new Set<string>();
  for (const trick of state.tricks) {
    for (const play of trick.plays) {
      played.add(`${play.card.rank}-${play.card.suit}`);
    }
  }
  for (const play of state.currentTrick) {
    played.add(`${play.card.rank}-${play.card.suit}`);
  }
  return played;
}

/** Count remaining cards in a suit (not yet played and not in our hand) */
function countOutstandingInSuit(suit: Suit, hand: Card[], playedCards: Set<string>): number {
  let count = 0;
  for (const rank of ALL_RANKS) {
    const key = `${rank}-${suit}`;
    if (playedCards.has(key)) continue;
    if (hand.some(c => c.suit === suit && c.rank === rank)) continue;
    count++;
  }
  return count;
}

/** Detect known voids: players who showed out of a suit */
function getKnownVoids(state: GameState): Map<Position, Set<Suit>> {
  const voids = new Map<Position, Set<Suit>>();
  const allPositions: Position[] = ["north", "east", "south", "west"];
  for (const pos of allPositions) voids.set(pos, new Set());

  for (const trick of state.tricks) {
    if (trick.plays.length < 2) continue;
    const leadSuit = trick.plays[0].card.suit;
    for (let i = 1; i < trick.plays.length; i++) {
      if (trick.plays[i].card.suit !== leadSuit) {
        voids.get(trick.plays[i].position)!.add(leadSuit);
      }
    }
  }
  // Also check current trick
  if (state.currentTrick.length >= 2) {
    const leadSuit = state.currentTrick[0].card.suit;
    for (let i = 1; i < state.currentTrick.length; i++) {
      if (state.currentTrick[i].card.suit !== leadSuit) {
        voids.get(state.currentTrick[i].position)!.add(leadSuit);
      }
    }
  }
  return voids;
}

/** Check if cards form a sequence (e.g. KQJ, QJ10) */
function isSequence(cards: Card[]): boolean {
  if (cards.length < 2) return false;
  const sorted = [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (rankValue(sorted[i].rank) - rankValue(sorted[i + 1].rank) !== 1) return false;
  }
  return true;
}

/** Find the top of a sequence in hand for a suit (e.g. KQJ → K) */
function topOfSequence(hand: Card[], suit: Suit): Card | null {
  const suitCards = hand.filter(c => c.suit === suit)
    .sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  if (suitCards.length < 2) return null;

  // Find longest sequence from the top
  let seqLen = 1;
  for (let i = 0; i < suitCards.length - 1; i++) {
    if (rankValue(suitCards[i].rank) - rankValue(suitCards[i + 1].rank) === 1) {
      seqLen++;
    } else break;
  }
  if (seqLen >= 2 && rankValue(suitCards[0].rank) >= rankValue("J")) {
    return suitCards[0]; // Top of honor sequence
  }
  return null;
}

/** Check if a card is an unsupported honor (Kx, Qx, Jx with no other honors) */
function isUnsupportedHonor(card: Card, hand: Card[]): boolean {
  if (hcp(card.rank) === 0) return false;
  const suitCards = hand.filter(c => c.suit === card.suit);
  if (suitCards.length > 2) return false; // Not "short" enough to be unsupported
  const honors = suitCards.filter(c => hcp(c.rank) > 0);
  return honors.length === 1 && suitCards.length <= 2;
}

/** Whether position is a defender (not declarer or dummy) */
function isDefender(position: Position, state: GameState): boolean {
  return position !== state.declarer && position !== state.dummy;
}

/** Get the seat position in the current trick (1=leader, 2=second, 3=third, 4=fourth) */
function seatInTrick(state: GameState): number {
  return state.currentTrick.length + 1;
}

/** Smart discard: discard from shortest non-trump suit, lowest card, avoiding unguarded honors */
function smartDiscard(validCards: Card[], hand: Card[], trumpSuit: Suit | null): Card {
  // Prefer discarding from a suit with no honors
  const nonTrump = validCards.filter(c => c.suit !== trumpSuit);
  const candidates = nonTrump.length > 0 ? nonTrump : validCards;

  // Prefer suits without honors
  const noHonors = candidates.filter(c => {
    const suitCards = hand.filter(h => h.suit === c.suit);
    return suitCards.every(h => hcp(h.rank) === 0);
  });

  const pool = noHonors.length > 0 ? noHonors : candidates;
  return pool.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
}

/** Advanced AI: significantly smarter card selection */
export function aiSelectCard(state: GameState, position: Position): Card {
  const hand = state.hands[position];
  const validCards = getValidCards(hand, state.currentTrick);

  if (validCards.length === 1) return validCards[0];

  const playedCards = getPlayedCards(state);
  const knownVoids = getKnownVoids(state);
  const partner = partnerOf(position);
  const defending = isDefender(position, state);
  const seat = seatInTrick(state);
  const leadSuit = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;
  const trumpSuit = state.trumpSuit;

  // ──────────────────────────────────────────────
  // LEADING (seat 1)
  // ──────────────────────────────────────────────
  if (state.currentTrick.length === 0) {
    return aiLead(hand, validCards, state, position, playedCards, knownVoids, defending);
  }

  const followingSuit = leadSuit && validCards[0].suit === leadSuit;

  // ──────────────────────────────────────────────
  // FOLLOWING SUIT
  // ──────────────────────────────────────────────
  if (followingSuit && leadSuit) {
    const winning = currentWinningPlay(state.currentTrick, trumpSuit);
    const partnerWinning = winning.position === partner;
    const sorted = [...validCards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
    const lowest = sorted[sorted.length - 1];
    const highest = sorted[0];

    // FOURTH SEAT: Play just enough to win, or give up
    if (seat === 4) {
      if (partnerWinning) return lowest;
      // Try to win with cheapest card
      const beaters = sorted.filter(c => rankValue(c.rank) > rankValue(winning.card.rank));
      return beaters.length > 0 ? beaters[beaters.length - 1] : lowest;
    }

    // THIRD SEAT ("third hand high")
    if (seat === 3) {
      if (partnerWinning) {
        // Partner led and is winning. If partner played high, play low.
        // If an opponent overtook, we need to beat them.
        const opponentPlayed = state.currentTrick.find(
          p => p.position !== partner && p.position !== position
        );
        if (opponentPlayed && opponentPlayed.card.suit === leadSuit) {
          const opRank = rankValue(opponentPlayed.card.rank);
          if (opRank > rankValue(winning.card.rank)) {
            // Opponent is actually winning, try to beat
            const beaters = sorted.filter(c => rankValue(c.rank) > opRank);
            return beaters.length > 0 ? beaters[beaters.length - 1] : lowest;
          }
        }
        return lowest; // Partner winning, play low
      }
      // Third hand high: play highest, but if we have a sequence, play lowest of sequence
      const topSeq = topOfSequence(validCards, leadSuit);
      if (topSeq && rankValue(topSeq.rank) > rankValue(winning.card.rank)) {
        // Play lowest in our winning sequence to save honors
        const seqCards = [topSeq];
        for (let i = sorted.indexOf(topSeq) + 1; i < sorted.length; i++) {
          if (rankValue(seqCards[seqCards.length - 1].rank) - rankValue(sorted[i].rank) === 1) {
            seqCards.push(sorted[i]);
          } else break;
        }
        const lowestSeq = seqCards[seqCards.length - 1];
        if (rankValue(lowestSeq.rank) > rankValue(winning.card.rank)) return lowestSeq;
      }
      // Just play highest
      return rankValue(highest.rank) > rankValue(winning.card.rank) ? highest : lowest;
    }

    // SECOND SEAT ("second hand low" — classic defensive principle)
    if (seat === 2) {
      // Exception: cover an honor with an honor
      const leaderCard = state.currentTrick[0].card;
      if (hcp(leaderCard.rank) > 0 && leaderCard.suit === leadSuit) {
        // Cover honor with honor if it could promote something for partner
        const coverCards = sorted.filter(c => rankValue(c.rank) > rankValue(leaderCard.rank) && hcp(c.rank) > 0);
        if (coverCards.length > 0) {
          // Cover with the lowest honor that beats it
          return coverCards[coverCards.length - 1];
        }
      }
      // Second hand low: play low (unless we can win cheaply with a spot card)
      return lowest;
    }

    // Default: try to win cheaply or play low
    if (partnerWinning) return lowest;
    const beaters = sorted.filter(c => rankValue(c.rank) > rankValue(winning.card.rank));
    return beaters.length > 0 ? beaters[beaters.length - 1] : lowest;
  }

  // ──────────────────────────────────────────────
  // CAN'T FOLLOW SUIT — TRUMP OR DISCARD
  // ──────────────────────────────────────────────
  const winning = currentWinningPlay(state.currentTrick, trumpSuit);
  const partnerWinning = winning.position === partner;

  // If partner is winning, just discard
  if (partnerWinning) {
    return smartDiscard(validCards, hand, trumpSuit);
  }

  // If trump contract, consider ruffing
  if (trumpSuit) {
    const trumpCards = validCards
      .filter(c => c.suit === trumpSuit)
      .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

    if (trumpCards.length > 0) {
      // Check if someone already trumped higher
      const winnerIsTrump = winning.card.suit === trumpSuit;
      if (winnerIsTrump) {
        // Need to overruff
        const overruffs = trumpCards.filter(c => rankValue(c.rank) > rankValue(winning.card.rank));
        if (overruffs.length > 0) return overruffs[0]; // Lowest overruff
        // Can't overruff — discard instead of wasting a trump
        return smartDiscard(validCards.filter(c => c.suit !== trumpSuit), hand, trumpSuit)
          || smartDiscard(validCards, hand, trumpSuit);
      }
      // Ruff with lowest trump
      return trumpCards[0];
    }
  }

  // No trumps available — discard
  return smartDiscard(validCards, hand, trumpSuit);
}

/** Advanced opening lead selection */
function aiLead(
  hand: Card[],
  validCards: Card[],
  state: GameState,
  position: Position,
  playedCards: Set<string>,
  knownVoids: Map<Position, Set<Suit>>,
  defending: boolean,
): Card {
  const trumpSuit = state.trumpSuit;
  const suitCounts: Record<Suit, number> = { spade: 0, heart: 0, diamond: 0, club: 0 };
  for (const c of hand) suitCounts[c.suit]++;

  // Calculate suit strength (honors + length)
  const suitScores: { suit: Suit; score: number; count: number }[] = [];
  for (const s of SUIT_ORDER) {
    if (s === trumpSuit && defending) continue; // Don't lead trumps unless strategic
    const suitCards = hand.filter(c => c.suit === s);
    if (suitCards.length === 0) continue;
    let score = 0;
    // Length points
    score += suitCards.length * 2;
    // Honor points
    for (const c of suitCards) score += hcp(c.rank) * 2;
    // Sequence bonus: KQJ or QJ10 are great leads
    const seq = topOfSequence(hand, s);
    if (seq) score += 10;
    // Penalize unsupported honors (leading from Kx is bad)
    if (suitCards.length <= 2 && suitCards.some(c => hcp(c.rank) > 0 && c.rank !== "A")) {
      score -= 8;
    }
    // Bonus for partner's known void (can give a ruff)
    const partner = partnerOf(position);
    if (trumpSuit && knownVoids.get(partner)?.has(s)) {
      score += 15;
    }
    suitScores.push({ suit: s, score, count: suitCards.length });
  }

  // Against NT: lead longest suit
  // Against suit contract: lead from best combination
  if (!trumpSuit) {
    // NT: prefer length, especially with honors
    suitScores.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.score - a.score;
    });
  } else {
    suitScores.sort((a, b) => b.score - a.score);
  }

  // Consider leading trumps if defending a suit contract and we have 4+ trumps
  if (defending && trumpSuit && suitCounts[trumpSuit] >= 4) {
    const trumpCards = hand.filter(c => c.suit === trumpSuit)
      .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    // Lead low trump to draw declarer's trumps
    if (trumpCards.length > 0) return trumpCards[0];
  }

  // Pick the best suit to lead
  const bestSuit = suitScores.length > 0 ? suitScores[0].suit : hand[0].suit;
  const suitCards = hand.filter(c => c.suit === bestSuit)
    .sort((a, b) => rankValue(b.rank) - rankValue(a.rank));

  // Choose which card in the suit to lead:
  // 1. Top of a sequence (KQJ → K, QJ10 → Q)
  const seqTop = topOfSequence(hand, bestSuit);
  if (seqTop) return seqTop;

  // 2. Singleton: lead it (especially in suit contracts for ruffing potential)
  if (suitCards.length === 1) return suitCards[0];

  // 3. Top of a doubleton (Kx → K, but not if it's an unsupported honor against NT)
  if (suitCards.length === 2) {
    if (trumpSuit) return suitCards[0]; // Top of doubleton in suit contract
    // In NT, avoid leading from Kx or Qx — prefer 4th best from a longer suit
    if (hcp(suitCards[0].rank) > 0 && suitScores.length > 1) {
      // Try next best suit
      const altSuit = suitScores[1].suit;
      const altCards = hand.filter(c => c.suit === altSuit)
        .sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
      if (altCards.length >= 4) {
        return altCards[3]; // 4th best
      }
    }
    return suitCards[0]; // Lead top of doubleton anyway
  }

  // 4. Fourth-best from length (4+ cards): standard lead
  if (suitCards.length >= 4) {
    return suitCards[3];
  }

  // 5. Low from 3 cards (unless AKx, lead A first)
  if (suitCards.length === 3) {
    const hasAK = suitCards.some(c => c.rank === "A") && suitCards.some(c => c.rank === "K");
    if (hasAK) return suitCards.find(c => c.rank === "A")!;
    return suitCards[suitCards.length - 1]; // Lead low from 3
  }

  return suitCards[suitCards.length - 1];
}

/**
 * Rotate table so declarer sits at South (bottom of screen), dummy at North (top).
 * Standard bridge display convention.
 */
const ROTATIONS: Record<Position, Record<Position, Position>> = {
  south: { north: "north", south: "south", east: "east", west: "west" },
  north: { north: "south", south: "north", east: "west", west: "east" },
  east:  { north: "west",  south: "east",  east: "south", west: "north" },
  west:  { north: "east",  south: "west",  east: "north", west: "south" },
};

/** Map a game position to a display position given the declarer */
export function toDisplayPosition(gamePos: Position, declarer: Position): Position {
  return ROTATIONS[declarer][gamePos];
}

/** Map a display position back to a game position given the declarer */
export function toGamePosition(displayPos: Position, declarer: Position): Position {
  const map = ROTATIONS[declarer];
  for (const [game, disp] of Object.entries(map)) {
    if (disp === displayPos) return game as Position;
  }
  return displayPos;
}

/** Calculate the result score */
export function getResult(state: GameState): {
  tricksNeeded: number;
  tricksMade: number;
  result: number; // positive = made, negative = down
  declarerPartnership: Partnership;
} {
  const { tricksNeeded } = parseContract(state.contract);
  const declarerPartnership = partnershipOf(state.declarer);
  const tricksMade = state.trickCount[declarerPartnership];

  return {
    tricksNeeded,
    tricksMade,
    result: tricksMade - tricksNeeded,
    declarerPartnership,
  };
}
