"use client";

import Link from "next/link";
import { ChevronRight, Presentation, Printer, Users, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Gli strumenti per la lezione, in un posto solo.
 *
 * Stesso elenco nel portale istruttori e nel riquadro della home: due copie
 * divergono al primo strumento nuovo, e uno dei due percorsi resta indietro
 * senza che nessuno se ne accorga. È già successo — il generatore di mani è
 * rimasto per un po' senza alcun collegamento nella navigazione.
 */
export interface Strumento {
  href: string;
  titolo: string;
  descrizione: string;
  icona: LucideIcon;
}

export const STRUMENTI_LEZIONE: Strumento[] = [
  {
    href: "/istruttori/tavolo",
    titolo: "Tavolo condiviso",
    descrizione: "Tu vedi tutte le mani, gli allievi solo la propria",
    icona: Users,
  },
  {
    href: "/istruttori/genera-mani",
    titolo: "Genera mani",
    descrizione: "Mani su misura per l'argomento della lezione",
    icona: Wand2,
  },
  {
    href: "/istruttori/lavagna",
    titolo: "Lavagna",
    descrizione: "Da proiettare in aula: si scopre una mano per volta",
    icona: Presentation,
  },
  {
    href: "/istruttori/dispensa",
    titolo: "Dispensa",
    descrizione: "Il foglio da consegnare, con le soluzioni in fondo",
    icona: Printer,
  },
];

export function StrumentiLezione({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {STRUMENTI_LEZIONE.map(({ href, titolo, descrizione, icona: Icona }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
            <Icona className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{titolo}</p>
            <p className="text-xs text-muted-foreground">{descrizione}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
