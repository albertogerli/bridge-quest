/**
 * Archivio personale delle mani.
 *
 * Una mano interessante non finisce con la lezione: si salva e si ritrova la
 * settimana dopo. E si salva anche la POSIZIONE — non «questa smazzata», ma
 * «questa smazzata a metà della quarta presa, quando il dichiarante deve
 * scegliere»: è quello il momento che si vuole discutere.
 *
 * L'archivio è personale: la policy di `saved_hands` lascia vedere solo le
 * proprie. Non c'è condivisione, e non è una dimenticanza — condividere una
 * mano significa decidere con chi, e quella domanda non è ancora stata posta.
 */

import { createClient } from "@/lib/supabase/client";
import type { Card, Position } from "./bridge-engine";
import { reportError } from "./report-error";

export interface SavedHand {
  id: string;
  titolo: string;
  nota: string | null;
  hands: Record<Position, Card[]>;
  contract: string | null;
  declarer: Position | null;
  played: { seat: Position; card: Card }[];
  created_at: string;
}

export async function getSavedHands(limite = 50): Promise<SavedHand[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_hands")
      .select("id, titolo, nota, hands, contract, declarer, played, created_at")
      .order("created_at", { ascending: false })
      .limit(limite);
    if (error || !data) return [];
    return data as SavedHand[];
  } catch (err) {
    reportError("archivio:leggi", err);
    return [];
  }
}

export async function saveHand(input: {
  titolo: string;
  nota?: string;
  hands: Record<Position, Card[]>;
  contract?: string | null;
  declarer?: Position | null;
  /** Le carte già giocate: è ciò che rende la posizione, non solo la mano. */
  played?: { seat: Position; card: Card }[];
}): Promise<{ ok: boolean; errore?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, errore: "Devi accedere." };

    const { error } = await supabase.from("saved_hands").insert({
      owner_id: user.id,
      titolo: input.titolo.trim(),
      nota: input.nota?.trim() || null,
      hands: input.hands,
      contract: input.contract ?? null,
      declarer: input.declarer ?? null,
      played: input.played ?? [],
    });
    if (error) {
      reportError("archivio:salva", error);
      return { ok: false, errore: "Non è stato possibile salvare la mano." };
    }
    return { ok: true };
  } catch (err) {
    reportError("archivio:salva", err);
    return { ok: false, errore: "Non è stato possibile salvare la mano." };
  }
}

export async function deleteSavedHand(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("saved_hands").delete().eq("id", id);
    if (error) {
      reportError("archivio:cancella", error);
      return false;
    }
    return true;
  } catch (err) {
    reportError("archivio:cancella", err);
    return false;
  }
}
