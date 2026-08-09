"use client";

import { motion } from "motion/react";
import { BookOpen, CheckCircle2, Globe, Spade } from "lucide-react";

/**
 * Quattro riquadri di sintesi (moduli, mani, completamento, mondi).
 * I `data-testid` `profilo-stat-*` sono usati dai test E2E: non rinominarli.
 */
export function QuickStats({
  totalModulesCompleted,
  handsPlayed,
  completionPercent,
  worldsCompleted,
  totalWorldsCount,
}: {
  totalModulesCompleted: number;
  handsPlayed: number;
  completionPercent: number;
  worldsCompleted: number;
  totalWorldsCount: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {[
        { icon: <BookOpen className="w-4 h-4 text-indigo-500" />, val: String(totalModulesCompleted), label: "Moduli" },
        { icon: <Spade className="w-4 h-4 text-foreground/80" />, val: String(handsPlayed), label: "Mani" },
        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, val: `${completionPercent}%`, label: "Completato" },
        { icon: <Globe className="w-4 h-4 text-blue-500" />, val: `${worldsCompleted}/${totalWorldsCount}`, label: "Mondi" },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          data-testid={`profilo-stat-${s.label.toLowerCase()}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.04 }}
          className="rounded-xl bg-card p-2.5 text-center border border-border shadow-sm"
        >
          <span className="flex justify-center">{s.icon}</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{s.val}</p>
          <p className="text-[9px] text-muted-foreground font-medium">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
