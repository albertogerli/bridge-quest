import { getLessonDisplayNumber } from "@/data/lesson-meta";
import type { Assignment, ClassRoom } from "@/lib/instructors";

/**
 * Il percorso che l'allievo vede, e come si chiamano le sue lezioni.
 *
 * DUE REGOLE CHE SEMBRANO DETTAGLI E NON LO SONO.
 *
 * 1. IL NUMERO VIENE DALLA LEZIONE, NON DALLA POSIZIONE. Se l'insegnante salta
 *    la 5, l'allievo vede 4, 6, 7 — il buco si vede, ed è giusto che si veda.
 *    Rinumerando per posizione, la frase «fa parte della lezione 6» e la quinta
 *    riga dell'elenco diventerebbero due cose diverse, e la riga che doveva
 *    rassicurare diventerebbe una cosa che non torna.
 *
 * 2. IL NOME DEL CORSO COMPARE SOLO SE I CORSI ATTIVI SONO PIÙ D'UNO. Con due
 *    corsi «lezione 2» è ambiguo: esiste in Fiori e nell'Approfondimento. Con
 *    un corso solo, il nome è rumore.
 *
 *    «Attivi», non «mai frequentati»: chi ha finito Fiori l'anno scorso e ora
 *    fa solo l'Approfondimento deve tornare a vedere la riga pulita, altrimenti
 *    il nome resta lì per sempre a fare rumore.
 */

/** Una classe conta come corso in corso finché non è chiusa o archiviata. */
export function corsiAttivi(classi: readonly ClassRoom[]): ClassRoom[] {
  return classi.filter((c) => c.stato !== "chiusa" && c.stato !== "archiviata");
}

/**
 * Come si nomina una lezione in una frase: «lezione 6», oppure «lezione 6 del
 * Corso Fiori» quando l'allievo segue più corsi insieme.
 */
export function etichettaLezione(
  lessonId: number,
  nomeCorso: string | null,
  quantiCorsiAttivi: number,
): string {
  const numero = getLessonDisplayNumber(lessonId);
  // IL TRATTINO, E NON UN ARTICOLO. «del ${nomeCorso}» produce «del
  // Approfondimento», che è italiano sbagliato; l'articolo giusto dipende da
  // genere e lettera iniziale, e il nome del corso lo scrive l'insegnante —
  // «Martedì sera», «Principianti 2026», qualunque cosa. Nessuna regola
  // indovina l'articolo per un nome arbitrario, quindi non se ne usa nessuno.
  if (quantiCorsiAttivi > 1 && nomeCorso) return `lezione ${numero} — ${nomeCorso}`;
  return `lezione ${numero}`;
}

export type StatoLezione = "completata" | "in-corso" | "in-attesa";

export interface RigaPercorso {
  lessonId: number;
  /** Il numero del corso, quello stampato sui materiali FIGB. */
  numero: number;
  stato: StatoLezione;
}

/**
 * Le righe del percorso per un corso.
 *
 * LE NON ASSEGNATE CI SONO, GRIGIE. È il trattamento dei contenuti didattici:
 * si dichiarano, non spariscono. Sparire genera sospetto — l'allievo che ne
 * parla con un compagno esterno scopre che lui le vede — mentre dichiarare
 * genera attesa e comunica che c'è un percorso.
 *
 * Le funzioni ludiche fanno il contrario e spariscono in silenzio: quello è
 * `permessi-allievo.ts`, e i due trattamenti convivono nella stessa schermata.
 */
export function percorsoDelCorso(
  lezioniDelCorso: readonly number[],
  assegnate: ReadonlySet<number>,
  completate: ReadonlySet<number>,
): RigaPercorso[] {
  return lezioniDelCorso
    .map((lessonId) => ({
      lessonId,
      numero: getLessonDisplayNumber(lessonId),
      stato: completate.has(lessonId)
        ? ("completata" as const)
        : assegnate.has(lessonId)
          ? ("in-corso" as const)
          : ("in-attesa" as const),
    }))
    .sort((a, b) => a.numero - b.numero);
}

export interface DaFare {
  assignment: Assignment;
  classe: ClassRoom;
  /** Scade prima = viene prima. Senza scadenza = in fondo. */
  scadenza: number;
}

/**
 * I compiti di TUTTI i corsi in un elenco solo, per scadenza.
 *
 * PERCHÉ NON DIVISI PER CORSO. La domanda che porta un allievo ad aprire il
 * portale è «devo fare qualcosa», non «in quale dei miei corsi devo cercare».
 * Dividerli — o peggio metterli sotto linguette — costringe a sapere in quale
 * corso sta una cosa prima di poterla cercare: è un modello mentale da
 * amministratore, non da studente. E chi ha un compito in scadenza nel corso
 * non selezionato non lo vedrebbe affatto.
 */
export function daFareAdesso(
  classi: readonly ClassRoom[],
  compitiPerClasse: ReadonlyMap<string, readonly Assignment[]>,
  eFatto: (a: Assignment) => boolean,
): DaFare[] {
  const righe: DaFare[] = [];
  for (const classe of classi) {
    for (const assignment of compitiPerClasse.get(classe.id) ?? []) {
      if (eFatto(assignment)) continue;
      righe.push({
        assignment,
        classe,
        scadenza: assignment.due_date
          ? new Date(assignment.due_date).getTime()
          : Number.POSITIVE_INFINITY,
      });
    }
  }
  return righe.sort((a, b) => a.scadenza - b.scadenza);
}
