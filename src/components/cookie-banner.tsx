"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { consentPending, setMarketingConsent } from "@/lib/consent-client";

/**
 * Richiesta di consenso ai cookie.
 *
 * Fino all'agosto 2026 il banner aveva un solo bottone e parlava di «cookie
 * tecnici necessari al funzionamento», mentre erano già attivi il tag Google
 * Ads e GA4. Le due scelte separate servono a rendere vera la dichiarazione:
 * senza un rifiuto possibile, il consenso non è un consenso.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Nascosto dentro l'app iOS Capacitor (linea guida Apple 5.1.2): lì non
    // vengono caricati tracciatori pubblicitari.
    const isCapacitor = typeof window !== "undefined" && (
      (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ||
      navigator.userAgent.includes("BridgeLab-Native")
    );
    if (isCapacitor) return;

    if (consentPending()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setShow(true);
    }
  }, []);

  const decide = (marketing: boolean) => {
    setMarketingConsent(marketing);
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
          role="dialog"
          aria-label="Preferenze cookie"
        >
          <div className="w-full max-w-lg mx-4 mb-4 bg-card border border-border rounded-2xl shadow-xl p-5">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Usiamo cookie tecnici, necessari al funzionamento della
              piattaforma. Con il tuo consenso usiamo anche cookie di
              statistica e pubblicitari, che ci aiutano a far conoscere il
              bridge a chi non lo conosce.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-4">
              <button
                onClick={() => decide(true)}
                className="flex-1 py-2.5 rounded-xl bg-figb hover:bg-figb-dark text-white text-sm font-bold transition-colors active:scale-[0.98]"
              >
                Accetta tutti
              </button>

              {/* Stessa evidenza del bottone di accettazione: un rifiuto
                  nascosto o scolorito non è una scelta libera. */}
              <button
                onClick={() => decide(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-bold transition-colors active:scale-[0.98]"
              >
                Solo necessari
              </button>
            </div>

            <div className="mt-3 text-center">
              <Link
                href="/privacy"
                className="text-xs font-semibold text-figb dark:text-primary transition-colors hover:underline"
              >
                Informativa privacy
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
