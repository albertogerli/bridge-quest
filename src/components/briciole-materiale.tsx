"use client";

import { useEffect, useState } from "react";
import { Briciole, type Briciola } from "@/components/briciole";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useT } from "@/contexts/traduzioni-provider";
import { nomeClasse } from "@/lib/instructors";
import { segnalaSalvoRete } from "@/lib/report-error";

/**
 * Le briciole del materiale del corso (`/dispense`, `/esercizi`), che non sta
 * sotto una classe nell'indirizzo ma ci appartiene.
 *
 * Il primo passo dipende da chi guarda: l'insegnante risale a «Le tue classi ›
 * Materiali del corso», l'allievo arrivato da una classe a «Le mie classi ›
 * <la sua classe>», gli altri alla home. Trevissoi, 02/11/2026: «non compare
 * il path completo in alto a sinistra», sia da insegnante sia da allievo.
 */
export function BricioleMateriale({ classe, passi }: { classe?: string | null; passi: Briciola[] }) {
  const t = useT();
  const { profile } = useSharedAuth();
  const insegna = profile?.role === "instructor" || profile?.role === "admin";
  const [nome, setNome] = useState<string | null>(null);
  useEffect(() => {
    if (!classe || insegna) return;
    let vivo = true;
    nomeClasse(classe)
      .then((n) => { if (vivo) setNome(n); })
      .catch((err) => segnalaSalvoRete("briciole-materiale", err));
    return () => { vivo = false; };
  }, [classe, insegna]);

  const inizio: Briciola[] = insegna
    ? [{ etichetta: t("Le tue classi"), href: "/istruttori" }, { etichetta: t("Materiali del corso"), href: "/istruttori/materiali" }]
    : classe
      ? [{ etichetta: t("Le mie classi"), href: "/classi" }, { etichetta: nome || t("La tua classe"), href: `/classi/${classe}` }]
      : [{ etichetta: t("Home"), href: "/" }];
  return <Briciole percorso={[...inizio, ...passi]} />;
}
