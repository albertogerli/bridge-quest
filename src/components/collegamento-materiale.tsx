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
  if (eInterno(url)) {
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
