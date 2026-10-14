/**
 * Lettura e scrittura di `materiali_lezione`. La logica pura (stati, ordine,
 * raggruppamento, controllo dell'indirizzo) sta in `materiali-lezione.ts`.
 *
 * SI DEGRADA IN SILENZIO. La tabella arriva con
 * `scripts/sql/materiali-lezione-2026-10.sql`, che si esegue a mano: finché
 * non c'è, l'insegnante legge «in attivazione» e l'allievo non vede niente.
 * Il segnale è la tabella mancante (PGRST205), non un difetto: non va in
 * Sentry. Ogni altro errore sì.
 *
 * CHI VEDE COSA lo decide il database (RLS), non questo file: l'allievo
 * riceve solo i materiali già usciti anche se chiede tutto. Il filtro sulla
 * data nella lettura dell'allievo è una cortesia, non la difesa.
 */

import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { tabellaMancante, type MaterialeLezione, type TipoMateriale } from "@/lib/materiali-lezione";

const COLONNE = "id, class_id, lesson_id, lezione, tipo, titolo, url, ordine, pubblica_dal, created_at";

/** Per l'insegnante: tutto, anche nascosto e programmato. `disponibile` falso = tabella non ancora creata. */
export async function materialiDellaClasse(
  classId: string,
): Promise<{ disponibile: boolean; materiali: MaterialeLezione[] }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materiali_lezione")
    .select(COLONNE)
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  if (error) {
    if (tabellaMancante(error)) return { disponibile: false, materiali: [] };
    throw error;
  }
  return { disponibile: true, materiali: (data ?? []) as MaterialeLezione[] };
}

/**
 * Per l'allievo: solo i materiali già usciti.
 *
 * Non lancia mai: un errore qui non deve togliere all'allievo i compiti e la
 * chat che stanno nella stessa pagina. Si segnala e si mostra niente.
 */
export async function materialiPubblicati(classId: string): Promise<MaterialeLezione[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("materiali_lezione")
      .select(COLONNE)
      .eq("class_id", classId)
      .not("pubblica_dal", "is", null)
      .lte("pubblica_dal", new Date().toISOString());
    if (error) {
      if (!tabellaMancante(error)) segnalaSalvoRete("materiali-lezione:allievo", error);
      return [];
    }
    return (data ?? []) as MaterialeLezione[];
  } catch (err) {
    segnalaSalvoRete("materiali-lezione:allievo", err);
    return [];
  }
}

export interface DatiMateriale {
  lesson_id: string | null;
  lezione: string;
  tipo: TipoMateriale;
  titolo: string;
  url: string;
  ordine: number;
}

export async function creaMateriale(
  classId: string,
  dati: DatiMateriale,
  pubblicaDal: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("materiali_lezione")
    .insert({ class_id: classId, ...dati, pubblica_dal: pubblicaDal });
  if (error) throw error;
}

export async function aggiornaMateriale(id: string, dati: DatiMateriale): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("materiali_lezione").update(dati).eq("id", id);
  if (error) throw error;
}

/**
 * Pubblica (adesso), programma (data futura) o nasconde (null).
 *
 * «Adesso» è l'ora del computer dell'insegnante: se è avanti di qualche
 * minuto, il materiale esce qualche minuto dopo. È un difetto accettabile
 * rispetto a una funzione SQL in più solo per leggere `now()`.
 */
export async function impostaPubblicazione(id: string, pubblicaDal: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("materiali_lezione")
    .update({ pubblica_dal: pubblicaDal })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminaMateriale(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("materiali_lezione").delete().eq("id", id);
  if (error) throw error;
}
