"use client";

import { useRef } from "react";
import { useT } from "@/contexts/traduzioni-provider";
import { motion, AnimatePresence } from "motion/react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export interface WeeklyRecapData {
  xpEarned: number;
  modulesCompleted: number;
  handsPlayed: number;
  streakDays: number;
}

interface WeeklyRecapModalProps {
  open: boolean;
  onClose: () => void;
  data: WeeklyRecapData;
  title: string;
}

export function WeeklyRecapModal({ open, onClose, data, title }: WeeklyRecapModalProps) {
  const t = useT();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open, { onEscape: onClose });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-card rounded-3xl p-8 text-center mx-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("Riepilogo settimanale")}
          >
            <div className="flex justify-center mb-3" aria-hidden="true">
              <BarChart3 className="w-12 h-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground font-display">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("Ecco i tuoi progressi!")}</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                <p className="text-2xl font-bold text-emerald-600">+{data.xpEarned}</p>
                <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">{t("XP guadagnati")}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-2xl font-bold text-amber-600">{data.modulesCompleted}</p>
                <p className="text-[12px] font-medium text-amber-700 dark:text-amber-400">{t("Moduli completati")}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800">
                <p className="text-2xl font-bold text-indigo-600">{data.handsPlayed}</p>
                <p className="text-[12px] font-medium text-indigo-700 dark:text-indigo-400">{t("Mani giocate")}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                <p className="text-2xl font-bold text-orange-600">{data.streakDays}</p>
                <p className="text-[12px] font-medium text-orange-700 dark:text-orange-400">{t("Giorni streak")}</p>
              </div>
            </div>

            {data.xpEarned > 200 ? (
              <p className="mt-4 text-sm font-bold text-emerald-600">{t("Settimana fantastica! Continua così!")}</p>
            ) : data.xpEarned > 0 ? (
              <p className="mt-4 text-sm font-bold text-amber-600">{t("Buon lavoro! Punta più in alto questa settimana!")}</p>
            ) : (
              <p className="mt-4 text-sm font-bold text-muted-foreground">{t("Nuova settimana, nuove sfide!")}</p>
            )}

            <Button
              onClick={onClose}
              className="mt-5 w-full h-12 rounded-xl bg-primary font-semibold shadow-lg active:scale-[0.98] transition-transform"
            >
              {t("Andiamo!")}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
