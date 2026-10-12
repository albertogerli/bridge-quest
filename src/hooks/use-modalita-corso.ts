"use client";

import { usePercorso } from "@/hooks/use-lingua";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useEnrolledClasses } from "@/store/use-classes-store";

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
 * DOVE: sotto `/istruttori` e `/classi`, sempre; sulla home solo per chi
 * insegna o è iscritto ad almeno una classe attiva — per tutti gli altri la
 * home resta quella di sempre.
 */
export function useModalitaCorso(): boolean {
  const percorso = usePercorso();
  const { user, profile } = useSharedAuth();
  const sullaHome = percorso === "/";
  // Le classi servono solo per decidere la home: altrove non si chiedono.
  const { classes } = useEnrolledClasses(Boolean(user) && sullaHome);
  if (!user) return false;
  if (percorso.startsWith("/istruttori") || percorso.startsWith("/classi")) return true;
  if (!sullaHome) return false;
  const insegna = profile?.role === "instructor" || profile?.role === "admin";
  return insegna || classes.length > 0;
}
