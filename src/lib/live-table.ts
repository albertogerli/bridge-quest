/**
 * Tavolo condiviso in aula.
 *
 * L'insegnante apre un tavolo per la sua classe e vede tutte e quattro le
 * mani; gli allievi collegati vedono solo la propria, e le altre quando lui
 * decide di scoprirle.
 *
 * NIENTE FILTRO QUI DENTRO
 * Le mani coperte non vengono nascoste dal client: non arrivano proprio. La
 * tabella non è leggibile dagli allievi e tutto passa da `live_table_view()`,
 * che filtra dentro il database (vedi `scripts/sql/tavolo-condiviso-2026-08.sql`).
 * Se il filtro stesse qui basterebbe aprire gli strumenti per sviluppatori per
 * leggere le mani degli altri — in una classe, il primo giorno.
 */

import { createClient } from "@/lib/supabase/client";
import type { Card, Position } from "./bridge-engine";
import { reportError } from "./report-error";

export interface LiveTable {
  id: string;
  classId: string;
  titolo: string | null;
  /** Solo le mani che chi guarda ha diritto di vedere. */
  hands: Partial<Record<Position, Card[]>>;
  /** Posti scoperti a tutta la classe. */
  revealed: Position[];
  /** Il posto assegnato a chi guarda, se ne ha uno. */
  seat: Position | null;
  /** Chi siede dove. Solo per l'insegnante: un allievo non ha motivo di
   *  sapere dove siedono i compagni. */
  seatOf: Record<string, Position> | null;
  isInstructor: boolean;
  contract: string | null;
  declarer: Position | null;
  showContract: boolean;
  closed: boolean;
  updatedAt: string;
}

/** Lo stato del tavolo come lo può vedere chi chiama. */
export async function getLiveTable(id: string): Promise<LiveTable | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("live_table_view", { p_table_id: id });
    if (error || !data) return null;
    return data as LiveTable;
  } catch (err) {
    reportError("live-table:view", err);
    return null;
  }
}

/** Il tavolo aperto adesso per una classe, se c'è. */
export async function getOpenLiveTable(classId: string): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("live_table_open", { p_class_id: classId });
    return error ? null : ((data as string | null) ?? null);
  } catch (err) {
    reportError("live-table:open", err);
    return null;
  }
}

/** Apre un tavolo. Solo l'insegnante della classe, per policy. */
export async function openLiveTable(input: {
  classId: string;
  hands: Record<Position, Card[]>;
  titolo?: string;
  contract?: string;
  declarer?: Position;
}): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Un tavolo per volta: se ne resta uno aperto, gli allievi rischiano di
  // guardare la mano sbagliata mentre l'insegnante ne ha già aperta un'altra.
  await supabase
    .from("live_tables")
    .update({ closed_at: new Date().toISOString() })
    .eq("class_id", input.classId)
    .is("closed_at", null);

  const { data, error } = await supabase
    .from("live_tables")
    .insert({
      class_id: input.classId,
      instructor_id: user.id,
      hands: input.hands,
      titolo: input.titolo ?? null,
      contract: input.contract ?? null,
      declarer: input.declarer ?? null,
    })
    .select("id")
    .single();

  if (error) {
    reportError("live-table:apri", error);
    return null;
  }
  return (data as { id: string }).id;
}

/** Cambia la smazzata sul tavolo, ricoprendo tutto. */
export async function setLiveHands(
  id: string,
  hands: Record<Position, Card[]>,
  extra: { titolo?: string; contract?: string; declarer?: Position } = {}
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("live_tables")
    .update({
      hands,
      titolo: extra.titolo ?? null,
      contract: extra.contract ?? null,
      declarer: extra.declarer ?? null,
      // Mano nuova, tutto coperto: è il punto dell'esercizio in aula.
      revealed: [],
      show_contract: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) reportError("live-table:mani", error);
}

/** Scopre o ricopre un posto per tutta la classe. */
export async function setRevealed(id: string, revealed: Position[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("live_tables")
    .update({ revealed, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("live-table:scopri", error);
}

/** Mostra o nasconde il contratto. */
export async function setShowContract(id: string, mostra: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("live_tables")
    .update({ show_contract: mostra, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("live-table:contratto", error);
}

/** Assegna i posti agli allievi: `{ "<id allievo>": "north", ... }`. */
export async function setSeats(id: string, seatOf: Record<string, Position>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("live_tables")
    .update({ seat_of: seatOf, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("live-table:posti", error);
}

export async function closeLiveTable(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("live_tables")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) reportError("live-table:chiudi", error);
}

/**
 * Segue il tavolo: a ogni cambiamento richiede lo stato filtrato.
 *
 * L'evento realtime fa da campanello e basta — dice QUANDO, non COSA. Le mani
 * si richiedono sempre a `live_table_view()`, così un allievo non riceve mai
 * dal canale una carta che non dovrebbe vedere.
 *
 * Se il canale cade si continua comunque, con una richiesta ogni cinque
 * secondi: in aula un tavolo che si blocca interrompe la lezione, e un
 * ritardo di qualche secondo no.
 */
export function watchLiveTable(
  id: string,
  onChange: (t: LiveTable | null) => void
): () => void {
  const supabase = createClient();
  let vivo = true;

  const aggiorna = () => {
    void getLiveTable(id).then((t) => {
      if (vivo) onChange(t);
    });
  };

  aggiorna();

  const channel = supabase
    .channel(`live-table-${id}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "live_tables", filter: `id=eq.${id}` },
      aggiorna
    )
    .subscribe();

  const timer = setInterval(aggiorna, 5000);

  return () => {
    vivo = false;
    clearInterval(timer);
    void supabase.removeChannel(channel);
  };
}
