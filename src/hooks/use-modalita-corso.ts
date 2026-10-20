"use client";

import { useSyncExternalStore } from "react";
import { usePercorso } from "@/hooks/use-lingua";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { corsiAttivi } from "@/lib/percorso-allievo";

/**
 * La «modalità corso» della cornice: niente colonne laterali.
 *
 * PERCHÉ. Chi insegna, e chi segue un corso, sta lavorando su una classe: la
 * colonna destra (livello, streak, «Riprendi» del percorso generale, box FIGB)
 * e la navigazione generale a sinistra sono contenuti estranei, e rubano lo
 * spazio che serve al tavolo, alla locandina, alla classe. Trevissoi l'ha
 * chiesto due volte (feedback del 02/10 e del 12/10/2026). La navigazione
 * generale resta raggiungibile, dietro un solo tasto.
 *
 * DOVE: sotto `/istruttori` e `/classi`, sempre; su `/dispense?classe=…`; sulla home solo per chi
 * insegna o è iscritto ad almeno una classe non archiviata — per tutti gli altri la
 * home resta quella di sempre.
 */
export function useModalitaCorso(): boolean {
  const percorso = usePercorso();
  const { user, profile } = useSharedAuth();
  const sullaHome = percorso === "/";
  const dallaClasse = useSyncExternalStore(ascoltaIndirizzo, haClasse, () => false);
  // Le classi servono solo per decidere la home: altrove non si chiedono.
  const { classes } = useEnrolledClasses(Boolean(user) && sullaHome);
  if (!user) return false;
  if (percorso.startsWith("/istruttori") || percorso.startsWith("/classi")) return true;
  // Le dispense aperte DA UNA CLASSE sono materiale del corso: stessa cornice
  // della classe, non quella del percorso generale con livello e streak.
  if (percorso.startsWith("/dispense") && dallaClasse) return true;
  if (!sullaHome) return false;
  const insegna = profile?.role === "instructor" || profile?.role === "admin";
  // Un corso archiviato è finito: chi segue solo quello torna alla home di sempre.
  return insegna || corsiAttivi(classes).length > 0;
}

/**
 * `?classe=` letto dall'indirizzo senza `useSearchParams`: questo hook gira
 * nella cornice di ogni pagina, fuori da qualunque `Suspense`, e lì
 * `useSearchParams` farebbe fallire la generazione statica. Lo snapshot si
 * rilegge a ogni render, e il cambio di pagina il render lo provoca già.
 */
function ascoltaIndirizzo(avvisa: () => void): () => void {
  window.addEventListener("popstate", avvisa);
  return () => window.removeEventListener("popstate", avvisa);
}

function haClasse(): boolean {
  return new URLSearchParams(window.location.search).has("classe");
}
