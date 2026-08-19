import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * Gli inviti d'aula: il link con cui si entra senza registrarsi.
 *
 * A SCADENZA E REVOCABILE, e non è formalismo. Un link che entra in una classe
 * senza chiedere niente, se resta valido per sempre, prima o poi gira: finisce
 * in un gruppo sbagliato, o su un foglio dimenticato in sala. La scadenza
 * predefinita è la fine della giornata perché la lezione è quella — chi vuole
 * di più lo allunga, ma deve deciderlo.
 *
 * IL GETTONE È IN CHIARO NEL DATABASE. È una scelta, non una dimenticanza:
 * quello che protegge è una classe di bridge per qualche ora, e il costo di
 * conservarne solo l'impronta sarebbe non poterlo più ristampare su una
 * locandina — che è proprio l'uso previsto.
 */

export interface InvitoAula {
  id: string;
  class_id: string;
  token: string;
  scade_il: string;
  revocato: boolean;
  max_ospiti: number;
  created_at: string;
}

/** Fine giornata di oggi: la durata di una lezione, non di più. */
function fineGiornata(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

/**
 * Un gettone lungo e casuale.
 *
 * `crypto.getRandomValues` e non `Math.random`: quest'ultimo è prevedibile, e
 * un gettone prevedibile è un gettone che si indovina — con 40 posti liberi in
 * aula, indovinarne uno basta.
 */
function nuovoToken(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, "0")).join("").slice(0, 40);
}

export async function invitoAttivo(classId: string): Promise<InvitoAula | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inviti_aula")
    .select("*")
    .eq("class_id", classId)
    .eq("revocato", false)
    .gt("scade_il", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    reportError("inviti:leggi", error);
    return null;
  }
  return (data as InvitoAula) ?? null;
}

export async function creaInvito(
  classId: string,
  opzioni?: { scadeIl?: string; maxOspiti?: number },
): Promise<InvitoAula | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("inviti_aula")
    .insert({
      class_id: classId,
      token: nuovoToken(),
      creato_da: user.id,
      scade_il: opzioni?.scadeIl ?? fineGiornata(),
      max_ospiti: opzioni?.maxOspiti ?? 40,
    })
    .select()
    .single();
  if (error) {
    reportError("inviti:crea", error);
    return null;
  }
  return data as InvitoAula;
}

export async function revocaInvito(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("inviti_aula").update({ revocato: true }).eq("id", id);
  if (error) reportError("inviti:revoca", error);
  return !error;
}

export function indirizzoAula(token: string, sito?: string): string {
  const base = (sito || process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(
    /\/$/,
    "",
  );
  return `${base}/aula/${token}`;
}
