"use client";

import { motion } from "motion/react";
import type { ContentBlockProps } from "../_types";

/** Titolo di sezione con la sottolineatura colorata. */
export function HeadingBlock({ block, ctx }: ContentBlockProps) {
  const { isJunior } = ctx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={isJunior ? "mb-6" : "mb-5"}
    >
      <h2 className={`font-display font-bold text-foreground leading-tight ${isJunior ? "text-[24px]" : "text-[22px]"}`}>
        {isJunior && "🎯 "}{block.content}
      </h2>
      <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${isJunior ? "w-20 from-pink-400 via-purple-400 to-indigo-400" : "w-12 from-emerald to-emerald-light"}`} />
    </motion.div>
  );
}
