/**
 * Il programma del Corso di Primo Livello come l'ha definito la Commissione
 * Insegnamento (Trevissoi, 02/11/2026: «adesso abbiamo definito tutto»): due
 * moduli da dieci lezioni, il gioco della carta e poi la dichiarazione.
 *
 * LE LEZIONI DEL SITO NON SI RINUMERANO QUI. Il sito ha tredici lezioni (0–12)
 * con progressi, compiti e smazzate legati al loro numero; il programma ne ha
 * venti, alcune di solo gioco al tavolo. Questa tabella dice, per ogni lezione
 * del programma, che cosa del sito le corrisponde: la usa l'insegnante per
 * sapere che cosa assegnare. Le smazzate di ogni lezione sono quelle delle
 * tabelle della Commissione (Trevissoi, 03/11/2026).
 */
export type TipoLezione = "teoria-e-gioco" | "gioco";

/**
 * Un gruppo di smazzate della Commissione: «E3 S1-4» = esercizio 3, smazzate
 * da 1 a 4 (Trevissoi, 03/11/2026, tabelle del programma).
 */
export interface GruppoSmazzate {
  e: number;
  da: number;
  a: number;
}

export interface LezioneProgramma {
  numero: number;
  modulo: 1 | 2;
  tipo: TipoLezione;
  titolo: string;
  /** Le lezioni del sito (id) che ne coprono la teoria. */
  lezioniSito: number[];
  /**
   * Da dove vengono le smazzate della lezione:
   * - `tavolo`: mescolate al tavolo, nessuna smazzata preparata;
   * - gruppi «E·S» della Commissione;
   * - `file`: preparate da BridgeLab (lezioni 17 e 18, «da generare BridgeLab»).
   */
  smazzate: "tavolo" | GruppoSmazzate[] | { file: string };
}

/**
 * LA NUMERAZIONE «E». Le sigle E1…E12 della Commissione sono i numeri dei
 * dodici test di Barion, uno per lezione del vecchio Corso Fiori, e ogni
 * lezione ha otto smazzate: sono le 96 smazzate del catalogo, lezioni 1–12.
 * Una sola differenza d'ordine: per la Commissione E7 sono le aperture di
 * 1SA e 2SA e E8 le dichiarazioni di apertura, che nel sito sono le lezioni 8
 * e 7.
 */
const LEZIONE_DI_E: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 8, 8: 7, 9: 9, 10: 10, 11: 11, 12: 12,
};
const E_DI_LEZIONE: Record<number, number> = Object.fromEntries(
  Object.entries(LEZIONE_DI_E).map(([e, l]) => [l, Number(e)]),
);

/** «E1 S3» per una smazzata del catalogo, `null` se non è della Commissione. */
export function siglaSmazzata(lessonId: number, board: number): string | null {
  const e = E_DI_LEZIONE[lessonId];
  return e && board >= 1 && board <= 8 ? `E${e} S${board}` : null;
}

/** Gli id delle smazzate del catalogo di un gruppo «E·S», nell'ordine. */
export function idSmazzateGruppo(g: GruppoSmazzate): string[] {
  const lezione = LEZIONE_DI_E[g.e];
  return Array.from({ length: g.a - g.da + 1 }, (_, i) => `${lezione}-${g.da + i}`);
}

/** «E3 S1-4 · E5 S1-4» */
export function siglaGruppi(gruppi: readonly GruppoSmazzate[]): string {
  return gruppi.map((g) => `E${g.e} S${g.da === g.a ? g.da : `${g.da}-${g.a}`}`).join(" · ");
}

const CARTELLA = "/materiali/programma";
const tutte = (e: number): GruppoSmazzate[] => [{ e, da: 1, a: 8 }];
const meta = (e1: number, e2: number, parte: 1 | 2): GruppoSmazzate[] => {
  const [da, a] = parte === 1 ? [1, 4] : [5, 8];
  return [{ e: e1, da, a }, { e: e2, da, a }];
};

export const PROGRAMMA_PRIMO_LIVELLO: LezioneProgramma[] = [
  { numero: 1, modulo: 1, tipo: "teoria-e-gioco", titolo: "Vincenti, affrancabili e attacco", lezioniSito: [1, 2], smazzate: "tavolo" },
  { numero: 2, modulo: 1, tipo: "teoria-e-gioco", titolo: "Affrancamenti di forza, di lunga e di posizione", lezioniSito: [3], smazzate: "tavolo" },
  { numero: 3, modulo: 1, tipo: "gioco", titolo: "Smazzate libere a senz'atout con tutoraggio: vincenti e affrancabili", lezioniSito: [], smazzate: "tavolo" },
  { numero: 4, modulo: 1, tipo: "teoria-e-gioco", titolo: "Il piano di gioco", lezioniSito: [4], smazzate: tutte(1) },
  { numero: 5, modulo: 1, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: il piano di gioco", lezioniSito: [], smazzate: tutte(5) },
  { numero: 6, modulo: 1, tipo: "teoria-e-gioco", titolo: "Il gioco ad atout", lezioniSito: [5, 6], smazzate: tutte(6) },
  { numero: 7, modulo: 1, tipo: "gioco", titolo: "Smazzate libere con tutoraggio ad atout", lezioniSito: [], smazzate: meta(3, 5, 1) },
  { numero: 8, modulo: 1, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: piano di gioco a senz'atout e ad atout", lezioniSito: [], smazzate: meta(3, 5, 2) },
  { numero: 9, modulo: 1, tipo: "teoria-e-gioco", titolo: "Fasi del gioco e valutazione della mano", lezioniSito: [7], smazzate: meta(4, 6, 1) },
  { numero: 10, modulo: 1, tipo: "teoria-e-gioco", titolo: "Contratti e requisiti", lezioniSito: [], smazzate: tutte(8) },
  { numero: 11, modulo: 2, tipo: "teoria-e-gioco", titolo: "Aperture e sviluppi delle mani bilanciate: 1SA, 2SA e 2♣ seguito da SA", lezioniSito: [8], smazzate: meta(4, 6, 2) },
  { numero: 12, modulo: 2, tipo: "teoria-e-gioco", titolo: "Riepilogo generale", lezioniSito: [], smazzate: tutte(1) },
  { numero: 13, modulo: 2, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: aperture e sviluppi delle bilanciate forti", lezioniSito: [], smazzate: tutte(3) },
  { numero: 14, modulo: 2, tipo: "teoria-e-gioco", titolo: "Aperture e sviluppi delle altre mani bilanciate", lezioniSito: [], smazzate: tutte(7) },
  { numero: 15, modulo: 2, tipo: "teoria-e-gioco", titolo: "Aperture delle mani sbilanciate", lezioniSito: [9], smazzate: tutte(9) },
  { numero: 16, modulo: 2, tipo: "gioco", titolo: "Smazzate preparate con tutoraggio: aperture di 1 nobile e sviluppi", lezioniSito: [], smazzate: tutte(10) },
  { numero: 17, modulo: 2, tipo: "teoria-e-gioco", titolo: "Sviluppo delle aperture di 1 a colore", lezioniSito: [10], smazzate: { file: `${CARTELLA}/mani-lezione-17.pbn` } },
  { numero: 18, modulo: 2, tipo: "teoria-e-gioco", titolo: "Apertura di 2♣, sottoaperture e richiesta d'assi", lezioniSito: [], smazzate: { file: `${CARTELLA}/mani-lezione-18.pbn` } },
  { numero: 19, modulo: 2, tipo: "teoria-e-gioco", titolo: "Interferenza e sviluppo (cenni)", lezioniSito: [11, 12], smazzate: tutte(11) },
  { numero: 20, modulo: 2, tipo: "gioco", titolo: "Torneo a smazzate libere", lezioniSito: [], smazzate: "tavolo" },
];

/** Le lezioni del programma che hanno smazzate preparate, nell'ordine. */
export function lezioniConSmazzate(): LezioneProgramma[] {
  return PROGRAMMA_PRIMO_LIVELLO.filter((l) => l.smazzate !== "tavolo");
}

export const MODULI_PROGRAMMA: Record<1 | 2, string> = {
  1: "Modulo 1 · Il gioco della carta",
  2: "Modulo 2 · Dichiarazione e gioco",
};
