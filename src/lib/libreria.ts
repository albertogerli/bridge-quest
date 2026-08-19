import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import { salvaModello } from "@/lib/modelli-mani";
import type { DealConstraints } from "@/lib/deal-generator";

/**
 * La libreria federale: il lavoro di pochi diventa materiale di tutti.
 *
 * PERCHÉ. Gli insegnanti che preparano materiale sono una minoranza, e quello
 * che preparano oggi muore nel loro portatile. Chi apre il portale per la prima
 * volta la sera della prima lezione non ha niente, e non ha nemmeno il tempo di
 * costruirselo: se non trova qualcosa di pronto per l'argomento del giorno,
 * chiude.
 *
 * SI IMPORTA UNA COPIA, MAI UN RIFERIMENTO. Chi importa può cambiare senza
 * toccare l'originale, e — soprattutto — l'originale non gli cambia sotto i
 * piedi la sera della lezione perché l'autore l'ha ritoccato. È la stessa
 * ragione per cui i modelli si duplicano invece di collegarsi.
 *
 * PASSA DA UN'APPROVAZIONE, e non è burocrazia: è materiale che porta il nome
 * della federazione e finisce davanti a classi di principianti. Un curatore lo
 * guarda prima. Serve anche per la responsabilità sui contenuti, che con la
 * pubblicazione libera resterebbe di nessuno.
 *
 * IL CONTATORE DI UTILIZZI È PER L'AUTORE, ed è la sola cosa che tiene viva una
 * libreria di questo tipo: sapere che il proprio set è stato usato in
 * diciassette corsi è il motivo per cui se ne prepara un altro.
 */

export type TipoVoce = "modello" | "smazzate" | "esercizi";
export type StatoVoce = "in-attesa" | "approvato" | "rifiutato";

export const ETICHETTE_TIPO: Record<TipoVoce, string> = {
  modello: "Modello di generazione",
  smazzate: "Set di smazzate",
  esercizi: "Raccolta di esercizi",
};

export interface VoceLibreria {
  id: string;
  autore_id: string | null;
  tipo: TipoVoce;
  titolo: string;
  descrizione: string | null;
  livello: string | null;
  argomento: string | null;
  lesson_id: number | null;
  contenuto: unknown;
  stato: StatoVoce;
  nota_curatore: string | null;
  usi: number;
  created_at: string;
}

export async function cerca(filtri?: {
  lessonId?: number | null;
  tipo?: TipoVoce | null;
  testo?: string;
}): Promise<VoceLibreria[]> {
  const supabase = createClient();
  let q = supabase
    .from("libreria")
    .select("*")
    .eq("stato", "approvato")
    .order("usi", { ascending: false })
    .limit(100);

  if (filtri?.lessonId != null) q = q.eq("lesson_id", filtri.lessonId);
  if (filtri?.tipo) q = q.eq("tipo", filtri.tipo);
  // La ricerca testuale sta su titolo e descrizione: l'argomento è già un
  // filtro a sé, e cercare dentro il contenuto vorrebbe dire cercare dentro un
  // jsonb di vincoli, che non è testo che qualcuno scriverebbe.
  if (filtri?.testo?.trim()) {
    const t = filtri.testo.trim();
    q = q.or(`titolo.ilike.%${t}%,descrizione.ilike.%${t}%`);
  }

  const { data, error } = await q;
  if (error) {
    reportError("libreria:cerca", error);
    return [];
  }
  return (data ?? []) as VoceLibreria[];
}

export async function proponi(input: {
  tipo: TipoVoce;
  titolo: string;
  descrizione?: string | null;
  livello?: string | null;
  argomento?: string | null;
  lessonId?: number | null;
  contenuto: unknown;
}): Promise<VoceLibreria | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("libreria")
    .insert({
      autore_id: user.id,
      tipo: input.tipo,
      titolo: input.titolo.trim().slice(0, 140),
      descrizione: input.descrizione?.trim().slice(0, 800) ?? null,
      livello: input.livello ?? null,
      argomento: input.argomento ?? null,
      lesson_id: input.lessonId ?? null,
      contenuto: input.contenuto,
      stato: "in-attesa",
    })
    .select()
    .single();
  if (error) {
    reportError("libreria:proponi", error);
    return null;
  }
  return data as VoceLibreria;
}

/** Le proposte da guardare. Solo per curatori e amministratori. */
export async function daModerare(): Promise<VoceLibreria[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("libreria")
    .select("*")
    .eq("stato", "in-attesa")
    .order("created_at", { ascending: true });
  if (error) {
    reportError("libreria:modera", error);
    return [];
  }
  return (data ?? []) as VoceLibreria[];
}

export async function decidi(
  id: string,
  stato: "approvato" | "rifiutato",
  nota?: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("libreria")
    .update({ stato, nota_curatore: nota ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("libreria:decidi", error);
  return !error;
}

/**
 * Porta una voce nella propria area.
 *
 * Per ora sa importare i MODELLI, che è il tipo che ha già una destinazione:
 * diventano un modello personale, modificabile. Set di smazzate e raccolte di
 * esercizi si pubblicano e si consultano, ma la loro importazione arriverà con
 * la stessa forma — una copia, mai un riferimento.
 */
export async function importa(v: VoceLibreria): Promise<boolean> {
  if (v.tipo !== "modello") return false;
  const salvato = await salvaModello({
    nome: v.titolo,
    descrizione: v.descrizione,
    vincoli: v.contenuto as DealConstraints,
  });
  if (!salvato) return false;

  // Il contatore lo alza una funzione: l'autore della copia non ha il permesso
  // di scrivere sulla riga altrui, ed è proprio quella che deve cambiare.
  const supabase = createClient();
  const { error } = await supabase.rpc("libreria_segna_uso", { p_id: v.id });
  if (error) reportError("libreria:uso", error);
  return true;
}

/** Le proprie voci, con quante volte sono state usate. */
export async function mieVoci(): Promise<VoceLibreria[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("libreria")
    .select("*")
    .eq("autore_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    reportError("libreria:mie", error);
    return [];
  }
  return (data ?? []) as VoceLibreria[];
}
