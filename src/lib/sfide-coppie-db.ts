/**
 * Sfide 2 contro 2: accesso al database.
 *
 * Il confronto vero — IMP e stelle — sta in `sfida-coppie.ts` (senza «-db»),
 * che è un motore puro e testato. Qui c'è solo il trasporto: due nomi vicini
 * per due mestieri diversi, e il suffisso serve a non sbagliare import.
 *
 * IL PUNTEGGIO NON PASSA MAI DA QUI. Lo calcola il server a licita chiusa
 * (`sfida_board_chiudi`), leggendo le dichiarazioni che ha già validato e la
 * tabella double dummy calcolata alla generazione. Se lo dichiarasse il
 * browser, vincere una sfida sarebbe questione di aprire gli strumenti per
 * sviluppatori.
 */

import { createClient } from "@/lib/supabase/client";
import { reportError } from "./report-error";

export interface BoardSfidaDb {
  numero: number;
  manoId: string;
  sessioneId: string;
  contratto: string | null;
  punteggio: number | null;
  chiusa: boolean;
  /** Nullo finché non hai chiuso tu: prima sarebbe un suggerimento. */
  altroContratto: string | null;
  altroPunteggio: number | null;
  altraChiusa: boolean;
  parScore: number | null;
  valoreAtteso: { ns?: { ev: number }; ew?: { ev: number } } | null;
}

export interface VistaSfida {
  id: string;
  miaCoppia: "A" | "B";
  coppiaA: string[];
  coppiaB: string[];
  board: BoardSfidaDb[];
}

export interface RigaSfida {
  id: string;
  creata: string;
  miaCoppia: "A" | "B";
  avversari: string[];
  daFare: number;
  totale: number;
}

export async function creaSfida(
  compagno: string,
  avversari: [string, string],
  quante = 4
): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sfida_coppie_crea", {
      p_compagno: compagno,
      p_b1: avversari[0],
      p_b2: avversari[1],
      p_quante: quante,
    });
    if (error) {
      reportError("sfide-coppie:crea", error);
      return null;
    }
    return (data as string | null) ?? null;
  } catch (err) {
    reportError("sfide-coppie:crea", err);
    return null;
  }
}

export async function mieSfide(): Promise<RigaSfida[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("mie_sfide_coppie");
    if (error) {
      reportError("sfide-coppie:elenco", error);
      return [];
    }
    return (data as RigaSfida[]) ?? [];
  } catch (err) {
    reportError("sfide-coppie:elenco", err);
    return [];
  }
}

export async function vistaSfida(id: string): Promise<VistaSfida | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sfida_coppie_vista", { p_id: id });
    if (error) {
      reportError("sfide-coppie:vista", error);
      return null;
    }
    return (data as VistaSfida | null) ?? null;
  } catch (err) {
    reportError("sfide-coppie:vista", err);
    return null;
  }
}

/**
 * Chiede al server di registrare il risultato di una board a licita chiusa.
 *
 * Si può chiamare più volte senza danni: la seconda risponde «già fatto». È
 * pensata così a posta, perché chi chiude la licita e chi torna sulla sfida
 * possono essere due persone diverse, e nessuna delle due deve ricordarsi di
 * fare un passaggio in più.
 */
export async function chiudiBoard(sessioneId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sfida_board_chiudi", {
      p_sessione: sessioneId,
    });
    if (error) {
      reportError("sfide-coppie:chiudi", error);
      return false;
    }
    return (data as { ok?: boolean } | null)?.ok === true;
  } catch (err) {
    reportError("sfide-coppie:chiudi", err);
    return false;
  }
}

export interface RigaAvversario {
  id: string;
  nome: string | null;
  incontri: number;
  vinti: number;
  persi: number;
  impNetti: number;
}

export interface StatisticheSfide {
  incontri: number;
  vinti: number;
  persi: number;
  pari: number;
  impFatti: number;
  impSubiti: number;
  perCompagno: RigaAvversario[];
  perAvversario: RigaAvversario[];
}

/**
 * Vittorie, sconfitte e IMP, in totale e per persona.
 *
 * Conta solo gli incontri finiti da entrambe le coppie: una sfida a metà non è
 * né vinta né persa, e vederla comparire fra le sconfitte perché l'altra
 * coppia non ha ancora dichiarato è il genere di cosa che fa smettere.
 */
export async function statisticheSfide(): Promise<StatisticheSfide | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("mie_statistiche_sfide");
    if (error) {
      reportError("sfide-coppie:statistiche", error);
      return null;
    }
    return (data as StatisticheSfide | null) ?? null;
  } catch (err) {
    reportError("sfide-coppie:statistiche", err);
    return null;
  }
}

/**
 * La coda: ci si iscrive in due e si aspetta un'altra coppia.
 *
 * SI DEGRADA IN SILENZIO. Le funzioni SQL arrivano con
 * `scripts/sql/coda-sfide-coppie-2026-08.sql`, che come tutti gli script di
 * schema si esegue a mano: finché non è stato eseguito, `stato` risponde
 * `null` e la pagina mostra soltanto la sfida diretta, senza errori rossi
 * addosso a chi non c'entra niente. Il segnale è la funzione mancante
 * (PGRST202), non un difetto: non va in Sentry.
 */
export interface StatoCoda {
  inAttesa: boolean;
  compagno: string | null;
  dal: string | null;
  coppieInAttesa: number;
}

/** `true` se l'errore dice solo «quella funzione non esiste ancora». */
function funzioneAssente(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "PGRST202" || /Could not find the function/i.test(error?.message ?? "");
}

export async function statoCoda(): Promise<StatoCoda | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sfida_coppie_coda_stato");
    if (error) {
      if (!funzioneAssente(error)) reportError("sfide-coppie:coda-stato", error);
      return null;
    }
    const d = (data ?? {}) as Record<string, unknown>;
    return {
      inAttesa: d.in_attesa === true,
      compagno: (d.compagno as string | null) ?? null,
      dal: (d.dal as string | null) ?? null,
      coppieInAttesa: Number(d.coppie_in_attesa ?? 0),
    };
  } catch (err) {
    reportError("sfide-coppie:coda-stato", err);
    return null;
  }
}

export type EsitoIscrizione =
  | { stato: "accoppiata"; sfida: string }
  | { stato: "in_attesa" }
  | { stato: "errore"; motivo: string };

export async function iscrivitiInCoda(
  compagno: string,
  quante = 4
): Promise<EsitoIscrizione> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sfida_coppie_iscrivi", {
      p_compagno: compagno,
      p_quante: quante,
    });
    if (error) {
      if (!funzioneAssente(error)) reportError("sfide-coppie:iscrivi", error);
      return { stato: "errore", motivo: "L'iscrizione non è ancora disponibile." };
    }
    const d = (data ?? {}) as Record<string, unknown>;
    if (d.stato === "accoppiata" && typeof d.sfida === "string") {
      return { stato: "accoppiata", sfida: d.sfida };
    }
    if (d.stato === "in_attesa") return { stato: "in_attesa" };
    return {
      stato: "errore",
      motivo: (d.motivo as string) ?? "Non è stato possibile iscriversi.",
    };
  } catch (err) {
    reportError("sfide-coppie:iscrivi", err);
    return { stato: "errore", motivo: "Non è stato possibile iscriversi." };
  }
}

export async function esciDallaCoda(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sfida_coppie_esci");
    if (error) {
      if (!funzioneAssente(error)) reportError("sfide-coppie:esci", error);
      return false;
    }
    return data === true;
  } catch (err) {
    reportError("sfide-coppie:esci", err);
    return false;
  }
}
