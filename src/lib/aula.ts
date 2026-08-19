import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import type { Card, Position } from "@/lib/bridge-engine";

/**
 * L'aula multi-tavolo: una lezione con tre-sei tavoli e una console sola.
 *
 * PERCHÉ NON BASTAVANO I TAVOLI CHE C'ERANO. Il tavolo condiviso è uno, e
 * l'insegnante lo governa guardandolo. In circolo la lezione ha dodici-ventiquattro
 * allievi su più tavoli: senza il concetto di aula, l'insegnante dovrebbe aprire
 * sei tavoli scollegati e ricordarsi a che punto è ognuno.
 *
 * ----------------------------------------------------------------------------
 * QUELLO CHE HO MISURATO, E QUELLO CHE NON HO POTUTO MISURARE
 * ----------------------------------------------------------------------------
 *
 * Misurato sul database di produzione, il 19/08/2026:
 *
 *   aprire una sessione da 40 tavoli          13 ms
 *   distribuire la stessa mano a 40 tavoli     3 ms
 *   leggere lo stato di 40 tavoli              2 ms
 *   160 letture di `live_table_view`          30 ms in tutto, 0,19 ms l'una
 *
 * Sono numeri comodi, e il motivo è che la distribuzione è UNA sola `update`
 * su quaranta righe invece di quaranta chiamate dal client. Fatta dal browser,
 * sarebbero quaranta andate e ritorni — cioè la differenza fra «la classe vede
 * la mano insieme» e «la vede a scaglioni».
 *
 * NON HO MISURATO 160 BROWSER VERI COLLEGATI INSIEME. Le 160 letture sono in
 * fila, non simultanee, e non dicono niente sul limite di connessioni Realtime
 * di Supabase né sulla banda di una sala con il wi-fi del circolo — che sono i
 * due limiti che in aula si incontrano per primi. Dichiararlo provato sarebbe
 * falso: quel numero si scopre alla prima lezione con quaranta tavoli veri, e
 * il polling di riserva ogni cinque secondi che il tavolo già ha è la rete
 * messa lì apposta per quel giorno.
 */

export interface StatoTavolo {
  tavolo_id: string;
  numero: number;
  titolo: string | null;
  carte_giocate: number;
  posti_assegnati: number;
  aggiornato: string;
}

export async function apriAula(
  classId: string,
  tavoli: number,
  titolo?: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_apri", {
    p_class_id: classId,
    p_tavoli: tavoli,
    p_titolo: titolo ?? null,
  });
  if (error) {
    reportError("aula:apri", error);
    return null;
  }
  return data as string;
}

export async function distribuisciATutti(
  sessioneId: string,
  hands: Record<Position, Card[]>,
  opzioni?: { titolo?: string; contract?: string | null; declarer?: Position | null },
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_distribuisci", {
    p_sessione_id: sessioneId,
    p_hands: hands,
    p_titolo: opzioni?.titolo ?? null,
    p_contract: opzioni?.contract ?? null,
    p_declarer: opzioni?.declarer ?? null,
  });
  if (error) {
    reportError("aula:distribuisci", error);
    return 0;
  }
  return (data as number) ?? 0;
}

export async function statoAula(sessioneId: string): Promise<StatoTavolo[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_stato", { p_sessione_id: sessioneId });
  if (error) {
    reportError("aula:stato", error);
    return [];
  }
  return (data ?? []) as StatoTavolo[];
}

export async function chiudiAula(sessioneId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.rpc("aula_chiudi", { p_sessione_id: sessioneId });
  if (error) reportError("aula:chiudi", error);
  return !error;
}

export interface SessioneAula {
  id: string;
  class_id: string;
  titolo: string | null;
  stato: "aperta" | "chiusa";
  created_at: string;
}

export async function sessioneAperta(classId: string): Promise<SessioneAula | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessioni_aula")
    .select("id, class_id, titolo, stato, created_at")
    .eq("class_id", classId)
    .eq("stato", "aperta")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    reportError("aula:sessione", error);
    return null;
  }
  return (data as SessioneAula) ?? null;
}

/**
 * Chi è fermo, e da quanto.
 *
 * È l'unica informazione che serve davvero a chi gira fra i tavoli: un tavolo
 * che non tocca una carta da tre minuti è un tavolo dove qualcuno non sa cosa
 * fare, e va raggiunto prima degli altri. Il resto — quante carte, che mano —
 * lo si legge entrando.
 */
export function fermoDa(t: StatoTavolo): number {
  return Math.max(0, Date.now() - new Date(t.aggiornato).getTime());
}
