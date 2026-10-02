"use client";

import Link from "@/components/link";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { useNascosti } from "@/hooks/use-permessi";

/**
 * Un gruppo di collegamenti in fondo a una pagina.
 *
 * PERCHÉ ESISTE. La barra del telefono aveva un cassetto «Altro» con dentro
 * otto destinazioni: profilo, amici, classifica, forum, negozio, trova ASD,
 * scopri, impostazioni. Un cassetto è il posto dove si mette quello che non
 * si è saputo dove mettere, e si riconosce da questo: le otto voci non
 * avevano niente in comune tranne l'essere avanzate.
 *
 * Tolto il cassetto, ognuna è andata dove la si cerca — le classifiche e gli
 * amici dentro Gioca, le dispense e il glossario dentro il Percorso, i premi
 * e le impostazioni nel Profilo. Questo componente è il modo di mostrarle lì
 * senza riscrivere tre volte la stessa griglia.
 *
 * NON È IL CASSETTO CON UN ALTRO NOME. La differenza è che ogni gruppo sta
 * nella pagina di cui parla, e ha un titolo che dice perché quelle voci sono
 * insieme. Se un giorno un gruppo si chiamasse «Altro», vorrebbe dire che
 * siamo tornati al punto di partenza.
 */
export interface Collegamento {
  href: string;
  /**
   * Un'icona di lucide, non un'emoji.
   *
   * L'avevo fatto con le emoji: si scrivono in fretta e sembrano allegre.
   * Ma il resto del sito usa lucide dentro un riquadro colorato, e un
   * elenco di emoji accanto a quelle schede sembra di un altro sito. Le
   * emoji per di più le disegna il sistema operativo: la stessa pagina è
   * grafica diversa su Android, iPhone e Windows, e non si può allineare
   * niente perché non si sa quanto sono larghe.
   */
  icona: LucideIcon;
  /** In italiano: la traduzione la fa il componente. */
  etichetta: string;
  /** Una riga che dice cosa ci si trova. Senza, è un elenco di parole. */
  descrizione: string;
}

/**
 * Le voci che l'insegnante non ha nascosto.
 *
 * Fuori dal componente perché è l'unica regola qui dentro, e una regola
 * dentro un componente non si prova.
 */
export function vociVisibili(
  voci: readonly Collegamento[],
  nascosti: ReadonlySet<string>,
): Collegamento[] {
  return voci.filter((v) => !nascosti.has(v.href));
}

export function CollegamentiSezione({
  titolo,
  voci,
}: {
  titolo: string;
  voci: readonly Collegamento[];
}) {
  const t = useT();
  // Niente lucchetti: un lucchetto dice «ti stanno tenendo fuori», l'assenza
  // dice «non è ancora il momento». È la stessa scelta della barra.
  const { nascosti } = useNascosti();
  const visibili = vociVisibili(voci, nascosti);
  if (visibili.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t(titolo)}
      </h2>
      {/* Stessa griglia, stesse misure e stesse utility delle schede di
          `/gioca`: card-clean + card-interactive, angoli 2xl, riquadro
          dell'icona 10×10 su `bg-figb/10`. Non è pigrizia — una pagina che
          usa due linguaggi grafici si legge come due pagine incollate. */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visibili.map((v) => {
          const Icona = v.icona;
          return (
            <Link
              key={v.href}
              href={v.href}
              className="card-clean card-interactive flex items-center gap-3 rounded-2xl bg-card p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-figb/10 dark:bg-primary/15">
                <Icona className="h-5 w-5 text-figb dark:text-primary" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground">
                  {t(v.etichetta)}
                </span>
                <span className="block text-[12px] leading-snug text-muted-foreground">
                  {t(v.descrizione)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
