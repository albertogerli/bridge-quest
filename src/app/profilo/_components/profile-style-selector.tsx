"use client";

import { motion } from "motion/react";
import { Coffee, Gamepad2, Spade, Zap } from "lucide-react";
import type { UserProfile } from "@/hooks/use-profile";
import { useT } from "@/contexts/traduzioni-provider";

/** Selettore "Stile di gioco" (fascia d'età): persiste su `bq_profile`. */
export function ProfileStyleSelector({
  currentProfile,
  onSelect,
}: {
  currentProfile: UserProfile;
  onSelect: (profile: UserProfile) => void;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {t("Stile di gioco")}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {([
          { id: "junior" as const, icon: <Gamepad2 className="w-6 h-6" />, label: "8-17 anni" },
          { id: "giovane" as const, icon: <Zap className="w-6 h-6" />, label: "18-35 anni" },
          { id: "adulto" as const, icon: <Spade className="w-6 h-6" />, label: "36-55 anni" },
          { id: "senior" as const, icon: <Coffee className="w-6 h-6" />, label: "55+ anni" },
        ]).map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`rounded-xl p-3 text-center transition-all active:scale-95 ${
              currentProfile === opt.id
                ? "bg-figb/10 dark:bg-primary/15 border-[3px] border-figb dark:border-primary shadow-sm"
                : "bg-card border-2 border-border shadow-sm"
            }`}
          >
            <span className={`flex items-center justify-center ${currentProfile === opt.id ? "text-figb dark:text-primary" : "text-muted-foreground"}`}>{opt.icon}</span>
            <p className={`text-xs font-bold mt-1 ${
              currentProfile === opt.id ? "text-figb dark:text-primary" : "text-foreground/80"
            }`}>
              {opt.label}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
