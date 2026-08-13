/**
 * Bacheca del circolo: gli avvisi ai soci.
 *
 * CHI PUÒ COSA LO DECIDE IL DATABASE
 * Qui non c'è nessun controllo di permesso, ed è voluto: scrive solo chi ha
 * ruolo di istruttore (o amministratore) e il circolo giusto nel profilo,
 * legge solo chi è di quel circolo. Le regole stanno nelle policy di
 * `club_posts` (vedi `scripts/sql/bacheca-circolo-2026-08.sql`), dove nessuno
 * può aggirarle cambiando quello che il browser manda.
 *
 * `puoScrivere()` serve solo a decidere se MOSTRARE il modulo: se sbagliasse,
 * comparirebbe un modulo che poi il database rifiuta — fastidioso, non
 * pericoloso.
 */

import { createClient } from "@/lib/supabase/client";
import { reportError } from "./report-error";

export interface ClubPost {
  id: string;
  asd_code: string;
  author_id: string;
  titolo: string;
  corpo: string;
  created_at: string;
  /** Nome dell'autore, quando disponibile. */
  autore?: string | null;
}

/** Gli avvisi di un circolo, dal più recente. */
export async function getClubPosts(asdCode: string, limite = 20): Promise<ClubPost[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("club_posts")
      .select("id, asd_code, author_id, titolo, corpo, created_at, profiles(display_name)")
      .eq("asd_code", asdCode)
      .order("created_at", { ascending: false })
      .limit(limite);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      asd_code: r.asd_code as string,
      author_id: r.author_id as string,
      titolo: r.titolo as string,
      corpo: r.corpo as string,
      created_at: r.created_at as string,
      autore: (r.profiles as { display_name?: string } | null)?.display_name ?? null,
    }));
  } catch (err) {
    reportError("bacheca:leggi", err);
    return [];
  }
}

/** Vero se chi guarda può pubblicare per questo circolo. */
export async function puoScrivere(asdCode: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("can_post_for_asd", { p_asd_code: asdCode });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Pubblica un avviso. Il database rifiuta se chi scrive non ne ha diritto. */
export async function pubblicaAvviso(input: {
  asdCode: string;
  titolo: string;
  corpo: string;
}): Promise<{ ok: boolean; errore?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, errore: "Devi accedere." };

    const { error } = await supabase.from("club_posts").insert({
      asd_code: input.asdCode,
      author_id: user.id,
      titolo: input.titolo.trim(),
      corpo: input.corpo.trim(),
    });
    if (error) {
      reportError("bacheca:pubblica", error);
      return { ok: false, errore: "Non è stato possibile pubblicare l'avviso." };
    }
    return { ok: true };
  } catch (err) {
    reportError("bacheca:pubblica", err);
    return { ok: false, errore: "Non è stato possibile pubblicare l'avviso." };
  }
}

/** Cancella un avviso: l'autore, o un amministratore. */
export async function cancellaAvviso(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("club_posts").delete().eq("id", id);
    if (error) {
      reportError("bacheca:cancella", error);
      return false;
    }
    return true;
  } catch (err) {
    reportError("bacheca:cancella", err);
    return false;
  }
}
