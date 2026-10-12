import { createClient } from "@/lib/supabase/client";
import { statoMiaIscrizione, type MemberStatus } from "@/lib/instructors";

/**
 * Come sta l'allievo in una classe, e come si chiama la classe.
 *
 * PERCHÉ. La pagina della classe prendeva nome e compiti dall'elenco delle
 * classi ATTIVE. Chi aveva appena inserito il codice ed era in attesa
 * dell'insegnante apriva la classe e trovava: titolo «Classe», «il tuo
 * istruttore non ha ancora assegnato compiti» (i compiti c'erano, ma le RLS
 * li mostrano solo agli iscritti attivi) e «Errore nel caricamento della
 * classifica». Tre messaggi sbagliati invece di uno giusto: «sei in attesa»
 * (feedback Trevissoi del 12/10/2026).
 *
 * Il nome si legge da `classes`, che la policy concede anche a chi è in
 * attesa (`is_pending_of_class`).
 */
export interface StatoClasseAllievo {
  stato: MemberStatus | null;
  nome: string | null;
}

export async function statoClasseAllievo(classId: string): Promise<StatoClasseAllievo> {
  const stato = await statoMiaIscrizione(classId);
  if (stato === null) return { stato, nome: null };
  const supabase = createClient();
  const { data, error } = await supabase.from("classes").select("name").eq("id", classId).maybeSingle();
  if (error) throw error;
  return { stato, nome: (data?.name as string | undefined) ?? null };
}
