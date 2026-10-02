"use client";

import { useState, useEffect, useRef } from "react";
import { usePercorso } from "./use-lingua";

export function useExitIntent() {
  // Senza prefisso: uscire da `/en/gioca/...` è uscire da una partita
  // esattamente come uscire da `/gioca/...`.
  const pathname = usePercorso();
  const prevPathname = useRef(pathname);
  const [showExitModal, setShowExitModal] = useState(false);
  const [handsToday, setHandsToday] = useState(0);

  useEffect(() => {
    const prev = prevPathname.current;
    prevPathname.current = pathname;

    // Detect navigation FROM /gioca/* to something NOT /gioca/*. L'indice
    // `/gioca` fa parte della sezione: tornare dalla partita all'elenco dei
    // giochi non è «andare via», e il messaggio «hai giocato solo 0 mani»
    // compariva a chi stava solo cambiando gioco.
    const dentroGioca = (percorso: string) => percorso === "/gioca" || percorso.startsWith("/gioca/");
    if (prev.startsWith("/gioca/") && !dentroGioca(pathname)) {
      const today = new Date().toISOString().slice(0, 10);
      let hands = 0;
      let dismissed = false;
      try {
        hands = parseInt(
          localStorage.getItem("bq_hands_today_" + today) || "0",
          10
        ) || 0;
        dismissed = localStorage.getItem("bq_exit_dismissed_" + today) === "1";
      } catch {}
      // eslint-disable-next-line react-hooks/set-state-in-effect -- rilevamento di navigazione (exit intent) con lettura localStorage: client-only
      setHandsToday(hands);

      if (hands < 4 && !dismissed) {
        setShowExitModal(true);
      }
    }
  }, [pathname]);

  return { showExitModal, setShowExitModal, handsToday };
}
