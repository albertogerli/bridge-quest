/**
 * Il codice amico: sei caratteri per invitare qualcuno senza cercarlo per nome.
 *
 * Le regole vere stanno nel database (`scripts/sql/codice-amico-2026-08.sql`):
 * qui c'è solo l'accesso e la costruzione del link. In particolare non si
 * decide nulla su cosa esce dal profilo — `amico_da_codice` restituisce id e
 * nome, e basta.
 */

import { createClient } from "@/lib/supabase/client";
import { reportError } from "./report-error";

/** Le lettere ambigue non fanno parte dell'alfabeto: qui si normalizza. */
export function normalizzaCodice(grezzo: string): string {
  return grezzo.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

/** Il link da mandare. Va costruito con l'origine vera, non con un dominio fisso. */
export function linkInvito(origin: string, codice: string): string {
  return `${origin}/amici?codice=${codice}`;
}

/** Il testo del messaggio: corto, perché si legge in anteprima su WhatsApp. */
export function messaggioInvito(nome: string | null, link: string): string {
  const chi = nome ? `${nome} ti invita` : "Ti invito";
  return `${chi} su Bridge LAB, la piattaforma della FIGB per imparare e giocare a bridge. Aggiungimi qui: ${link}`;
}

export async function mioCodice(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("mio_codice_amico");
    if (error) {
      reportError("codice-amico:mio", error);
      return null;
    }
    return (data as string | null) ?? null;
  } catch (err) {
    reportError("codice-amico:mio", err);
    return null;
  }
}

export async function cercaPerCodice(
  codice: string
): Promise<{ id: string; nome: string | null } | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("amico_da_codice", {
      p_codice: normalizzaCodice(codice),
    });
    if (error || !data) return null;
    return data as { id: string; nome: string | null };
  } catch (err) {
    reportError("codice-amico:cerca", err);
    return null;
  }
}
