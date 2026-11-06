/**
 * Le figure salvate dell'insegnante: poche carte composte in «Combinazioni»,
 * con un nome, da riaprire e proiettare a lezione (Trevissoi, 06/11/2026).
 *
 * Sono private: le vede solo chi le ha fatte. La tabella è in
 * `scripts/sql/figure-insegnante-2026-11.sql`.
 */

import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { tabellaMancante } from "@/lib/materiali-lezione";

export interface FiguraSalvata {
  id: string;
  nome: string;
  mani: Record<Position, Card[]>;
  atout: Suit | null;
  created_at: string;
}

const COLONNE = "id, nome, mani, atout, created_at";

/** Le proprie figure, la più recente in cima. `null` = non lette (rete o tabella assente). */
export async function elencaFigure(): Promise<FiguraSalvata[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("figure_insegnante")
    .select(COLONNE)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    // Prima dello script SQL la tabella non c'è: niente elenco, niente allarme.
    if (!tabellaMancante(error)) segnalaSalvoRete("figure-insegnante:elenca", error);
    return null;
  }
  return (data ?? []).map((r) => ({ ...r, mani: completaMani(r.mani) })) as FiguraSalvata[];
}

/** Salva una figura nuova; restituisce l'id, o `null` se non è riuscito. */
export async function salvaFigura(
  nome: string,
  mani: Record<Position, Card[]>,
  atout: Suit | null,
): Promise<string | null> {
  const supabase = createClient();
  // Niente `.select()` dopo l'insert: l'id lo generiamo qui, così una policy
  // di sola scrittura non fa sembrare fallito un salvataggio riuscito.
  const id = crypto.randomUUID();
  const { error } = await supabase.from("figure_insegnante").insert({ id, nome: nome.trim(), mani, atout });
  if (error) {
    segnalaSalvoRete("figure-insegnante:salva", error);
    return null;
  }
  return id;
}

export async function cancellaFigura(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("figure_insegnante").delete().eq("id", id);
  if (error) {
    segnalaSalvoRete("figure-insegnante:cancella", error);
    return false;
  }
  return true;
}

/** Dal database può mancare un posto vuoto: l'editor li vuole tutti e quattro. */
function completaMani(m: unknown): Record<Position, Card[]> {
  const r = (m && typeof m === "object" ? m : {}) as Partial<Record<Position, Card[]>>;
  return {
    north: Array.isArray(r.north) ? r.north : [],
    east: Array.isArray(r.east) ? r.east : [],
    south: Array.isArray(r.south) ? r.south : [],
    west: Array.isArray(r.west) ? r.west : [],
  };
}
