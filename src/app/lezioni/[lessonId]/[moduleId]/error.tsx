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
        className="w-full max-w-md bg-white rounded-2xl border border-[#e5e0d5] shadow-sm p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
          <span className="text-3xl">📝</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Errore nel modulo
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Il modulo non si è caricato correttamente. Riprova oppure torna alla
          lezione per scegliere un altro modulo.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">
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
            className="w-full rounded-xl border border-[#e5e0d5] bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Torna alle Lezioni
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Torna alla Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
