"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useLingua } from "@/hooks/use-lingua";
import { reportError } from "@/lib/report-error";

/**
 * Registra sul profilo la lingua in cui la persona sta usando il sito.
 *
 * PERCHÉ NON BASTA L'INDIRIZZO. Sul sito la lingua sta nel percorso, e va
 * benissimo finché qualcuno sta navigando. Le email però partono quando non
 * c'è nessuno: un promemoria della striscia, l'avviso che tocca a te in una
 * licita. Senza un campo sul profilo l'unica scelta possibile sarebbe
 * l'italiano per tutti, e chi legge in inglese riceverebbe messaggi che non
 * capisce — o peggio, li segnerebbe come indesiderati.
 *
 * SI SCRIVE SOLO QUANDO CAMBIA, e una volta per sessione: è una preferenza,
 * non un evento da tracciare. Un aggiornamento a ogni pagina sarebbe traffico
 * inutile su una tabella che tutti leggono.
 *
 * Se la scrittura fallisce non succede niente di visibile: l'utente continua a
 * leggere nella lingua che ha scelto, e al massimo la prossima email arriva
 * nella lingua di prima. Non vale un messaggio d'errore in faccia a nessuno.
 */
export function RicordaLingua() {
  const { user } = useSharedAuth();
  const { lingua } = useLingua();
  const giaScritta = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (giaScritta.current === lingua) return;
    giaScritta.current = lingua;

    const supabase = createClient();
    void supabase
      .from("profiles")
      .update({ lingua })
      .eq("id", user.id)
      .then(({ error }) => {
        // `PGRST204` = colonna assente: succede finché la migrazione non è
        // stata applicata, e non è un guasto da segnalare.
        if (error && error.code !== "PGRST204") {
          reportError("lingua:profilo", error);
        }
      });
  }, [user, lingua]);

  return null;
}
