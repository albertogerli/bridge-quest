"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  apriRevisioni, getClassAssignments, getStatoCompiti,
  type Assignment, type StatoCompito,
} from "@/lib/instructors";
import { frasePerLInsegnante, riepilogoRevisioni } from "@/lib/revisioni";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Le revisioni che aspettano un gesto dell'insegnante.
 *
 * PERCHÉ STA IN CIMA ALLA CLASSE E NON DENTRO IL SINGOLO COMPITO. Il
 * predefinito «le apro io» sposta lavoro sull'insegnante: chi è organizzato non
 * se lo dimentica, chi lo è meno lascerà revisioni chiuse per distrazione — e i
 * suoi allievi non vedranno mai le proprie mani senza capire perché. Nascosto
 * dentro il compito, quel promemoria non lo trova nessuno.
 *
 * DICE QUANTO È GRAVE, NON SOLO QUANTE SONO. «3 da aprire, una l'hanno finita
 * tutti»: la seconda metà è quella che fa agire, perché dice che ci sono dodici
 * persone che hanno lavorato e stanno aspettando.
 *
 * SI APRE IN BLOCCO, perché in blocco è il gesto: dopo la lezione se ne aprono
 * cinque insieme, non una per volta.
 *
 * Non c'è il pulsante contrario: richiudere non toglie dagli occhi di chi ha
 * già letto, e metterlo qui accanto lo farebbe sembrare simmetrico.
 */
export function RevisioniDaAprire({ classId }: { classId: string }) {
  const t = useT();
  const [compiti, setCompiti] = useState<Assignment[]>([]);
  const [stato, setStato] = useState<StatoCompito[]>([]);
  const [busy, setBusy] = useState(false);

  const carica = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([getClassAssignments(classId), getStatoCompiti(classId)]);
      setCompiti(c);
      setStato(s);
    } catch (err) {
      reportError("revisioni:carica", err);
    }
  }, [classId]);

  useEffect(() => { void carica(); }, [carica]);

  const riepilogo = riepilogoRevisioni(compiti, stato);
  const frase = frasePerLInsegnante(riepilogo);
  if (!frase) return null;

  async function apriTutte() {
    setBusy(true);
    try {
      await apriRevisioni(riepilogo.inAttesa.map((r) => r.assignment.id));
      await carica();
    } catch (err) {
      reportError("revisioni:apri-tutte", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <p className="font-semibold text-amber-900 dark:text-amber-100">{frase}</p>
      <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
        {t("Finché non le apri, i tuoi allievi non possono rivedere le mani che hanno giocato.")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void apriTutte()}>
          {t("Apri tutte")}
        </Button>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-amber-900 dark:text-amber-100">
        {riepilogo.inAttesa.slice(0, 5).map((r) => (
          <li key={r.assignment.id} className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{r.assignment.title}</span>
            <span className="text-xs">
              {r.allievi > 0 && r.finiti >= r.allievi
                ? t("l'hanno finita tutti")
                : `${r.finiti}/${r.allievi} ${t("l'hanno finita")}`}
              {r.giorni > 0 && ` · ${r.giorni} ${r.giorni === 1 ? t("giorno") : t("giorni")}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
