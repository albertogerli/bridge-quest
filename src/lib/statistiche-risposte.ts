import { normalizzaRisposta, rispostaGiusta } from "@/lib/esercizi-posizione";

/**
 * Cosa ha risposto la classe a un esercizio.
 *
 * È la vista dei quiz di BridgeChamp che è piaciuta il 28/09/2026: per ogni
 * domanda, «il 71% ha dichiarato 3SA, il 14% 3♥, il 14% 2SA». Dice
 * all'insegnante cosa è passato della lezione — «a lezione annuiscono tutti»,
 * e poi qui si vede chi non aveva capito.
 *
 * SI CONTA LA PRIMA RISPOSTA DI OGNUNO. Il database restituisce già quella
 * (`get_class_results`, DISTINCT ON per allievo ed esercizio, la più vecchia):
 * dopo un errore la soluzione si vede, e le risposte seguenti non dicono più
 * cosa l'allievo pensava.
 *
 * LA STESSA DICHIARAZIONE SCRITTA IN MODI DIVERSI È UNA VOCE SOLA: «3sa», «3SA»
 * e «3NT» sono la stessa risposta, e si mostra la forma più usata.
 */

export interface RigaRisultato {
  student_id: string;
  smazzata_id: string;
  details: Record<string, unknown> | null;
}

export interface VoceRisposta {
  risposta: string;
  n: number;
  quota: number;
  giusta: boolean;
}

export interface StatisticaEsercizio {
  totale: number;
  giuste: number;
  voci: VoceRisposta[];
}

export function statisticheRisposte(
  righe: readonly RigaRisultato[],
  esercizioId: string,
  attese: readonly string[],
): StatisticaEsercizio {
  const gruppi = new Map<string, { forme: Map<string, number>; n: number }>();
  const visti = new Set<string>();
  for (const r of righe) {
    if (r.smazzata_id !== esercizioId || visti.has(r.student_id)) continue;
    const testo = typeof r.details?.risposta === "string" ? r.details.risposta.trim() : "";
    if (!testo) continue;
    visti.add(r.student_id);
    const chiave = normalizzaRisposta(testo);
    const g = gruppi.get(chiave) ?? { forme: new Map(), n: 0 };
    g.n += 1;
    g.forme.set(testo, (g.forme.get(testo) ?? 0) + 1);
    gruppi.set(chiave, g);
  }
  const totale = visti.size;
  const voci: VoceRisposta[] = [...gruppi.values()]
    .map((g) => {
      const forma = [...g.forme.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return { risposta: forma, n: g.n, quota: totale ? g.n / totale : 0, giusta: rispostaGiusta(forma, attese) };
    })
    .sort((a, b) => b.n - a.n || a.risposta.localeCompare(b.risposta));
  return { totale, giuste: voci.filter((v) => v.giusta).reduce((s, v) => s + v.n, 0), voci };
}
