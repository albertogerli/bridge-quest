"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useT } from "@/contexts/traduzioni-provider";

const LS_DISMISSED = "bq_notif_nudge_dismissed";

/**
 * Inline activation nudge for the (otherwise dormant) reminder system.
 * The whole streak/daily-challenge push loop is useless until the user grants
 * notification permission — yet nothing prominently asks. This does, once.
 * Shown only for logged-in users who haven't decided and haven't dismissed it.
 */
export function NotificationsNudge({ show = true }: { show?: boolean }) {
  const t = useT();
  const { supported, permission, enabled, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(true); // default hidden until we read LS
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setDismissed(localStorage.getItem(LS_DISMISSED) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(LS_DISMISSED, "1");
    } catch {}
    setDismissed(true);
  };

  const enable = async () => {
    const ok = await requestPermission();
    if (ok) {
      setJustEnabled(true);
      setTimeout(dismiss, 2200);
    } else {
      // Denied or unsupported: don't nag again.
      dismiss();
    }
  };

  // Visible only when: parent allows, supported, not yet enabled, permission
  // still askable ("default"), and not dismissed.
  const visible =
    show && supported && !enabled && permission === "default" && !dismissed;

  if (!visible && !justEnabled) return null;

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
          {justEnabled ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
            >
              <Bell className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {t("Promemoria attivi! Ti avviseremo per non perdere la striscia. 🔥")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="nudge"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-figb text-white">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="font-display text-sm font-bold text-foreground">
                  {t("Non perdere la striscia 🔥")}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t("Attiva i promemoria: ti avvisiamo per la Sfida del Giorno e prima che la tua striscia si azzeri.")}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={enable}
                    className="rounded-xl bg-figb px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-figb-dark active:scale-[0.98]"
                  >
                    {t("Attiva i promemoria")}
                  </button>
                  <button
                    onClick={dismiss}
                    className="px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-muted-foreground"
                  >
                    {t("Non ora")}
                  </button>
                </div>
              </div>
              <button
                onClick={dismiss}
                aria-label={t("Chiudi")}
                className="absolute right-2 top-2 rounded-lg p-1 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
