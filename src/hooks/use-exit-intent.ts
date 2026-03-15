"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useExitIntent() {
  const pathname = usePathname();
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
