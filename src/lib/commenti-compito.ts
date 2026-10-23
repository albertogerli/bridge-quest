import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { tabellaMancante } from "@/lib/materiali-lezione";

/**
 * Il commento dell'insegnante su una mano di un compito.
 *
 * Prima l'insegnante correggeva le aste facendo lo screenshot di ogni mano e
 * mandandolo su WhatsApp (23/10/2026); ora il commento sta accanto alla mano
 * che corregge, e l'allievo lo ritrova aprendo il compito.
 *
 * DUE GENERI: per un allievo (`studentId`) o per tutta la classe (`null`) —
 * «qui si apriva 1SA» si scrive una volta, non otto.
 *
 * A DIFFERENZA DELLA NOTA (`note-smazzate.ts`) segue il compito, non la mano:
 * è una correzione a chi l'ha giocata quella volta, non come la si spiega.
 *
 * Tabella e RPC vengono da `scripts/sql/commenti-compito-2026-10.sql`, da
 * eseguire a mano: finché non c'è, la lettura torna `null` e la pagina lo dice
 * invece di fallire.
 */
export interface CommentoCompito {
  smazzataId: string;
  /** `null`: il commento è per tutta la classe. */
  studentId: string | null;
  testo: string;
  aggiornato: string;
}

/** `null` se la tabella non c'è ancora (script non eseguito). */
export async function commentiDelCompito(assignmentId: string): Promise<CommentoCompito[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("commenti_compito")
    .select("smazzata_id, student_id, testo, updated_at")
    .eq("assignment_id", assignmentId);
  if (error) {
    if (tabellaMancante(error)) return null;
    segnalaSalvoRete("commenti-compito:leggi", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    smazzataId: r.smazzata_id as string,
    studentId: (r.student_id as string | null) ?? null,
    testo: r.testo as string,
    aggiornato: r.updated_at as string,
  }));
}

/** Salva o, con un testo vuoto, cancella. Lancia l'errore: chi chiama lo mostra. */
export async function salvaCommentoCompito(input: {
  assignmentId: string;
  smazzataId: string;
  studentId: string | null;
  testo: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("salva_commento_compito", {
    p_assignment_id: input.assignmentId,
    p_smazzata_id: input.smazzataId,
    p_student_id: input.studentId,
    p_testo: input.testo.trim().slice(0, 4000),
  });
  if (error) throw error;
}

/** I commenti che riguardano una mano, per un allievo: il suo e quello per tutti. */
export function commentiPerMano(
  commenti: readonly CommentoCompito[],
  smazzataId: string,
  studentId: string | null,
): { perTe: string | null; perTutti: string | null } {
  const della = commenti.filter((c) => c.smazzataId === smazzataId);
  return {
    perTe: studentId ? (della.find((c) => c.studentId === studentId)?.testo ?? null) : null,
    perTutti: della.find((c) => c.studentId === null)?.testo ?? null,
  };
}
