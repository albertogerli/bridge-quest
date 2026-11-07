/**
 * Segnalare un contenuto e bloccare un utente, nel forum e nella chat di
 * classe. Le tabelle sono in `scripts/sql/moderazione-contenuti-2026-11.sql`.
 *
 * Il blocco è solo dalla parte di chi blocca: smette di vedere l'altro, e
 * l'altro non lo sa. La segnalazione va all'amministratore, che può togliere
 * il contenuto.
 */

import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { tabellaMancante } from "@/lib/materiali-lezione";

export type TipoContenuto = "forum_post" | "forum_commento" | "messaggio_classe";
export type MotivoSegnalazione = "offensivo" | "spam" | "inappropriato" | "altro";

export const MOTIVI: { valore: MotivoSegnalazione; etichetta: string }[] = [
  { valore: "offensivo", etichetta: "Offensivo o molesto" },
  { valore: "inappropriato", etichetta: "Contenuto inappropriato" },
  { valore: "spam", etichetta: "Pubblicità o spam" },
  { valore: "altro", etichetta: "Altro" },
];

export interface ContenutoSegnalabile {
  tipo: TipoContenuto;
  id: string | number;
  /** Il post per un commento, la classe per un messaggio. */
  contenitoreId?: string | number | null;
  autoreId: string;
  testo: string;
}

export async function segnalaContenuto(
  c: ContenutoSegnalabile,
  motivo: MotivoSegnalazione,
  nota: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("segnalazioni_contenuti").insert({
    tipo: c.tipo,
    contenuto_id: String(c.id),
    contenitore_id: c.contenitoreId == null ? null : String(c.contenitoreId),
    autore_id: c.autoreId,
    testo: c.testo.slice(0, 20000),
    motivo,
    nota: nota.trim().slice(0, 1000) || null,
  });
  if (error) {
    segnalaSalvoRete("moderazione:segnala", error);
    return false;
  }
  return true;
}

/** Gli id che l'utente ha bloccato. Vuoto se non letti: meglio mostrare tutto che niente. */
export async function elencaBloccati(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("utenti_bloccati").select("bloccato_id");
  if (error) {
    if (!tabellaMancante(error)) segnalaSalvoRete("moderazione:bloccati", error);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.bloccato_id as string));
}

export async function bloccaUtente(id: string): Promise<boolean> {
  const supabase = createClient();
  // Senza `.select()`: la riga esiste già se si blocca due volte, e va bene così.
  const { error } = await supabase.from("utenti_bloccati").insert({ bloccato_id: id });
  if (error && error.code !== "23505") {
    segnalaSalvoRete("moderazione:blocca", error);
    return false;
  }
  avvisaCambioBlocchi();
  return true;
}

export async function sbloccaUtente(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("utenti_bloccati").delete().eq("bloccato_id", id);
  if (error) {
    segnalaSalvoRete("moderazione:sblocca", error);
    return false;
  }
  avvisaCambioBlocchi();
  return true;
}

/** Il forum e la chat aperti in altre parti della pagina rileggono i blocchi. */
export const EVENTO_BLOCCHI = "bq_blocchi_cambiati";
function avvisaCambioBlocchi() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_BLOCCHI));
}
