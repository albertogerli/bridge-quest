import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { tabellaMancante } from "@/lib/materiali-lezione";

/**
 * Domande e risposte tra allievo e insegnante su una mano di un compito.
 *
 * Il commento dell'insegnante (`commenti-compito.ts`) andava in una direzione
 * sola: l'allievo che non lo capiva doveva aspettare la lezione dopo per
 * chiedere (Saccomanno con la classe, 27/10/2026). Qui si scrivono.
 *
 * UN FILO PER (compito, mano, allievo): `studentId` è l'allievo del filo,
 * `dallInsegnante` chi ha scritto. L'allievo legge solo il suo filo.
 *
 * Tabella e RPC vengono da `scripts/sql/messaggi-compito-2026-10.sql`, da
 * eseguire a mano: finché non c'è, la lettura torna `null` e la pagina non
 * mostra la conversazione.
 */
export interface MessaggioCompito {
  id: string;
  smazzataId: string;
  studentId: string;
  dallInsegnante: boolean;
  testo: string;
  creato: string;
}

/** Il messaggio più lungo che si può mandare: lo stesso limite della tabella. */
export const LUNGHEZZA_MESSAGGIO = 2000;

function daRiga(r: Record<string, unknown>): MessaggioCompito {
  return {
    id: r.id as string,
    smazzataId: r.smazzata_id as string,
    studentId: r.student_id as string,
    dallInsegnante: r.dall_insegnante === true,
    testo: r.testo as string,
    creato: r.created_at as string,
  };
}

/** `null` se la tabella non c'è ancora (script non eseguito). */
export async function messaggiDelCompito(assignmentId: string): Promise<MessaggioCompito[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messaggi_compito")
    .select("id, smazzata_id, student_id, dall_insegnante, testo, created_at")
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: true });
  if (error) {
    if (tabellaMancante(error)) return null;
    segnalaSalvoRete("messaggi-compito:leggi", error);
    return [];
  }
  return (data ?? []).map((r) => daRiga(r as Record<string, unknown>));
}

/** Manda un messaggio nel filo di `studentId`. Lancia l'errore: chi chiama lo mostra. */
export async function scriviMessaggioCompito(input: {
  assignmentId: string;
  smazzataId: string;
  studentId: string;
  testo: string;
}): Promise<MessaggioCompito> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("scrivi_messaggio_compito", {
    p_assignment_id: input.assignmentId,
    p_smazzata_id: input.smazzataId,
    p_student_id: input.studentId,
    p_testo: input.testo.trim().slice(0, LUNGHEZZA_MESSAGGIO),
  });
  if (error) throw error;
  return daRiga(data as Record<string, unknown>);
}

/** Il filo di un allievo su una mano, dal più vecchio. */
export function filoDellaMano(
  messaggi: readonly MessaggioCompito[] | null,
  smazzataId: string,
  studentId: string | null,
): MessaggioCompito[] {
  if (!messaggi || !studentId) return [];
  return messaggi.filter((m) => m.smazzataId === smazzataId && m.studentId === studentId);
}

/**
 * Il filo aspetta la risposta dell'insegnante: l'ultimo a scrivere è stato
 * l'allievo. È il segnale che l'insegnante deve vedere nella tabella.
 */
export function aspettaRisposta(filo: readonly MessaggioCompito[]): boolean {
  return filo.length > 0 && !filo[filo.length - 1].dallInsegnante;
}

/** Le domande ancora senza risposta in un compito: una voce per filo. */
export function domandeInAttesa(
  messaggi: readonly MessaggioCompito[] | null,
): { smazzataId: string; studentId: string; ultima: MessaggioCompito }[] {
  if (!messaggi) return [];
  const fili = new Map<string, MessaggioCompito[]>();
  for (const m of messaggi) {
    const k = `${m.studentId}|${m.smazzataId}`;
    fili.set(k, [...(fili.get(k) ?? []), m]);
  }
  return [...fili.values()]
    .filter(aspettaRisposta)
    .map((filo) => {
      const ultima = filo[filo.length - 1];
      return { smazzataId: ultima.smazzataId, studentId: ultima.studentId, ultima };
    })
    .sort((a, b) => a.ultima.creato.localeCompare(b.ultima.creato));
}
