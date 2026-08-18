"use client";

import { motion } from "motion/react";
import type { ContentBlockProps } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** «Metti in ordine»: non ancora interattivo, mostra la sequenza corretta. */
export function SequenceBlock({ block, delay }: ContentBlockProps) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card card-clean p-5 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
        </div>
        <p className="font-bold text-foreground text-[15px]">{t("Metti in ordine")}</p>
      </div>
      <p className="text-[14px] text-foreground/80 mb-4 leading-relaxed">{block.content}</p>
      <div className="space-y-2">
        {(block.correctOrder ?? []).map((origIdx, step) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-white text-xs font-bold">
              {step + 1}
            </span>
            <span className="text-[14px] text-foreground/80 font-medium">
              {block.options?.[origIdx]}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
