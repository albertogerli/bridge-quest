import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { Briciole } from "@/components/briciole";
import { FiguraDomanda } from "@/components/figura-domanda";
import { OpzioniCorrette } from "@/components/classi/opzioni-corrette";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
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
 * Un esercizio della Commissione a schermo, per l'insegnante: ogni domanda con
 * la figura, tutte le opzioni e la giusta in verde, come le vede l'allievo dopo
 * aver risposto.
 *
 * PERCHÉ. «Vedi» nel programma del corso portava all'elenco degli esercizi, con
 * solo Stampa e Assegna: per guardare le domande bisognava aprire il foglio da
 * stampare (Trevisaoi, 21/11/2026).
 *
 * COMPONENTE SERVER, come il foglio da stampare: il file contiene le risposte
 * giuste e non deve finire nel JavaScript scaricato da chiunque. La pagina la
 * apre solo chi insegna (`istruttori/layout.tsx`).
 */
export default async function VediEserciziPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const t = await tServer();
  const numero = Number((await searchParams).test);
  const test = TEST_COMMISSIONE.find((x) => x.numero === numero);
  if (!test) notFound();
  const domande = ((dati as { numero: number; domande: DomandaTest[] }[]).find((x) => x.numero === numero)?.domande ?? []).filter(
    (d) => !d.sospesa,
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: t("Le tue classi"), href: "/istruttori" },
          { etichetta: t("Esercizi"), href: "/istruttori/domande" },
          { etichetta: gruppoTest(test) },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-balance sm:text-3xl">{gruppoTest(test)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("{n} domande").replace("{n}", String(domande.length))}</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/istruttori/domande/stampa?test=${test.numero}`} target="_blank">
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t("Stampa")}
          </Link>
        </Button>
      </div>

      <ol className="grid gap-4">
        {domande.map((d) => {
          const figura = leggiFigura(d.figura);
          return (
            <li key={d.numero} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <p className="text-sm font-semibold text-muted-foreground tabular-nums">{titoloDomanda(test, d.numero)}</p>
              <p className="mt-1 font-semibold text-pretty">{d.testo}</p>
              {d.contesto && <p className="mt-1 text-sm text-pretty">{d.contesto}</p>}
              {figura && (
                <div className="mt-3">
                  <FiguraDomanda figura={figura} />
                </div>
              )}
              <div className="mt-3">
                <OpzioniCorrette opzioni={d.opzioni} data={null} risposte={[d.opzioni[d.giusta]]} />
              </div>
              {d.spiegazione && <p className="mt-3 text-sm text-muted-foreground text-pretty">{d.spiegazione}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
