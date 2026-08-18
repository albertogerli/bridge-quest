"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/contexts/traduzioni-provider";

/** Consiglio del Maestro Fiori in fondo alla pagina del torneo. */
export function MaestroTip() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-4 mb-6"
    >
      <div className="card-elevated rounded-2xl bg-card p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-sm shadow-md shadow-emerald/30">
            M
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-bold text-sm text-foreground">
                {t("Maestro Fiori")}
              </p>
              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[12px] font-bold border-0">
                {t("Consiglio")}
              </Badge>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Il Torneo Settimanale ti permette di sfidare tutti i
              giocatori sulle stesse 5 mani. Ogni settimana nuove mani
              e una nuova classifica. Concentrati su ogni presa!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
