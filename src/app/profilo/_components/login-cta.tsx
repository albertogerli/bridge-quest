"use client";

import { motion } from "motion/react";

/** Banner "Accedi per salvare i progressi" mostrato agli utenti non autenticati. */
export function LoginCta() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-figb/5 dark:bg-primary/10 rounded-2xl p-4 border-2 border-figb/20 dark:border-primary/30 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-figb text-white text-lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Accedi per salvare i progressi</p>
          <p className="text-[12px] text-muted-foreground">Sincronizza su tutti i dispositivi</p>
        </div>
        <a href="/login" className="inline-flex h-9 px-4 items-center rounded-xl bg-figb text-white font-semibold text-xs shadow-md hover:bg-figb/90 transition-colors">
          Accedi
        </a>
      </div>
    </motion.div>
  );
}
