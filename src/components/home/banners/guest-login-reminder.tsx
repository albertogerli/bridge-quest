import { motion } from "motion/react";

export function GuestLoginReminder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg px-4 mb-4"
    >
      <a
        href="/login"
        className="flex items-center gap-3 rounded-2xl bg-[#1B5E3B]/5 dark:bg-emerald-950/30 border border-[#1B5E3B]/15 dark:border-emerald-900 p-3.5 hover:bg-[#1B5E3B]/8 dark:hover:bg-emerald-950/50 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B5E3B] text-white shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Crea un account gratuito</p>
          <p className="text-[11px] text-muted-foreground">Salva i progressi e sincronizza su tutti i dispositivi. Gratis, senza carta di credito.</p>
        </div>
        <svg className="w-4 h-4 text-[#1B5E3B] dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </a>
    </motion.div>
  );
}
