"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { consentPending, exposeConsentApi, setMarketingConsent } from "@/lib/consent-client";
import { CONSENT_REOPEN_EVENT } from "@/lib/consent";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Richiesta di consenso ai cookie.
 *
 * Fino all'agosto 2026 il banner aveva un solo bottone e parlava di «cookie
 * tecnici necessari al funzionamento», mentre erano già attivi il tag Google
 * Ads e GA4. Le due scelte separate servono a rendere vera la dichiarazione:
 * senza un rifiuto possibile, il consenso non è un consenso.
 */
export function CookieBanner() {
  const t = useT();
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

  // Stato ispezionabile da console per chi verifica il sito.
  useEffect(() => {
    exposeConsentApi();
  }, []);

  // Riapertura da «Preferenze cookie»: vale anche per chi ha già scelto, ed è
  // ciò che rende la scelta revocabile.
  useEffect(() => {
    const riapri = () => setShow(true);
    window.addEventListener(CONSENT_REOPEN_EVENT, riapri);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, riapri);
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
          aria-label={t("Preferenze cookie")}
        >
          {/*
            COMPATTO AL TELEFONO. Alto quasi trecento pixel, copriva il
            pulsante «Accedi» del login e «Prova senza account» della pagina
            d'ingresso: per entrare bisognava prima chiuderlo, e chi non
            capiva cosa stava succedendo toccava lo schermo senza effetto
            (visto nel controllo del 28/09/2026). I due pulsanti restano
            affiancati e uguali, e l'informativa sta nella frase.
          */}
          <div className="w-full max-w-lg mx-3 mb-3 bg-card border border-border rounded-2xl shadow-xl p-4 sm:mx-4 sm:mb-4 sm:p-5">
            <p className="text-sm text-foreground/80 leading-snug sm:leading-relaxed">
              {t("Usiamo cookie tecnici, necessari al funzionamento della piattaforma. Con il tuo consenso usiamo anche cookie di statistica e pubblicitari, che ci aiutano a far conoscere il bridge a chi non lo conosce.")}{" "}
              <Link
                href="/privacy"
                className="font-semibold text-figb dark:text-primary underline-offset-2 hover:underline"
              >
                {t("Informativa privacy")}
              </Link>
            </p>

            <div className="flex flex-row items-stretch gap-2 mt-3 sm:mt-4">
              <button
                onClick={() => decide(true)}
                className="flex-1 min-h-11 rounded-xl bg-figb hover:bg-figb-dark text-white text-sm font-bold transition-colors active:scale-[0.98]"
              >
                {t("Accetta tutti")}
              </button>

              {/* Stessa evidenza del bottone di accettazione: un rifiuto
                  nascosto o scolorito non è una scelta libera. */}
              <button
                onClick={() => decide(false)}
                className="flex-1 min-h-11 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-bold transition-colors active:scale-[0.98]"
              >
                {t("Solo necessari")}
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
