"use client";

import { useEffect, useRef } from "react";

const LS_KEY = "bq_total_minutes";
const TICK_INTERVAL = 30_000; // 30 seconds
const TICK_MINUTES = 0.5; // each tick = 0.5 minutes

export function useActivityTracker() {
  const isVisibleRef = useRef(true);

  useEffect(() => {
    // Track visibility
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Heartbeat: increment total_minutes every 30s when tab is visible
    const intervalId = setInterval(() => {
      if (!isVisibleRef.current) return;
      try {
        const current = parseFloat(localStorage.getItem(LS_KEY) || "0");
        localStorage.setItem(LS_KEY, String(Math.round((current + TICK_MINUTES) * 10) / 10));
      } catch {}
    }, TICK_INTERVAL);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(intervalId);
    };
  }, []);
}
