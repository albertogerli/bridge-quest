/**
 * Double dummy solver esatto per smazzate intere.
 *
 * PERCHÉ NON BASTA `dds-solver.ts`
 * Quello fa ricerca esatta solo fino a 6 carte per mano
 * (`FULL_SEARCH_THRESHOLD = 6`); oltre restituisce una stima euristica con
 * `available: false`. Misurato il 12/08/2026 su smazzate intere: esaurisce i
 * 4 secondi di timeout e ritorna una stima. Va bene per suggerire una carta
 * durante il gioco, non per dire quale sia il contratto par — un numero
 * sbagliato mostrato a un insegnante è peggio di nessun numero.
 *
 * COME FUNZIONA, E PERCHÉ COSÌ
 * Non si cerca «quante prese fa N-S» ma si risponde a «N-S ne fa almeno k?».
 * Sembra un dettaglio ed è la differenza fra minuti e millisecondi: con una
 * domanda booleana la finestra alfa-beta è larga uno, quindi appena una linea
 * trova una risposta sufficiente l'intero ramo si chiude. Il numero esatto si
 * ottiene poi per ricerca binaria su k, cioè in quattro chiamate.
 *
 * La prima stesura calcolava il valore esatto con finestra piena: corretta ma
 * inutilizzabile, 26 milioni di nodi e ancora incompleta dopo 30 secondi.
 *
 * Tre accorgimenti fanno il resto:
 *  1. Carte equivalenti: se restano ♠K e ♠Q e nessuno ha il ♠J, giocarle è la
 *     stessa cosa. Si prova solo una del gruppo — è la potatura che taglia di
 *     più, perché elimina rami identici.
 *  2. Tabella di trasposizione: lo stesso finale si raggiunge per molti ordini
 *     di gioco. La chiave è un intero, non una stringa: a milioni di nodi
 *     l'allocazione della stringa costava più della ricerca.
 *  3. Limite superiore: se anche vincendo tutte le prese rimaste non si arriva
 *     a k, il ramo è chiuso senza esplorarlo.
 *
 * Le mani sono maschere di bit per seme.
 */

import type { Card, Position, Rank, Suit } from "./bridge-engine";

const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SEATS: Position[] = ["north", "east", "south", "west"];

const SUIT_INDEX: Record<Suit, number> = { spade: 0, heart: 1, diamond: 2, club: 3 };
const SEAT_INDEX: Record<Position, number> = { north: 0, east: 1, south: 2, west: 3 };
const RANK_BIT: Record<Rank, number> = RANKS.reduce(
  (acc, r, i) => ({ ...acc, [r]: 1 << i }),
  {} as Record<Rank, number>
);

/** `null` = senza atout. */
export type Strain = Suit | null;

function toHoldings(hands: Record<Position, Card[]>): Int32Array {
  const h = new Int32Array(16);
  for (const seat of SEATS) {
    for (const card of hands[seat]) {
      h[SEAT_INDEX[seat] * 4 + SUIT_INDEX[card.suit]] |= RANK_BIT[card.rank];
    }
  }
  return h;
}

/**
 * Una mossa per gruppo di carte equivalenti.
 *
 * Due carte dello stesso seme sono equivalenti se fra loro non resta in gioco
 * nessuna carta altrui: portano alla stessa posizione. Si tiene la più bassa.
 */
function distinctMoves(own: number, others: number): number[] {
  const moves: number[] = [];
  let remaining = own;
  while (remaining) {
    const bit = remaining & -remaining;
    moves.push(bit);
    remaining &= ~bit;
    // Assorbe le carte superiori contigue che sono nostre.
    let probe = bit;
    for (;;) {
      const next = probe << 1;
      if (next > 1 << 12 || others & next || !(own & next)) break;
      remaining &= ~next;
      probe = next;
    }
  }
  return moves;
}

interface Ctx {
  h: Int32Array;
  trump: number; // -1 = senza atout
  memo: Map<number, boolean>;
  nodes: number;
  deadline: number;
  timedOut: boolean;
}

/** Chiave intera: configurazione delle carte + chi è di mano + soglia. */
function key(ctx: Ctx, leader: number, need: number): number {
  const h = ctx.h;
  let k = (leader << 5) | need;
  for (let i = 0; i < 16; i++) k = (Math.imul(k, 0x9e3779b1) ^ h[i]) | 0;
  return k;
}

function beats(bitA: number, suitA: number, bitB: number, suitB: number, led: number, trump: number): boolean {
  if (suitA === suitB) return bitA > bitB;
  if (suitA === trump) return true;
  if (suitB === trump) return false;
  return suitA === led;
}

/** Carte rimaste a un giocatore. */
function cardCount(h: Int32Array, seat: number): number {
  let n = 0;
  for (let s = 0; s < 4; s++) {
    let m = h[seat * 4 + s];
    while (m) {
      m &= m - 1;
      n++;
    }
  }
  return n;
}

/**
 * Vero se N-S riesce a fare almeno `need` prese fra quelle rimaste, con
 * `leader` di mano e gioco ottimale di entrambe le linee.
 */
function canReach(ctx: Ctx, leader: number, need: number): boolean {
  if (need <= 0) return true;
  const h = ctx.h;
  const remaining = cardCount(h, leader);
  // Anche vincendole tutte non basterebbe.
  if (need > remaining) return false;

  if ((ctx.nodes++ & 1023) === 0 && Date.now() > ctx.deadline) {
    ctx.timedOut = true;
    return false;
  }

  const k = key(ctx, leader, need);
  const cached = ctx.memo.get(k);
  if (cached !== undefined) return cached;

  const played: number[] = [0, 0, 0, 0];
  const suitOf: number[] = [0, 0, 0, 0];

  function step(depth: number): boolean {
    if (depth === 4) {
      let winner = 0;
      for (let i = 1; i < 4; i++) {
        if (beats(played[i], suitOf[i], played[winner], suitOf[winner], suitOf[0], ctx.trump)) winner = i;
      }
      const winnerSeat = (leader + winner) % 4;
      const nsWon = winnerSeat === 0 || winnerSeat === 2 ? 1 : 0;
      return canReach(ctx, winnerSeat, need - nsWon);
    }

    const seat = (leader + depth) % 4;
    const led = depth === 0 ? -1 : suitOf[0];
    const mustFollow = led >= 0 && h[seat * 4 + led] !== 0;
    const nsToPlay = seat === 0 || seat === 2;

    for (let s = 0; s < 4; s++) {
      const suit = mustFollow ? led : s;
      if (mustFollow && s > 0) break;
      const own = h[seat * 4 + suit];
      if (!own) continue;
      let others = 0;
      for (let o = 0; o < 4; o++) if (o !== seat) others |= h[o * 4 + suit];

      for (const bit of distinctMoves(own, others)) {
        h[seat * 4 + suit] &= ~bit;
        played[depth] = bit;
        suitOf[depth] = suit;

        const ok = step(depth + 1);

        h[seat * 4 + suit] |= bit;

        // Finestra larga uno: a N-S basta UNA mossa che riesca, agli
        // avversari basta UNA che impedisca. In entrambi i casi si chiude
        // subito il ramo — è qui che sta tutto il guadagno.
        if (ok === nsToPlay) return ok;
        if (ctx.timedOut) return false;
      }
    }
    // Nessuna mossa ha cambiato l'esito: vale quello opposto a chi muoveva.
    return !nsToPlay;
  }

  const result = step(0);
  if (!ctx.timedOut) ctx.memo.set(k, result);
  return result;
}

export interface ExactResult {
  /** Prese di N-S con gioco ottimale da entrambe le parti. */
  nsTricks: number;
  /** Falso se è scaduto il tempo: il valore non è attendibile. */
  exact: boolean;
  nodes: number;
  timeMs: number;
}

/**
 * Prese di N-S per un dato atout e giocatore di mano.
 * Ricerca binaria sulla soglia: quattro domande booleane invece di una
 * ricerca a finestra piena.
 */
export function solveExact(
  hands: Record<Position, Card[]>,
  strain: Strain,
  leader: Position,
  timeoutMs = 20_000
): ExactResult {
  const start = Date.now();
  const ctx: Ctx = {
    h: toHoldings(hands),
    trump: strain === null ? -1 : SUIT_INDEX[strain],
    memo: new Map(),
    nodes: 0,
    deadline: start + timeoutMs,
    timedOut: false,
  };

  let lo = 0;
  let hi = 13;
  while (lo < hi) {
    const mid = ((lo + hi + 1) / 2) | 0;
    if (canReach(ctx, SEAT_INDEX[leader], mid)) lo = mid;
    else hi = mid - 1;
    if (ctx.timedOut) break;
  }

  return { nsTricks: lo, exact: !ctx.timedOut, nodes: ctx.nodes, timeMs: Date.now() - start };
}
