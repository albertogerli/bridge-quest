/**
 * Slide e dispense ufficiali dei moduli, per gli insegnanti.
 *
 * I PDF stanno in `public/materiali/` e si rigenerano da HTML con
 * `node scripts/materiali/rendi-materiali.mjs`: le carte e le mani
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

/**
 * Gli esercizi dell'eserciziario della Commissione, così come li ha mandati:
 * PDF originali, divisi in due. Il foglio da dare all'allievo non ha le
 * soluzioni, che stanno in un file a parte per l'insegnante.
 *
 * Non sono quiz interattivi perché le domande vivono di diagrammi e di
 * risposte aperte («quante prese siete destinati a perdere?»): trascriverle
 * a scelta multipla vorrebbe dire riscriverle, e quello spetta agli autori.
 */
export interface Esercizi extends Materiale {
  /** Percorso pubblico del PDF con le sole soluzioni. */
  soluzioni: string;
}

/**
 * Smazzate della Commissione che nel catalogo non ci sono, in PBN: si
 * aggiungono a un compito da «Nuovo compito». Le altre lezioni della
 * Commissione hanno le stesse mani del catalogo, già con il commento.
 * Si rigenerano con `scripts/materiali/commissione/mani-commissione.mjs`.
 */
export interface ManiCommissione {
  titolo: string;
  file: string;
  smazzate: number;
  /** Le lezioni BridgeLab più vicine all'argomento. */
  lezioni: number[];
}

export interface ModuloMateriali {
  titolo: string;
  descrizione: string;
  slide: Materiale[];
  dispense: Materiale[];
  esercizi: Esercizi[];
  mani: ManiCommissione[];
}

const CARTELLA = "/materiali/gioco-della-carta";

export const MATERIALI_CORSO: ModuloMateriali[] = [
  {
    titolo: "Il gioco della carta",
    descrizione: "Le regole della lezione 0, vincenti e affrancabili, la difesa, gli affrancamenti, il piano di gioco a senz'atout e con l'atout.",
    slide: [
      { titolo: "Lezione 0: le regole per cominciare", file: `${CARTELLA}/slide-lezione-zero.pdf`, pagine: 9, lezioni: [0] },
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
    esercizi: [
      { titolo: "Vincenti e affrancabili", file: `${CARTELLA}/esercizi-vincenti-e-affrancabili.pdf`, soluzioni: `${CARTELLA}/soluzioni-vincenti-e-affrancabili.pdf`, pagine: 2, lezioni: [1] },
      { titolo: "Il punto di vista dei difensori", file: `${CARTELLA}/esercizi-punto-di-vista-dei-difensori.pdf`, soluzioni: `${CARTELLA}/soluzioni-punto-di-vista-dei-difensori.pdf`, pagine: 2, lezioni: [2] },
      { titolo: "Affrancamenti di lunga e di posizione", file: `${CARTELLA}/esercizi-affrancamenti-di-lunga-e-di-posizione.pdf`, soluzioni: `${CARTELLA}/soluzioni-affrancamenti-di-lunga-e-di-posizione.pdf`, pagine: 2, lezioni: [3] },
      { titolo: "Il piano di gioco a senz'atout", file: `${CARTELLA}/esercizi-piano-di-gioco-a-senza-atout.pdf`, soluzioni: `${CARTELLA}/soluzioni-piano-di-gioco-a-senza-atout.pdf`, pagine: 2, lezioni: [4] },
      { titolo: "Il gioco ad atout", file: `${CARTELLA}/esercizi-gioco-ad-atout.pdf`, soluzioni: `${CARTELLA}/soluzioni-gioco-ad-atout.pdf`, pagine: 4, lezioni: [5, 6] },
    ],
    mani: [
      { titolo: "Introduzione del morto", file: `${CARTELLA}/mani-introduzione-del-morto.pbn`, smazzate: 8, lezioni: [3] },
      { titolo: "Il piano di gioco a senz'atout (2)", file: `${CARTELLA}/mani-piano-di-gioco-a-senza-atout-2.pbn`, smazzate: 8, lezioni: [4] },
      { titolo: "Tutoraggio: il gioco a senz'atout", file: `${CARTELLA}/mani-tutoraggio-gioco-a-senza.pbn`, smazzate: 8, lezioni: [4] },
      { titolo: "Tutoraggio: a senz'atout e ad atout", file: `${CARTELLA}/mani-tutoraggio-senza-e-atout.pbn`, smazzate: 8, lezioni: [5, 6] },
    ],
  },
];

/** La dispensa della Commissione per una lezione BridgeLab, se c'è. */
export function dispensaDellaLezione(lessonId: number): Materiale | null {
  for (const m of MATERIALI_CORSO) {
    const d = m.dispense.find((x) => x.lezioni.includes(lessonId));
    if (d) return d;
  }
  return null;
}

/** Gli esercizi della Commissione per una lezione BridgeLab, se ci sono. */
export function eserciziDellaLezione(lessonId: number): Esercizi | null {
  for (const m of MATERIALI_CORSO) {
    const e = m.esercizi.find((x) => x.lezioni.includes(lessonId));
    if (e) return e;
  }
  return null;
}
