"use client";

import { motion } from "motion/react";
import { type AILevel, AI_LEVEL_LABELS } from "@/lib/ai-difficulty";

interface BenStatusProps {
  available: boolean | null; // null = checking
  aiLevel?: AILevel;
}

export function BenStatus({ available, aiLevel = "intermedio" }: BenStatusProps) {
  if (available === null) return null; // Still checking

  // Determine display label and color based on AI level + BEN availability
  const isUsingBen = available && aiLevel === "esperto";
  const label = isUsingBen ? "BEN" : AI_LEVEL_LABELS[aiLevel];

  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    base: {
      bg: "rgba(234, 179, 8, 0.12)",
      text: "#a16207",
      dot: "#eab308",
    },
    intermedio: {
      bg: "rgba(59, 130, 246, 0.1)",
      text: "#2563eb",
      dot: "#3b82f6",
    },
    esperto: {
      bg: "rgba(5, 150, 105, 0.1)",
      text: "#059669",
      dot: "#059669",
    },
  };

  const colors = isUsingBen ? colorMap.esperto : colorMap[aiLevel];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: colors.dot,
        }}
      />
      AI: {label}
    </motion.div>
  );
}
