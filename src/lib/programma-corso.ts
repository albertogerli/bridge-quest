/**
 * Il programma del Corso di Primo Livello come l'ha definito la Commissione
 * Insegnamento (Trevissoi, 02/11/2026: «adesso abbiamo definito tutto»): due
 * moduli da dieci lezioni, il gioco della carta e poi la dichiarazione.
 *
 * LE LEZIONI DEL SITO NON SI RINUMERANO QUI. Il sito ha tredici lezioni (0–12)
 * con progressi, compiti e smazzate legati al loro numero; il programma ne ha
 * venti, alcune di solo gioco al tavolo. Questa tabella dice, per ogni lezione
 * del programma, che cosa del sito le corrisponde: la usa l'insegnante per
 * sapere che cosa assegnare. La corrispondenza è una proposta da confermare
 * con la Commissione, soprattutto per le lezioni di solo gioco.
 */
export type TipoLezione = "teoria-e-gioco" | "gioco";

export interface LezioneProgramma {
  numero: number;
  modulo: 1 | 2;
  tipo: TipoLezione;
  titolo: string;
  /** Le lezioni del sito (id) che ne coprono la teoria. */
  lezioniSito: number[];
  /** I file delle «Mani della Commissione» da usare in aula, se ce ne sono. */
  mani: string[];
}

const CARTELLA = "/materiali/gioco-della-carta";

export const PROGRAMMA_PRIMO_LIVELLO: LezioneProgramma[] = [
  { numero: 1, modulo: 1, tipo: "teoria-e-gioco", titolo: "Vincenti, affrancabili e attacco", lezioniSito: [1, 2], mani: [] },
  { numero: 2, modulo: 1, tipo: "teoria-e-gioco", titolo: "Affrancamenti di forza, di lunga e di posizione", lezioniSito: [3], mani: [] },
  { numero: 3, modulo: 1, tipo: "gioco", titolo: "Smazzate libere a senz'atout con tutoraggio: vincenti e affrancabili", lezioniSito: [], mani: [`${CARTELLA}/mani-introduzione-del-morto.pbn`] },
  { numero: 4, modulo: 1, tipo: "teoria-e-gioco", titolo: "Il piano di gioco", lezioniSito: [4], mani: [] },
  { numero: 5, modulo: 1, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: il piano di gioco", lezioniSito: [], mani: [`${CARTELLA}/mani-piano-di-gioco-a-senza-atout-2.pbn`, `${CARTELLA}/mani-tutoraggio-gioco-a-senza.pbn`] },
  { numero: 6, modulo: 1, tipo: "teoria-e-gioco", titolo: "Il gioco ad atout", lezioniSito: [5, 6], mani: [] },
  { numero: 7, modulo: 1, tipo: "gioco", titolo: "Smazzate libere con tutoraggio ad atout", lezioniSito: [], mani: [] },
  { numero: 8, modulo: 1, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: piano di gioco a senz'atout e ad atout", lezioniSito: [], mani: [`${CARTELLA}/mani-tutoraggio-senza-e-atout.pbn`] },
  { numero: 9, modulo: 1, tipo: "teoria-e-gioco", titolo: "Fasi del gioco e valutazione della mano", lezioniSito: [7], mani: [] },
  { numero: 10, modulo: 1, tipo: "teoria-e-gioco", titolo: "Contratti e requisiti", lezioniSito: [], mani: [] },
  { numero: 11, modulo: 2, tipo: "teoria-e-gioco", titolo: "Aperture e sviluppi delle mani bilanciate: 1SA, 2SA e 2♣ seguito da SA", lezioniSito: [8], mani: [] },
  { numero: 12, modulo: 2, tipo: "teoria-e-gioco", titolo: "Riepilogo generale", lezioniSito: [], mani: [] },
  { numero: 13, modulo: 2, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: aperture e sviluppi delle bilanciate forti", lezioniSito: [], mani: [] },
  { numero: 14, modulo: 2, tipo: "teoria-e-gioco", titolo: "Aperture e sviluppi delle altre mani bilanciate", lezioniSito: [], mani: [] },
  { numero: 15, modulo: 2, tipo: "teoria-e-gioco", titolo: "Aperture delle mani sbilanciate", lezioniSito: [9], mani: [] },
  { numero: 16, modulo: 2, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: aperture di 1 nobile e sviluppi", lezioniSito: [], mani: [] },
  { numero: 17, modulo: 2, tipo: "teoria-e-gioco", titolo: "Sviluppo delle aperture di 1 a colore", lezioniSito: [10], mani: [] },
  { numero: 18, modulo: 2, tipo: "teoria-e-gioco", titolo: "Apertura di 2♣, sottoaperture e richiesta d'assi", lezioniSito: [], mani: [] },
  { numero: 19, modulo: 2, tipo: "teoria-e-gioco", titolo: "Interferenza e sviluppo (cenni)", lezioniSito: [11, 12], mani: [] },
  { numero: 20, modulo: 2, tipo: "gioco", titolo: "Torneo a smazzate libere", lezioniSito: [], mani: [] },
];

export const MODULI_PROGRAMMA: Record<1 | 2, string> = {
  1: "Modulo 1 · Il gioco della carta",
  2: "Modulo 2 · Dichiarazione e gioco",
};
