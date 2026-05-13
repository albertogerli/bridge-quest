/**
 * FIGB Bridge LAB - Combined index of all Smazzate (practice hands)
 * From FIGB Corso Fiori, Quadri, Cuori Gioco, Cuori Licita
 */

import { smazzate as smazzate1to4, type Smazzata } from "./smazzate";
import { smazzate5to8 } from "./smazzate-5-8";
import { smazzate9to12 } from "./smazzate-9-12";
import { quadriSmazzate } from "./quadri-smazzate";
import { cuoriGiocoSmazzate } from "./cuori-gioco-smazzate";
import { cuoriLicitaSmazzate } from "./cuori-licita-smazzate";
import { getLessonById } from "./courses";
import { getLessonDisplayNumber } from "./lesson-meta";
import type { Position, Card, Suit, Rank } from "../lib/bridge-engine";

export type { Smazzata } from "./smazzate";

type Vulnerability = "none" | "ns" | "ew" | "both";

const POSITIONS: Position[] = ["north", "south", "east", "west"];
const RANK_ORDER: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

function nextPos(p: Position): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  return order[(order.indexOf(p) + 1) % 4];
}

function declarerFromBidding(bidding: { dealer: Position; bids: string[] }): Position | null {
  const order: Position[] = ["south", "west", "north", "east"];
  const dealerIdx = order.indexOf(bidding.dealer);
  if (dealerIdx === -1) return null;

  let lastBidIdx = -1;
  for (let i = bidding.bids.length - 1; i >= 0; i--) {
    const b = bidding.bids[i];
    if (b !== "P" && b !== "Dbl" && b !== "Rdbl" && b !== "X" && b !== "XX") {
      lastBidIdx = i;
      break;
    }
  }
  if (lastBidIdx === -1) return null;

  const lastBidderPos = order[(dealerIdx + lastBidIdx) % 4];
  const winningSide = lastBidderPos === "north" || lastBidderPos === "south" ? "ns" : "ew";
  const denom = bidding.bids[lastBidIdx].replace(/[0-9]/g, "").toUpperCase();

  for (let i = 0; i < bidding.bids.length; i++) {
    const pos = order[(dealerIdx + i) % 4];
    const bid = bidding.bids[i];
    if (bid === "P" || bid === "Dbl" || bid === "Rdbl" || bid === "X" || bid === "XX") continue;
    const bidDenom = bid.replace(/[0-9]/g, "").toUpperCase();
    const bidSide = pos === "north" || pos === "south" ? "ns" : "ew";
    if (bidSide === winningSide && bidDenom === denom) return pos;
  }
  return lastBidderPos;
}

function pickOpeningLead(hand: Card[], trumpSuit: string | null): Card {
  const suits: Suit[] = ["spade", "heart", "diamond", "club"];
  const nonTrump = suits.filter(s => s !== trumpSuit);
  const preferred = [...nonTrump, ...(trumpSuit ? [trumpSuit as Suit] : [])];

  for (const suit of preferred) {
    const cards = hand.filter(c => c.suit === suit).sort(
      (a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
    );
    if (cards.length >= 4) return cards[3];
    if (cards.length >= 2) return cards[0];
  }
  return hand[0];
}

function contractTrumpSuit(contract: string): Suit | null {
  const normalized = contract.replace(/♠/g, "S").replace(/♥/g, "H").replace(/♦/g, "D").replace(/♣/g, "C");
  const m = normalized.match(/\d(NT|S|H|D|C)/i);
  if (!m) return null;
  const s = m[1].toUpperCase();
  if (s === "S") return "spade";
  if (s === "H") return "heart";
  if (s === "D") return "diamond";
  if (s === "C") return "club";
  return null;
}

function fixDeclarerFromBidding(s: Smazzata): Smazzata {
  if (!s.bidding) return s;
  const correct = declarerFromBidding(s.bidding);
  if (!correct || correct === s.declarer) return s;

  const newLeader = nextPos(correct);
  const leaderHand = s.hands[newLeader];
  const hasLead = leaderHand.some(
    c => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank
  );

  return {
    ...s,
    declarer: correct,
    openingLead: hasLead ? s.openingLead : pickOpeningLead(leaderHand, contractTrumpSuit(s.contract)),
  };
}

/** Filter out smazzate with data issues (wrong hand sizes, duplicates, bad opening leads) */
function validateSmazzate(hands: Smazzata[]): Smazzata[] {
  return hands.map(fixDeclarerFromBidding).filter((s) => {
    for (const pos of POSITIONS) {
      if (s.hands[pos].length !== 13) return false;
    }
    const seen = new Set<string>();
    for (const pos of POSITIONS) {
      for (const c of s.hands[pos]) {
        const key = `${c.suit}-${c.rank}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
    }
    const leader = nextPos(s.declarer);
    const hasLead = s.hands[leader].some(
      (c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank
    );
    if (!hasLead) return false;
    return true;
  });
}

// Normalize vulnerability values ("all" -> "both")
function normalizeVul(v: string): Vulnerability {
  if (v === "all" || v === "both") return "both";
  if (v === "ns" || v === "ew" || v === "none") return v;
  return "none";
}

// Normalize the 5-8 format to our standard Smazzata type
const normalized5to8: Smazzata[] = smazzate5to8.map((h) => ({
  id: h.id,
  lesson: h.lesson,
  board: h.board,
  title: h.title,
  contract: h.contract,
  declarer: h.declarer as Position,
  openingLead: h.openingLead as Card,
  vulnerability: normalizeVul(h.vulnerability),
  hands: h.hands as { north: Card[]; south: Card[]; east: Card[]; west: Card[] },
  commentary: h.commentary,
}));

// Normalize 9-12 format
const normalized9to12: Smazzata[] = smazzate9to12.map((h) => ({
  id: h.id,
  lesson: h.lesson,
  board: h.board,
  title: h.title,
  contract: h.contract,
  declarer: h.declarer as Position,
  openingLead: h.openingLead as Card,
  vulnerability: normalizeVul(h.vulnerability as string),
  hands: h.hands as { north: Card[]; south: Card[]; east: Card[]; west: Card[] },
  commentary: h.commentary,
}));

/** Fiori smazzate (96 hands) */
export const fioriSmazzate: Smazzata[] = [
  ...smazzate1to4,
  ...normalized5to8,
  ...normalized9to12,
];

/** All practice hands from all courses (validated: correct hand sizes, no duplicates, valid opening lead) */
export const allSmazzate: Smazzata[] = validateSmazzate([
  ...fioriSmazzate,
  ...quadriSmazzate,
  ...cuoriGiocoSmazzate,
  ...cuoriLicitaSmazzate,
]);

// ---------------------------------------------------------------------------
// Coerenza HCP linea dichiarante / contratto
//
// Alcune smazzate del corpus FIGB sono state importate con punti distribuiti
// sulle posizioni sbagliate (la linea dichiarante risulta avere molti meno HCP
// del minimo plausibile). Per le challenge "a sorte" (sfida giorno, settimanale,
// torneo) filtriamo queste smazzate, evitando di proporre p.es. un 3NT con 14
// punti in linea. Le smazzate restano nel pool generale (`allSmazzate`) e
// raggiungibili per id, così non si rompe il resto.
// ---------------------------------------------------------------------------

const HCP_TABLE: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

function handHcp(hand: Card[]): number {
  let s = 0;
  for (const c of hand) s += HCP_TABLE[c.rank] ?? 0;
  return s;
}

function minHcpForContract(contract: string): number {
  // Normalizza simboli unicode → ASCII (♠→S, ♥→H, ♦→D, ♣→C) e rimuove X/R finali
  const normalized = contract
    .replace(/♠/g, "S")
    .replace(/♥/g, "H")
    .replace(/♦/g, "D")
    .replace(/♣/g, "C");
  const isDoubled = /[XR]+$/.test(normalized);
  const stripped = normalized.replace(/[XR]+$/g, "");
  const m = stripped.match(/^(\d)(NT|S|H|D|C)$/i);
  if (!m) return 0;
  const lvl = parseInt(m[1], 10);
  const strain = m[2].toUpperCase();
  const isNT = strain === "NT";
  const isMaj = strain === "S" || strain === "H";
  // Soglie generose: ammettiamo manciate didattiche FIGB con fit eccezionali,
  // doppi fit o sacrifici. Il filtro deve scartare solo dati chiaramente corrotti
  // (es. 3NT con 14 HCP in linea), NON le mani marginali volute dal corso.
  let base: number;
  if (lvl <= 2) base = 12;
  else if (lvl === 3 && !isNT) base = 16;
  else if (lvl === 3 && isNT) base = 19;
  else if (lvl === 4 && isMaj) base = 18;
  else if (lvl === 4 && !isMaj && !isNT) base = 17;
  else if (lvl === 5) base = 21;
  else if (lvl === 6) base = 25;
  else if (lvl === 7) base = 27;
  else return 0;
  // Contratti contrati (X) sono spesso sacrifici/save: la linea dichiarante
  // ha tipicamente pochi HCP ma molte atout; abbassiamo la soglia.
  return isDoubled ? Math.max(0, base - 5) : base;
}

export function isPlausibleSmazzata(s: Smazzata): boolean {
  const isNS = s.declarer === "north" || s.declarer === "south";
  const declarerHcp = isNS
    ? handHcp(s.hands.north) + handHcp(s.hands.south)
    : handHcp(s.hands.east) + handHcp(s.hands.west);
  const oppHcp = 40 - declarerHcp;
  // Non deve essere chiaramente in minoranza vs avversari (soglia ampia per
  // ammettere casi a doppio fit / sacrifici didattici).
  if (declarerHcp + 10 < oppHcp) return false;
  // Deve avere almeno il minimo plausibile per il contratto
  if (declarerHcp < minHcpForContract(s.contract)) return false;
  return true;
}

/**
 * Pool da usare per le challenge "a sorte" (sfida del giorno/settimana,
 * mano del giorno, torneo, smazzata casuale): esclude smazzate con
 * incoerenze HCP/contratto.
 */
export const playableSmazzate: Smazzata[] = allSmazzate.filter(isPlausibleSmazzata);

/** Get smazzate for a specific lesson (optionally filtered by course) */
export function getSmazzateByLesson(lesson: number, course?: string): Smazzata[] {
  const pool = course ? getSmazzateByCourse(course) : allSmazzate;
  return pool.filter((s) => s.lesson === lesson);
}

/** Get all smazzate for a specific course */
export function getSmazzateByCourse(courseId: string): Smazzata[] {
  switch (courseId) {
    case "fiori": return validateSmazzate(fioriSmazzate);
    case "quadri": return validateSmazzate([...quadriSmazzate]);
    case "cuori-gioco": return validateSmazzate([...cuoriGiocoSmazzate]);
    case "cuori-licita": return validateSmazzate([...cuoriLicitaSmazzate]);
    default: return allSmazzate;
  }
}

/** Get a single smazzata by id */
export function getSmazzataById(id: string): Smazzata | undefined {
  return allSmazzate.find((s) => s.id === id);
}

/** Lesson titles for reference */
export const lessonTitles: Record<number, string> = {
  1: "Vincenti e affrancabili",
  2: "Il punto di vista dei difensori",
  3: "Affrancamenti di lunga e di posizione",
  4: "Il piano di gioco a senz'atout",
  5: "Il gioco con l'atout",
  6: "Il piano di gioco con l'atout",
  7: "La valutazione della mano",
  8: "L'apertura e la risposta",
  9: "La ridichiara dell'apertore",
  10: "Le risposte a 1SA",
  11: "L'intervento",
  12: "Sviluppi dopo l'intervento",
};

export function getLessonTitle(lessonId: number): string {
  return (
    getLessonById(lessonId)?.title ??
    lessonTitles[lessonId] ??
    `Lezione ${getLessonDisplayNumber(lessonId)}`
  );
}
