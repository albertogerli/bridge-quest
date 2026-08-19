/**
 * Come finisce un'asta: chi dichiara, quante prese, quanto vale.
 *
 * PERCHÉ STA QUI E NON NELLA PAGINA
 * Perché lo usano due esercizi — l'allenamento e i tornei — e perché è la
 * parte che si sbaglia. Il dichiarante NON è chi ha detto l'ultima parola ma
 * il primo della sua linea ad aver nominato quella denominazione; le prese
 * sono quelle DEL dichiarante, non del migliore dei due compagni; e la zona
 * cambia il punteggio. Sbagliarne una vuol dire dare un voto sbagliato senza
 * che niente lo segnali, e scriverlo due volte vuol dire sbagliarlo due volte.
 */

import type { Position } from "./bridge-engine";
import type { DdsTable } from "./dds-table";
import { strainOf } from "./dds-table";
import type { Strain } from "./minibridge";
import type { Vulnerability } from "./catalog";
import { scoreContract, type Doppio } from "./scoring";

const GIRO: Position[] = ["north", "east", "south", "west"];

export const DENOMINAZIONI: { label: string; strain: Strain }[] = [
  { label: "♣", strain: "club" },
  { label: "♦", strain: "diamond" },
  { label: "♥", strain: "heart" },
  { label: "♠", strain: "spade" },
  { label: "SA", strain: "nt" },
];

/** L'ordine dei posti a partire dal mazziere. */
export function ordineDa(dealer: Position): Position[] {
  const i = GIRO.indexOf(dealer);
  return [0, 1, 2, 3].map((k) => GIRO[(i + k) % 4]);
}

/** Di chi è il turno, dato il mazziere e le dichiarazioni fatte. */
export function turnoDi(dealer: Position, bids: readonly string[]): Position {
  return ordineDa(dealer)[bids.length % 4];
}

/** Vero se l'asta è chiusa: tre passi dopo una dichiarazione, o quattro in tutto. */
export function astaChiusa(bids: readonly string[]): boolean {
  const ultimo = bids.map((b) => b !== "P").lastIndexOf(true);
  return ultimo < 0 ? bids.length >= 4 : bids.length - ultimo - 1 >= 3;
}

export function inZona(v: Vulnerability, lato: "ns" | "ew"): boolean {
  return v === "both" || v === lato;
}

export interface EsitoAsta {
  /** Come si scrive il contratto, contro compreso: "4♠", "3SAX". */
  contratto: string;
  level: number;
  strain: Strain;
  declarer: Position;
  lato: "ns" | "ew";
  prese: number;
  /** Dal punto di vista di Nord-Sud, come il par. */
  punteggio: number;
  doppio: Doppio;
}

/**
 * L'esito di un'asta chiusa. `null` se è passata generale — che non è un
 * errore, è un risultato: zero.
 */
export function esitoAsta(
  bids: readonly string[],
  dealer: Position,
  table: DdsTable,
  vulnerability: Vulnerability
): EsitoAsta | null {
  const ordine = ordineDa(dealer);
  // L'ultima DICHIARAZIONE, non l'ultima parola: dopo il contratto possono
  // esserci contro e surcontro, che non sono contratti.
  const iUltimo = bids.map((b) => /^[1-7]/.test(b)).lastIndexOf(true);
  if (iUltimo < 0) return null;

  const ultimo = bids[iUltimo];
  const den = DENOMINAZIONI.find((d) => ultimo.slice(1) === d.label);
  if (!den) return null;
  const level = Number(ultimo[0]);

  const linea = (p: Position): "ns" | "ew" => (p === "north" || p === "south" ? "ns" : "ew");
  const lato = linea(ordine[iUltimo % 4]);

  // Il dichiarante è il primo della linea vincente ad aver nominato quella
  // denominazione, non chi ha detto l'ultima parola.
  let declarer = ordine[iUltimo % 4];
  for (let i = 0; i <= iUltimo; i++) {
    const chi = ordine[i % 4];
    if (linea(chi) === lato && bids[i].slice(1) === den.label) {
      declarer = chi;
      break;
    }
  }

  const doppio: Doppio = bids.slice(iUltimo).includes("XX")
    ? 4
    : bids.slice(iUltimo).includes("X")
      ? 2
      : 1;

  const prese = table.tricks[strainOf(den.strain === "nt" ? null : den.strain)][declarer];
  const punti = scoreContract({
    level,
    strain: den.strain,
    tricksMade: prese,
    vulnerable: inZona(vulnerability, lato),
    doppio,
  }).score;

  return {
    contratto: ultimo + (doppio === 4 ? "XX" : doppio === 2 ? "X" : ""),
    level,
    strain: den.strain,
    declarer,
    lato,
    prese,
    // Se dichiarano loro, quel punteggio è contro di noi.
    punteggio: lato === "ns" ? punti : -punti,
    doppio,
  };
}

/**
 * La rotazione delle zone del bridge duplicato, board 1..16.
 *
 * NON È UN ELENCO ARBITRARIO: è la sequenza regolamentare, quella stampata su
 * ogni astuccio. Il ciclo è di sedici e poi si ripete. Metterla qui, invece di
 * scegliere una zona a caso, serve perché chi si allena ritrovi al torneo le
 * stesse situazioni nello stesso ordine — la zona è metà della decisione, e
 * impararla su una rotazione finta non insegna niente.
 */
export const ZONE_PER_BOARD: readonly Vulnerability[] = [
  "none", "ns", "ew", "both",
  "ns", "ew", "both", "none",
  "ew", "both", "none", "ns",
  "both", "none", "ns", "ew",
];
