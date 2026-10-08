"use client";

import { useEffect, useRef } from "react";

/**
 * Rilegge i dati quando si torna sulla pagina, e ogni tanto mentre la si guarda.
 *
 * PERCHÉ. Il 07/10/2026 un insegnante provava il portale con due browser
 * affiancati: allievo in Chrome, insegnante in Edge. L'allievo ha mandato la
 * richiesta di iscrizione, l'insegnante non l'ha vista — la sua pagina era
 * aperta da prima e nessuno la rileggeva. Ha concluso che la richiesta non
 * arrivava. Arrivava: bastava ricaricare, ma chi non lo sa non ricarica.
 *
 * Tre occasioni, tutte economiche:
 *  - la scheda torna visibile (si rientra dall'altra finestra o dal telefono
 *    in tasca);
 *  - la finestra riprende il fuoco (due browser affiancati: la scheda è sempre
 *    «visibile», cambia solo quale finestra è davanti);
 *  - ogni `ogniMs` mentre è visibile. Con la scheda nascosta non parte niente:
 *    non si paga traffico per una pagina che nessuno guarda.
 */
export function useAlRitorno(rileggi: () => void, ogniMs = 30_000, attivo = true): void {
  const ultima = useRef(rileggi);
  useEffect(() => {
    ultima.current = rileggi;
  });

  useEffect(() => {
    if (!attivo) return;
    const visibile = () => document.visibilityState === "visible";
    const seVisibile = () => {
      if (visibile()) ultima.current();
    };
    document.addEventListener("visibilitychange", seVisibile);
    window.addEventListener("focus", seVisibile);
    const timer = window.setInterval(seVisibile, ogniMs);
    return () => {
      document.removeEventListener("visibilitychange", seVisibile);
      window.removeEventListener("focus", seVisibile);
      window.clearInterval(timer);
    };
  }, [ogniMs, attivo]);
}
