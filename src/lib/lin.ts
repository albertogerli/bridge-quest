import type { Card, Position, Rank, Suit } from "@/lib/bridge-engine";

/**
 * Il formato LIN, quello di Bridge Base Online.
 *
 * PERCHÉ NON C'ERA E PERCHÉ SERVE. Il PBN è lo standard per scambiare mani fra
 * programmi; il LIN è quello che capisce BBO, dove gioca la maggior parte dei
 * nostri allievi quando esce da qui. Una mano preparata a lezione che si può
 * aprire su BBO è una mano che l'allievo rigioca la sera con il suo compagno,
 * ed è il ponte che manca fra il corso e il gioco vero.
 *
 * ----------------------------------------------------------------------------
 * COM'È FATTO
 * ----------------------------------------------------------------------------
 *
 * Una riga di comandi `xx|contenuto|` in fila, senza a capo obbligatori:
 *
 *   qx|o1|    numero della smazzata («o» per open room, «c» per closed)
 *   md|3S...| le mani: la prima cifra è il MAZZIERE (1=Sud, 2=Ovest, 3=Nord,
 *             4=Est), poi Sud, Ovest, Nord separati da virgola. La mano di EST
 *             NON SI SCRIVE: si ricava per differenza, ed è la trappola
 *             principale di questo formato — scriverla la fa rifiutare.
 *   sv|o|     la zona: o=nessuno, n=NS, e=EO, b=tutti
 *   pg||      fine della sezione
 *
 * I semi si scrivono maiuscoli davanti ai loro ranghi: `SAKQJHT98...`, e il
 * dieci è `T`, non `10`.
 *
 * Il mazziere numerato da SUD e non da Nord è l'altra stranezza: viene da come
 * BBO ordina i posti, non da una convenzione di bridge, e sbagliarla sposta la
 * dichiarazione di un posto senza che nessun controllo se ne accorga.
 */

const ORDINE_SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const LETTERA_SEME: Record<Suit, string> = {
  spade: "S",
  heart: "H",
  diamond: "D",
  club: "C",
};
const ORDINE_RANGHI: Rank[] = [
  "A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2",
] as Rank[];

/** Il dieci in LIN è `T`. */
function rangoLin(r: Rank): string {
  return r === ("10" as Rank) ? "T" : r;
}

/** `SAKQJHT98D...`: i quattro semi in ordine, ognuno con i suoi ranghi. */
export function manoLin(carte: readonly Card[]): string {
  return ORDINE_SEMI.map((s) => {
    const ranghi = carte
      .filter((c) => c.suit === s)
      .map((c) => c.rank)
      .sort((a, b) => ORDINE_RANGHI.indexOf(a) - ORDINE_RANGHI.indexOf(b))
      .map(rangoLin)
      .join("");
    return LETTERA_SEME[s] + ranghi;
  }).join("");
}

/** Il mazziere come lo numera BBO: 1=Sud, 2=Ovest, 3=Nord, 4=Est. */
export function cifraMazziere(dealer: Position): number {
  return { south: 1, west: 2, north: 3, east: 4 }[dealer];
}

export type Zona = "none" | "ns" | "ew" | "both";

const LETTERA_ZONA: Record<Zona, string> = { none: "o", ns: "n", ew: "e", both: "b" };

export interface SmazzataLin {
  hands: Record<Position, Card[]>;
  dealer: Position;
  vulnerability: Zona;
  numero?: number;
}

/**
 * Una smazzata in LIN.
 *
 * La mano di Est non si scrive: BBO la ricava per differenza dalle altre tre.
 * Scriverla è l'errore che fa rifiutare il file, e non dà un messaggio utile —
 * si vede solo che la mano non si apre.
 */
export function smazzataLin(s: SmazzataLin): string {
  const md = [
    cifraMazziere(s.dealer),
    manoLin(s.hands.south),
    ",",
    manoLin(s.hands.west),
    ",",
    manoLin(s.hands.north),
  ].join("");

  return [
    `qx|o${s.numero ?? 1}|`,
    `md|${md}|`,
    `sv|${LETTERA_ZONA[s.vulnerability]}|`,
    `pg||`,
  ].join("");
}

/** Un file LIN con più smazzate, una per riga. */
export function fileLin(smazzate: readonly SmazzataLin[]): string {
  return smazzate.map((s, i) => smazzataLin({ ...s, numero: s.numero ?? i + 1 })).join("\n");
}
