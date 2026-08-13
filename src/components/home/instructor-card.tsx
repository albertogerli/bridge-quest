"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Presentation, Wand2, ChevronRight } from "lucide-react";
import { getMyClasses } from "@/lib/instructors";
import { reportError } from "@/lib/report-error";
import { useSharedAuth } from "@/contexts/auth-provider";

/**
 * Scorciatoie per chi insegna, in homepage.
 *
 * Compare SOLO a chi ha almeno una classe: per tutti gli altri non rende nulla,
 * così la home non si riempie di voci inutilizzabili. È anche il motivo per cui
 * il controllo non è sul ruolo ma sulle classi possedute — un ruolo assegnato e
 * mai usato non giustifica un riquadro in prima pagina.
 *
 * Serve a risolvere un problema misurato: le funzioni per gli istruttori
 * esistono da mesi ma `/istruttori` ha avuto 46 visitatori in tre mesi, e il
 * generatore di mani non era raggiungibile da nessun percorso di navigazione.
 */
export function InstructorCard() {
  const { user, loading } = useSharedAuth();
  const [classCount, setClassCount] = useState<number | null>(null);

  useEffect(() => {
    // Senza sessione non si chiede nulla. Prima si chiamava sempre, e per ogni
    // visitatore anonimo `getMyClasses()` sollevava «Non autenticato»: un
    // evento Sentry a ogni visita della home, cioè la pagina più battuta del
    // sito. Non era un guasto, era la condizione normale di chi non ha ancora
    // fatto accesso.
    if (loading || !user) return;

    let alive = true;
    getMyClasses()
      .then((classes) => {
        if (alive) setClassCount(classes.length);
      })
      .catch((err) => {
        // Un guasto vero qui non deve rovinare la home: il riquadro non
        // compare e basta.
        reportError("home:classi-istruttore", err);
        if (alive) setClassCount(0);
      });
    return () => {
      alive = false;
    };
  }, [user, loading]);

  if (!classCount) return null;

  return (
    <section className="px-4 mb-8" aria-labelledby="home-istruttore">
      <h2 id="home-istruttore" className="text-lg font-bold font-display mb-3">
        Per l&apos;insegnante
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
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
              {classCount === 1 ? "1 classe" : `${classCount} classi`} · compiti e
              andamento
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </Link>

        <Link
          href="/istruttori/genera-mani"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
            <Wand2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">Genera mani</p>
            <p className="text-xs text-muted-foreground">
              Mani su misura per l&apos;argomento della lezione
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </Link>

        <Link
          href="/istruttori/lavagna"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
            <Presentation className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">Lavagna</p>
            <p className="text-xs text-muted-foreground">
              Da proiettare in aula: si scopre una mano per volta
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
