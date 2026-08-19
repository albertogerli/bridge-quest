import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * La nota che un insegnante allega a una smazzata.
 *
 * SEGUE LA MANO, NON IL COMPITO. È la differenza che la rende utile: la nota
 * scritta l'anno scorso su «1-4» ricompare quest'anno, in un'altra classe,
 * senza che nessuno la cerchi. Legarla al compito vorrebbe dire riscriverla a
 * ogni corso — cioè non scriverla.
 *
 * È DELL'AUTORE, non della smazzata. Due insegnanti che usano la stessa mano
 * hanno due note diverse, e va bene: la nota è come la spiega lui, non cos'è la
 * mano. Per quello c'è già il commento del catalogo.
 */

export interface NotaSmazzata {
  smazzata_id: string;
  testo: string;
  updated_at: string;
}

export async function mieNote(ids: string[]): Promise<Map<string, string>> {
  const esito = new Map<string, string>();
  if (ids.length === 0) return esito;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return esito;

  const { data, error } = await supabase
    .from("note_smazzate")
    .select("smazzata_id, testo")
    .eq("autore_id", user.id)
    .in("smazzata_id", ids);
  if (error) {
    reportError("note:leggi", error);
    return esito;
  }
  for (const r of (data ?? []) as NotaSmazzata[]) esito.set(r.smazzata_id, r.testo);
  return esito;
}

/** Salva o cancella: una nota vuota si toglie invece di restare come riga vuota. */
export async function salvaNota(smazzataId: string, testo: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const pulito = testo.trim();
  if (!pulito) {
    const { error } = await supabase
      .from("note_smazzate")
      .delete()
      .eq("autore_id", user.id)
      .eq("smazzata_id", smazzataId);
    if (error) reportError("note:cancella", error);
    return !error;
  }

  const { error } = await supabase.from("note_smazzate").upsert({
    autore_id: user.id,
    smazzata_id: smazzataId,
    testo: pulito.slice(0, 4000),
    updated_at: new Date().toISOString(),
  });
  if (error) reportError("note:salva", error);
  return !error;
}

/**
 * Le scorciatoie per i semi.
 *
 * Sulla tastiera italiana i simboli dei semi non ci sono, e un insegnante che
 * scrive «picche» dieci volte per riga smette di scrivere note. Si digita `!s`
 * e diventa ♠: sono due caratteri, e si imparano in una nota sola.
 */
export const SCORCIATOIE: { da: string; a: string }[] = [
  { da: "!s", a: "♠" },
  { da: "!h", a: "♥" },
  { da: "!d", a: "♦" },
  { da: "!c", a: "♣" },
  { da: "!p", a: "♠" },
  { da: "!q", a: "♦" },
  { da: "!f", a: "♣" },
];

export function espandiSemi(testo: string): string {
  let fuori = testo;
  for (const s of SCORCIATOIE) fuori = fuori.split(s.da).join(s.a);
  return fuori;
}
