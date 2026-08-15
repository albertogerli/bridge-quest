"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { getMyClasses } from "@/lib/instructors";
import { reportError } from "@/lib/report-error";
import { StrumentiLezione } from "@/components/istruttori/strumenti-lezione";

/**
 * Il riquadro degli insegnanti in home.
 *
 * COMPARE PER RUOLO, NON PER NUMERO DI CLASSI
 * Prima si mostrava solo a chi aveva già almeno una classe. In produzione gli
 * istruttori sono quindici e solo sette hanno una classe: gli altri otto
 * aprivano la home e non trovavano nulla — nemmeno il modo di crearne una.
 * Chi ha appena ricevuto il ruolo è esattamente la persona che ha più bisogno
 * di vedere da dove si comincia.
 *
 * Gli strumenti sono quelli di `StrumentiLezione`, gli stessi del portale: due
 * elenchi separati divergono al primo strumento nuovo.
 */
export function InstructorCard() {
  const { user, profile, loading } = useSharedAuth();
  const [classCount, setClassCount] = useState<number | null>(null);

  const isIstruttore = profile?.role === "instructor" || profile?.role === "admin";

  useEffect(() => {
    // Senza sessione non si chiede nulla. Prima si chiamava sempre, e per ogni
    // visitatore anonimo `getMyClasses()` sollevava «Non autenticato»: un
    // evento Sentry a ogni visita della home, cioè la pagina più battuta del
    // sito. Non era un guasto, era la condizione normale di chi non ha ancora
    // fatto accesso.
    if (loading || !user || !isIstruttore) return;

    let alive = true;
    getMyClasses()
      .then((classes) => {
        if (alive) setClassCount(classes.length);
      })
      .catch((err) => {
        // Un guasto vero qui non deve rovinare la home: si mostrano comunque
        // gli strumenti, senza il conteggio.
        //
        // «Non autenticato» però non è un guasto: è la sessione scaduta fra il
        // disegno della pagina e la chiamata. Succede a chi lascia la scheda
        // aperta tutta la notte, non c'è niente da correggere, e segnalarlo
        // riempie le segnalazioni della pagina più visitata del sito.
        if (!(err instanceof Error) || err.message !== "Non autenticato") {
          reportError("home:classi-istruttore", err);
        }
        if (alive) setClassCount(0);
      });
    return () => {
      alive = false;
    };
  }, [user, loading, isIstruttore]);

  if (loading || !user || !isIstruttore) return null;

  return (
    <section className="px-5 mt-6" aria-labelledby="riquadro-istruttori">
      <h2
        id="riquadro-istruttori"
        className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3"
      >
        Per insegnare
      </h2>

      <div className="space-y-3">
        <Link
          href="/istruttori"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">Le tue classi</p>
            <p className="text-xs text-muted-foreground">
              {classCount === null
                ? "compiti e andamento"
                : classCount === 0
                  ? "Crea la prima classe e ottieni il codice invito"
                  : `${classCount === 1 ? "1 classe" : `${classCount} classi`} · compiti e andamento`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </Link>

        <StrumentiLezione />
      </div>
    </section>
  );
}
