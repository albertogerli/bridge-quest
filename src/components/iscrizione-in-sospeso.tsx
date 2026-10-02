"use client";

import { useEffect } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { joinClass } from "@/lib/instructors";
import { useRouter } from "@/hooks/use-router-lingua";
import { segnalaSalvoRete } from "@/lib/report-error";
import { usePercorso } from "@/hooks/use-lingua";

/**
 * Il codice della classe scritto in registrazione, quando la sessione non
 * c'era ancora (email da confermare): al primo accesso si entra nella classe e
 * si va lì, invece che nella home generale.
 */
export function IscrizioneInSospeso() {
  const { user } = useSharedAuth();
  const router = useRouter();
  const percorso = usePercorso();
  useEffect(() => {
    // Sulla pagina di accesso no: lì, finito il login, la pagina ricarica da
    // sola verso la sua destinazione e cancellerebbe questo spostamento.
    if (!user || percorso === "/login" || percorso === "/registrati") return;
    let codice: string | null = null;
    try {
      codice = localStorage.getItem("bq_codice_classe");
    } catch {}
    if (!codice) return;
    try {
      localStorage.removeItem("bq_codice_classe");
    } catch {}
    joinClass(codice)
      .then((classe) => router.replace(`/classi/${classe.id}`))
      .catch((err) => segnalaSalvoRete("iscrizione-in-sospeso", err));
  }, [user, router, percorso]);
  return null;
}
