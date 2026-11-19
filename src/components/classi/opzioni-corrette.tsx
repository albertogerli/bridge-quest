"use client";

import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { normalizzaRisposta } from "@/lib/esercizi-posizione";

/**
 * Tutte le opzioni di una domanda a scelta, dopo aver risposto: quella giusta
 * in verde, la propria (se sbagliata) in rosso, le altre neutre.
 *
 * PERCHÉ. Rivedendo il test si leggeva solo «La tua risposta: …»: senza le
 * altre opzioni accanto non si capiva fra cosa si era scelto, e riaprendo la
 * domanda restava solo «Giusto» (utente, 19/11/2026).
 */
export function OpzioniCorrette({
  opzioni,
  data,
  risposte,
}: {
  opzioni: string[];
  /** La risposta data dall'allievo. */
  data: string | null;
  /** Le risposte giuste; vuoto finché il responso non è arrivato. */
  risposte: string[];
}) {
  const t = useT();
  const giuste = new Set(risposte.map(normalizzaRisposta));
  const mia = data == null ? null : normalizzaRisposta(data);
  return (
    <ul className="grid gap-1.5">
      {opzioni.map((o) => {
        const n = normalizzaRisposta(o);
        const giusta = giuste.has(n);
        const scelta = mia === n;
        const stile = giusta
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : scelta
            ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            : "border-border bg-card text-muted-foreground";
        return (
          <li key={o} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${stile}`}>
            {giusta ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : scelta ? (
              <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 opacity-40" aria-hidden="true" />
            )}
            <span className={`text-pretty ${giusta || scelta ? "font-medium text-foreground" : ""}`}>
              {o}
              {giusta && <span className="sr-only"> ({t("giusta")})</span>}
              {scelta && <span className="block text-xs font-semibold text-muted-foreground">{t("la tua risposta")}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
