"use client";

import { motion } from "motion/react";
import type { ContentBlockProps } from "../_types";
import { ShieldIcon } from "./block-icons";
import { EnrichedText } from "./enriched-text";

/** Regola da ricordare: è anche quella salvata negli appunti a fine modulo. */
export function RuleBlock({ block, delay, ctx }: ContentBlockProps) {
  const { isJunior, profile, glossaryTermMap } = ctx;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * profile.animSpeed, type: "spring", stiffness: 300, damping: 25 }}
      className={`rounded-2xl border p-4 mb-5 relative overflow-hidden ${profile.contentClasses} ${
        isJunior
          ? "bg-card border-primary/20 dark:border-primary/20"
          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900"
      }`}
    >
      <div className="absolute top-3 right-3 opacity-10">
        <ShieldIcon className={`h-16 w-16 ${isJunior ? "text-primary" : "text-emerald"}`} />
      </div>
      <div className="relative flex gap-3">
        <div className={`flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
          isJunior ? "h-10 w-10 bg-primary text-lg" : "h-8 w-8 bg-emerald"
        }`}>
          {isJunior ? "📌" : <ShieldIcon className="h-4 w-4" />}
        </div>
        <div>
          <p className={`font-bold uppercase tracking-widest mb-1 ${
            isJunior ? "text-xs text-primary dark:text-primary" : "text-xs text-emerald"
          }`}>{isJunior ? "Regola Importante!" : "Regola"}</p>
          <p className={`font-semibold leading-relaxed ${
            isJunior ? "text-[15px] text-primary dark:text-primary" : "text-[14px] text-emerald-900 dark:text-emerald-200"
          }`}>
            <EnrichedText text={block.content} termMap={glossaryTermMap} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
