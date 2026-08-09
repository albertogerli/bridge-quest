"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "bq_cookie_consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Hide cookie banner inside Capacitor iOS app (Apple guideline 5.1.2)
    const isCapacitor = typeof window !== "undefined" && (
      (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ||
      navigator.userAgent.includes("BridgeLab-Native")
    );
    if (isCapacitor) return;

    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[60] flex justify-center pb-safe-area"
        >
          <div className="w-full max-w-lg mx-4 mb-4 bg-card border border-border rounded-2xl shadow-xl p-5">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Questo sito utilizza cookie tecnici necessari al funzionamento
              della piattaforma. Per saperne di più consulta la nostra
              informativa.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl bg-figb hover:bg-figb-dark text-white text-sm font-bold transition-colors active:scale-[0.98]"
              >
                Accetta
              </button>

              <Link
                href="/privacy"
                className="px-4 py-2.5 text-sm font-semibold text-figb dark:text-primary transition-colors hover:underline"
              >
                Informativa
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
