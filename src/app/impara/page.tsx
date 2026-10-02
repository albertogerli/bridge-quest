"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLingua } from "@/hooks/use-lingua";
import { conLingua } from "@/lib/lingua";

/**
 * `/impara` non è più una pagina: è un rimando al percorso.
 *
 * ERA UN MENU DAVANTI A UN MENU. La scheda «Impara» della barra portava qui,
 * e qui c'erano due cose: il collegamento al percorso e gli strumenti di
 * studio. Quindi per arrivare al percorso — che è la cosa per cui esiste
 * BridgeLab — servivano due tocchi, e il primo non dava niente: chiedeva
 * soltanto di scegliere fra «il percorso» e «altro».
 *
 * Adesso la scheda si chiama «Percorso» e porta a `/lezioni`. Gli strumenti
 * di studio stanno in fondo al percorso, dove si è quando servono.
 *
 * Il rimando resta perché l'indirizzo è in giro: nei segnalibri, nei
 * messaggi degli insegnanti, nelle mail già spedite. Un indirizzo che ha
 * funzionato non deve smettere di funzionare.
 */
export default function ImparaPage() {
  const router = useRouter();
  const { lingua } = useLingua();

  // Il rimando conserva la lingua: da /en/impara si arriva a /en/lezioni.
  useEffect(() => {
    router.replace(conLingua("/lezioni", lingua));
  }, [router, lingua]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
    </div>
  );
}
