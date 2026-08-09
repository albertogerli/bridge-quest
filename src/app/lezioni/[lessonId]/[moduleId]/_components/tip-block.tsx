"use client";

import { motion } from "motion/react";
import type { ContentBlockProps } from "../_types";
import { LightbulbIcon } from "./block-icons";

/** Consiglio del Maestro Fiori. */
export function TipBlock({ block, delay, ctx }: ContentBlockProps) {
  const { isJunior } = ctx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-4 mb-5 ${
        isJunior
          ? "bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/30 border-sky-200/60 dark:border-sky-900"
          : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-200/60 dark:border-amber-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold text-sm shadow-md ${
          isJunior
            ? "bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sky-300/30 text-lg"
            : "bg-gradient-to-br from-emerald to-emerald-dark text-white shadow-emerald/30"
        }`}>
          {isJunior ? "💡" : "M"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-bold text-sm ${isJunior ? "text-sky-800 dark:text-sky-300" : "text-foreground"}`}>
              {isJunior ? "Il Maestro ti svela un segreto!" : "Maestro Fiori"}
            </p>
            {!isJunior && <LightbulbIcon className="h-3.5 w-3.5 text-amber-500" />}
          </div>
          <p className={`font-medium text-[13px] mb-1 ${isJunior ? "text-sky-900 dark:text-sky-200" : "text-foreground/90"}`}>
            {block.content}
          </p>
          {block.explanation && (
            <p className={`text-[13px] leading-relaxed ${isJunior ? "text-sky-800/80 dark:text-sky-300/80" : "text-amber-900/80 dark:text-amber-200/80"}`}>
              {block.explanation}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
