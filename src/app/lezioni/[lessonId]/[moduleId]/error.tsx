"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BridgeQuest] Errore modulo:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-sm p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/40 dark:to-purple-950/40">
          <span className="text-3xl">📝</span>
        </div>

        <h1 className="text-xl font-bold text-foreground font-display mb-2">
          Errore nel modulo
        </h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Il modulo non si è caricato correttamente. Riprova oppure torna alla
          lezione per scegliere un altro modulo.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Codice: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow"
          >
            Riprova
          </button>
          <Link
            href="/lezioni"
            className="w-full rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground/80 hover:bg-muted/50 transition-colors"
          >
            Torna alle Lezioni
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            Torna alla Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
