"use client";

import { useEffect, useState } from "react";
import { useT } from "@/contexts/traduzioni-provider";
import { useSharedAuth } from "@/contexts/auth-provider";

/** A persistent error stays visible until a confirmed save, including after navigation. */
export function SyncNotice() {
  const t = useT();
  const { user } = useSharedAuth();
  const [progressError, setProgressError] = useState(false);
  const [resultsError, setResultsError] = useState(false);
  useEffect(() => {
    const progress = (event: Event) => setProgressError((event as CustomEvent).detail === "error");
    const pending = () => setResultsError(true);
    const saved = () => setResultsError(false);
    window.addEventListener("bq_sync_status", progress);
    window.addEventListener("bq_results_pending", pending);
    window.addEventListener("bq_results_synced", saved);
    return () => {
      window.removeEventListener("bq_sync_status", progress);
      window.removeEventListener("bq_results_pending", pending);
      window.removeEventListener("bq_results_synced", saved);
    };
  }, []);
  if (!user || (!progressError && !resultsError)) return null;
  return (
    <aside role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50">
      <p>{t("Salvataggio online non confermato. Non cancellare i dati di questo dispositivo.")}</p>
      <button type="button" className="mt-2 underline" onClick={() => window.dispatchEvent(new Event("bq_sync_retry"))}>
        {t("Riprova il salvataggio")}
      </button>
    </aside>
  );
}
