"use client";

import { useEffect, useState } from "react";
import { volteCompromessa } from "@/lib/password-compromessa";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Avviso, non blocco: se la password compare negli elenchi di password rubate
 * lo si dice sotto il campo, e la persona decide. Si controlla dopo una breve
 * pausa nella digitazione, e la password non lascia mai il browser (vedi
 * `lib/password-compromessa.ts`).
 */
export function AvvisoPassword({ password }: { password: string }) {
  const t = useT();
  const [volte, setVolte] = useState<number | null>(null);

  useEffect(() => {
    if (password.length < 6) return;
    const annulla = new AbortController();
    const timer = setTimeout(() => {
      void volteCompromessa(password, annulla.signal).then((n) => {
        if (!annulla.signal.aborted) setVolte(n);
      });
    }, 600);
    return () => {
      clearTimeout(timer);
      annulla.abort();
    };
  }, [password]);

  if (password.length < 6 || !volte) return null;
  return (
    <p role="status" className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
      ⚠️ {t("Questa password compare in elenchi di password rubate: puoi usarla, ma è meglio sceglierne una che usi solo qui.")}
    </p>
  );
}
