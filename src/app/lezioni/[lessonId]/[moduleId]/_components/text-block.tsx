"use client";

import { motion } from "motion/react";
import type { ContentBlockProps } from "../_types";
import { EnrichedText } from "./enriched-text";

/** Paragrafo di spiegazione. */
export function TextBlock({ block, delay, ctx }: ContentBlockProps) {
  const { isJunior, profile, glossaryTermMap } = ctx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * profile.animSpeed }}
      className={`text-foreground/80 leading-relaxed ${isJunior ? "mb-5 text-[15.5px]" : "mb-4"} ${profile.contentClasses || "text-[15px]"}`}
    >
      <EnrichedText text={block.content} termMap={glossaryTermMap} />
    </motion.div>
  );
}
