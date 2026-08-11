/**
 * FIGB Bridge LAB - PBN import (Portable Bridge Notation)
 *
 * Parses .pbn files/text into app `Smazzata` objects so instructors can
 * assign hands from any dealing program (Dealer4, BridgeComposer, BBO…).
 *
 * Supported tags: Board, Dealer, Vulnerable, Deal, Contract, Declarer,
 * Event, Play (only the opening lead is read). Everything else is ignored.
 * Hands without a playable contract (e.g. "Pass") are reported and skipped.
 */

import type { Card, Position, Rank, Suit } from "./bridge-engine";
import { nextPlayer } from "./bridge-engine";
import type { Smazzata, Vulnerability } from "./catalog";

export interface PbnImportResult {
  deals: Smazzata[];
  /** Human-readable problems (Italian), one per skipped record */
  errors: string[];
}

// ─── PBN char maps ───────────────────────────────────────────────────────

const SEAT: Record<string, Position> = {
  N: "north",
  E: "east",
  S: "south",
  W: "west",
};

/** Clockwise order used by the Deal tag, starting from the reference seat */
const CLOCKWISE: Position[] = ["north", "east", "south", "west"];

/** Suit order inside one PBN hand: spades.hearts.diamonds.clubs */
const PBN_SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

const PBN_SUIT_LETTER: Record<string, Suit> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
};

const SUIT_SYMBOL: Record<string, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

function pbnRank(ch: string): Rank | null {
  const c = ch.toUpperCase();
  if (c === "T") return "10";
  if ("AKQJ98765432".includes(c) && c.length === 1) return c as Rank;
  return null;
}

// ─── Record model (one PBN game = a bag of tags + optional play lines) ──

interface PbnRecord {
  tags: Map<string, string>;
  playLeader: Position | null;
  firstPlayCard: string | null; // e.g. "H5"
}

/** Split raw PBN text into game records. A record ends at a blank line that
 *  follows a Deal tag, or when a tag repeats (new game without separator). */
function splitRecords(text: string): PbnRecord[] {
  const records: PbnRecord[] = [];
  let current: PbnRecord = { tags: new Map(), playLeader: null, firstPlayCard: null };
  let inPlay = false;

  const push = () => {
    if (current.tags.size > 0) records.push(current);
    current = { tags: new Map(), playLeader: null, firstPlayCard: null };
    inPlay = false;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("%")) continue; // comment / directive
    if (line === "") {
      if (current.tags.has("DEAL")) push();
      inPlay = false;
      continue;
    }

    const tagMatch = line.match(/^\[(\w+)\s+"([^"]*)"\]/);
    if (tagMatch) {
      const name = tagMatch[1].toUpperCase();
      const value = tagMatch[2];
      inPlay = false;
      // Repeated tag without blank-line separator → new game starts here
      if (current.tags.has(name)) push();
      current.tags.set(name, value);
      if (name === "PLAY") {
        current.playLeader = SEAT[value.toUpperCase()] ?? null;
        inPlay = true;
      }
      continue;
    }

    // Non-tag line: if we're right after [Play], the first token is the lead
    if (inPlay && !current.firstPlayCard) {
      const token = line.split(/\s+/)[0]?.toUpperCase();
      if (token && /^[SHDC][AKQJT98765432]$/.test(token)) {
        current.firstPlayCard = token;
      }
      inPlay = false; // we only need the opening lead
    }
  }
  push();
  return records;
}

// ─── Field parsers ───────────────────────────────────────────────────────

/** "N:KQT2.AT3.J4.A985 ..." → four 13-card hands (or throws) */
function parseDeal(deal: string): Record<Position, Card[]> {
  const m = deal.trim().match(/^([NESW]):(.+)$/i);
  if (!m) throw new Error("formato Deal non valido");
  const start = SEAT[m[1].toUpperCase()];
  const handStrs = m[2].trim().split(/\s+/);
  if (handStrs.length !== 4) throw new Error("il Deal non contiene 4 mani");

  const hands: Record<Position, Card[]> = {
    north: [],
    south: [],
    east: [],
    west: [],
  };
  const seen = new Set<string>();
  const startIdx = CLOCKWISE.indexOf(start);

  for (let h = 0; h < 4; h++) {
    const pos = CLOCKWISE[(startIdx + h) % 4];
    const suits = handStrs[h].split(".");
    if (suits.length !== 4) throw new Error(`mano ${h + 1}: servono 4 colori separati da punti`);
    for (let s = 0; s < 4; s++) {
      for (const ch of suits[s]) {
        const rank = pbnRank(ch);
        if (!rank) throw new Error(`mano ${h + 1}: carta "${ch}" non riconosciuta`);
        const key = `${PBN_SUITS[s]}-${rank}`;
        if (seen.has(key)) throw new Error(`carta duplicata nel Deal (${ch})`);
        seen.add(key);
        hands[pos].push({ suit: PBN_SUITS[s], rank });
      }
    }
    if (hands[pos].length !== 13)
      throw new Error(`mano ${h + 1}: ${hands[pos].length} carte invece di 13`);
  }
  return hands;
}

/** "4S" / "3NT" / "4HX" / "5DXX" → app contract string ("4♠", "3NT", "4♥X") */
function parseContractTag(value: string): string | null {
  const m = value.trim().toUpperCase().match(/^([1-7])(NT|SA|[SHDC])(X{0,2})$/);
  if (!m) return null;
  const denom = m[2] === "NT" || m[2] === "SA" ? "NT" : SUIT_SYMBOL[m[2]];
  return `${m[1]}${denom}${m[3]}`;
}

function parseVulnerability(value: string | undefined): Vulnerability {
  switch ((value ?? "").trim().toUpperCase()) {
    case "NS":
      return "ns";
    case "EW":
      return "ew";
    case "ALL":
    case "BOTH":
      return "both";
    default:
      return "none"; // None / Love / missing
  }
}

/** Classic default lead when the PBN has no Play section: from declarer's
 *  left, longest non-trump suit — 4th highest with 4+, top of a doubleton,
 *  otherwise lowest. */
function defaultOpeningLead(hand: Card[], trumpLetter: string | null): Card {
  const trump = trumpLetter ? PBN_SUIT_LETTER[trumpLetter] ?? null : null;
  const bySuit = new Map<Suit, Card[]>();
  for (const c of hand) {
    if (!bySuit.has(c.suit)) bySuit.set(c.suit, []);
    bySuit.get(c.suit)!.push(c);
  }
  const RANKS: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sortDesc = (cards: Card[]) =>
    [...cards].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));

  const candidates = [...bySuit.entries()]
    .filter(([suit]) => suit !== trump)
    .sort((a, b) => b[1].length - a[1].length);
  const pool = candidates.length > 0 ? candidates : [...bySuit.entries()];
  const suitCards = sortDesc(pool[0][1]);

  if (suitCards.length >= 4) return suitCards[3]; // 4th highest
  if (suitCards.length === 2) return suitCards[0]; // top of doubleton
  return suitCards[suitCards.length - 1]; // lowest
}

// ─── Main entry point ────────────────────────────────────────────────────

/**
 * Parse PBN text into Smazzata objects. `idPrefix` keeps ids unique across
 * imports (e.g. pass a timestamp from the caller).
 */
export function parsePbn(text: string, idPrefix = "pbn"): PbnImportResult {
  const deals: Smazzata[] = [];
  const errors: string[] = [];
  const records = splitRecords(text);

  let index = 0;
  for (const rec of records) {
    if (!rec.tags.has("DEAL")) continue; // header-only record (Event, Site…)
    index++;
    const label = rec.tags.get("BOARD")
      ? `Board ${rec.tags.get("BOARD")}`
      : `Mano ${index}`;

    try {
      const hands = parseDeal(rec.tags.get("DEAL")!);

      const contractRaw = rec.tags.get("CONTRACT") ?? "";
      const contract = parseContractTag(contractRaw);
      if (!contract) {
        errors.push(
          contractRaw.toUpperCase() === "PASS"
            ? `${label}: passata in apertura — saltata`
            : `${label}: contratto mancante o non valido ("${contractRaw}") — saltata`
        );
        continue;
      }

      const declarerLetter = (rec.tags.get("DECLARER") ?? "").toUpperCase();
      const declarer = SEAT[declarerLetter];
      if (!declarer) {
        errors.push(`${label}: dichiarante mancante o non valido — saltata`);
        continue;
      }

      // Opening lead: from the Play section when present and plausible,
      // otherwise a sensible default from declarer's left.
      const leader = nextPlayer(declarer);
      let openingLead: Card | null = null;
      if (rec.firstPlayCard && rec.playLeader === leader) {
        const suit = PBN_SUIT_LETTER[rec.firstPlayCard[0]];
        const rank = pbnRank(rec.firstPlayCard[1]);
        if (suit && rank) {
          const inHand = hands[leader].some((c) => c.suit === suit && c.rank === rank);
          if (inHand) openingLead = { suit, rank };
        }
      }
      if (!openingLead) {
        const trumpLetter = contractRaw.trim().toUpperCase().match(/^[1-7](NT|SA|[SHDC])/)?.[1] ?? null;
        openingLead = defaultOpeningLead(
          hands[leader],
          trumpLetter === "NT" || trumpLetter === "SA" ? null : trumpLetter
        );
      }

      const board = parseInt(rec.tags.get("BOARD") ?? "", 10);
      deals.push({
        id: `${idPrefix}-${index}`,
        lesson: 0, // custom hand: not tied to a catalog lesson
        board: Number.isFinite(board) ? board : index,
        title: rec.tags.get("EVENT")?.trim() || label,
        contract,
        declarer,
        openingLead,
        vulnerability: parseVulnerability(rec.tags.get("VULNERABLE")),
        hands,
        commentary: "",
      });
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : "errore di parsing"}`);
    }
  }

  if (deals.length === 0 && errors.length === 0) {
    errors.push("Nessuna mano trovata nel file PBN (manca il tag [Deal]).");
  }
  return { deals, errors };
}

// ─── PBN export ──────────────────────────────────────────────────────────

/**
 * Serializza una smazzata nel valore del tag `[Deal]`, es.
 * `N:AK5.QJ3.T92.K876 QJ2.A87.AKQ.9543 ... ...`
 *
 * Le mani seguono l'ordine orario a partire da quella nominata; i semi vanno
 * sempre picche.cuori.quadri.fiori e le carte in ordine decrescente. Il dieci
 * si scrive `T`: è la convenzione PBN, e scriverlo "10" romperebbe i lettori
 * che contano un carattere per carta.
 */
export function dealToPbnString(hands: Record<Position, Card[]>): string {
  const suitOrder: Suit[] = ["spade", "heart", "diamond", "club"];
  const rankOrder: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const seats: Position[] = ["north", "east", "south", "west"];

  const handToString = (hand: readonly Card[]) =>
    suitOrder
      .map((suit) =>
        hand
          .filter((c) => c.suit === suit)
          .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank))
          .map((c) => (c.rank === "10" ? "T" : c.rank))
          .join("")
      )
      .join(".");

  return `N:${seats.map((s) => handToString(hands[s])).join(" ")}`;
}

/**
 * File PBN completo con una o più smazzate, pronto da scaricare e aprire in
 * Dealer4, BridgeComposer o BBO.
 *
 * Dealer e vulnerabilità seguono la rotazione standard dei board, così una
 * serie generata si comporta come una vera serie di smazzate da torneo invece
 * che come 16 board tutti "Nessuna / Nord".
 */
export function dealsToPbn(
  deals: readonly Record<Position, Card[]>[],
  event = "BridgeLab - mani generate"
): string {
  const dealers = ["N", "E", "S", "W"];
  const vulnerabilities = [
    "None", "NS", "EW", "All",
    "NS", "EW", "All", "None",
    "EW", "All", "None", "NS",
    "All", "None", "NS", "EW",
  ];

  return deals
    .map((hands, i) => {
      const board = i + 1;
      return [
        `[Event "${event}"]`,
        `[Board "${board}"]`,
        `[Dealer "${dealers[i % 4]}"]`,
        `[Vulnerable "${vulnerabilities[i % 16]}"]`,
        `[Deal "${dealToPbnString(hands)}"]`,
        "",
      ].join("\n");
    })
    .join("\n");
}
