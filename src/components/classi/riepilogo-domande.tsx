"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import type { HandResult } from "@/lib/instructors";
import { leggiFigura } from "@/lib/figura-domanda";
import { FiguraDomanda } from "@/components/figura-domanda";
import { verificaEsercizio, type EsercizioPerAllievo, type EsitoEsercizio } from "@/lib/esercizi-posizione";

/**
 * A compito finito, tutte le domande di seguito: la risposta data, quella
 * giusta e la spiegazione.
 *
 * PERCHÉ. L'allievo vedeva solo una spunta o una croce per domanda, e per
 * capire dove aveva sbagliato doveva riaprirle una per una (Trevissoi,
 * 06/11/2026: «rendersi conto di dove ha sbagliato, e il perché, se non lo
 * coglie, lo chiede all'insegnante»).
 *
 * Il responso si chiede al database con la risposta già data, come fa la
 * pagina della domanda: le soluzioni non stanno nel browser prima di aver
 * risposto, e così non registra niente di nuovo.
 */
export function RiepilogoDomande({
  ids,
  domande,
  results,
  classId,
  assignmentId,
}: {
  ids: string[];
  domande: Map<string, EsercizioPerAllievo>;
  results: Map<string, HandResult>;
  classId: string;
  assignmentId: string;
}) {
  const t = useT();
  const [esiti, setEsiti] = useState<Map<string, EsitoEsercizio>>(new Map());
  const chiave = ids.join(",");

  useEffect(() => {
    let vivo = true;
    void Promise.all(
      ids.map(async (id) => {
        const data = results.get(id)?.details?.risposta;
        if (typeof data !== "string") return null;
        const esito = await verificaEsercizio(id, data);
        return esito ? ([id, esito] as const) : null;
      }),
    ).then((coppie) => {
      if (vivo) setEsiti(new Map(coppie.filter((c): c is readonly [string, EsitoEsercizio] => c !== null)));
    });
    return () => {
      vivo = false;
    };
    // `results` cambia identità a ogni caricamento; le domande no.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- si ricalcola quando cambiano le domande del compito
  }, [chiave]);

  return (
    <div className="mb-6">
      <p className="mb-1 text-sm font-semibold">{t("Rivedi le tue risposte")}</p>
      <p className="mb-3 text-sm text-muted-foreground">
        {t("Per ogni domanda: la tua risposta, quella giusta e il perché. Se qualcosa non ti torna, chiedilo al tuo insegnante.")}
      </p>
      <ol className="space-y-3">
        {ids.map((id, i) => {
          const d = domande.get(id);
          const data = results.get(id)?.details?.risposta;
          const esito = esiti.get(id);
          const giusta = esito ? esito.giusta : results.get(id)?.made;
          const figura = d ? leggiFigura(d.figura) : null;
          return (
            <li
              key={id}
              className={`rounded-xl border bg-card p-4 ${
                giusta === false ? "border-red-200 dark:border-red-900" : "border-emerald-200 dark:border-emerald-900"
              }`}
            >
              <p className="text-xs font-semibold text-muted-foreground">
                {d?.titolo ?? t("Domanda {n}", { n: i + 1 })}
              </p>
              {figura && <div className="mt-2"><FiguraDomanda figura={figura} /></div>}
              {d?.domanda && <p className="mt-1 text-sm font-medium">{d.domanda}</p>}

              <div className="mt-3 flex items-start gap-2 text-sm">
                {giusta === false ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                )}
                <p>
                  <span className="text-muted-foreground">{t("La tua risposta:")}</span>{" "}
                  <span className="font-semibold">{typeof data === "string" ? data : "—"}</span>
                </p>
              </div>
              {esito && !esito.giusta && esito.risposte.length > 0 && (
                <p className="mt-1 pl-6 text-sm">
                  <span className="text-muted-foreground">
                    {esito.risposte.length === 1 ? t("La risposta giusta:") : t("Andavano bene:")}
                  </span>{" "}
                  <span className="font-semibold">{esito.risposte.join(", ")}</span>
                </p>
              )}
              {esito?.soluzione && (
                <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{esito.soluzione}</p>
              )}
              {/* Le posizioni con le carte sul tavolo si riaprono per rivederle. */}
              <Link
                href={`/classi/${classId}/esercizio/${id}?compito=${assignmentId}`}
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {t("Riapri la domanda")}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
