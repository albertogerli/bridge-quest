import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * Come hanno giocato la stessa mano gli altri della classe.
 *
 * ANONIMO PER SCELTA, non per prudenza. Il confronto serve a capire dove si sta
 * — «in sei su dieci l'hanno mantenuto, io no: quindi si poteva» — e quella
 * risposta non ha bisogno dei nomi. Con i nomi diventa una classifica, e una
 * classifica in una classe di principianti fa smettere di provare proprio
 * quelli che avrebbero più da guadagnare. L'insegnante può accendere i nomi
 * sulla sua classe, ed è una sua decisione didattica.
 *
 * IL PROPRIO RISULTATO SI RICONOSCE SEMPRE, anche da anonimo: senza, la riga
 * più importante della tabella sarebbe indistinguibile dalle altre.
 *
 * SI CONFRONTA IL PRIMO TENTATIVO, come ovunque nel portale: chi rigioca dieci
 * volte non deve comparire con il decimo risultato accanto a chi ha giocato una
 * volta sola.
 */
export interface RigaConfronto {
  nome: string;
  prese: number | null;
  mantenuto: boolean;
  e_mio: boolean;
}

export async function confrontoMano(
  assignmentId: string,
  smazzataId: string,
): Promise<RigaConfronto[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("confronto_mano", {
    p_assignment_id: assignmentId,
    p_smazzata_id: smazzataId,
  });
  if (error) {
    reportError("confronto:mano", error);
    return [];
  }
  return (data ?? []) as RigaConfronto[];
}

/** Quanti hanno mantenuto, su quanti hanno giocato. */
export function riassunto(righe: readonly RigaConfronto[]): {
  quanti: number;
  mantenuti: number;
  mio: RigaConfronto | undefined;
} {
  return {
    quanti: righe.length,
    mantenuti: righe.filter((r) => r.mantenuto).length,
    mio: righe.find((r) => r.e_mio),
  };
}
