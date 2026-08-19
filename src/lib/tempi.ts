/**
 * I tempi di riflessione: quanto ci si mette a decidere, non quanto si è bravi.
 *
 * A COSA SERVE. L'area Valutazioni ha bisogno di qualcosa di oggettivo e che non
 * costi nulla da raccogliere. Il tempo lo è, e dice cose che il risultato non
 * dice: i due casi che interessano un insegnante sono «ci ha pensato molto e ha
 * sbagliato» — non sapeva come fare, e la spiegazione non è arrivata — e «ha
 * risposto subito e ha sbagliato» — non si è accorto che c'era una scelta. Sono
 * due difficoltà opposte con lo stesso esito, e senza il tempo si confondono.
 *
 * ALL'ALLIEVO NON SI MOSTRANO CLASSIFICHE DI VELOCITÀ. Il bridge è un gioco in
 * cui pensare è la cosa giusta da fare, e una gara a chi gioca prima insegna
 * l'opposto. L'allievo vede il proprio tempo e basta.
 *
 * NON SI FIDA DEL CLIENT. Il tempo lo misura il browser, e un browser può stare
 * fermo per mille motivi che non c'entrano col pensare: la scheda in secondo
 * piano, il telefono in tasca, il portatile chiuso a metà mano. `ripulisci`
 * toglie i valori assurdi PRIMA che entrino nei conti — un allievo che risulta
 * aver pensato quaranta minuti su una carta falsa la media di tutta la classe.
 */

/** Oltre questo, non è riflessione: è una scheda lasciata aperta. */
export const TETTO_PER_DECISIONE_MS = 5 * 60 * 1000;

export interface TempiMano {
  /** Millisecondi per ogni decisione, in ordine. */
  decisioni: number[];
  /** Somma delle decisioni valide. */
  totaleMs: number;
  /** La decisione più lunga: quasi sempre è quella che contava. */
  massimoMs: number;
  /** Quante decisioni sono state scartate perché fuori scala. */
  scartate: number;
}

/**
 * Il cronometro di una mano.
 *
 * Si segna a ogni gesto — una dichiarazione, una carta — e la differenza dal
 * gesto precedente è il tempo di quella decisione. Il primo intervallo parte
 * da quando la mano è comparsa a schermo, che è quando si comincia a pensare.
 */
export class Cronometro {
  private ultimo: number;
  private readonly misure: number[] = [];

  constructor(adesso: number) {
    this.ultimo = adesso;
  }

  /** Registra una decisione e restituisce quanto è durata. */
  segna(adesso: number): number {
    const dt = Math.max(0, adesso - this.ultimo);
    this.ultimo = adesso;
    this.misure.push(dt);
    return dt;
  }

  grezzi(): number[] {
    return [...this.misure];
  }
}

/**
 * Toglie i valori che non possono essere riflessione.
 *
 * Non li mette a zero: li TOGLIE, e dice quanti erano. Un intervallo di
 * quaranta minuti non è «una decisione molto lunga» da schiacciare al tetto, è
 * una misura che non è avvenuta, e contarla al tetto sposterebbe comunque tutte
 * le medie verso l'alto.
 */
export function ripulisci(decisioni: readonly number[]): TempiMano {
  const buone: number[] = [];
  let scartate = 0;
  for (const d of decisioni) {
    if (!Number.isFinite(d) || d < 0 || d > TETTO_PER_DECISIONE_MS) scartate++;
    else buone.push(Math.round(d));
  }
  return {
    decisioni: buone,
    totaleMs: buone.reduce((a, b) => a + b, 0),
    massimoMs: buone.length ? Math.max(...buone) : 0,
    scartate,
  };
}

export type Difficolta = "lento-e-sbagliato" | "veloce-e-sbagliato" | "normale";

/**
 * I due casi che l'insegnante deve vedere.
 *
 * Le soglie sono in secondi sulla decisione più lunga, non sul totale: una mano
 * lunga perché si è giocato con calma non è un segnale, una mano in cui una
 * singola carta è costata mezzo minuto sì. E «veloce» è sotto i due secondi per
 * decisione in media, che al bridge vuol dire non aver guardato.
 */
export function difficolta(t: TempiMano, mantenuto: boolean): Difficolta {
  if (mantenuto) return "normale";
  if (t.massimoMs >= 30_000) return "lento-e-sbagliato";
  const media = t.decisioni.length ? t.totaleMs / t.decisioni.length : 0;
  if (t.decisioni.length >= 4 && media < 2000) return "veloce-e-sbagliato";
  return "normale";
}

/** `1m 12s`, `8s`. I millisecondi non li legge nessuno. */
export function formattaDurata(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
