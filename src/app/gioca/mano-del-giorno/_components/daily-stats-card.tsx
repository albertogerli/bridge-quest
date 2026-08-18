"use client";

import { motion } from "motion/react";
import type { DailyResult } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Serie, totale mani e stelle di oggi. */
export function DailyStatsCard({
  mounted,
  streak,
  total,
  alreadyPlayed,
  todayResult,
}: {
  mounted: boolean;
  streak: number;
  total: number;
  alreadyPlayed: boolean;
  todayResult: DailyResult | null;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mt-4"
    >
      <div className="card-elevated rounded-2xl bg-card p-5">
        <h3 className="font-bold text-foreground mb-3">
          {t("Le tue statistiche giornaliere")}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald">
              {mounted ? streak : 0}
            </p>
            <p className="text-[12px] text-muted-foreground font-medium">
              {t("Giorni consecutivi")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {mounted ? total : 0}
            </p>
            <p className="text-[12px] text-muted-foreground font-medium">
              {t("Mani giornaliere")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">
              {alreadyPlayed && todayResult
                ? `${todayResult.stars}/3`
                : "--"}
            </p>
            <p className="text-[12px] text-muted-foreground font-medium">
              {t("Stelle oggi")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
