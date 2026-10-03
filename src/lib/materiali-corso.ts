/**
 * Slide e dispense ufficiali dei moduli, per gli insegnanti.
 *
 * I PDF stanno in `public/materiali/` e si rigenerano da HTML con
 * `node scripts/materiali/rendi-gioco-della-carta.mjs`: le carte e le mani
 * sono disegnate dai dati, e il render si ferma se una mano non ha 13 carte o
 * se una carta compare due volte. Correggere un esempio vuol dire cambiare una
 * riga del sorgente, non ridisegnare un'immagine.
 *
 * Il testo è quello della Commissione, impaginato da capo: nessun nome
 * d'autore sulle pagine e nessun numero di lezione, perché l'ordine delle
 * lezioni può cambiare e il numero stampato no.
 */
export interface Materiale {
  titolo: string;
  /** Percorso pubblico del PDF. */
  file: string;
  pagine: number;
  /** Le lezioni BridgeLab che il materiale accompagna. */
  lezioni: number[];
}

export interface ModuloMateriali {
  titolo: string;
  descrizione: string;
  slide: Materiale[];
  dispense: Materiale[];
}

const CARTELLA = "/materiali/gioco-della-carta";

export const MATERIALI_CORSO: ModuloMateriali[] = [
  {
    titolo: "Il gioco della carta",
    descrizione: "Vincenti e affrancabili, la difesa, gli affrancamenti, il piano di gioco a senz'atout e con l'atout.",
    slide: [
      { titolo: "Vincenti e affrancabili, l'attacco e il terzo di mano", file: `${CARTELLA}/slide-vincenti-e-affrancabili.pdf`, pagine: 22, lezioni: [1, 2] },
      { titolo: "Il piano di gioco", file: `${CARTELLA}/slide-piano-di-gioco.pdf`, pagine: 24, lezioni: [3, 4] },
      { titolo: "Il gioco ad atout", file: `${CARTELLA}/slide-gioco-ad-atout.pdf`, pagine: 14, lezioni: [5, 6] },
    ],
    dispense: [
      { titolo: "Vincenti e affrancabili", file: `${CARTELLA}/dispensa-vincenti-e-affrancabili.pdf`, pagine: 4, lezioni: [1] },
      { titolo: "Il punto di vista dei difensori", file: `${CARTELLA}/dispensa-punto-di-vista-dei-difensori.pdf`, pagine: 5, lezioni: [2] },
      { titolo: "Affrancamenti di lunga e di posizione", file: `${CARTELLA}/dispensa-affrancamenti-di-lunga-e-di-posizione.pdf`, pagine: 4, lezioni: [3] },
      { titolo: "Il piano di gioco a senz'atout", file: `${CARTELLA}/dispensa-piano-di-gioco-a-senza-atout.pdf`, pagine: 4, lezioni: [4] },
      { titolo: "Il gioco ad atout", file: `${CARTELLA}/dispensa-gioco-ad-atout.pdf`, pagine: 8, lezioni: [5, 6] },
    ],
  },
];
