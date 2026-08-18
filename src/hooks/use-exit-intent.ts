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

    // Detect navigation FROM /gioca/* to something NOT /gioca/*
    if (prev.startsWith("/gioca/") && !pathname.startsWith("/gioca/")) {
      const today = new Date().toISOString().slice(0, 10);
      const hands = parseInt(
        localStorage.getItem("bq_hands_today_" + today) || "0",
        10
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- rilevamento di navigazione (exit intent) con lettura localStorage: client-only
      setHandsToday(hands);

      if (
        hands < 4 &&
        localStorage.getItem("bq_exit_dismissed_" + today) !== "1"
      ) {
        setShowExitModal(true);
      }
    }
  }, [pathname]);

  return { showExitModal, setShowExitModal, handsToday };
}
