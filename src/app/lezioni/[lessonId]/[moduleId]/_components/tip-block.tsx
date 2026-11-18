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
          ? "bg-card border-sky-200/60 dark:border-sky-900"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold text-sm shadow-md ${
          isJunior
            ? "bg-primary text-white text-lg"
            : "bg-emerald-700 text-white"
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
