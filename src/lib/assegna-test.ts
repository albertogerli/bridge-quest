import { createAssignment, type Assignment } from "@/lib/instructors";
import { gruppoTest, type TestCommissione } from "@/lib/test-commissione";

export type EsitoAssegnaTest =
  | { ok: true; compito: Assignment; titolo: string }
  | { ok: false; motivo: "solo-insegnanti" | "manca-script" | "errore" };

/**
 * Un esercizio della Commissione diventa un compito della classe, in un passo.
 *
 * La rotta copia le domande fra quelle dell'insegnante se non c'erano (con le
 * risposte, che dal browser non passano) e restituisce gli id in ordine; da
 * lì è un compito come gli altri. Lo usano la pagina «Esercizi» e il
 * programma del corso: un solo percorso, così non divergono.
 */
export async function assegnaTestCommissione(classId: string, test: TestCommissione): Promise<EsitoAssegnaTest> {
  try {
    const r = await fetch("/api/istruttori/test-commissione", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: test.numero }),
    });
    const j = (await r.json().catch(() => ({}))) as { ids?: string[]; codice?: string };
    if (!r.ok || !j.ids?.length) {
      return { ok: false, motivo: r.status === 403 ? "solo-insegnanti" : j.codice === "42703" ? "manca-script" : "errore" };
    }
    const titolo = gruppoTest(test);
    const compito = await createAssignment({ classId, title: titolo, smazzataIds: [], esercizioIds: j.ids });
    return { ok: true, compito, titolo };
  } catch {
    return { ok: false, motivo: "errore" };
  }
}
