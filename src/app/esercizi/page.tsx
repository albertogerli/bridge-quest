"use client";

import { ChevronRight } from "lucide-react";
import Link from "@/components/link";
import { BricioleMateriale } from "@/components/briciole-materiale";
import { useT } from "@/contexts/traduzioni-provider";
import { SCHEDE_ESERCIZI } from "@/lib/esercizi-commissione";

/**
 * L'elenco degli esercizi della Commissione.
 *
 * PERCHÉ ESISTE. Esistevano solo le pagine dei singoli argomenti
 * (`/esercizi/vincenti-e-affrancabili`…), e l'indirizzo che avevamo dato a
 * Trevissoi — `bridgelab.it/esercizi` — finiva in «Pagina non trovata»
 * (segnalato il 02/11/2026). Pubblica come le schede: ci arriva anche chi
 * segue un link senza avere un account.
 */
export default function EserciziIndicePage() {
  const t = useT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <BricioleMateriale passi={[{ etichetta: t("Esercizi") }]} />
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Corso di Primo Livello")}</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("Esercizi")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Gli esercizi della Commissione Insegnamento, un argomento per pagina. Rispondi senza aiuti, poi apri la soluzione.")}
        </p>
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {SCHEDE_ESERCIZI.map((s) => {
            const quanti = s.temi.reduce((n, tema) => n + tema.esercizi.length, 0);
            return (
              <li key={s.slug}>
                <Link
                  href={`/esercizi/${s.slug}`}
                  className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.titolo}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {t("{n} esercizi", { n: quanti })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-xs text-muted-foreground">
          {t("Testi ed esercizi: Commissione Insegnamento FIGB · Scuola Bridge FIGB.")}
        </p>
      </div>
    </div>
  );
}
