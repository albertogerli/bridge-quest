import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "@/components/link";

/**
 * Un riquadro-collegamento della home: icona nel quadratino, titolo, una riga
 * di spiegazione, la freccia. Prima ogni avviso aveva il suo disegno, la sua
 * larghezza massima e il suo margine, e messi in fila non stavano allineati
 * (18/11/2026). Adesso sono tutti questo.
 */
export function RigaLink({
  href,
  Icona,
  titolo,
  testo,
  extra,
}: {
  href: string;
  Icona: LucideIcon;
  titolo: string;
  testo?: string;
  extra?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        <Icona className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-pretty">{titolo}</span>
        {testo && <span className="block text-sm text-muted-foreground text-pretty">{testo}</span>}
      </span>
      {extra}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
