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

/** Simple AI: plays a valid card (basic strategy) */
export function aiSelectCard(state: GameState, position: Position): Card {
  const hand = state.hands[position];
  const validCards = getValidCards(hand, state.currentTrick);

  if (validCards.length === 1) {
    return validCards[0];
  }

  const leadSuit = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;

  // If leading, pick from longest suit, lowest card
  if (state.currentTrick.length === 0) {
    const suitCounts: Record<Suit, number> = { spade: 0, heart: 0, diamond: 0, club: 0 };
    for (const c of hand) suitCounts[c.suit]++;

    let bestSuit: Suit = hand[0].suit;
    let bestCount = 0;
    for (const s of SUIT_ORDER) {
      if (s !== state.trumpSuit && suitCounts[s] > bestCount) {
        bestCount = suitCounts[s];
        bestSuit = s;
      }
    }

    const suitCards = validCards
      .filter((c) => c.suit === bestSuit)
      .sort((a, b) => rankValue(b.rank) - rankValue(a.rank));

    return suitCards.length >= 4 ? suitCards[3] : suitCards[suitCards.length - 1];
  }

  // Following suit
  if (leadSuit && validCards[0].suit === leadSuit) {
    // If partner is currently winning, play low
    if (state.currentTrick.length >= 2) {
      const winning = currentWinningPlay(state.currentTrick, state.trumpSuit);
      if (winning.position === partnerOf(position)) {
        return validCards.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
      }
    }

    // Try to win — play lowest card that beats current highest
    const highestInTrick = state.currentTrick
      .filter((p) => p.card.suit === leadSuit)
      .sort((a, b) => rankValue(b.card.rank) - rankValue(a.card.rank))[0];

    if (highestInTrick) {
      const winningCards = validCards
        .filter((c) => c.suit === leadSuit && rankValue(c.rank) > rankValue(highestInTrick.card.rank))
        .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

      if (winningCards.length > 0) {
        return winningCards[0];
      }
    }

    return validCards.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
  }

  // Can't follow suit
  if (state.trumpSuit) {
    const trumpCards = validCards
      .filter((c) => c.suit === state.trumpSuit)
      .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

    // If partner is currently winning, just discard
    if (state.currentTrick.length >= 2) {
      const winning = currentWinningPlay(state.currentTrick, state.trumpSuit);
      if (winning.position === partnerOf(position)) {
        return validCards.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
      }
    }

    if (trumpCards.length > 0) {
      return trumpCards[0];
    }
  }

  return validCards.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
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
