"use client";

import { Download, FileText, ListChecks, Presentation, Spade } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Briciole } from "@/components/briciole";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { MATERIALI_CORSO, type Esercizi, type ManiCommissione, type Materiale } from "@/lib/materiali-corso";

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
          {t("Le slide da proiettare in aula, le dispense e gli esercizi da stampare o mandare agli allievi.")}
          {lingua === "en" && <> {t("I PDF sono in italiano.")}</>}
        </p>

        {MATERIALI_CORSO.map((modulo) => (
          <section key={modulo.titolo} className="mb-8">
            <h2 className="text-lg font-bold font-display">{t(modulo.titolo)}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t(modulo.descrizione)}</p>

            <Gruppo titolo={t("Slide da proiettare")} icona={Presentation} materiali={modulo.slide} />
            <Gruppo titolo={t("Dispense")} icona={FileText} materiali={modulo.dispense} />
            <GruppoEsercizi esercizi={modulo.esercizi} />
            <GruppoMani mani={modulo.mani} />
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          {t("Testi, esercizi e smazzate: Commissione Insegnamento FIGB · Scuola Bridge FIGB. Impaginazione BridgeLab.")}
        </p>
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
                  {etichettaLezioni(m.lezioni, t)}
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

function etichettaLezioni(lezioni: number[], t: ReturnType<typeof useT>) {
  return lezioni.length === 1
    ? t("Lezione {n}", { n: lezioni[0] })
    : t("Lezioni {da}–{a}", { da: lezioni[0], a: lezioni[lezioni.length - 1] });
}

/** Il foglio per l'allievo e, a parte, le soluzioni per l'insegnante. */
function GruppoEsercizi({ esercizi }: { esercizi: Esercizi[] }) {
  const t = useT();
  if (esercizi.length === 0) return null;
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-muted-foreground mb-1">{t("Esercizi")}</h3>
      <p className="text-xs text-muted-foreground mb-2">
        {t("Il foglio per gli allievi è senza soluzioni: le trovi a parte. Per darlo alla classe, pubblicalo dai «Materiali dopo la lezione» della classe.")}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {esercizi.map((e) => (
          <li key={e.file} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{t(e.titolo)}</p>
              <p className="text-xs text-muted-foreground">
                {etichettaLezioni(e.lezioni, t)} · {t("{n} pagine", { n: e.pagine })}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold">
                <a href={e.file} target="_blank" rel="noopener" className="text-primary hover:underline">
                  {t("Esercizi")}
                </a>
                <a href={e.soluzioni} target="_blank" rel="noopener" className="text-primary hover:underline">
                  {t("Soluzioni")}
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Le smazzate della Commissione che il catalogo non ha: si assegnano da «Nuovo compito». */
function GruppoMani({ mani }: { mani: ManiCommissione[] }) {
  const t = useT();
  if (mani.length === 0) return null;
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-muted-foreground mb-1">{t("Altre smazzate della Commissione")}</h3>
      <p className="text-xs text-muted-foreground mb-2">
        {t("Le smazzate delle altre lezioni della Commissione sono già tra le mani di ogni lezione, con il commento. Queste le trovi in «Nuovo compito» di ogni classe, sotto «Mani della Commissione»: hanno il contratto, non il commento.")}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {mani.map((m) => (
          <li key={m.file} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
              <Spade className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{t(m.titolo)}</p>
              <p className="text-xs text-muted-foreground">
                {etichettaLezioni(m.lezioni, t)} · {t("{n} smazzate", { n: m.smazzate })}
              </p>
            </div>
            <a
              href={m.file}
              download
              className="text-xs font-semibold text-primary hover:underline shrink-0"
              aria-label={t("Scarica il file PBN di «{titolo}»", { titolo: t(m.titolo) })}
            >
              PBN
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
