"use client";

import { motion } from "motion/react";
import Link from "@/components/link";
import { BookOpen } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";

export function PrimaManoBanner() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg px-4 mb-4"
    >
      <Link
        href="/prima-mano"
        className="relative block overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
      >
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-figb text-white shadow-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#12305f]">{t("Hai 3 minuti? Prova Prima Mano")}</p>
            <p className="text-[12px] text-[#51627f]">{t("Impara le basi del bridge e guadagna +50 XP")}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#c8a44e]/15 px-2.5 py-1 text-[12px] font-bold text-[#7a5a0f]">+50 XP</span>
        </div>
      </Link>
    </motion.div>
  );
}
