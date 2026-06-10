"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallAppBanner() {
  const { canInstall, isInstalled, isIOS, install } = usePwaInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  return (
    <>
      {!isInstalled && !installDismissed && (canInstall || isIOS) && (
        <section className="px-4 sm:px-5 pt-4 lg:hidden">
          <div className="mx-auto max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="rounded-2xl bg-[#1B5E3B]/5 dark:bg-emerald-950/30 border border-[#1B5E3B]/15 dark:border-emerald-900 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B5E3B]/10 dark:bg-emerald-900/40">
                    <Smartphone className="w-5 h-5 text-[#1B5E3B] dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Installa Bridge LAB
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Aggiungilo alla schermata Home
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canInstall ? (
                      <button
                        onClick={() => install()}
                        className="px-4 py-2 rounded-xl bg-[#1B5E3B] text-white text-xs font-bold shadow-sm hover:bg-[#14472D] transition-colors"
                      >
                        Installa
                      </button>
                    ) : isIOS ? (
                      <button
                        onClick={() => setShowIOSGuide(true)}
                        className="px-4 py-2 rounded-xl bg-[#1B5E3B] text-white text-xs font-bold shadow-sm hover:bg-[#14472D] transition-colors"
                      >
                        Come fare
                      </button>
                    ) : null}
                    <button
                      onClick={() => setInstallDismissed(true)}
                      aria-label="Chiudi banner installazione"
                      className="p-2.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* iOS Install Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="bg-card rounded-t-3xl p-6 w-full max-w-md shadow-2xl pb-10"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Guida installazione su iPhone e iPad"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" aria-hidden="true" />
              <h3 className="text-lg font-bold text-foreground text-center mb-4">
                Installa su iPhone/iPad
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-lg flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-foreground/80">
                    Tocca il pulsante <strong>Condividi</strong>{" "}
                    <span className="inline-block align-middle">
                      <svg className="w-5 h-5 inline text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>{" "}
                    in basso
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-lg flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-foreground/80">
                    Scorri e tocca <strong>&quot;Aggiungi a schermata Home&quot;</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-lg flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-foreground/80">
                    Tocca <strong>&quot;Aggiungi&quot;</strong> in alto a destra
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform"
              >
                Ho capito
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
