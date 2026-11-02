/**
 * L'ordine dei semi in una mano: nero e rosso alternati.
 *
 * PERCHÉ. Con l'ordine fisso ♠ ♥ ♦ ♣ cuori e quadri stanno attaccate. Il mazzo
 * del sito è a quattro colori, ma il rosso delle cuori e l'arancio delle quadri
 * su un telefono piccolo si somigliano: chi comincia tocca un quadri credendo di
 * toccare un cuori. I giocatori veri sistemano la mano alternando i colori, e
 * qui si fa lo stesso: «nero» e «rosso» sono le due famiglie, ♠♣ e ♥♦.
 *
 * COME. I semi presenti sono al più quattro, quindi le disposizioni possibili
 * sono al più ventiquattro: si provano tutte e si tiene quella con meno coppie
 * dello stesso colore accanto. A parità vince la più vicina a ♠ ♥ ♣ ♦, così la
 * mano completa esce sempre uguale. L'atout, se c'è, va per primo.
 */
import type { Card, Suit } from "./bridge-engine";

const BASE: Suit[] = ["spade", "heart", "club", "diamond"];
const ROSSO: Record<Suit, boolean> = { spade: false, heart: true, club: false, diamond: true };
const RANGHI = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

function permutazioni<T>(v: T[]): T[][] {
  if (v.length <= 1) return [v];
  return v.flatMap((x, i) => permutazioni([...v.slice(0, i), ...v.slice(i + 1)]).map((p) => [x, ...p]));
}

/** `a` viene prima di `b` in ordine lessicografico. */
function prima(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

/** I semi presenti, nell'ordine in cui si mettono in mano. */
export function ordineSemiAlternato(presenti: readonly Suit[], atout?: Suit | null): Suit[] {
  const semi = BASE.filter((s) => presenti.includes(s));
  let migliore: Suit[] = semi;
  let chiaveMigliore: number[] | null = null;
  for (const p of permutazioni(semi)) {
    if (atout && semi.includes(atout) && p[0] !== atout) continue;
    let stessoColore = 0;
    for (let i = 1; i < p.length; i++) if (ROSSO[p[i]] === ROSSO[p[i - 1]]) stessoColore++;
    const chiave = [stessoColore, ...p.map((s) => BASE.indexOf(s))];
    if (!chiaveMigliore || prima(chiave, chiaveMigliore)) {
      migliore = p;
      chiaveMigliore = chiave;
    }
  }
  return migliore;
}

/** Le carte di una mano, per seme alternato e dentro il seme dall'asso in giù. */
export function ordinaManoAlternata<C extends Card>(carte: readonly C[], atout?: Suit | null): C[] {
  const ordine = ordineSemiAlternato([...new Set(carte.map((c) => c.suit))], atout);
  return [...carte].sort(
    (a, b) => ordine.indexOf(a.suit) - ordine.indexOf(b.suit) || RANGHI.indexOf(a.rank) - RANGHI.indexOf(b.rank),
  );
}
