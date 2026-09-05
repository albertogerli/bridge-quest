"use client";

import { useMemo } from "react";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { permessiAllievo } from "@/lib/permessi-allievo";

/**
 * Le rotte che la navigazione non deve proporre.
 *
 * SOLO LA FAMIGLIA B PASSA DI QUI. I contenuti didattici restano nel menu: la
 * loro restrizione vive dentro la pagina, dove si può dire «fa parte della
 * lezione 6 del tuo corso». Toglierli dal menu li farebbe sparire, e sparire
 * genera sospetto — l'allievo che ne parla con un compagno esterno scopre che
 * lui li vede. Dichiararlo genera attesa, e comunica che c'è un percorso.
 *
 * FINCHÉ NON SI SA, SI MOSTRA TUTTO. Le classi arrivano dal server e per un
 * istante non ci sono. L'alternativa — nascondere tutto e poi rivelare — fa
 * lampeggiare la barra a OGNI utente, compresa la maggioranza che in una
 * classe non è iscritta. E non si sta proteggendo un segreto: queste sono
 * funzioni che chiunque si registri vede comunque, semplicemente non proposte.
 * Per i divieti veri vale il contrario, ma quelli non passano da qui: li
 * applica il server.
 */
export function useNascosti(): { nascosti: Set<string>; pronto: boolean } {
  const { classes, isLoaded } = useEnrolledClasses();

  return useMemo(() => {
    if (!isLoaded) return { nascosti: new Set<string>(), pronto: false };
    const { nascosti } = permessiAllievo(
      classes.map((c) => ({
        accessoLibero: c.accesso_libero,
        permessi: c.permessi,
      })),
    );
    return { nascosti: new Set(nascosti), pronto: true };
  }, [classes, isLoaded]);
}

/** Vero se la voce non va proposta. Confronto per prefisso, come le rotte. */
export function vaNascosta(nascosti: Set<string>, href: string): boolean {
  return nascosti.has(href);
}
