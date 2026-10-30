"use client";

import Link from "@/components/link";
import { eInterno } from "@/lib/materiali-lezione";

/**
 * Il collegamento a un materiale di lezione.
 *
 * Due strade, e conta sceglierle bene. Una pagina di BridgeLab passa da `Link`
 * e conserva la lingua: sotto `/en` un `href="/dispense"` nudo porterebbe al
 * sito italiano. Un indirizzo esterno (YouTube, Drive, un PDF) si apre in
 * un'altra scheda, così chiudendo il video l'allievo ritrova la sua classe.
 */
export function CollegamentoMateriale({
  url,
  className,
  children,
}: {
  url: string;
  className?: string;
  children: React.ReactNode;
}) {
  // Un file del sito (la dispensa o gli esercizi in PDF) è interno ma non è
  // una pagina: si apre a parte come un PDF esterno.
  const file = /\.[a-z0-9]+$/i.test(url.split(/[?#]/)[0]);
  if (eInterno(url) && !file) {
    return (
      <Link href={url} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
