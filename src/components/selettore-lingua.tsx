"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { LINGUE, NOME_LINGUA } from "@/lib/lingua";
import { useLingua } from "@/hooks/use-lingua";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il cambio lingua, che porta allo STESSO indirizzo nell'altra lingua.
 *
 * Non alla home: chi sta leggendo la lezione sul taglio e cambia lingua vuole
 * la stessa lezione in inglese, non ricominciare dal principio. È la
 * differenza fra un selettore utile e uno che si usa una volta sola.
 *
 * Sono link veri, non pulsanti con `router.push`: si possono aprire in una
 * scheda nuova, copiare, mandare a qualcuno. Un cambio lingua che non produce
 * un indirizzo condivisibile spreca metà del motivo per cui la lingua sta
 * nell'indirizzo.
 */
export function SelettoreLingua({ className = "" }: { className?: string }) {
  const t = useT();
  const { lingua, versoLingua } = useLingua();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t("Lingua")}</span>
      {LINGUE.map((l) => {
        const attiva = l === lingua;
        return (
          <Link
            key={l}
            href={versoLingua(l)}
            // `hreflang` dice ai motori di ricerca che cosa c'è dall'altra
            // parte, e ai lettori di schermo in che lingua è scritto il link.
            hrefLang={l}
            aria-current={attiva ? "true" : undefined}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              attiva
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {NOME_LINGUA[l]}
          </Link>
        );
      })}
    </div>
  );
}
