"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * La scia di navigazione delle pagine annidate.
 *
 * PERCHÉ CE N'ERA BISOGNO. Nelle pagine di classe ogni livello si era fatto il
 * suo «← Torna» a mano, e non tutti: da `/istruttori/[classId]/nuovo-compito`
 * non c'era nessun modo di risalire se non il tasto indietro del browser — che
 * nell'app installata da telefono non c'è. Cinque pagine, quattro soluzioni
 * diverse e un buco.
 *
 * SU TELEFONO MOSTRA SOLO L'ULTIMO PASSO, con la freccia: la scia intera
 * manderebbe a capo, e il gesto che serve lì è uno solo, tornare indietro di
 * un livello. Da schermo largo c'è tutta, che è l'unico posto dove serve
 * davvero — con tre livelli si vuole poter saltare al primo.
 */
export interface Briciola {
  etichetta: string;
  /** Assente sull'ultima, che è la pagina in cui si è già. */
  href?: string;
}

export function Briciole({ percorso }: { percorso: Briciola[] }) {
  const navigabili = percorso.filter((b) => b.href);
  const ultimoLink = navigabili[navigabili.length - 1];

  return (
    <nav aria-label="Percorso" className="mb-3 text-sm text-muted-foreground">
      {/* Telefono: solo il passo indietro. */}
      {ultimoLink && (
        <Link
          href={ultimoLink.href!}
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline sm:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
          {ultimoLink.etichetta}
        </Link>
      )}

      {/* Schermo largo: la scia intera. */}
      <ol className="hidden items-center gap-1.5 sm:flex">
        {percorso.map((b, i) => (
          <li key={`${b.etichetta}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
            {b.href ? (
              <Link href={b.href} className="hover:text-foreground hover:underline">
                {b.etichetta}
              </Link>
            ) : (
              <span className="max-w-[22ch] truncate font-medium text-foreground" aria-current="page">
                {b.etichetta}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
