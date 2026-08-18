"use client";

import { motion } from "motion/react";
import { useT } from "@/contexts/traduzioni-provider";

/** Tempo mancante alla mano di domani. */
export function DailyCountdownCard({
  mounted,
  countdown,
}: {
  mounted: boolean;
  countdown: string;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-5"
    >
      <div className="card-elevated rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("Nuova mano tra")}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
              {mounted ? countdown : "--:--:--"}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30">
            <svg
              className="h-6 w-6 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
