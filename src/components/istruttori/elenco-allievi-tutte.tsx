"use client";

import { Fragment, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import {
  compitiSvoltiPerAllievo,
  getClassDetail,
  type ClassRoom,
} from "@/lib/instructors";
import { ordinaElenco, type RigaElenco } from "@/lib/riepiloghi-classe";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { ElencoAllieviEsporta } from "@/components/istruttori/elenco-allievi-esporta";

/**
 * Gli allievi di tutte le classi attive, in una tabella sola.
 *
 * Si carica a richiesta: costa una lettura per classe più una per compito, e
 * chi apre il portale per assegnare un compito non deve pagarla. In ordine di
 * registro: classe, cognome, nome. Un tocco sulla riga apre quello che
 * l'allievo ha scritto nel modulo d'adesione (Trevissoi, 29/10/2026).
 */
export function ElencoAllieviTutte({ classi }: { classi: ClassRoom[] }) {
  const t = useT();
  const [righe, setRighe] = useState<RigaElenco[] | null>(null);
  const [aperta, setAperta] = useState<number | null>(null);
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore] = useState(false);

  async function carica() {
    setCaricando(true);
    setErrore(false);
    try {
      const perClasse = await Promise.all(
        classi.map(async (c) => {
          const d = await getClassDetail(c.id);
          const [svolti, adesioni] = await Promise.all([
            compitiSvoltiPerAllievo(d.assignments),
            adesioniCollegate(c.id),
          ]);
          return [...d.members, ...d.inAttesa].map((m) => {
            const a = adesioni.get(m.student_id);
            return {
              nome: m.display_name ?? t("Allievo senza nome"),
              classe: c.name,
              stato: m.status === "pending" ? t("in attesa") : t("iscritto"),
              iscrittoIl: new Date(m.joined_at).toLocaleDateString("it-IT"),
              compitiSvolti: svolti.get(m.student_id) ?? 0,
              compitiAssegnati: d.assignments.length,
              contatto: a?.contatto ?? undefined,
              note: a?.note ?? undefined,
            };
          });
        }),
      );
      setRighe(ordinaElenco(perClasse.flat()));
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
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => void carica()}
            disabled={caricando}
          >
            {caricando ? t("Carico…") : t("Mostra l'elenco")}
          </Button>
        ) : (
          <div className="ml-auto">
            <ElencoAllieviEsporta
              righe={righe}
              titolo={t("Allievi di tutte le classi")}
            />
          </div>
        )}
      </div>
      {errore && (
        <p className="mt-2 text-sm text-destructive">
          {t(
            "Non riesco a caricare l'elenco. Controlla la connessione e riprova.",
          )}
        </p>
      )}
      {righe !== null &&
        (righe.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("Nessun allievo nelle classi attive.")}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">{t("Nome")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("Classe")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("Stato")}</th>
                  <th className="py-2 pr-3 font-semibold">
                    {t("Iscritto il")}
                  </th>
                  <th className="py-2 text-right font-semibold">
                    {t("Compiti svolti")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {righe.map((r, i) => (
                  <Fragment key={i}>
                    <tr
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                      onClick={() => setAperta(aperta === i ? null : i)}
                      aria-expanded={aperta === i}
                    >
                      <td className="py-2 pr-3 font-medium">
                        <span
                          className="mr-1 text-muted-foreground"
                          aria-hidden="true"
                        >
                          {aperta === i ? "▾" : "▸"}
                        </span>
                        {r.nome}
                      </td>
                      <td className="py-2 pr-3">{r.classe}</td>
                      <td className="py-2 pr-3">{r.stato}</td>
                      <td className="py-2 pr-3 tabular-nums">{r.iscrittoIl}</td>
                      <td className="py-2 text-right tabular-nums">
                        {r.compitiSvolti}/{r.compitiAssegnati}
                      </td>
                    </tr>
                    {aperta === i && (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan={5} className="px-3 py-2 text-sm">
                          {r.contatto || r.note ? (
                            <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-4">
                              <dt className="font-semibold">{t("Contatto")}</dt>
                              <dd>{r.contatto || "—"}</dd>
                              <dt className="font-semibold">{t("Note")}</dt>
                              <dd className="whitespace-pre-line">
                                {r.note || "—"}
                              </dd>
                            </dl>
                          ) : (
                            <p className="text-muted-foreground">
                              {t(
                                "Nessun modulo d'adesione collegato a questo allievo. Si collega da «Hanno detto che vengono», nella pagina della classe.",
                              )}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}

/**
 * Le adesioni della classe già collegate a un allievo, per allievo.
 * Se la tabella non c'è o la lettura fallisce, l'elenco resta senza contatti.
 */
async function adesioniCollegate(
  classId: string,
): Promise<Map<string, { contatto: string; note: string | null }>> {
  const { data, error } = await createClient()
    .from("adesioni")
    .select("user_id, contatto, note")
    .eq("class_id", classId)
    .not("user_id", "is", null);
  if (error) {
    segnalaSalvoRete("insegnanti:elenco-adesioni", error);
    return new Map();
  }
  return new Map(
    (data ?? []).map((r) => [
      r.user_id as string,
      {
        contatto: r.contatto as string,
        note: (r.note as string | null) ?? null,
      },
    ]),
  );
}
