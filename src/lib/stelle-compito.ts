import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { tabellaMancante } from "@/lib/materiali-lezione";
import { STELLE_PER_RIUSCITA } from "@/lib/compito-licita";

/**
 * Le stelle dell'insegnante su una mano di un compito di licita.
 *
 * Il programma dà le stelle confrontando il contratto col par; ma l'insegnante
 * spesso spiega accordi diversi da quelli del corso federale, e un allievo che
 * ha dichiarato come gli è stato insegnato si ritrovava con una stella sola
 * (25/10/2026). Qui l'insegnante le corregge, allievo per allievo e mano per
 * mano; e con `Assignment.stelle_insegnante` il compito parte senza voto
 * automatico: le stelle le dà solo lui.
 *
 * LA RIGA DEL RISULTATO NON SI TOCCA: le stelle del programma restano in
 * `details.stelle`, quelle dell'insegnante stanno accanto. Se l'insegnante
 * cancella la sua correzione torna il voto di prima, e se l'allievo ridichiara
 * la mano il suo nuovo risultato non cancella il voto dell'insegnante.
 *
 * Tabella e RPC vengono da `scripts/sql/stelle-insegnante-2026-10.sql`, da
 * eseguire a mano: finché non c'è, la lettura torna `null` e la pagina lo dice.
 */
export interface StelleAssegnate {
  smazzataId: string;
  studentId: string;
  stelle: number;
}

/** `null` se la tabella non c'è ancora (script non eseguito). */
export async function stelleDelCompito(assignmentId: string): Promise<StelleAssegnate[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stelle_compito")
    .select("smazzata_id, student_id, stelle")
    .eq("assignment_id", assignmentId);
  if (error) {
    if (tabellaMancante(error)) return null;
    segnalaSalvoRete("stelle-compito:leggi", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    smazzataId: r.smazzata_id as string,
    studentId: r.student_id as string,
    stelle: Number(r.stelle),
  }));
}

/** Assegna le stelle o, con `null`, torna al voto del programma. Lancia l'errore. */
export async function assegnaStelleCompito(input: {
  assignmentId: string;
  smazzataId: string;
  studentId: string;
  stelle: number | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("assegna_stelle_compito", {
    p_assignment_id: input.assignmentId,
    p_smazzata_id: input.smazzataId,
    p_student_id: input.studentId,
    p_stelle: input.stelle,
  });
  if (error) throw error;
}

/** Cambia l'impostazione del compito. Lancia l'errore. */
export async function impostaStelleInsegnante(assignmentId: string, attivo: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("assignments")
    .update({ stelle_insegnante: attivo })
    .eq("id", assignmentId);
  if (error) throw error;
}

/** Le stelle dell'insegnante per un allievo su una mano, se ci sono. */
export function stelleAssegnate(
  elenco: readonly StelleAssegnate[] | null,
  smazzataId: string,
  studentId: string | null,
): number | null {
  if (!elenco || !studentId) return null;
  return elenco.find((s) => s.smazzataId === smazzataId && s.studentId === studentId)?.stelle ?? null;
}

export interface VotoMano {
  /** Le stelle da mostrare; `null` quando si aspetta l'insegnante. */
  stelle: number | null;
  /** Le ha date l'insegnante, non il programma. */
  dallInsegnante: boolean;
  /** Mano riuscita; `null` finché non c'è un voto. */
  riuscita: boolean | null;
}

/**
 * Il voto che vale per una mano dichiarata: quello dell'insegnante se c'è;
 * altrimenti, se il compito ha le stelle «le assegno io», nessuno; altrimenti
 * quello del programma.
 */
export function votoMano(input: {
  automatiche: number | null | undefined;
  insegnante: number | null;
  soloInsegnante: boolean;
}): VotoMano {
  if (input.insegnante !== null) {
    return { stelle: input.insegnante, dallInsegnante: true, riuscita: input.insegnante >= STELLE_PER_RIUSCITA };
  }
  if (input.soloInsegnante || typeof input.automatiche !== "number") {
    return { stelle: null, dallInsegnante: false, riuscita: null };
  }
  return { stelle: input.automatiche, dallInsegnante: false, riuscita: input.automatiche >= STELLE_PER_RIUSCITA };
}

/** Le stelle che l'insegnante può scegliere: da zero a tre, di mezza in mezza. */
export const SCELTE_STELLE = [0, 0.5, 1, 1.5, 2, 2.5, 3] as const;
