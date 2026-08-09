/**
 * Etichette accessibili (in italiano) per carte, semi e posizioni al tavolo.
 *
 * Rilievo perizie 2026-08: tavolo, carte e controlli di gioco erano resi con
 * simboli grafici (♠ ♥ ♦ ♣) e testo di una lettera, quindi illeggibili da uno
 * screen reader. Qui c'è la traduzione unica riusata da tutti i componenti in
 * `src/components/bridge/`.
 *
 * Funzioni pure, nessuna dipendenza dal DOM → testate in `card-labels.test.ts`.
 */

export type CardSuit = "spade" | "heart" | "diamond" | "club";
export type CardRank =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "10"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3"
  | "2";

export interface LabelledCard {
  suit: string;
  rank: string;
}

/** Nome italiano del seme, al singolare/plurale d'uso ("Asso di **picche**"). */
const SUIT_NAMES: Record<CardSuit, string> = {
  spade: "picche",
  heart: "cuori",
  diamond: "quadri",
  club: "fiori",
};

/** Simbolo Unicode → chiave interna del seme (usato da CardDisplay & co.). */
const SYMBOL_TO_SUIT: Record<string, CardSuit> = {
  "♠": "spade",
  "♥": "heart",
  "♦": "diamond",
  "♣": "club",
};

/** Sigle inglesi usate nei dati PBN/BEN. */
const LETTER_TO_SUIT: Record<string, CardSuit> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
};

/** Nome italiano delle figure; le cartine restano numeriche. */
const RANK_NAMES: Record<string, string> = {
  A: "Asso",
  K: "Re",
  Q: "Donna",
  J: "Fante",
  T: "10",
};

const POSITION_NAMES: Record<string, string> = {
  north: "Nord",
  south: "Sud",
  east: "Est",
  west: "Ovest",
  n: "Nord",
  s: "Sud",
  e: "Est",
  w: "Ovest",
};

/**
 * Normalizza un seme espresso come chiave interna ("spade"), simbolo ("♠")
 * o sigla PBN ("S"). Restituisce null se non riconosciuto.
 */
export function normalizeSuit(suit: string): CardSuit | null {
  if (!suit) return null;
  const trimmed = suit.trim();
  if (trimmed in SYMBOL_TO_SUIT) return SYMBOL_TO_SUIT[trimmed];
  const lower = trimmed.toLowerCase();
  if (lower in SUIT_NAMES) return lower as CardSuit;
  const upper = trimmed.toUpperCase();
  if (upper in LETTER_TO_SUIT) return LETTER_TO_SUIT[upper];
  return null;
}

/** "picche" | "cuori" | "quadri" | "fiori" — stringa vuota se seme ignoto. */
export function suitAriaLabel(suit: string): string {
  const key = normalizeSuit(suit);
  return key ? SUIT_NAMES[key] : "";
}

/** "Asso" | "Re" | "Donna" | "Fante" | "10" | "9" … */
export function rankAriaLabel(rank: string): string {
  const trimmed = String(rank ?? "").trim();
  const upper = trimmed.toUpperCase();
  return RANK_NAMES[upper] ?? trimmed;
}

/**
 * Etichetta completa di una carta: "Asso di picche", "Re di cuori",
 * "10 di quadri". Se il seme non è riconoscibile ripiega sul solo rango.
 */
export function cardAriaLabel(card: LabelledCard): string {
  const rank = rankAriaLabel(card?.rank ?? "");
  const suit = suitAriaLabel(card?.suit ?? "");
  if (!rank && !suit) return "";
  if (!suit) return rank;
  if (!rank) return suit;
  return `${rank} di ${suit}`;
}

/** "Nord" | "Sud" | "Est" | "Ovest" (accetta "north"/"N"/"n"). */
export function positionAriaLabel(position: string): string {
  const key = String(position ?? "").trim().toLowerCase();
  return POSITION_NAMES[key] ?? "";
}

/** "Sud gioca Asso di picche" — usato per le carte della presa in corso. */
export function trickCardAriaLabel(position: string, card: LabelledCard): string {
  const who = positionAriaLabel(position);
  const what = cardAriaLabel(card);
  return who ? `${who} gioca ${what}` : what;
}

/**
 * Etichetta di una dichiarazione: "1 picche", "3 senza atout", "Passo",
 * "Contro", "Surcontro". Stringa vuota per le celle vuote della licita.
 * Accetta sia le sigle inglesi ("1NT", "4H", "P", "X") sia i simboli ("1♠").
 */
export function bidAriaLabel(bid: string): string {
  const raw = String(bid ?? "").trim();
  if (!raw || raw === "—" || raw === "-") return "";

  const upper = raw.toUpperCase();
  if (upper === "P" || upper === "PASS" || upper === "PASSO") return "Passo";
  if (upper === "XX" || upper === "SURCONTRO" || upper === "REDBL") return "Surcontro";
  if (upper === "X" || upper === "CONTRE" || upper === "CONTRO" || upper === "DBL")
    return "Contro";

  const level = raw[0];
  if (!/[1-7]/.test(level)) return raw;
  const strain = raw.slice(1).trim().toUpperCase();
  if (strain === "NT" || strain === "SA") return `${level} senza atout`;
  const suit = suitAriaLabel(strain);
  return suit ? `${level} ${suit}` : raw;
}

/**
 * Etichetta di una mano intera raggruppata per seme:
 * "Picche: Asso, Re, 4. Cuori: nessuna carta. …"
 * Utile come `aria-label` del contenitore di una mano/morto.
 */
export function handAriaLabel(
  cards: readonly LabelledCard[],
  owner?: string
): string {
  const order: CardSuit[] = ["spade", "heart", "diamond", "club"];
  const parts = order.map((suit) => {
    const ranks = cards
      .filter((c) => normalizeSuit(c.suit) === suit)
      .map((c) => rankAriaLabel(c.rank));
    const name = SUIT_NAMES[suit];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return `${capitalized}: ${ranks.length ? ranks.join(", ") : "nessuna carta"}`;
  });
  const body = parts.join(". ");
  const who = owner ? positionAriaLabel(owner) : "";
  return who ? `Mano di ${who}. ${body}` : body;
}
