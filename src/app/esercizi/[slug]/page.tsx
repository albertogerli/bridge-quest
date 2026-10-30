"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { Eye, EyeOff, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiguraEsercizio } from "@/components/esercizi/figura-esercizio";
import { TestoConSemi } from "@/components/esercizi/testo-con-semi";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { schedaEsercizi, type EsercizioCommissione } from "@/lib/esercizi-commissione";
import { eserciziDellaLezione } from "@/lib/materiali-corso";

/**
 * Gli esercizi della Commissione da fare a schermo.
 *
 * L'allievo legge la consegna, risponde da sé (a mente, su un foglio) e poi
 * apre la soluzione della Commissione, un esercizio alla volta. Il foglio da
 * stampare resta il PDF originale, senza soluzioni.
 *
 * Pubblica come il PDF da cui viene: ci arriva anche chi segue il link
 * mandato dall'insegnante senza avere ancora un account.
 */
export default function EserciziPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useT();
  const { lingua } = useLingua();
  const scheda = schedaEsercizi(slug);
  if (!scheda) notFound();
  const pdf = eserciziDellaLezione(scheda.lezioni[0]);
  const nomi = { nord: t("Nord"), ovest: t("Ovest"), est: t("Est"), sud: t("Sud") };

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Esercizi")}</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{scheda.titolo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Rispondi senza aiuti, poi apri la soluzione. Se un esercizio ti mette in difficoltà, chiedi in aula.")}
          {lingua === "en" && <> {t("Gli esercizi sono in italiano.")}</>}
        </p>
        {pdf && (
          <a
            href={pdf.file}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t("Il foglio da stampare (PDF)")}
          </a>
        )}

        {scheda.temi.map((tema) => (
          <section key={tema.tema} className="mt-8">
            <h2 className="mb-4 font-display text-lg font-bold">
              {tema.tema} · {tema.titolo}
            </h2>
            <ol className="space-y-5">
              {tema.esercizi.map((e) => (
                <Esercizio key={e.numero} esercizio={e} nomi={nomi} />
              ))}
            </ol>
          </section>
        ))}

        <p className="mt-10 text-xs text-muted-foreground">
          {t("Testi ed esercizi: Commissione Insegnamento FIGB · Scuola Bridge FIGB.")}
        </p>
      </div>
    </div>
  );
}

function Esercizio({
  esercizio: e,
  nomi,
}: {
  esercizio: EsercizioCommissione;
  nomi: Record<"nord" | "ovest" | "est" | "sud", string>;
}) {
  const t = useT();
  const [aperta, setAperta] = useState(false);
  const errate = (e.figure ?? []).filter((f) => f.errataOriginale);

  return (
    <li className="rounded-2xl border border-border bg-card/50 p-4">
      <p className="mb-3 whitespace-pre-line text-sm leading-relaxed">
        <span className="mr-1.5 font-display text-base font-bold text-primary">{e.numero}.</span>
        <TestoConSemi testo={e.consegna} />
      </p>
      {e.figure && e.figure.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {e.figure.map((f, i) => (
            <FiguraEsercizio key={i} figura={f} nomi={nomi} />
          ))}
        </div>
      )}
      {errate.map((f, i) => (
        <p key={i} className="mb-2 text-xs text-amber-700 dark:text-amber-300">
          {t("Nella figura {n} dell'originale c'è un errore: {errore}. L'abbiamo segnalato agli autori.", {
            n: f.etichetta ?? "",
            errore: f.errataOriginale ?? "",
          })}
        </p>
      ))}
      <Button size="sm" variant="outline" onClick={() => setAperta((v) => !v)} aria-expanded={aperta}>
        {aperta ? <EyeOff className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
        {aperta ? t("Nascondi la soluzione") : t("Mostra la soluzione")}
      </Button>
      {aperta && (
        <div className="mt-3 whitespace-pre-line rounded-xl bg-primary/5 p-3 text-sm leading-relaxed">
          <TestoConSemi testo={e.soluzione} />
        </div>
      )}
    </li>
  );
}
