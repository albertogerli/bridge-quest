"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { leggiEsercizi, type EsercizioPerAllievo } from "@/lib/esercizi-posizione";
import type { AssignmentResultRow } from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Le domande di un compito, allievo per allievo: quante ne ha fatte, quante
 * giuste, e aprendo la riga cosa ha risposto a ciascuna.
 *
 * PERCHÉ C'È. È il riepilogo che Trevissoi si faceva ogni settimana con i
 * Google Moduli (06/11/2026): chi ha sbagliato cosa, per riprendere in aula le
 * domande specifiche. Prima la pagina del compito mostrava la griglia delle
 * MANI, che in un test sono zero: la risposta c'era, ma in fondo alla pagina,
 * sotto una tabella vuota — «non trovo traccia nel riepilogo».
 *
 * La divisione delle risposte domanda per domanda, senza nomi, resta sotto in
 * `RisposteClasse`: questa è la vista per nome, quella si può proiettare.
 */
export function RisultatiDomande({
  esercizioIds,
  righe,
  allievi,
}: {
  esercizioIds: string[];
  righe: AssignmentResultRow[];
  allievi: { student_id: string; display_name?: string | null }[];
}) {
  const t = useT();
  const [domande, setDomande] = useState<Map<string, EsercizioPerAllievo>>(new Map());
  const [aperto, setAperto] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void leggiEsercizi(esercizioIds).then((l) => {
      if (vivo) setDomande(new Map(l.map((e) => [e.id, e])));
    });
    return () => { vivo = false; };
  }, [esercizioIds]);

  const perAllievo = allievi
    .map((a) => {
      const sue = new Map(
        righe.filter((r) => r.student_id === a.student_id && esercizioIds.includes(r.smazzata_id)).map((r) => [r.smazzata_id, r]),
      );
      const giuste = [...sue.values()].filter((r) => r.score >= 0).length;
      return { ...a, sue, giuste };
    })
    .sort((x, y) => y.giuste - x.giuste || y.sue.size - x.sue.size);

  // Le domande sbagliate di più, per sapere cosa rispiegare senza leggere tutto.
  const sbagliate = esercizioIds
    .map((id, i) => ({ id, i, n: righe.filter((r) => r.smazzata_id === id && r.score < 0).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  return (
    <div className="mb-8">
      <h2 className="mb-1 font-display text-xl font-bold text-foreground">{t("Le risposte, allievo per allievo")}</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t("Tocca un allievo per vedere cosa ha risposto a ogni domanda. Conta la prima risposta.")}
      </p>

      {sbagliate.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="mb-1 font-semibold">{t("Da riprendere in aula")}</p>
          <ul className="space-y-0.5">
            {sbagliate.map((x) => (
              <li key={x.id}>
                <span className="font-semibold">{domande.get(x.id)?.titolo ?? t("Domanda {n}", { n: x.i + 1 })}</span>
                {" · "}
                {x.n === 1 ? t("1 errore") : t("{n} errori", { n: x.n })}
                {domande.get(x.id)?.domanda && <span className="text-muted-foreground"> · {domande.get(x.id)!.domanda}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allievi.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Nessun allievo iscritto a questa classe.")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-3 py-2 font-semibold">{t("Allievo")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("Risposte")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("Giuste")}</th>
              </tr>
            </thead>
            <tbody>
              {perAllievo.map((a) => {
                const su = aperto === a.student_id;
                return (
                  <Fragment key={a.student_id}>
                    <tr className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setAperto(su ? null : a.student_id)}
                          disabled={a.sue.size === 0}
                          aria-expanded={su}
                          className="flex items-center gap-1.5 font-medium disabled:cursor-default"
                        >
                          {a.sue.size > 0 &&
                            (su ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />)}
                          {a.display_name ?? t("Allievo")}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {a.sue.size === 0 ? <span className="text-muted-foreground">{t("non ha cominciato")}</span> : `${a.sue.size}/${esercizioIds.length}`}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {a.sue.size > 0 && `${a.giuste} (${Math.round((a.giuste / a.sue.size) * 100)}%)`}
                      </td>
                    </tr>
                    {su && (
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={3} className="px-3 py-2">
                          <ol className="space-y-1">
                            {esercizioIds.map((id, i) => {
                              const r = a.sue.get(id);
                              const risposta = typeof r?.details?.risposta === "string" ? r.details.risposta : null;
                              return (
                                <li key={id} className="flex gap-2">
                                  <span
                                    className={`w-5 shrink-0 text-center font-bold ${!r ? "text-muted-foreground" : r.score >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                    aria-label={!r ? t("Non risposta") : r.score >= 0 ? t("Giusta") : t("Sbagliata")}
                                  >
                                    {!r ? "–" : r.score >= 0 ? "✓" : "✗"}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="font-semibold">{domande.get(id)?.titolo ?? t("Domanda {n}", { n: i + 1 })}</span>
                                    {risposta && <span className="text-muted-foreground"> · {t("ha risposto {r}", { r: risposta })}</span>}
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
