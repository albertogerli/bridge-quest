"use client";

import { Download, FileText, Presentation } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Briciole } from "@/components/briciole";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { MATERIALI_CORSO, type Materiale } from "@/lib/materiali-corso";

/**
 * Slide da proiettare e dispense da stampare, modulo per modulo.
 *
 * Solo per insegnanti: il layout di `/istruttori` lascia entrare solo loro.
 * Le infografiche di ogni lezione restano dove le trovano gli allievi, nella
 * pagina della lezione e in `/dispense`.
 */
export default function MaterialiPage() {
  const t = useT();
  const { lingua } = useLingua();

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-4xl">
        <Briciole percorso={[{ etichetta: "Le tue classi", href: "/istruttori" }, { etichetta: "Materiali del corso" }]} />
        <h1 className="text-2xl font-bold font-display mb-1">{t("Materiali del corso")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("Le slide da proiettare in aula e le dispense da stampare o mandare agli allievi.")}
          {lingua === "en" && <> {t("I PDF sono in italiano.")}</>}
        </p>

        {MATERIALI_CORSO.map((modulo) => (
          <section key={modulo.titolo} className="mb-8">
            <h2 className="text-lg font-bold font-display">{t(modulo.titolo)}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t(modulo.descrizione)}</p>

            <Gruppo titolo={t("Slide da proiettare")} icona={Presentation} materiali={modulo.slide} />
            <Gruppo titolo={t("Dispense")} icona={FileText} materiali={modulo.dispense} />
          </section>
        ))}
      </div>
    </div>
  );
}

function Gruppo({ titolo, icona: Icona, materiali }: { titolo: string; icona: LucideIcon; materiali: Materiale[] }) {
  const t = useT();
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">{titolo}</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {materiali.map((m) => (
          <li key={m.file}>
            <a
              href={m.file}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
                <Icona className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{t(m.titolo)}</p>
                <p className="text-xs text-muted-foreground">
                  {m.lezioni.length === 1
                    ? t("Lezione {n}", { n: m.lezioni[0] })
                    : t("Lezioni {da}–{a}", { da: m.lezioni[0], a: m.lezioni[m.lezioni.length - 1] })}
                  {" · "}
                  {t("{n} pagine", { n: m.pagine })}
                </p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
