import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import type { DealConstraints } from "@/lib/deal-generator";

/**
 * I modelli di generazione: quelli ufficiali, i propri, quelli condivisi.
 *
 * IL MOTORE C'ERA GIÀ. `deal-generator.ts` accetta vincoli molto più espressivi
 * di quanto serva — punti per mano e per linea, lunghezze, sagome, cortezze,
 * qualità dei colori, alternative in OR. Quello che mancava era il modo di
 * SALVARE un vincolo e ritrovarlo: senza, ogni volta si riparte da un elenco
 * fisso di sette modelli scritti nel codice.
 *
 * COPIA, NON RIFERIMENTO. Chi importa un modello altrui se ne prende una copia
 * e la può cambiare senza toccare l'originale. È l'unica forma che regge nel
 * tempo: un riferimento vivo vuol dire che il modello ti cambia sotto i piedi
 * la sera della lezione, perché qualcun altro l'ha ritoccato.
 */

export interface ModelloMani {
  id: string;
  nome: string;
  descrizione: string | null;
  vincoli: DealConstraints;
  autore_id: string | null;
  ufficiale: boolean;
  condiviso: boolean;
  lesson_id: number | null;
  usi: number;
  created_at: string;
}

/** Tutti i modelli che chi guarda ha diritto di vedere: propri, ufficiali, condivisi. */
export async function elencaModelli(): Promise<ModelloMani[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("modelli_mani")
    .select("*")
    // Prima gli ufficiali, che sono l'unica cosa utile al primo accesso, e
    // dentro quelli l'ordine delle lezioni: è l'ordine in cui si insegna.
    .order("ufficiale", { ascending: false })
    .order("lesson_id", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    reportError("modelli:elenca", error);
    return [];
  }
  return (data ?? []) as ModelloMani[];
}

export async function salvaModello(input: {
  nome: string;
  descrizione?: string | null;
  vincoli: DealConstraints;
  condiviso?: boolean;
}): Promise<ModelloMani | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("modelli_mani")
    .insert({
      nome: input.nome.trim().slice(0, 120),
      descrizione: input.descrizione?.trim().slice(0, 500) ?? null,
      vincoli: input.vincoli,
      autore_id: user.id,
      condiviso: input.condiviso ?? false,
    })
    .select()
    .single();
  if (error) {
    reportError("modelli:salva", error);
    return null;
  }
  return data as ModelloMani;
}

export async function rinominaModello(id: string, nome: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("modelli_mani")
    .update({ nome: nome.trim().slice(0, 120), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("modelli:rinomina", error);
  return !error;
}

export async function condividiModello(id: string, condiviso: boolean): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("modelli_mani")
    .update({ condiviso, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("modelli:condividi", error);
  return !error;
}

export async function eliminaModello(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("modelli_mani").delete().eq("id", id);
  if (error) reportError("modelli:elimina", error);
  return !error;
}

/**
 * Duplica un modello nella propria libreria.
 *
 * Serve sia per «parto da quello ufficiale e lo ritocco» sia per importare
 * quello di un collega. In entrambi i casi nasce una riga nuova: la copia è il
 * punto, non un effetto collaterale.
 */
export async function duplicaModello(m: ModelloMani, nome?: string): Promise<ModelloMani | null> {
  return salvaModello({
    nome: nome ?? `${m.nome} (copia)`,
    descrizione: m.descrizione,
    vincoli: m.vincoli,
  });
}
