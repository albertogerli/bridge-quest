/**
 * Il robot che gioca con le carte che vedrebbe un giocatore vero.
 *
 * PERCHÉ ESISTE
 * L'euristica di `aiSelectCard` non guarda mai il morto: il dichiarante
 * robot gioca Nord e Sud come due estranei, e il banco di prova
 * (`robot-quality.test.ts`) gli conta più di tre prese buttate per mano. Il
 * double dummy a carte scoperte, all'opposto, gioca perfetto ma bara: vede le
 * carte coperte dell'allievo.
 *
 * COME FUNZIONA (Monte Carlo a informazione perfetta)
 * 1. Si separa ciò che il robot vede davvero — la propria mano, il morto
 *    dopo l'attacco, le carte già giocate — da ciò che non vede.
 * 2. Si distribuiscono a caso le carte non viste fra i posti coperti,
 *    rispettando quante carte ha ciascuno e i semi in cui ha già mostrato di
 *    non averne (ha scartato o tagliato).
 * 3. Su ogni distribuzione il solver dice quante prese vale ogni carta
 *    giocabile; si gioca la carta con la media più alta.
 *
 * Le carte vere nascoste non entrano mai nel calcolo: servono solo a sapere
 * QUALI carte mancano all'appello, cosa che il giocatore al tavolo sa
 * contando quelle uscite.
 *
 * I LIMITI NOTI
 * Le distribuzioni non tengono conto della licita (chi ha aperto ha più
 * punti) né delle carte segnalate: è la prima versione, e il banco di prova
 * misura quanto vale già così.
 */

import {
  getValidCards,
  rankValue,
  type Card,
  type GameState,
  type Position,
  type Suit,
} from "./bridge-engine";
import { cardOptions } from "./dds-table";

const POSTI: Position[] = ["north", "east", "south", "west"];

/** I posti di cui `chi` conosce le carte in questo momento. */
export function postiVisti(state: GameState, chi: Position): Set<Position> {
  // Il morto lo gioca il dichiarante: chi decide per il morto vede anche la
  // mano del dichiarante.
  const io = chi === state.dummy ? state.declarer : chi;
  const visti = new Set<Position>([io]);
  if (io === state.declarer) visti.add(state.dummy);
  const attaccoFatto = state.tricks.length > 0 || state.currentTrick.length > 0;
  if (attaccoFatto) visti.add(state.dummy);
  return visti;
}

/** I semi in cui ciascun posto ha già mostrato di non avere carte. */
export function semiMancanti(state: GameState): Map<Position, Set<Suit>> {
  const mancano = new Map<Position, Set<Suit>>(POSTI.map((p) => [p, new Set<Suit>()]));
  const prese = [...state.tricks.map((t) => t.plays), state.currentTrick];
  for (const plays of prese) {
    const seme = plays[0]?.card.suit;
    if (!seme) continue;
    for (const p of plays.slice(1)) {
      if (p.card.suit !== seme) mancano.get(p.position)!.add(seme);
    }
  }
  return mancano;
}

/**
 * Una distribuzione possibile delle carte non viste, o null se i vincoli
 * non si lasciano soddisfare in pochi tentativi (capita solo con molti semi
 * mancanti incrociati: chi chiama ripiega sull'ignorarli).
 */
export function campionaMondo(
  state: GameState,
  chi: Position,
  rng: () => number,
  rispettaMancanti = true
): Record<Position, Card[]> | null {
  const visti = postiVisti(state, chi);
  const coperti = POSTI.filter((p) => !visti.has(p));
  const mazzo = coperti.flatMap((p) => state.hands[p]);
  const mancano = semiMancanti(state);

  for (let tentativo = 0; tentativo < 40; tentativo++) {
    const carte = [...mazzo];
    for (let i = carte.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [carte[i], carte[j]] = [carte[j], carte[i]];
    }
    // Prima le carte con meno posti possibili: è ciò che rende rari i vicoli
    // ciechi quando un posto ha già mostrato di non avere due semi.
    const ammessi = (c: Card) =>
      coperti.filter((p) => !rispettaMancanti || !mancano.get(p)!.has(c.suit));
    carte.sort((a, b) => ammessi(a).length - ammessi(b).length);

    const mondo: Record<Position, Card[]> = { north: [], east: [], south: [], west: [] };
    for (const p of visti) mondo[p] = [...state.hands[p]];
    let riuscito = true;
    const spazio = (p: Position) => state.hands[p].length - mondo[p].length;
    for (const c of carte) {
      const liberi = ammessi(c).filter((p) => spazio(p) > 0);
      if (liberi.length === 0) {
        riuscito = false;
        break;
      }
      // PESATO SUI POSTI LIBERI. Anche la moneta dava a ogni carta libera la
      // probabilità giusta — le carte sono già mescolate, e la scelta del
      // posto non guarda quale carta sia — ma riempiva presto il posto con
      // meno spazio, e con tre posti coperti e più semi mancanti questo
      // porta a vicoli ciechi (carte che non hanno più un posto ammesso).
      // Il peso sullo spazio rimasto è la regola naturale e li rende rari.
      // Il test «ogni carta libera finisce in proporzione ai posti» lo fissa.
      let r = rng() * liberi.reduce((somma, p) => somma + spazio(p), 0);
      let dove = liberi[liberi.length - 1];
      for (const p of liberi) {
        r -= spazio(p);
        if (r < 0) {
          dove = p;
          break;
        }
      }
      mondo[dove].push(c);
    }
    if (riuscito) return mondo;
  }
  return null;
}

export interface OpzioniPimc {
  /** Quante distribuzioni provare al massimo. */
  mondi: number;
  /** Tempo massimo in millisecondi: si ferma prima se lo supera. */
  budgetMs?: number;
  rng?: () => number;
}

/**
 * La carta con la media di prese più alta sulle distribuzioni possibili, o
 * null se il solver non risponde (chi chiama ripiega sull'euristica).
 *
 * A parità di media si gioca la carta più bassa: con valori uguali non c'è
 * ragione di sprecare un onore, e una regola fissa rende il robot
 * prevedibile nel modo giusto — quello del manuale.
 */
export async function scegliCartaPimc(
  state: GameState,
  chi: Position,
  opzioni: OpzioniPimc
): Promise<Card | null> {
  const valide = getValidCards(state.hands[chi], state.currentTrick);
  if (valide.length === 0) return null;
  if (valide.length === 1) return valide[0];

  const rng = opzioni.rng ?? Math.random;
  const avvio = Date.now();
  const leader = state.currentTrick[0]?.position ?? state.currentPlayer;
  const giaInPresa = state.currentTrick.map((p) => p.card);
  const somma = new Map<string, number>();
  const chiave = (c: Card) => `${c.rank}-${c.suit}`;
  let provati = 0;

  for (let i = 0; i < opzioni.mondi; i++) {
    if (provati > 0 && opzioni.budgetMs !== undefined && Date.now() - avvio > opzioni.budgetMs) break;
    const mondo = campionaMondo(state, chi, rng) ?? campionaMondo(state, chi, rng, false);
    if (!mondo) continue;
    // Il solver gira sul filo principale: fra un mondo e l'altro si lascia
    // respirare la pagina, altrimenti nelle prime prese (fino a ~200 ms a
    // risoluzione) le animazioni si fermano finché il robot non ha deciso.
    if (provati > 0) await new Promise((ok) => setTimeout(ok, 0));
    const esiti = await cardOptions(mondo, state.trumpSuit, leader, giaInPresa);
    for (const e of esiti) somma.set(chiave(e.card), (somma.get(chiave(e.card)) ?? 0) + e.tricks);
    provati++;
  }
  if (provati === 0) return null;

  let migliore: Card | null = null;
  let valore = -Infinity;
  for (const c of valide) {
    const v = somma.get(chiave(c)) ?? -Infinity;
    if (v > valore || (v === valore && migliore && rankValue(c.rank) < rankValue(migliore.rank))) {
      migliore = c;
      valore = v;
    }
  }
  return migliore;
}
