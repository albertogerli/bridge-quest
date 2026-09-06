"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCatalog } from "@/store/use-catalog-store";
import { useSmazzate } from "@/store/use-smazzate-store";
import {
  apriRevisioni,
  assegnaLezione,
  assegnaManiLezione,
  getClassAssignments,
  getStatoCompiti,
  maniGiaAssegnate,
  type Assignment,
  type StatoCompito,
} from "@/lib/instructors";
import { aspettaLInsegnante } from "@/lib/revisioni";
import { reportError } from "@/lib/report-error";
import { compitoAssegnatoWhatsApp, linkWhatsApp } from "@/lib/whatsapp";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Le lezioni del corso, con lo stato per ciascuna e un pulsante per assegnarla.
 *
 * PERCHÉ ESISTE. «Assegna gli esercizi della lezione di stasera» è quello che
 * l'insegnante fa ogni settimana, e passava dal modulo di composizione: titolo,
 * nota, scadenza, e la scelta a mano delle otto smazzate. Il modulo resta —
 * serve per i compiti su misura — ma per il caso normale bastava un gesto.
 *
 * IL CONTEGGIO CHE SI VEDE è quanti allievi hanno finito TUTTE le mani, non
 * quante mani sono state giocate in totale. È il numero che serve per decidere
 * se andare avanti: sapere che venti mani su cento sono fatte non dice quanti
 * allievi sono pronti.
 *
 * Premere due volte non crea doppioni: se ne occupa il database, con un vincolo
 * su (classe, lezione). Qui non c'è nessuna difesa contro il doppio clic, e non
 * serve — due schede aperte non si parlerebbero comunque.
 */
export function AssegnaLezioni({ classId }: { classId: string }) {
  const t = useT();
  const { courses } = useCatalog();
  const { smazzate } = useSmazzate();
  const [stato, setStato] = useState<StatoCompito[]>([]);
  /** Serve solo per sapere se la revisione è ancora chiusa: `stato_compiti_classe` non lo dice. */
  const [compiti, setCompiti] = useState<Assignment[]>([]);
  const [caricando, setCaricando] = useState(true);
  const [inCorso, setInCorso] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [corsoAperto, setCorsoAperto] = useState<string | null>(null);
  /** La lezione di cui si stanno scegliendo le mani, e cosa c'è già dentro. */
  const [scelta, setScelta] = useState<
    { lessonId: number; titolo: string; gia: string[]; spuntate: Set<string> } | null
  >(null);

  async function ricarica() {
    try {
      const [s, c] = await Promise.all([getStatoCompiti(classId), getClassAssignments(classId)]);
      setStato(s);
      setCompiti(c);
    } catch (err) {
      reportError("assegna-lezioni:stato", err);
      setErrore("Non riesco a leggere lo stato dei compiti.");
    } finally {
      setCaricando(false);
    }
  }

  useEffect(() => {
    void ricarica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  /** Quante mani ha ogni lezione, secondo il catalogo. */
  const maniPerLezione = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of smazzate) m.set(s.lesson, (m.get(s.lesson) ?? 0) + 1);
    return m;
  }, [smazzate]);

  /** Il compito già assegnato per una lezione, se c'è. */
  const perLezione = useMemo(() => {
    const m = new Map<number, StatoCompito>();
    for (const c of stato) if (c.lesson_id != null) m.set(c.lesson_id, c);
    return m;
  }, [stato]);

  async function assegna(lessonId: number) {
    setInCorso(lessonId);
    setErrore(null);
    try {
      await assegnaLezione(classId, lessonId);
      await ricarica();
    } catch (err) {
      reportError("assegna-lezioni:assegna", err);
      setErrore("Non sono riuscito ad assegnare la lezione.");
    } finally {
      setInCorso(null);
    }
  }

  /** Apre la scelta delle mani per una lezione, con le già assegnate segnate. */
  async function apriScelta(lessonId: number, titolo: string) {
    setErrore(null);
    try {
      const gia = await maniGiaAssegnate(classId, lessonId);
      // Le già assegnate partono spuntate: la spunta dice «questa mano fa parte
      // del compito», non «questa la sto aggiungendo adesso».
      setScelta({ lessonId, titolo, gia, spuntate: new Set(gia) });
    } catch (err) {
      reportError("assegna-lezioni:scelta", err);
      setErrore("Non riesco a leggere cosa è già assegnato.");
    }
  }

  async function confermaScelta() {
    if (!scelta) return;
    setInCorso(scelta.lessonId);
    setErrore(null);
    try {
      await assegnaManiLezione(classId, scelta.lessonId, scelta.titolo, [...scelta.spuntate]);
      setScelta(null);
      await ricarica();
    } catch (err) {
      reportError("assegna-lezioni:assegna-parziale", err);
      setErrore("Non sono riuscito ad assegnare le mani scelte.");
    } finally {
      setInCorso(null);
    }
  }

  async function apri(assignmentId: string) {
    setErrore(null);
    try {
      await apriRevisioni([assignmentId]);
      await ricarica();
    } catch (err) {
      reportError("assegna-lezioni:apri-revisione", err);
      setErrore("Non sono riuscito ad aprire la revisione.");
    }
  }

  if (caricando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Solo i corsi che hanno almeno una lezione con delle mani: gli altri
  // riempirebbero l'elenco di righe su cui non c'è niente da assegnare.
  const corsi = courses
    .map((c) => ({
      ...c,
      lezioni: c.lessons.filter((l) => (maniPerLezione.get(l.id) ?? 0) > 0),
    }))
    .filter((c) => c.lezioni.length > 0);

  /** Le mani di una lezione, in ordine di board. */
  function maniDella(lessonId: number) {
    return smazzate
      .filter((sm) => sm.lesson === lessonId)
      .sort((a, b) => a.board - b.board);
  }

  return (
    <div className="space-y-4">
      {scelta && (
        <div className="rounded-lg border border-primary/40 bg-card p-4">
          <p className="font-display text-base font-semibold">
            {t("Quali mani assegnare")} — {scelta.titolo}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Le mani già assegnate sono spuntate. Togliere la spunta non le leva dal compito: si possono solo aggiungere.")}
          </p>

          <div className="mt-3 divide-y divide-border">
            {maniDella(scelta.lessonId).map((sm) => {
              const gia = scelta.gia.includes(sm.id);
              return (
                <label
                  key={sm.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={scelta.spuntate.has(sm.id)}
                    disabled={gia}
                    onChange={() =>
                      setScelta((s0) => {
                        if (!s0) return s0;
                        const spuntate = new Set(s0.spuntate);
                        if (spuntate.has(sm.id)) spuntate.delete(sm.id);
                        else spuntate.add(sm.id);
                        return { ...s0, spuntate };
                      })
                    }
                  />
                  <span className="text-sm">
                    {t("Mano")} {sm.board} · {sm.contract}
                  </span>
                  {gia && (
                    <Badge variant="secondary" className="ml-auto">
                      {t("già assegnata")}
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={inCorso !== null || scelta.spuntate.size === scelta.gia.length}
              onClick={() => void confermaScelta()}
            >
              {t("Assegna le mani scelte")}
            </Button>
            <Button variant="ghost" onClick={() => setScelta(null)}>
              {t("Annulla")}
            </Button>
          </div>
        </div>
      )}

      {errore && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errore}
        </p>
      )}

      {corsi.map((corso) => {
        const aperto = corsoAperto === corso.id;
        const assegnate = corso.lezioni.filter((l) => perLezione.has(l.id)).length;
        return (
          <div key={corso.id} className="rounded-lg border border-border">
            <button
              onClick={() => setCorsoAperto(aperto ? null : corso.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
            >
              <span className="font-display text-base font-semibold">{corso.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {assegnate}/{corso.lezioni.length} assegnate
              </Badge>
              <span className="text-muted-foreground">{aperto ? "−" : "+"}</span>
            </button>

            {aperto && (
              <div className="divide-y divide-border border-t border-border">
                {corso.lezioni.map((lezione) => {
                  const nMani = maniPerLezione.get(lezione.id) ?? 0;
                  const compito = perLezione.get(lezione.id);
                  // La revisione ancora chiusa, e se è il caso grave: hanno
                  // finito tutti e stanno aspettando. Vedi `revisioni.ts`.
                  const daAprire =
                    compito &&
                    compiti.some((a) => a.id === compito.assignment_id && aspettaLInsegnante(a));
                  const finitaDaTutti =
                    !!compito && compito.n_allievi > 0 && compito.n_completi >= compito.n_allievi;
                  return (
                    <div key={lezione.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{lezione.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {compito ? `${compito.n_mani}/${nMani} ${t("mani assegnate")}` : `${nMani} ${nMani === 1 ? "mano" : "mani"}`}
                          {compito && (
                            <>
                              {" · "}
                              <span
                                className={
                                  compito.n_completi === compito.n_allievi && compito.n_allievi > 0
                                    ? "font-semibold text-emerald-600"
                                    : ""
                                }
                              >
                                {compito.n_completi}/{compito.n_allievi} l&rsquo;hanno finita
                              </span>
                            </>
                          )}
                          {daAprire && (
                            <>
                              {" · "}
                              {/* Quando hanno finito tutti la revisione chiusa
                                  fa danno adesso: si marca. Quando ha finito
                                  qualcuno è solo un promemoria. In entrambi i
                                  casi resta sulla stessa riga — questa
                                  schermata l'insegnante la scorre. */}
                              <span
                                className={
                                  finitaDaTutti
                                    ? "font-semibold text-amber-700 dark:text-amber-400"
                                    : "text-muted-foreground"
                                }
                              >
                                {finitaDaTutti ? t("revisione da aprire") : t("revisione chiusa")}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      {compito ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {compito.n_mani >= nMani ? (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" />
                              {t("Assegnata")}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={inCorso !== null}
                              onClick={() => void apriScelta(lezione.id, lezione.title)}
                            >
                              {t("Aggiungi mani")}
                            </Button>
                          )}
                          <a
                            href={linkWhatsApp(
                              compitoAssegnatoWhatsApp(
                                compito.title,
                                classId,
                                compito.assignment_id,
                                compito.n_mani,
                              ),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              {t("Avvisa")}
                            </Button>
                          </a>
                          {daAprire && (
                            <Button
                              size="sm"
                              variant={finitaDaTutti ? "default" : "ghost"}
                              disabled={inCorso !== null}
                              onClick={() => void apri(compito.assignment_id)}
                            >
                              {t("Apri la revisione")}
                            </Button>
                          )}
                          <Link href={`/istruttori/dispensa?compito=${compito.assignment_id}`}>
                            <Button size="sm" variant="ghost">
                              {t("Dispensa")}
                            </Button>
                          </Link>
                          <Link href={`/istruttori/${classId}/compito/${compito.assignment_id}`}>
                            <Button size="sm" variant="ghost">
                              {t("Risultati")}
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* L'assegnazione a blocco resta la principale: è quella
                              che farà la maggior parte degli insegnanti. */}
                          <Button
                            size="sm"
                            disabled={inCorso !== null}
                            onClick={() => void assegna(lezione.id)}
                          >
                            {inCorso === lezione.id ? "Assegno…" : "Assegna"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={inCorso !== null}
                            onClick={() => void apriScelta(lezione.id, lezione.title)}
                          >
                            {t("Scegli le mani")}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
