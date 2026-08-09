"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Coins } from "lucide-react";
import { computeFiches } from "@/lib/profile-stats";

/** Saldo fiches (derivato dagli XP) e accesso al negozio. */
export function FichesCard({ xp }: { xp: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-2 border-amber-300 dark:border-amber-800 shadow-sm p-5 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber/10">
            <Coins className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Fiches</p>
            <p className="text-xs text-muted-foreground">
              Per cosmetici e bonus
            </p>
          </div>
        </div>
        <p className="text-3xl font-bold text-amber-dark">{computeFiches(xp)}</p>
      </div>
      <Link
        href="/negozio"
        className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold h-11 text-sm shadow-md shadow-amber-500/20 transition-all active:scale-[0.97]"
      >
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        Vai al Negozio
      </Link>
    </motion.div>
  );
}
