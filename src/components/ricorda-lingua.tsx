"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useLingua } from "@/hooks/use-lingua";
import { reportError } from "@/lib/report-error";

const RITARDI_RETRY = [1_000, 3_000];

function erroreTemporaneo(status: number, error: { code: string; message: string }): boolean {
  if ([502, 503, 504].includes(status)) return true;
  // PostgREST restituisce gli errori di fetch come risultato, non li lancia.
  // Non trattare ogni TypeError/AbortError come una perdita di connessione.
  return status === 0 && !error.code &&
    /^TypeError: (Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)(?: \([^\n]*\))?$/.test(error.message);
}

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
 * SI SCRIVE SOLO QUANDO CAMBIA, e una volta per account/mount: è una preferenza,
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
  const userId = user?.id;
  const giaScritta = useRef<string | null>(null);
  // Serializza anche i cambi rapidi di lingua: una richiesta precedente deve
  // terminare prima di inviare la preferenza più recente.
  const coda = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!userId) {
      giaScritta.current = null;
      return;
    }
    const chiave = `${userId}:${lingua}`;
    let attivo = true;
    let annullaAttesa: (() => void) | undefined;

    // null = browser già offline: aspetta online senza consumare tentativi.
    // Il cleanup libera anche la coda, senza lasciare timer o listener appesi.
    function attendi(ms: number | null) {
      return new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const termina = () => {
          clearTimeout(timer);
          window.removeEventListener("online", termina);
          annullaAttesa = undefined;
          resolve();
        };
        annullaAttesa = termina;
        window.addEventListener("online", termina);
        if (ms !== null) timer = setTimeout(termina, ms);
      });
    }

    coda.current = coda.current.then(async () => {
      if (!attivo || giaScritta.current === chiave) return;
      for (let tentativo = 0; tentativo <= RITARDI_RETRY.length; tentativo++) {
        while (attivo && navigator.onLine === false) await attendi(null);
        if (!attivo) return;
        giaScritta.current = null;
        const { error, status, count } = await createClient()
          .from("profiles")
          .update({ lingua }, { count: "exact" })
          .eq("id", userId);
        if (!attivo) return;
        if (!error && count === 1) {
          giaScritta.current = chiave;
          return;
        }
        if (error && erroreTemporaneo(status, error) && tentativo < RITARDI_RETRY.length) {
          await attendi(RITARDI_RETRY[tentativo]);
          continue;
        }
        // Permessi, colonna assente, zero righe aggiornate e guasti persistenti
        // restano visibili. Nessun ID o dato del profilo viene segnalato.
        reportError("lingua:profilo", error ?? {
          code: "LINGUA_NOT_SAVED",
          message: "La preferenza di lingua non ha aggiornato esattamente un profilo",
          status,
        });
        return;
      }
    }).catch((error: unknown) => {
      // Copre anche rejection inattese, oltre agli errori restituiti dall'SDK.
      if (attivo) reportError("lingua:profilo", error);
    });

    return () => {
      attivo = false;
      annullaAttesa?.();
    };
  }, [userId, lingua]);

  return null;
}
