"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

/** Uscita dall'account (con o senza dati locali), eliminazione account o CTA di accesso. */
export function AccountActions({
  user,
  showLogoutConfirm,
  onShowLogoutConfirm,
  loggingOut,
  onLogout,
  showDeleteConfirm,
  onShowDeleteConfirm,
  deleting,
  onDeleteAccount,
}: {
  user: User | null;
  showLogoutConfirm: boolean;
  onShowLogoutConfirm: (show: boolean) => void;
  loggingOut: boolean;
  onLogout: (clearData: boolean) => void;
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: (show: boolean) => void;
  deleting: boolean;
  onDeleteAccount: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mb-6"
    >
      {user ? (
        <AnimatePresence mode="wait">
          {showLogoutConfirm ? (
            <motion.div
              key="logout-confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-card border-2 border-rose-200 dark:border-rose-900 shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Vuoi anche cancellare i dati locali?</p>
                  <p className="text-[11px] text-muted-foreground">I progressi locali possono essere mantenuti o rimossi</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => onLogout(true)}
                  disabled={loggingOut}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold h-10 shadow-md disabled:opacity-50"
                >
                  {loggingOut ? "Uscita..." : "Esci e cancella dati locali"}
                </Button>
                <Button
                  onClick={() => onLogout(false)}
                  disabled={loggingOut}
                  variant="outline"
                  className="w-full rounded-xl text-sm font-semibold h-10 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50"
                >
                  {loggingOut ? "Uscita..." : "Esci e mantieni dati locali"}
                </Button>
                <Button
                  onClick={() => onShowLogoutConfirm(false)}
                  variant="outline"
                  className="w-full rounded-xl text-sm font-semibold h-10 border-border text-muted-foreground"
                >
                  Annulla
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="logout-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button
                onClick={() => onShowLogoutConfirm(true)}
                variant="outline"
                className="w-full rounded-xl border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 font-semibold h-12 text-sm border-2 shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Esci dall&apos;account
              </Button>
              <AnimatePresence>
                {showDeleteConfirm ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4"
                  >
                    <p className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-1">Sei sicuro?</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">Questa azione è irreversibile. Tutti i tuoi dati, progressi, badge e statistiche verranno eliminati permanentemente.</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={onDeleteAccount}
                        disabled={deleting}
                        className="flex-1 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold h-9"
                      >
                        {deleting ? "Eliminazione..." : "Conferma eliminazione"}
                      </Button>
                      <Button
                        onClick={() => onShowDeleteConfirm(false)}
                        variant="outline"
                        className="flex-1 rounded-xl text-xs font-semibold h-9 border-rose-200 dark:border-rose-900"
                      >
                        Annulla
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => onShowDeleteConfirm(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:border-rose-300 dark:hover:border-rose-800 transition-colors py-3 px-4 text-sm font-semibold"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Elimina account e tutti i dati
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <a
          href="/login"
          className="flex items-center justify-center w-full rounded-xl bg-figb text-white font-semibold h-12 text-sm shadow-lg shadow-figb/20 hover:opacity-90 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Accedi o Registrati
        </a>
      )}
    </motion.div>
  );
}
