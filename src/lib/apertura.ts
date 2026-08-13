/**
 * Qual è l'apertura giusta con questa mano.
 *
 * PERCHÉ SERVE
 * Gli esercizi di licita del catalogo sono scritti a mano, uno per uno: coprono
 * quello che qualcuno ha avuto tempo di preparare. Il generatore sa già
 * produrre mani con vincoli precisi («bilanciata 15-17», «quinta maggiore
 * 12-19»), ma per farne un esercizio serve la risposta — e la risposta va
 * DEDOTTA dalla mano, non attaccata al modello: dentro «quinta maggiore
 * 12-19» ci finiscono mani che si aprono 1♥ e mani che si aprono 1♠.
 *
 * SISTEMA: Naturale (quinta maggiore), il sistema insegnato nei corsi FIGB.
 *
 * QUANDO NON RISPONDE
 * `null` non è un errore: è la risposta onesta quando due aperture sono
 * entrambe difendibili, o quando la mano cade fuori dai casi che un allievo
 * ha già studiato. Un esercizio con due risposte giuste insegna che una delle
 * due è sbagliata, che è peggio di non fare l'esercizio.
 */

import type { Card, Suit } from "./bridge-engine";
import { handHcp } from "./deal-generator";

const SIMBOLO: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const NOME: Record<Suit, string> = {
  spade: "picche",
  heart: "cuori",
  diamond: "quadri",
  club: "fiori",
};

export interface Apertura {
  /** La dichiarazione, es. `1♠` o `1SA`. */
  bid: string;
  /** Perché, in una frase, nel linguaggio del corso. */
  perche: string;
}

function lunghezze(hand: readonly Card[]): Record<Suit, number> {
  const l: Record<Suit, number> = { spade: 0, heart: 0, diamond: 0, club: 0 };
  for (const c of hand) l[c.suit]++;
  return l;
}

/** Bilanciata: nessun singolo o vuoto e al massimo una doppia. */
function bilanciata(l: Record<Suit, number>): boolean {
  const v = Object.values(l);
  if (v.some((n) => n < 2)) return false;
  return v.filter((n) => n === 2).length <= 1;
}

/**
 * L'apertura consigliata, o `null` se il caso è ambiguo o fuori programma.
 *
 * L'ordine dei controlli è quello che si insegna: prima si guarda se la mano è
 * bilanciata e nella fascia del senza atout, poi le lunghe.
 */
export function aperturaConsigliata(hand: readonly Card[]): Apertura | null {
  if (hand.length !== 13) return null;
  const po = handHcp(hand);
  const l = lunghezze(hand);
  const bil = bilanciata(l);

  // Sotto gli 11 punti non si apre al livello di uno: restano le preventive,
  // trattate più sotto. Fra 11 e 12 la scelta dipende dalla qualità dei
  // punti, che un esercizio automatico non sa valutare: si tace.
  if (po >= 15 && po <= 17 && bil) {
    return { bid: "1SA", perche: `Mano bilanciata con ${po} punti onori: è la fascia esatta dell'apertura di 1SA.` };
  }

  // Preventiva: mano debole con una lunga di sette carte.
  if (po >= 5 && po <= 10) {
    const lunga = (["spade", "heart", "diamond", "club"] as Suit[]).find((s) => l[s] === 7);
    if (lunga && !bil) {
      return {
        bid: `3${SIMBOLO[lunga]}`,
        perche:
          `Solo ${po} punti onori ma sette ${NOME[lunga]}: si apre di barrage al livello di tre, ` +
          `per togliere spazio agli avversari prima che si trovino.`,
      };
    }
    return null;
  }

  if (po < 12 || po > 21) return null;

  // Quinta maggiore. Con due maggiori di pari lunghezza si apre la più alta.
  const maggiori: Suit[] = ["spade", "heart"];
  const lunghe = maggiori.filter((s) => l[s] >= 5);
  if (lunghe.length > 0 && po <= 19) {
    const scelta =
      lunghe.length === 2
        ? l.spade === l.heart
          ? "spade"
          : l.spade > l.heart
            ? "spade"
            : "heart"
        : lunghe[0];
    const s = scelta as Suit;
    const pari = lunghe.length === 2 && l.spade === l.heart;
    return {
      bid: `1${SIMBOLO[s]}`,
      perche: pari
        ? `Cinque picche e cinque cuori: con due maggiori di pari lunghezza si apre la più alta, 1♠.`
        : `${l[s]} carte di ${NOME[s]} e ${po} punti onori: si apre il maggiore lungo.`,
    };
  }

  // Nessuna maggiore quinta: si apre il minore più lungo. Con quadri e fiori
  // di pari lunghezza la convenzione varia da corso a corso, quindi si tace
  // invece di dare per giusta una delle due scuole.
  if (!bil || po < 15 || po > 17) {
    if (l.diamond >= 4 && l.diamond > l.club) {
      return { bid: "1♦", perche: `Nessun maggiore di cinque carte: si apre il minore più lungo, ${l.diamond} quadri.` };
    }
    if (l.club >= 4 && l.club > l.diamond) {
      return { bid: "1♣", perche: `Nessun maggiore di cinque carte: si apre il minore più lungo, ${l.club} fiori.` };
    }
  }

  return null;
}
