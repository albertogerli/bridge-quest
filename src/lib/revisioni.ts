import type { Assignment, StatoCompito } from "@/lib/instructors";

/**
 * Le revisioni che aspettano di essere aperte, e quanto è grave che aspettino.
 *
 * PERCHÉ NON BASTA CONTARLE. «3 revisioni da aprire» dice quante, non se
 * importa. Una revisione chiusa su un compito che nessuno ha finito non fa
 * danno a nessuno: non è in ritardo, è in anticipo. Quella su cui hanno finito
 * TUTTI è l'unica che sta facendo male adesso — ci sono dodici persone che
 * hanno lavorato e non possono rivedere quello che hanno fatto.
 *
 * E IL TEMPO TRASFORMA LA DISTRAZIONE IN DANNO. «Chiusa da otto giorni» si
 * capisce e si agisce; «3» si legge e si rimanda.
 *
 * Il predefinito «finché non lo dico io» sposta lavoro sull'insegnante, e chi è
 * meno organizzato lascerà revisioni chiuse per dimenticanza — con gli allievi
 * che non vedono le proprie mani senza sapere perché. Questo modulo esiste per
 * far arrivare l'informazione dove l'insegnante sta già guardando.
 */

export interface RevisioneInAttesa {
  assignment: Assignment;
  /** Quanti allievi hanno finito tutte le mani, e su quanti. */
  finiti: number;
  allievi: number;
  /** Da quanti giorni il compito è stato assegnato. */
  giorni: number;
}

export interface RiepilogoRevisioni {
  inAttesa: RevisioneInAttesa[];
  /** Quelle su cui hanno finito tutti: sono le uniche che stanno facendo danno. */
  finiteDaTutti: number;
  /** I giorni della più vecchia, per dire da quanto si aspetta. */
  giorniDellaPiuVecchia: number;
}

/** Solo questa impostazione richiede un gesto dell'insegnante. */
export function aspettaLInsegnante(a: Assignment): boolean {
  return a.soluzioni === "quando-l-insegnante-decide";
}

export function riepilogoRevisioni(
  compiti: readonly Assignment[],
  stato: readonly StatoCompito[],
  adesso: Date = new Date(),
): RiepilogoRevisioni {
  const perId = new Map(stato.map((s) => [s.assignment_id, s]));

  const inAttesa = compiti
    .filter(aspettaLInsegnante)
    .map((assignment) => {
      const s = perId.get(assignment.id);
      const giorni = Math.max(
        0,
        Math.floor(
          (adesso.getTime() - new Date(assignment.created_at).getTime()) / 86_400_000,
        ),
      );
      return {
        assignment,
        finiti: s?.n_completi ?? 0,
        allievi: s?.n_allievi ?? 0,
        giorni,
      };
    })
    // Prima quelle finite da tutti, poi le più vecchie: l'ordine è la gravità.
    .sort((a, b) => {
      const tuttiA = a.allievi > 0 && a.finiti >= a.allievi ? 1 : 0;
      const tuttiB = b.allievi > 0 && b.finiti >= b.allievi ? 1 : 0;
      if (tuttiA !== tuttiB) return tuttiB - tuttiA;
      return b.giorni - a.giorni;
    });

  return {
    inAttesa,
    finiteDaTutti: inAttesa.filter((r) => r.allievi > 0 && r.finiti >= r.allievi).length,
    giorniDellaPiuVecchia: inAttesa.reduce((max, r) => Math.max(max, r.giorni), 0),
  };
}

/**
 * La frase da mostrare: dice quante SONO e quanto è GRAVE, in una riga.
 * Restituisce `null` quando non c'è niente da aprire, così chi la usa non deve
 * decidere se mostrare la sezione.
 */
export function frasePerLInsegnante(r: RiepilogoRevisioni): string | null {
  const n = r.inAttesa.length;
  if (n === 0) return null;
  const quante = n === 1 ? "1 revisione da aprire" : `${n} revisioni da aprire`;
  if (r.finiteDaTutti > 0) {
    const g = r.finiteDaTutti === 1 ? "una l'hanno finita tutti" : `${r.finiteDaTutti} le hanno finite tutti`;
    return `${quante}, ${g}`;
  }
  if (r.giorniDellaPiuVecchia >= 7) {
    return `${quante}, la più vecchia da ${r.giorniDellaPiuVecchia} giorni`;
  }
  return quante;
}
