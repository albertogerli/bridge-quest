/**
 * Più insegnanti nella stessa classe (16/11/2026): il titolare è chi l'ha
 * creata, i colleghi si aggiungono per email e fanno tutto tranne eliminare
 * la classe e scegliere gli altri insegnanti. Il database decide: qui ci sono
 * solo le chiamate (`scripts/sql/co-insegnanti-2026-11.sql`).
 */
import { createClient } from "@/lib/supabase/client";

export interface InsegnanteClasse {
  id: string;
  nome: string | null;
  email: string | null;
  titolare: boolean;
}

/** Perché un collega non è stato aggiunto: si dice all'insegnante, non si nasconde. */
export type MotivoRifiuto = "non-trovato" | "e-il-titolare" | "non-titolare" | "rete";

export class InsegnanteNonAggiunto extends Error {
  constructor(readonly motivo: MotivoRifiuto, cause?: unknown) {
    super(motivo, { cause });
  }
}

export async function insegnantiDellaClasse(classId: string): Promise<InsegnanteClasse[]> {
  const { data, error } = await createClient().rpc("insegnanti_della_classe", { p_class_id: classId });
  if (error) throw error;
  return ((data ?? []) as { insegnante_id: string; nome: string | null; email: string | null; titolare: boolean }[]).map(
    (r) => ({ id: r.insegnante_id, nome: r.nome, email: r.email, titolare: r.titolare }),
  );
}

export async function aggiungiInsegnante(classId: string, email: string): Promise<void> {
  const { error } = await createClient().rpc("aggiungi_insegnante_classe", {
    p_class_id: classId,
    p_email: email.trim(),
  });
  if (!error) return;
  if (error.code === "PT404") throw new InsegnanteNonAggiunto("non-trovato", error);
  if (error.code === "PT409") throw new InsegnanteNonAggiunto("e-il-titolare", error);
  if (error.code === "42501") throw new InsegnanteNonAggiunto("non-titolare", error);
  throw new InsegnanteNonAggiunto("rete", error);
}

/** Il titolare toglie un collega; un collega può togliere sé stesso. */
export async function togliInsegnante(classId: string, insegnanteId: string): Promise<void> {
  const { error } = await createClient().rpc("togli_insegnante_classe", {
    p_class_id: classId,
    p_insegnante_id: insegnanteId,
  });
  if (error) throw error;
}
