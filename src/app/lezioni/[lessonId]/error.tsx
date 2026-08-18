"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useT } from "@/contexts/traduzioni-provider";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("[BridgeQuest] Errore lezione:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-sm p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40">
          <span className="text-3xl">📘</span>
        </div>

        <h1 className="text-xl font-bold text-foreground font-display mb-2">
          {t("Errore nel caricamento della lezione")}
        </h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Non siamo riusciti a caricare questa lezione. Potrebbe trattarsi di un
          problema temporaneo: riprova tra un momento.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Codice: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow"
          >
            {t("Riprova")}
          </button>
          <Link
            href="/lezioni"
            className="w-full rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground/80 hover:bg-muted/50 transition-colors"
          >
            {t("Torna alle Lezioni")}
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            {t("Torna alla Home")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
