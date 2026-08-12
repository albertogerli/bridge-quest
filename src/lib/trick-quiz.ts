/**
 * Quiz «quante prese fa N-S?».
 *
 * PERCHÉ È DIVERSO DAGLI ALTRI QUIZ
 * Tutti i quiz della piattaforma sono scritti a mano — per questo ne esistono
 * 230 in tutto, e ogni nuovo argomento costa lavoro d'autore. Questo si
 * genera: le mani vengono dal generatore con vincoli, la risposta dal double
 * dummy. Contenuto illimitato, e la risposta è corretta per costruzione invece
 * che per revisione.
 *
 * SI VEDONO TUTTE E QUATTRO LE MANI
 * È una scelta, non una semplificazione. Mostrando solo Nord-Sud la domanda
 * diventa valutazione della mano: risposta incerta anche per un campione, e
 * l'allievo verrebbe punito per aver ragionato bene. Con tutte le carte in
 * vista è un esercizio di conteggio: difficile ma equo, e la risposta esatta
 * esiste.
 *
 * LA TOLLERANZA È PARTE DELLA DIDATTICA
 * Sbagliare di una presa su tredici significa aver visto quasi tutto. Contarlo
 * come errore secco insegnerebbe solo che è un gioco arbitrario.
 */

import type { Suit } from "./bridge-engine";

/** Seme di gioco della domanda; `null` = senza atout. */
export type QuizStrain = Suit | null;

export interface QuizLevel {
  id: string;
  label: string;
  description: string;
  /** Semi fra cui pescare la domanda. */
  strains: QuizStrain[];
}

/**
 * Progressione: prima il senza atout, dove si contano le vincenti e basta;
 * poi l'atout, che aggiunge tagli e affrancamento; infine tutto insieme.
 */
export const QUIZ_LEVELS: QuizLevel[] = [
  {
    id: "senza-atout",
    label: "Senza atout",
    description: "Conta le prese che Nord-Sud incassa senza colore d'atout",
    strains: [null],
  },
  {
    id: "colore",
    label: "A colore",
    description: "Con un colore d'atout: entrano in gioco tagli e affrancamento",
    strains: ["spade", "heart", "diamond", "club"],
  },
  {
    id: "misto",
    label: "Misto",
    description: "Senza atout e a colore, alternati",
    strains: [null, "spade", "heart", "diamond", "club"],
  },
];

export const STRAIN_LABEL: Record<string, string> = {
  spade: "♠ picche",
  heart: "♥ cuori",
  diamond: "♦ quadri",
  club: "♣ fiori",
  notrump: "senza atout",
};

/** Etichetta leggibile del seme della domanda. */
export function strainLabel(strain: QuizStrain): string {
  return strain === null ? STRAIN_LABEL.notrump : STRAIN_LABEL[strain];
}

/**
 * Quattro risposte fra cui scegliere, tutte plausibili.
 *
 * Sono vicine alla corretta di proposito: distrattori lontani si scartano
 * senza contare nulla, e il quiz misurerebbe il colpo d'occhio invece della
 * tecnica. Restano dentro 0-13 e non contengono doppioni.
 */
export function buildOptions(correct: number, seed: number): number[] {
  const options = new Set<number>([correct]);
  // Si allarga a ventaglio attorno alla risposta finché non si hanno quattro
  // valori legali: vicino agli estremi (0 o 13) il ventaglio è asimmetrico.
  for (let delta = 1; options.size < 4 && delta <= 13; delta++) {
    for (const candidate of [correct - delta, correct + delta]) {
      if (candidate >= 0 && candidate <= 13) options.add(candidate);
      if (options.size === 4) break;
    }
  }
  const list = [...options];
  // Mescolamento deterministico: la posizione della risposta giusta non deve
  // essere prevedibile, ma la stessa domanda deve riproporsi identica.
  for (let i = list.length - 1; i > 0; i--) {
    const j = (Math.imul(seed + i, 0x9e3779b1) >>> 0) % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export interface QuizScore {
  /** Punti della risposta. */
  points: number;
  /** Vero se esatta al netto della tolleranza. */
  accepted: boolean;
  /** Messaggio per l'allievo. */
  message: string;
}

export const POINTS_EXACT = 100;
export const POINTS_NEAR = 40;

/**
 * Punteggio della risposta.
 * Esatta = pieno; sbagliata di una presa = parziale, perché a quel punto il
 * ragionamento era quasi tutto corretto; oltre = zero.
 */
export function scoreAnswer(answer: number, correct: number): QuizScore {
  const distance = Math.abs(answer - correct);
  if (distance === 0) {
    return { points: POINTS_EXACT, accepted: true, message: "Esatto!" };
  }
  if (distance === 1) {
    return {
      points: POINTS_NEAR,
      accepted: true,
      message: `Quasi: ne fa ${correct}, hai sbagliato di una presa.`,
    };
  }
  return {
    points: 0,
    accepted: false,
    message: `Ne fa ${correct}, tu hai risposto ${answer}.`,
  };
}

/**
 * Seme del giro successivo.
 *
 * Deterministico e crescente: due partite avviate con lo stesso seme iniziale
 * propongono le stesse mani — utile a un insegnante che voglia dare alla
 * classe la stessa serie — ma dentro una partita le domande non si ripetono.
 */
export function nextSeed(seed: number, index: number): number {
  return (Math.imul(seed + index * 7919, 0x85ebca6b) >>> 0) % 1_000_000;
}

/** Seme della domanda scelto per il giro `index`. */
export function strainForRound(level: QuizLevel, seed: number, index: number): QuizStrain {
  return level.strains[nextSeed(seed, index) % level.strains.length];
}
