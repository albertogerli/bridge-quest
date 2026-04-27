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
import type { Position, Card } from "../lib/bridge-engine";

export type { Smazzata } from "./smazzate";

type Vulnerability = "none" | "ns" | "ew" | "both";

const POSITIONS: Position[] = ["north", "south", "east", "west"];

function nextPos(p: Position): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  return order[(order.indexOf(p) + 1) % 4];
}

/** Filter out smazzate with data issues (wrong hand sizes, duplicates, bad opening leads) */
function validateSmazzate(hands: Smazzata[]): Smazzata[] {
  return hands.filter((s) => {
    // Check each hand has exactly 13 cards
    for (const pos of POSITIONS) {
      if (s.hands[pos].length !== 13) return false;
    }
    // Check no duplicate cards
    const seen = new Set<string>();
    for (const pos of POSITIONS) {
      for (const c of s.hands[pos]) {
        const key = `${c.suit}-${c.rank}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
    }
    // Check opening lead is in the leader's hand
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
  const m = contract.replace(/[XR]+$/g, "").match(/^(\d)(NT|S|H|D|C)$/i);
  if (!m) return 0;
  const lvl = parseInt(m[1], 10);
  const strain = m[2].toUpperCase();
  const isNT = strain === "NT";
  const isMaj = strain === "S" || strain === "H";
  // Soglie con tolleranza 2-3 HCP rispetto al minimo "da manuale" per ammettere
  // contratti marginali con buon fit/distribuzione.
  if (lvl <= 2) return 14;
  if (lvl === 3 && !isNT) return 18;
  if (lvl === 3 && isNT) return 22;
  if (lvl === 4 && isMaj) return 22;
  if (lvl === 4 && !isMaj && !isNT) return 20;
  if (lvl === 5) return 25;
  if (lvl === 6) return 28;
  if (lvl === 7) return 32;
  return 0;
}

export function isPlausibleSmazzata(s: Smazzata): boolean {
  const isNS = s.declarer === "north" || s.declarer === "south";
  const declarerHcp = isNS
    ? handHcp(s.hands.north) + handHcp(s.hands.south)
    : handHcp(s.hands.east) + handHcp(s.hands.west);
  const oppHcp = 40 - declarerHcp;
  // Non deve essere chiaramente in minoranza vs avversari
  if (declarerHcp + 4 < oppHcp) return false;
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
