"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { candidatiPerAdesione, gruppiSimili, type Adesione } from "@/lib/adesioni";
import type { ClassMember } from "@/lib/instructors";
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
export function ElencoAdesioni({
  classId,
  membri = [],
}: {
  classId: string;
  /** Gli iscritti alla classe, per collegare un'adesione a chi è arrivato. */
  membri?: ClassMember[];
}) {
  const t = useT();
  const [adesioni, setAdesioni] = useState<Adesione[]>([]);
  const [mostraArchiviate, setMostraArchiviate] = useState(false);
  /** L'adesione di cui si sta scegliendo la persona. */
  const [collegando, setCollegando] = useState<string | null>(null);
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

  /**
   * IL COLLEGAMENTO È REVERSIBILE, e non è un dettaglio: l'insegnante che
   * sbaglia persona — due Maria Rossi, ed è il caso per cui abbiamo scelto lui
   * invece di un algoritmo — deve poter separare. A senso unico, il primo
   * errore diventerebbe un dato sbagliato per sempre.
   *
   * Separare non tocca né l'adesione né l'account: sono due cose che esistono
   * per conto loro, e il collegamento è solo una riga che dice che sono la
   * stessa persona.
   */
  async function collega(adesioneId: string, userId: string | null) {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.from("adesioni").update({ user_id: userId }).eq("id", adesioneId);
      setCollegando(null);
      await carica();
    } catch (err) {
      reportError("adesioni:collega", err);
    } finally {
      setBusy(false);
    }
  }

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
  const giaCollegati = new Set(adesioni.map((a) => a.user_id).filter((x): x is string => !!x));
  const nomeDi = (id: string) =>
    membri.find((m) => m.student_id === id)?.display_name ?? "un allievo";
  const archiviate = adesioni.filter((a) => a.archiviata_il);
  const simili = gruppiSimili(adesioni);
  if (adesioni.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("Hanno detto che vengono")} · {vive.length}
        {giaCollegati.size > 0 && (
          // Aderito e poi arrivato: è il tasso di conversione della Lezione
          // Zero, uno degli indicatori che vanno in Consiglio.
          <span className="ml-2 font-normal normal-case tracking-normal">
            {giaCollegati.size} {t("di loro sono arrivati")}
          </span>
        )}
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
            <div className="flex flex-wrap items-center gap-1">
              {a.user_id ? (
                <>
                  <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    {t("è")} {nomeDi(a.user_id)}
                  </span>
                  <Button size="sm" variant="ghost" disabled={busy}
                    onClick={() => void collega(a.id, null)}>
                    {t("Separa")}
                  </Button>
                </>
              ) : (
                membri.length > 0 && (
                  <Button size="sm" variant="ghost" disabled={busy}
                    onClick={() => setCollegando(collegando === a.id ? null : a.id)}>
                    {t("È arrivata")}
                  </Button>
                )
              )}
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void archivia(a.id)}>
                {t("Archivia")}
              </Button>
            </div>

            {collegando === a.id && (
              <div className="w-full rounded-lg border border-border p-2">
                <p className="mb-1 px-1 text-xs text-muted-foreground">
                  {t("Chi è, fra gli iscritti?")}
                </p>
                <div className="max-h-56 overflow-y-auto">
                  {candidatiPerAdesione(a, membri, giaCollegati).map((m) => (
                    <button key={m.student_id} disabled={busy}
                      onClick={() => void collega(a.id, m.student_id)}
                      className="block min-h-11 w-full rounded-md px-2 text-left text-sm hover:bg-muted">
                      {m.display_name ?? t("Senza nome")}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
