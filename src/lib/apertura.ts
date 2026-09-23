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
 * Sono comprese anche le aperture forti del corso: 2 a colore con mano
 * sbilanciata da 21+ punti, 2SA con la bilanciata 21-23 e 2♣ con la bilanciata
 * da 24 punti (manuale Fiori 2022). Dove la sola forza onori e la distribuzione non bastano — per
 * esempio una forte basata sulle vincenti probabili — la funzione tace.
 *
 * QUANDO NON RISPONDE
 * `null` non è un errore: è la risposta onesta quando due aperture sono
 * entrambe difendibili, o quando la mano cade fuori dai casi che un allievo
 * ha già studiato. Un esercizio con due risposte giuste insegna che una delle
 * due è sbagliata, che è peggio di non fare l'esercizio.
 */

import type { Card, Suit } from "./bridge-engine";
import { handHcp } from "./deal-generator";
import { FIORI_2022 } from "./didactic-system";

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
  if (hand.length !== 13 || new Set(hand.map((c) => `${c.suit}:${c.rank}`)).size !== 13) return null;
  const po = handHcp(hand);
  const l = lunghezze(hand);
  const bil = bilanciata(l);

  // Sotto gli 11 punti non si apre al livello di uno: restano le preventive,
  // trattate più sotto. Fra 11 e 12 la scelta dipende dalla qualità dei
  // punti, che un esercizio automatico non sa valutare: si tace.
  if (po >= 15 && po <= 17 && bil) {
    return { bid: "1SA", perche: `Mano bilanciata con ${po} punti onori: è la fascia esatta dell'apertura di 1SA.` };
  }

  // Aperture forti a Senza. Fiori 2022: bilanciata 21-23 apre 2SA; da 24
  // punti passa dal contenitore 2♣ e descriverà i Senza al giro successivo.
  if (bil && po >= FIORI_2022.balancedTwoClubsMin) {
    return {
      bid: "2♣",
      perche: `Mano bilanciata fortissima con ${po} punti onori: si apre 2♣ e si mostreranno i Senza al giro successivo.`,
    };
  }
  if (bil && po >= FIORI_2022.twoNT.min) {
    return {
      bid: "2SA",
      perche: `Mano bilanciata con ${po} punti onori: è la fascia dell'apertura forte di 2SA.`,
    };
  }

  // Apertura forte naturale a colore: con 21+ punti e mano sbilanciata si
  // apre al livello di due nel colore lungo. Si risponde solo quando il colore
  // è almeno quinto ed è univocamente il più lungo; sulle parità la scelta
  // dipende dalla struttura della mano e l'esercizio automatico deve tacere.
  if (!bil && po >= FIORI_2022.strongSuitHcpMin) {
    const semi: Suit[] = ["spade", "heart", "diamond", "club"];
    const massimo = Math.max(...semi.map((s) => l[s]));
    const piuLunghi = semi.filter((s) => l[s] === massimo);
    // Strong two-suiters need a reviewed rebid plan; the longest-suit shortcut is unsafe.
    if (semi.filter((s) => l[s] >= 5).length > 1) return null;
    if (massimo >= 5 && piuLunghi.length === 1) {
      const s = piuLunghi[0];
      return {
        bid: `2${SIMBOLO[s]}`,
        perche: `${po} punti onori, mano sbilanciata e ${l[s]} carte di ${NOME[s]}: è un'apertura forte di 2${SIMBOLO[s]}.`,
      };
    }
    return null;
  }

  // Preventiva: mano debole con una lunga di sette carte.
  if (po >= 5 && po <= 10) {
    const lunga = (["spade", "heart", "diamond", "club"] as Suit[]).find((s) => l[s] === 7);
    if (lunga && !bil) {
      const ranks = new Set(hand.filter((c) => c.suit === lunga).map((c) => c.rank));
      const top = ["A", "K", "Q"].filter((r) => ranks.has(r as Card["rank"])).length;
      const outsidePoints = handHcp(hand.filter((c) => c.suit !== lunga));
      // Fiori 2022: suit quality and no side values, not length alone.
      // Seven cashing tricks headed by AKQ can justify level four: outside this quiz.
      if (outsidePoints > 0 || top === 3 || !(top >= 2 || (top >= 1 && ranks.has("J") && ranks.has("10")))) return null;
      return {
        bid: `3${SIMBOLO[lunga]}`,
        perche:
          `Solo ${po} punti onori ma sette ${NOME[lunga]}: si apre di barrage al livello di tre, ` +
          `per togliere spazio agli avversari prima che si trovino.`,
      };
    }
    return null;
  }

  if (po < 12 || po > 20) return null;

  // Fiori 2022: due colori entrambi quinti o più → il più alto di rango;
  // una sola quinta → quella; nessuna quinta → quadri quarto, altrimenti fiori.
  const semi: Suit[] = ["spade", "heart", "diamond", "club"];
  const lunghe = semi.filter((s) => l[s] >= 5);
  if (lunghe.length > 0) {
    const s = lunghe[0];
    return {
      bid: `1${SIMBOLO[s]}`,
      perche: lunghe.length > 1
        ? `Due colori di almeno cinque carte: nel sistema Fiori 2022 si apre il più alto di rango, 1${SIMBOLO[s]}.`
        : `${l[s]} carte di ${NOME[s]} e ${po} punti onori: si apre il colore lungo.`,
    };
  }

  if (l.diamond >= FIORI_2022.diamondMinLength) {
    return { bid: "1♦", perche: `Nessun maggiore quinto: con almeno quattro quadri si apre 1♦ (Fiori 2022).` };
  }
  return { bid: "1♣", perche: `Nessun maggiore quinto e meno di quattro quadri: si apre 1♣, anche con sole due carte (Fiori 2022).` };
}
