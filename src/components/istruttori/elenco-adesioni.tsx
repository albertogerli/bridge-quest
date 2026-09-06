"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { gruppiSimili, type Adesione } from "@/lib/adesioni";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Chi ha detto «vengo», per l'insegnante che compone i tavoli.
 *
 * SERVE LA SERA PRIMA. Le note sono il campo per cui esiste tutto il resto:
 * «vengo con mia moglie», «preferirei il primo turno», «ho già giocato a
 * scala quaranta». Trevissoi cura gli accoppiamenti per età e affinità, e senza
 * quelle righe li compone al buio.
 *
 * I DOPPIONI SI MOSTRANO IN CIMA, col motivo. Due righe con lo stesso nome sono
 * quasi sempre la stessa persona due volte; due righe con lo stesso recapito e
 * nomi diversi sono quasi sempre marito e moglie. Dire «attenzione, si
 * somigliano» senza dire in che modo lascerebbe il lavoro a lui.
 *
 * NON SI CANCELLA, SI ARCHIVIA. «Quanti hanno aderito e quanti sono venuti» è
 * il tasso di conversione della Lezione Zero, uno degli indicatori che vanno in
 * Consiglio: cancellare una riga falsa quel numero per sempre.
 */
export function ElencoAdesioni({ classId }: { classId: string }) {
  const t = useT();
  const [adesioni, setAdesioni] = useState<Adesione[]>([]);
  const [mostraArchiviate, setMostraArchiviate] = useState(false);
  const [busy, setBusy] = useState(false);

  const carica = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("adesioni").select("*").eq("class_id", classId)
        .order("creata_il", { ascending: false });
      if (error) throw error;
      setAdesioni((data ?? []) as Adesione[]);
    } catch (err) {
      reportError("adesioni:carica", err);
    }
  }, [classId]);

  useEffect(() => { void carica(); }, [carica]);

  async function archivia(id: string, annulla = false) {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.from("adesioni")
        .update({ archiviata_il: annulla ? null : new Date().toISOString() })
        .eq("id", id);
      await carica();
    } catch (err) {
      reportError("adesioni:archivia", err);
    } finally {
      setBusy(false);
    }
  }

  const vive = adesioni.filter((a) => !a.archiviata_il);
  const archiviate = adesioni.filter((a) => a.archiviata_il);
  const simili = gruppiSimili(adesioni);
  if (adesioni.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("Hanno detto che vengono")} · {vive.length}
      </h2>

      {simili.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            {t("Righe che si somigliano")}
          </p>
          <ul className="mt-1 space-y-1 text-amber-900 dark:text-amber-100">
            {simili.map((g, i) => (
              <li key={i}>
                {g.adesioni.map((a) => a.nome).join(" · ")} —{" "}
                {g.motivo === "stesso-nome"
                  ? t("stesso nome: forse ha aderito due volte")
                  : t("stesso recapito: forse sono due persone della stessa famiglia")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border">
        {vive.map((a) => (
          <div key={a.id} className="flex flex-wrap items-start gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.nome}</p>
              <p className="text-sm text-muted-foreground">{a.contatto}</p>
              {a.note && <p className="mt-1 text-sm">{a.note}</p>}
            </div>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void archivia(a.id)}>
              {t("Archivia")}
            </Button>
          </div>
        ))}
      </div>

      {archiviate.length > 0 && (
        <>
          <button
            onClick={() => setMostraArchiviate((v) => !v)}
            className="mt-2 min-h-11 text-sm text-muted-foreground underline underline-offset-4"
          >
            {mostraArchiviate
              ? t("Nascondi le archiviate")
              : `${archiviate.length} ${t("archiviate")}`}
          </button>
          {mostraArchiviate && (
            <div className="mt-2 divide-y divide-border rounded-xl border border-dashed border-border">
              {archiviate.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 text-muted-foreground">
                  <span className="flex-1">{a.nome} · {a.contatto}</span>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void archivia(a.id, true)}>
                    {t("Rimetti")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
