"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import { compitiSvoltiPerAllievo, getClassDetail, type ClassRoom } from "@/lib/instructors";
import type { RigaElenco } from "@/lib/riepiloghi-classe";
import { segnalaSalvoRete } from "@/lib/report-error";
import { ElencoAllieviEsporta } from "@/components/istruttori/elenco-allievi-esporta";

/**
 * Gli allievi di tutte le classi attive, in una tabella sola.
 *
 * Si carica a richiesta: costa una lettura per classe più una per compito, e
 * chi apre il portale per assegnare un compito non deve pagarla. Le classi
 * arrivano nell'ordine dell'elenco (la più vecchia per prima), gli allievi in
 * ordine alfabetico dentro ciascuna.
 */
export function ElencoAllieviTutte({ classi }: { classi: ClassRoom[] }) {
  const t = useT();
  const [righe, setRighe] = useState<RigaElenco[] | null>(null);
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore] = useState(false);

  async function carica() {
    setCaricando(true);
    setErrore(false);
    try {
      const perClasse = await Promise.all(
        classi.map(async (c) => {
          const d = await getClassDetail(c.id);
          const svolti = await compitiSvoltiPerAllievo(d.assignments);
          return [...d.members, ...d.inAttesa]
            .map((m) => ({
              nome: m.display_name ?? t("Allievo senza nome"),
              classe: c.name,
              stato: m.status === "pending" ? t("in attesa") : t("iscritto"),
              iscrittoIl: new Date(m.joined_at).toLocaleDateString("it-IT"),
              compitiSvolti: svolti.get(m.student_id) ?? 0,
              compitiAssegnati: d.assignments.length,
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
        }),
      );
      setRighe(perClasse.flat());
    } catch (err) {
      segnalaSalvoRete("insegnanti:elenco-tutte", err);
      setErrore(true);
    } finally {
      setCaricando(false);
    }
  }

  if (classi.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Users className="h-5 w-5 text-figb" aria-hidden="true" />
        <h2 className="font-semibold">{t("Allievi di tutte le classi")}</h2>
        {righe === null ? (
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void carica()} disabled={caricando}>
            {caricando ? t("Carico…") : t("Mostra l'elenco")}
          </Button>
        ) : (
          <div className="ml-auto">
            <ElencoAllieviEsporta righe={righe} titolo={t("Allievi di tutte le classi")} />
          </div>
        )}
      </div>
      {errore && (
        <p className="mt-2 text-sm text-destructive">{t("Non riesco a caricare l'elenco. Controlla la connessione e riprova.")}</p>
      )}
      {righe !== null && (
        righe.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("Nessun allievo nelle classi attive.")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">{t("Nome")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("Classe")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("Stato")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("Iscritto il")}</th>
                  <th className="py-2 text-right font-semibold">{t("Compiti svolti")}</th>
                </tr>
              </thead>
              <tbody>
                {righe.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.nome}</td>
                    <td className="py-2 pr-3">{r.classe}</td>
                    <td className="py-2 pr-3">{r.stato}</td>
                    <td className="py-2 pr-3 tabular-nums">{r.iscrittoIl}</td>
                    <td className="py-2 text-right tabular-nums">
                      {r.compitiSvolti}/{r.compitiAssegnati}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
}
