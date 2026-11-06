import { notFound } from "next/navigation";
import { FiguraDomanda } from "@/components/figura-domanda";
import { PulsanteStampa } from "@/components/istruttori/pulsante-stampa";
import { leggiFigura } from "@/lib/figura-domanda";
import { gruppoTest, TEST_COMMISSIONE, titoloDomanda } from "@/lib/test-commissione";
import { tServer } from "@/lib/traduzioni-server";
import dati from "@/data/commissione/test-commissione.json";

interface DomandaTest {
  numero: string;
  testo: string;
  contesto?: string;
  figura: unknown;
  opzioni: string[];
  giusta: number;
  spiegazione?: string;
  sospesa?: boolean;
}

/**
 * Il foglio di un esercizio della Commissione, da stampare o salvare in PDF:
 * le domande con le figure e le caselle da barrare, e in fondo, su una pagina
 * a parte, le soluzioni per l'insegnante.
 *
 * COMPONENTE SERVER, E SOTTO `/istruttori`. Il file delle domande contiene le
 * risposte giuste: qui lo legge il server, e la pagina la apre solo chi
 * insegna (lo controlla `istruttori/layout.tsx`). In un componente client
 * finirebbe nel JavaScript che scarica chiunque.
 */
export default async function StampaEserciziPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const t = await tServer();
  const numero = Number((await searchParams).test);
  const test = TEST_COMMISSIONE.find((x) => x.numero === numero);
  if (!test) notFound();
  const domande = ((dati as { numero: number; domande: DomandaTest[] }[]).find((x) => x.numero === numero)?.domande ?? []).filter(
    (d) => !d.sospesa,
  );

  return (
    <div className="min-h-screen bg-white text-[#0f1219] print:min-h-0">
      <div className="mx-auto max-w-[800px] p-8 print:p-0">
        <div className="mb-6 flex justify-end print:hidden">
          <PulsanteStampa />
        </div>

        <header className="mb-6 border-b border-[#0f1219]/20 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0f1219]/60">
            {t("Scuola Bridge FIGB · Commissione Insegnamento")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">{gruppoTest(test)}</h1>
          <p className="mt-3 text-sm">{t("Nome e cognome")}: ______________________________</p>
        </header>

        <ol className="space-y-6">
          {domande.map((d) => {
            const figura = leggiFigura(d.figura);
            return (
              <li key={d.numero} className="break-inside-avoid">
                <p className="mb-2 font-semibold">
                  <span className="mr-2 text-[#0f1219]/60">{titoloDomanda(test, d.numero)}</span>
                  {d.testo}
                  {d.contesto && <span className="block font-normal">{d.contesto}</span>}
                </p>
                {figura && <FiguraDomanda figura={figura} />}
                <ul className="space-y-1">
                  {d.opzioni.map((o) => (
                    <li key={o} className="flex items-start gap-2">
                      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm border border-[#0f1219]" aria-hidden="true" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>

        <section className="mt-12 break-before-page">
          <h2 className="mb-1 font-display text-xl font-bold">{t("Soluzioni")}</h2>
          <p className="mb-4 text-sm text-[#0f1219]/70">{gruppoTest(test)}</p>
          <ol className="columns-2 gap-8 text-sm">
            {domande.map((d) => (
              <li key={d.numero} className="mb-1.5 break-inside-avoid">
                <span className="font-semibold">{titoloDomanda(test, d.numero)}</span> {d.opzioni[d.giusta]}
                {d.spiegazione && <span className="block text-xs text-[#0f1219]/70">{d.spiegazione}</span>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
