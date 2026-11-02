"use client";

import { Download, FileText, ListChecks, Presentation, Spade } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Briciole } from "@/components/briciole";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import Link from "@/components/link";
import { MATERIALI_CORSO, type Esercizi, type ManiCommissione, type Materiale } from "@/lib/materiali-corso";
import { MODULI_PROGRAMMA, PROGRAMMA_PRIMO_LIVELLO } from "@/lib/programma-corso";

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

        <Programma />

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
        {t("A schermo l'allievo risponde e poi apre la soluzione di ogni esercizio; il foglio da stampare è senza soluzioni, che trovi a parte. Per darli alla classe, pubblicali dai «Materiali dopo la lezione» della classe.")}
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
                <Link href={e.online} className="text-primary hover:underline">
                  {t("A schermo")}
                </Link>
                <a href={e.file} target="_blank" rel="noopener" className="text-primary hover:underline">
                  {t("Da stampare")}
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

/**
 * Il programma ufficiale, lezione per lezione, con quello che il sito ha per
 * ciascuna. Vedi `programma-corso.ts`: la corrispondenza è da confermare.
 */
function Programma() {
  const t = useT();
  const titoliMani = new Map(MATERIALI_CORSO.flatMap((m) => m.mani.map((x) => [x.file, x.titolo] as const)));
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold font-display">{t("Programma del Corso di Primo Livello")}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("Le venti lezioni della Commissione e, per ognuna, la lezione del sito da assegnare o le smazzate da giocare in aula. Le lezioni di gioco non hanno teoria nuova: si gioca al tavolo con il tutoraggio.")}
      </p>
      {([1, 2] as const).map((modulo) => (
        <div key={modulo} className="mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t(MODULI_PROGRAMMA[modulo])}</h3>
          <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {PROGRAMMA_PRIMO_LIVELLO.filter((l) => l.modulo === modulo).map((l) => (
              <li key={l.numero} className="flex gap-3 px-4 py-3">
                <span className="w-7 shrink-0 font-display text-lg font-bold tabular-nums text-primary">{l.numero}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t(l.titolo)}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{l.tipo === "gioco" ? t("Gioco") : t("Teoria e gioco")}</span>
                    {l.lezioniSito.map((id) => (
                      <Link key={id} href={`/lezioni/${id}`} className="font-semibold text-primary hover:underline">
                        {t("Lezione {n} del sito", { n: id })}
                      </Link>
                    ))}
                    {l.mani.map((f) => (
                      <span key={f}>{t("Mani: {titolo}", { titolo: t(titoliMani.get(f) ?? "") })}</span>
                    ))}
                    {l.lezioniSito.length === 0 && l.mani.length === 0 && (
                      <span>{l.tipo === "gioco" ? t("Smazzate da scegliere in «Nuovo compito»") : t("Materiale in preparazione")}</span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}
