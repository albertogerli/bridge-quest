import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { tabellaMancante } from "@/lib/materiali-lezione";

/**
 * Le mani su cui l'insegnante ha scritto qualcosa che l'allievo non ha ancora visto.
 *
 * PERCHÉ. Il commento dell'insegnante e la sua risposta a una domanda stavano
 * dentro il compito, e l'allievo li trovava solo se ci tornava per caso
 * (insegnante, 03/11/2026: «quando mando i messaggi sulle mani dichiarate è
 * possibile far arrivare una notifica all'allievo?»). Per ora l'avviso è nel
 * sito: sulla home e sulle mani del compito. Le email sono un passo dopo.
 *
 * DOVE SI RICORDA COSA È STATO VISTO: nel browser, per compito. Niente tabella
 * nuova da far eseguire: il prezzo è che su un secondo dispositivo le novità
 * già lette ricompaiono una volta, finché non si apre il compito. Si salva il
 * momento dell'ultima cosa vista, non l'ora del dispositivo: un orologio
 * sbagliato non deve nascondere un commento.
 */

/** Una cosa scritta dall'insegnante su una mano: commento o risposta. */
export interface ScrittoInsegnante {
  smazzataId: string;
  /** ISO: `updated_at` del commento o `created_at` del messaggio. */
  quando: string;
}

const CHIAVE = (assignmentId: string) => `bq_letto_compito:${assignmentId}`;

/** Fin dove l'allievo ha letto in questo compito; `null` se non l'ha mai aperto da qui. */
export function vistoFinoA(assignmentId: string): string | null {
  try {
    return localStorage.getItem(CHIAVE(assignmentId));
  } catch {
    return null;
  }
}

/** Segna come visto tutto ciò che è stato scritto fino all'ultima di queste cose. */
export function segnaVisto(assignmentId: string, scritti: readonly ScrittoInsegnante[]): void {
  const ultima = ultimoMomento(scritti);
  if (!ultima) return;
  const prima = vistoFinoA(assignmentId);
  if (prima && prima >= ultima) return;
  try {
    localStorage.setItem(CHIAVE(assignmentId), ultima);
  } catch {}
}

export function ultimoMomento(scritti: readonly ScrittoInsegnante[]): string | null {
  return scritti.reduce<string | null>((m, s) => (m === null || s.quando > m ? s.quando : m), null);
}

/**
 * Da commenti e messaggi, quello che l'insegnante ha scritto per questo allievo:
 * i commenti per lui e quelli per tutta la classe, le risposte nel suo filo.
 */
export function scrittiPerAllievo(
  commenti: readonly { smazzataId: string; studentId: string | null; aggiornato: string }[],
  messaggi: readonly { smazzataId: string; studentId: string; dallInsegnante: boolean; creato: string }[],
  studentId: string,
): ScrittoInsegnante[] {
  return [
    ...commenti
      .filter((c) => c.studentId === null || c.studentId === studentId)
      .map((c) => ({ smazzataId: c.smazzataId, quando: c.aggiornato })),
    ...messaggi
      .filter((m) => m.dallInsegnante && m.studentId === studentId)
      .map((m) => ({ smazzataId: m.smazzataId, quando: m.creato })),
  ];
}

/** Le mani con qualcosa di nuovo, nell'ordine in cui compaiono la prima volta. */
export function maniConNovita(scritti: readonly ScrittoInsegnante[], visto: string | null): string[] {
  const mani: string[] = [];
  for (const s of scritti) {
    if (visto !== null && s.quando <= visto) continue;
    if (!mani.includes(s.smazzataId)) mani.push(s.smazzataId);
  }
  return mani;
}

/**
 * Per la home: in quali compiti ci sono novità, e su quante mani.
 * Due letture in tutto, qualunque sia il numero dei compiti.
 */
export async function novitaDeiCompiti(
  assignmentIds: readonly string[],
  studentId: string,
): Promise<Map<string, string[]>> {
  const novita = new Map<string, string[]>();
  if (assignmentIds.length === 0) return novita;
  const supabase = createClient();
  const [c, m] = await Promise.all([
    supabase
      .from("commenti_compito")
      .select("assignment_id, smazzata_id, student_id, updated_at")
      .in("assignment_id", [...assignmentIds]),
    supabase
      .from("messaggi_compito")
      .select("assignment_id, smazzata_id, student_id, dall_insegnante, created_at")
      .in("assignment_id", [...assignmentIds])
      .eq("dall_insegnante", true),
  ]);
  for (const r of [c, m]) {
    if (r.error && !tabellaMancante(r.error)) segnalaSalvoRete("novita-insegnante:leggi", r.error);
  }
  type Riga = Record<string, unknown>;
  const commenti = ((c.error ? [] : c.data) ?? []) as Riga[];
  const messaggi = ((m.error ? [] : m.data) ?? []) as Riga[];
  for (const id of assignmentIds) {
    const scritti = scrittiPerAllievo(
      commenti
        .filter((r) => r.assignment_id === id)
        .map((r) => ({
          smazzataId: r.smazzata_id as string,
          studentId: (r.student_id as string | null) ?? null,
          aggiornato: r.updated_at as string,
        })),
      messaggi
        .filter((r) => r.assignment_id === id)
        .map((r) => ({
          smazzataId: r.smazzata_id as string,
          studentId: r.student_id as string,
          dallInsegnante: r.dall_insegnante === true,
          creato: r.created_at as string,
        })),
      studentId,
    );
    const mani = maniConNovita(scritti, vistoFinoA(id));
    if (mani.length > 0) novita.set(id, mani);
  }
  return novita;
}
