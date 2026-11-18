"use client";

import Link from "@/components/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { usePercorso } from "@/hooks/use-lingua";
import { destinazioneIndietro } from "@/lib/navigazione-indietro";

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
  const t = useT();
  const navigabili = percorso.filter((b) => b.href);
  const ultimoLink = navigabili[navigabili.length - 1];
  /*
   * UN SOLO RITORNO PER PAGINA. La cornice mette già «← Torna alla classe» in
   * cima alle pagine delle classi (`TornaIndietro`): con la scia sotto, sul
   * telefono c'erano due link indietro uno sopra l'altro, «Torna alle mie
   * classi» e «‹ Le mie classi» (guida allievi, 14/11/2026). Sul telefono
   * vince quello della cornice; sullo schermo largo vince la scia, che dice
   * di più, e la cornice si nasconde da sé (`[data-briciole]` in globals.css).
   */
  const ritornoInCornice = destinazioneIndietro(usePercorso()) != null;

  // «Percorso di navigazione» e non «Percorso»: dal 27/09/2026 «Percorso» è
  // anche una delle quattro schede della barra, e il dizionario ha UNA CHIAVE
  // SOLA per ogni parola italiana. Con la chiave condivisa la scheda della
  // barra usciva «Breadcrumb» in inglese.
  //
  // L'etichetta è comunque migliore così: a un lettore di schermo «Percorso»
  // da solo non dice di che percorso si tratta.
  return (
    <nav data-briciole aria-label={t("Percorso di navigazione")} className="mb-3 text-sm text-muted-foreground">
      {/* Telefono: solo il passo indietro, se la cornice non lo dà già. */}
      {ultimoLink && !ritornoInCornice && (
        <Link
          href={ultimoLink.href!}
          className="-my-2 inline-flex min-h-11 items-center gap-1 py-2 pr-3 hover:text-foreground hover:underline sm:hidden"
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
