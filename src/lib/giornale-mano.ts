import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { partnershipOf } from "@/lib/bridge-engine";
import type { OpzioneCarta } from "@/lib/dds-table";

/**
 * Il giornale della mano: presa per presa, carta per carta, e quanto è
 * costata ciascuna a carte viste.
 *
 * È la griglia della revisione di BridgeChamp («Journal del Board»), che il
 * 28/09/2026 è stata indicata come la cosa da copiare: in una schermata si
 * vede tutta la mano, si clicca una carta e ci si porta in quel momento, e la
 * carta che ha regalato una presa è segnata. Qui stanno i calcoli, senza
 * interfaccia, perché sono la parte che si sbaglia e che va provata.
 */

export interface Giocata {
  seat: Position;
  card: Card;
}

export interface PresaGiocata {
  giocate: Giocata[];
  vincitore: Position | null;
}

const POSTI: Position[] = ["north", "east", "south", "west"];
const chiave = (c: Card) => `${c.suit}-${c.rank}`;

/** Dal formato salvato dai giochi (`player`, `winner` come stringhe). */
export function normalizzaPrese(
  prese: { cards: { player: string; card: Card }[]; winner?: string }[],
): PresaGiocata[] {
  return prese
    .filter((p) => p.cards.length > 0)
    .map((p) => ({
      giocate: p.cards.map((c) => ({ seat: c.player as Position, card: c.card })),
      vincitore: (POSTI as string[]).includes(p.winner ?? "") ? (p.winner as Position) : null,
    }));
}

/**
 * Le quattro mani di partenza.
 *
 * I giochi salvano le mani a volte all'inizio e a volte alla fine, quando
 * sono già vuote: qui si rimettono insieme le carte in mano e quelle giocate,
 * senza doppioni, e il risultato è la smazzata intera in entrambi i casi.
 */
export function maniIniziali(
  mani: Record<Position, Card[]>,
  prese: PresaGiocata[],
): Record<Position, Card[]> {
  const esito = {} as Record<Position, Card[]>;
  for (const p of POSTI) {
    const viste = new Set<string>();
    esito[p] = [];
    const aggiungi = (c: Card) => {
      if (viste.has(chiave(c))) return;
      viste.add(chiave(c));
      esito[p].push(c);
    };
    (mani[p] ?? []).forEach(aggiungi);
    for (const presa of prese) for (const g of presa.giocate) if (g.seat === p) aggiungi(g.card);
  }
  return esito;
}

export function puntiOnori(mano: Card[]): number {
  const valore: Partial<Record<Card["rank"], number>> = { A: 4, K: 3, Q: 2, J: 1 };
  return mano.reduce((s, c) => s + (valore[c.rank] ?? 0), 0);
}

export function sequenza(prese: PresaGiocata[]): Giocata[] {
  return prese.flatMap((p) => p.giocate);
}

export interface Posizione {
  mani: Record<Position, Card[]>;
  /** Le carte già uscite nella presa in corso. */
  presaCorrente: Giocata[];
  /** Chi ha aperto la presa in corso (o chi apre la prossima). */
  leader: Position;
  completate: number;
  preseNS: number;
  preseEO: number;
}

/**
 * La posizione dopo `passo` carte giocate (0 = prima dell'attacco).
 * `primoDiMano` serve solo per `passo` 0: chi attacca.
 */
export function posizioneAl(
  iniziali: Record<Position, Card[]>,
  prese: PresaGiocata[],
  passo: number,
  primoDiMano: Position,
): Posizione {
  const giocate = new Set<string>();
  let restanti = passo;
  let completate = 0;
  let preseNS = 0;
  let preseEO = 0;
  let presaCorrente: Giocata[] = [];
  let leader = primoDiMano;
  for (const presa of prese) {
    if (restanti <= 0) {
      // Solo se la presa di prima si è chiusa: a presa a metà il primo di mano
      // resta chi l'ha aperta. Sbagliarlo dà al solver una posizione
      // impossibile, e lui risponde «null function» (visto il 28/09/2026).
      if (presaCorrente.length === 0) leader = presa.giocate[0]?.seat ?? leader;
      break;
    }
    const prese_qui = presa.giocate.slice(0, restanti);
    prese_qui.forEach((g) => giocate.add(chiave(g.card)));
    restanti -= prese_qui.length;
    leader = presa.giocate[0]?.seat ?? leader;
    if (prese_qui.length === presa.giocate.length && presa.giocate.length === 4) {
      completate += 1;
      if (presa.vincitore) {
        if (partnershipOf(presa.vincitore) === "ns") preseNS += 1;
        else preseEO += 1;
        leader = presa.vincitore;
      }
      presaCorrente = [];
    } else {
      presaCorrente = prese_qui;
    }
  }
  const mani = {} as Record<Position, Card[]>;
  for (const p of POSTI) mani[p] = iniziali[p].filter((c) => !giocate.has(chiave(c)));
  return { mani, presaCorrente, leader, completate, preseNS, preseEO };
}

export interface ValutazioneGiocata {
  /** Prese totali della linea del dichiarante, a carte viste, dopo questa carta. */
  preseDichiarante: number;
  /** Prese regalate da chi l'ha giocata rispetto alla carta migliore (0 = giusta). */
  costo: number;
}

type Valutatore = (
  mani: Record<Position, Card[]>,
  trump: Suit | null,
  leader: Position,
  presa: readonly Card[],
) => Promise<OpzioneCarta[]>;

/**
 * Ogni carta giocata, valutata a carte viste nel momento in cui è uscita.
 *
 * Una risoluzione per carta: la prima presa è la più lenta, poi il solver
 * corre. `aggiorna` riceve i risultati man mano, così la griglia si riempie
 * sotto gli occhi invece di restare vuota per dieci secondi.
 */
export async function valutaGiocate(
  iniziali: Record<Position, Card[]>,
  prese: PresaGiocata[],
  trump: Suit | null,
  dichiarante: Position,
  valuta: Valutatore,
  aggiorna?: (parziale: (ValutazioneGiocata | null)[]) => void,
  annullato: () => boolean = () => false,
): Promise<(ValutazioneGiocata | null)[]> {
  const tutte = sequenza(prese);
  const esito: (ValutazioneGiocata | null)[] = tutte.map(() => null);
  const lineaDich = partnershipOf(dichiarante);
  for (let i = 0; i < tutte.length; i++) {
    if (annullato()) break;
    const pos = posizioneAl(iniziali, prese, i, tutte[0].seat);
    const opzioni = await valuta(pos.mani, trump, pos.leader, pos.presaCorrente.map((g) => g.card));
    const giocata = tutte[i];
    const sua = opzioni.find((o) => chiave(o.card) === chiave(giocata.card));
    if (!sua) continue;
    const migliore = Math.max(...opzioni.map((o) => o.tricks));
    const vintePrima = lineaDich === "ns" ? pos.preseNS : pos.preseEO;
    const rimaste = 13 - pos.completate;
    const stessaLinea = partnershipOf(giocata.seat) === lineaDich;
    esito[i] = {
      preseDichiarante: vintePrima + (stessaLinea ? sua.tricks : rimaste - sua.tricks),
      costo: migliore - sua.tricks,
    };
    aggiorna?.([...esito]);
  }
  return esito;
}
