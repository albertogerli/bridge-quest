"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCatalog } from "@/store/use-catalog-store";
import { useSmazzate } from "@/store/use-smazzate-store";
import { assegnaLezione, getStatoCompiti, type StatoCompito } from "@/lib/instructors";
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
  const [caricando, setCaricando] = useState(true);
  const [inCorso, setInCorso] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [corsoAperto, setCorsoAperto] = useState<string | null>(null);

  async function ricarica() {
    try {
      setStato(await getStatoCompiti(classId));
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

  return (
    <div className="space-y-4">
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
                  return (
                    <div key={lezione.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{lezione.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {nMani} {nMani === 1 ? "mano" : "mani"}
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
                        </p>
                      </div>
                      {compito ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Check className="h-3 w-3" />
                            {t("Assegnata")}
                          </Badge>
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
                        <Button
                          size="sm"
                          disabled={inCorso !== null}
                          onClick={() => void assegna(lezione.id)}
                        >
                          {inCorso === lezione.id ? "Assegno…" : "Assegna"}
                        </Button>
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
