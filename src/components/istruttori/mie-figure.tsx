"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { elencaFigure, type FiguraSalvata } from "@/lib/figure-insegnante";

/**
 * Le figure salvate in «Combinazioni», fra i materiali dell'insegnante: si
 * aprono già composte, pronte da proiettare (Trevissoi, 06/11/2026: «salvarla
 * con nome nell'area del materiale didattico personalizzato»).
 */
export function MieFigure() {
  const t = useT();
  const [figure, setFigure] = useState<FiguraSalvata[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void elencaFigure().then((f) => {
      if (vivo) setFigure(f);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-figb/10 text-figb flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{t("Le mie figure")}</p>
          <p className="text-xs text-muted-foreground">
            {t("Le combinazioni che hai composto e salvato con un nome, da proiettare a lezione.")}
          </p>
        </div>
        <Link href="/istruttori/combinazione" className="shrink-0 text-sm font-semibold text-primary hover:underline">
          {t("Componi")}
        </Link>
      </div>
      {figure && figure.length > 0 && (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {figure.map((f) => (
            <li key={f.id}>
              <Link
                href={`/istruttori/combinazione?figura=${f.id}`}
                className="flex items-center gap-2 py-2 text-sm hover:text-primary"
              >
                <span className="min-w-0 flex-1 truncate">{f.nome}</span>
                <span className="shrink-0 text-xs font-semibold text-primary">{t("Apri e proietta")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
