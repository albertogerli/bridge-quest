/**
 * BridgeQuest - Combined index of all Smazzate (practice hands)
 * From FIGB Corso Fiori, Quadri, Cuori Gioco, Cuori Licita
 */

import { smazzate as smazzate1to4, type Smazzata } from "./smazzate";
import { smazzate5to8 } from "./smazzate-5-8";
import { smazzate9to12 } from "./smazzate-9-12";
import { quadriSmazzate } from "./quadri-smazzate";
import { cuoriGiocoSmazzate } from "./cuori-gioco-smazzate";
import { cuoriLicitaSmazzate } from "./cuori-licita-smazzate";
import type { Position, Card } from "../lib/bridge-engine";

export type { Smazzata } from "./smazzate";

type Vulnerability = "none" | "ns" | "ew" | "both";

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

/** All practice hands from all courses */
export const allSmazzate: Smazzata[] = [
  ...fioriSmazzate,
  ...quadriSmazzate,
  ...cuoriGiocoSmazzate,
  ...cuoriLicitaSmazzate,
];

/** Get smazzate for a specific lesson */
export function getSmazzateByLesson(lesson: number): Smazzata[] {
  return allSmazzate.filter((s) => s.lesson === lesson);
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
