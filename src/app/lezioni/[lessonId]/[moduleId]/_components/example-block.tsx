"use client";

import { motion } from "motion/react";
import { CardDisplay } from "@/components/bridge/card-display";
import type { ContentBlockProps } from "../_types";
import { CardsIcon } from "./block-icons";
import { EnrichedText } from "./enriched-text";

/** Esempio commentato, con la mano di carte quando c'è. */
export function ExampleBlock({ block, delay, ctx }: ContentBlockProps) {
  const { isJunior, glossaryTermMap } = ctx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-4 mb-5 ${
        isJunior
          ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 border-amber-200 dark:border-amber-900"
          : "bg-gradient-to-br from-figb/10 to-blue-50 dark:from-primary/15 dark:to-blue-950/30 border-figb/20 dark:border-primary/25"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
          isJunior ? "h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 text-lg" : "h-8 w-8 bg-figb"
        }`}>
          {isJunior ? "👀" : <CardsIcon className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold uppercase tracking-widest mb-1 ${
            isJunior ? "text-[11px] text-amber-600 dark:text-amber-400" : "text-[10px] text-figb dark:text-primary"
          }`}>{isJunior ? "Guarda Qui!" : "Esempio"}</p>
          <p className={`leading-relaxed mb-2 ${
            isJunior ? "text-[15px] text-amber-900 dark:text-amber-200" : "text-[14px] text-indigo-900 dark:text-indigo-200"
          }`}><EnrichedText text={block.content} termMap={glossaryTermMap} /></p>
          {block.cards && (
            <div className="mt-2">
              <CardDisplay cards={block.cards} size="md" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
