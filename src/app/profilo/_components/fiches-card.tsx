"use client";

import Link from "@/components/link";
import { motion } from "motion/react";
import { Coins } from "lucide-react";
import { computeFiches } from "@/lib/profile-stats";
import { useT } from "@/contexts/traduzioni-provider";

/** Saldo fiches (derivato dagli XP) e accesso al negozio. */
export function FichesCard({ xp }: { xp: number }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="mb-6 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber/10">
            <Coins className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t("Fiches")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Per cosmetici e bonus")}
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold text-amber-dark">{computeFiches(xp)}</p>
      </div>
      <Link
        href="/negozio"
        className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 text-sm transition-all active:scale-[0.97]"
      >
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {t("Vai al Negozio")}
      </Link>
    </motion.div>
  );
}
