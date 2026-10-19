import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";

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
  /**
   * Sei cifre da dettare in aula, per chi non sa inquadrare il QR. Assente
   * finché non è eseguito `scripts/sql/codice-aula-2026-10.sql`, e sugli inviti
   * creati prima.
   */
  codice?: string | null;
  /** Chi l'ha creato. La tabella ce l'ha e le letture `select("*")` lo portano. */
  creato_da: string | null;
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
    segnalaSalvoRete("inviti:leggi", error);
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

  const riga: Record<string, unknown> = {
    class_id: classId,
    token: nuovoToken(),
    creato_da: user.id,
    scade_il: opzioni?.scadeIl ?? fineGiornata(),
    max_ospiti: opzioni?.maxOspiti ?? 40,
  };
  const codice = await codiceLibero();
  let { data, error } = await supabase
    .from("inviti_aula")
    .insert(codice ? { ...riga, codice } : riga)
    .select()
    .single();
  // Colonna non ancora creata (script da eseguire a mano): l'invito nasce
  // senza codice, come prima, invece di non nascere affatto.
  if (error && codice && colonnaMancante(error)) {
    ({ data, error } = await supabase.from("inviti_aula").insert(riga).select().single());
  }
  if (error) {
    segnalaSalvoRete("inviti:crea", error);
    return null;
  }
  return data as InvitoAula;
}

/** Sei cifre a caso. Lo zero iniziale è ammesso: è testo, non un numero. */
export function nuovoCodice(): string {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return String(b[0] % 1_000_000).padStart(6, "0");
}

/**
 * Un codice che nessun invito ancora valido sta usando. Si controlla fra quelli
 * visibili all'insegnante: due insegnanti diversi con lo stesso codice nello
 * stesso giorno sono un caso su centinaia di migliaia, e la rotta che risolve
 * il codice prende comunque il più recente.
 */
async function codiceLibero(): Promise<string | null> {
  const supabase = createClient();
  for (let tentativo = 0; tentativo < 5; tentativo++) {
    const codice = nuovoCodice();
    const { data, error } = await supabase
      .from("inviti_aula")
      .select("id")
      .eq("codice", codice)
      .eq("revocato", false)
      .gt("scade_il", new Date().toISOString())
      .limit(1);
    if (error) return colonnaMancante(error) ? null : codice;
    if (!data || data.length === 0) return codice;
  }
  return null;
}

function colonnaMancante(error: { code?: string; message?: string }): boolean {
  return error.code === "42703" || error.code === "PGRST204" || /codice/.test(error.message ?? "");
}

export async function revocaInvito(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("inviti_aula").update({ revocato: true }).eq("id", id);
  if (error) segnalaSalvoRete("inviti:revoca", error);
  return !error;
}

export function indirizzoAula(token: string, sito?: string): string {
  const base = (sito || process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(
    /\/$/,
    "",
  );
  return `${base}/aula/${token}`;
}
