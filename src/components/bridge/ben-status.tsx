"use client";

import { motion } from "motion/react";

interface BenStatusProps {
  available: boolean | null; // null = checking
}

export function BenStatus({ available }: BenStatusProps) {
  if (available === null) return null; // Still checking

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{
        backgroundColor: available ? "rgba(5, 150, 105, 0.1)" : "rgba(156, 163, 175, 0.15)",
        color: available ? "#059669" : "#9ca3af",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: available ? "#059669" : "#9ca3af",
        }}
      />
      AI: {available ? "BEN" : "Base"}
    </motion.div>
  );
}
