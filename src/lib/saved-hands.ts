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
import { segnalaSalvoRete } from "@/lib/report-error";

export interface SavedHand {
  id: string;
  titolo: string;
  nota: string | null;
  hands: Record<Position, Card[]>;
  contract: string | null;
  declarer: Position | null;
  played: { seat: Position; card: Card }[];
  created_at: string;
  /** Il set a cui appartiene: «mani sulle transfer». `null` = senza cartella. */
  cartella: string | null;
  preferita: boolean;
}

// Cinquecento e non cinquanta: con le cartelle l'archivio smette di essere
// «le ultime mani salvate» e diventa il materiale di un corso intero.
export async function getSavedHands(limite = 500): Promise<SavedHand[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_hands")
      .select("id, titolo, nota, hands, contract, declarer, played, created_at, cartella, preferita")
      .order("created_at", { ascending: false })
      .limit(limite);
    if (error || !data) return [];
    return data as SavedHand[];
  } catch (err) {
    segnalaSalvoRete("archivio:leggi", err);
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
  cartella?: string | null;
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
      cartella: nomeCartella(input.cartella),
    });
    if (error) {
      segnalaSalvoRete("archivio:salva", error);
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
      segnalaSalvoRete("archivio:cancella", error);
      return false;
    }
    return true;
  } catch (err) {
    segnalaSalvoRete("archivio:cancella", err);
    return false;
  }
}

/** Il nome di una cartella ripulito: vuoto vuol dire «nessuna». */
export function nomeCartella(nome: string | null | undefined): string | null {
  const pulito = (nome ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  return pulito || null;
}

/**
 * Molte mani in una volta sola, nella stessa cartella: «crea dieci mani»,
 * «importa questo PBN». Un solo INSERT, così o entrano tutte o nessuna.
 */
export async function saveHands(
  mani: {
    titolo: string;
    hands: Record<Position, Card[]>;
    contract?: string | null;
    declarer?: Position | null;
  }[],
  cartella: string | null,
): Promise<{ ok: boolean; errore?: string }> {
  if (mani.length === 0) return { ok: true };
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, errore: "Devi accedere." };
    const { error } = await supabase.from("saved_hands").insert(
      mani.map((m) => ({
        owner_id: user.id,
        titolo: m.titolo.trim().slice(0, 200),
        hands: m.hands,
        contract: m.contract ?? null,
        declarer: m.declarer ?? null,
        played: [],
        cartella: nomeCartella(cartella),
      })),
    );
    if (error) {
      segnalaSalvoRete("archivio:salva-set", error);
      return { ok: false, errore: "Non è stato possibile salvare le mani." };
    }
    return { ok: true };
  } catch (err) {
    segnalaSalvoRete("archivio:salva-set", err);
    return { ok: false, errore: "Non è stato possibile salvare le mani." };
  }
}

/** Sposta in una cartella, o mette/toglie la stella. */
export async function aggiornaMano(
  id: string,
  campi: { cartella?: string | null; preferita?: boolean },
): Promise<boolean> {
  try {
    const supabase = createClient();
    const riga: Record<string, unknown> = {};
    if ("cartella" in campi) riga.cartella = nomeCartella(campi.cartella);
    if ("preferita" in campi) riga.preferita = campi.preferita;
    const { error } = await supabase.from("saved_hands").update(riga).eq("id", id);
    if (error) {
      segnalaSalvoRete("archivio:aggiorna", error);
      return false;
    }
    return true;
  } catch (err) {
    segnalaSalvoRete("archivio:aggiorna", err);
    return false;
  }
}

/** Rinomina una cartella: è cambiare il nome a tutte le sue mani. */
export async function rinominaCartella(vecchio: string, nuovo: string): Promise<boolean> {
  const nome = nomeCartella(nuovo);
  if (!nome) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("saved_hands").update({ cartella: nome }).eq("cartella", vecchio);
    if (error) {
      segnalaSalvoRete("archivio:rinomina", error);
      return false;
    }
    return true;
  } catch (err) {
    segnalaSalvoRete("archivio:rinomina", err);
    return false;
  }
}

export interface GruppoArchivio {
  /** Chiave stabile per l'interfaccia. */
  chiave: string;
  nome: string | null;
  tipo: "preferite" | "cartella" | "senza";
  mani: SavedHand[];
}

/**
 * L'archivio come lo si legge: le preferite in cima (anche se stanno in una
 * cartella: la stella è una scorciatoia, non uno spostamento), poi le
 * cartelle in ordine alfabetico, e in fondo quelle senza cartella.
 */
export function raggruppaArchivio(mani: readonly SavedHand[]): GruppoArchivio[] {
  const gruppi: GruppoArchivio[] = [];
  const preferite = mani.filter((m) => m.preferita);
  if (preferite.length) gruppi.push({ chiave: "*preferite", nome: null, tipo: "preferite", mani: preferite });
  const perCartella = new Map<string, SavedHand[]>();
  const senza: SavedHand[] = [];
  for (const m of mani) {
    if (m.cartella) perCartella.set(m.cartella, [...(perCartella.get(m.cartella) ?? []), m]);
    else senza.push(m);
  }
  for (const nome of [...perCartella.keys()].sort((a, b) => a.localeCompare(b, "it", { numeric: true }))) {
    gruppi.push({ chiave: `c:${nome}`, nome, tipo: "cartella", mani: perCartella.get(nome)! });
  }
  if (senza.length) gruppi.push({ chiave: "*senza", nome: null, tipo: "senza", mani: senza });
  return gruppi;
}
