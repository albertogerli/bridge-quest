"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Gift, Package, Wrench, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useGameStore } from "@/store/use-game-store";

const chestMilestoneIcons = {
  3: (size: string) => <Gift className={`${size} text-amber-700`} />,
  10: (size: string) => <Package className={`${size} text-gray-600`} />,
  25: (size: string) => <Wrench className={`${size} text-amber-500`} />,
  50: (size: string) => <Crown className={`${size} text-amber-400`} />,
} as Record<number, (size: string) => React.ReactNode>;

const chestMilestones = [
  { modules: 3, label: "Chest Bronzo", reward: "50 XP + Badge" },
  { modules: 10, label: "Chest Argento", reward: "150 XP + Badge" },
  { modules: 25, label: "Chest Oro", reward: "300 XP + Dorso carte" },
  { modules: 50, label: "Chest Diamante", reward: "500 XP + Feltro esclusivo" },
];

export function TreasureChests({ modulesCompleted }: { modulesCompleted: number }) {
  const profile = useProfile();
  const [showChestPopup, setShowChestPopup] = useState<typeof chestMilestones[0] | null>(null);

  // Check for newly earned chest
  useEffect(() => {
    try {
      const claimed = JSON.parse(localStorage.getItem("bq_chests_claimed") || "[]") as number[];
      for (const chest of chestMilestones) {
        if (modulesCompleted >= chest.modules && !claimed.includes(chest.modules)) {
          setShowChestPopup(chest);
          // Award XP
          const xpReward = chest.modules === 3 ? 50 : chest.modules === 10 ? 150 : chest.modules === 25 ? 300 : 500;
          useGameStore.getState().addXp(xpReward);
          localStorage.setItem("bq_chests_claimed", JSON.stringify([...claimed, chest.modules]));
          break;
        }
      }
    } catch {}
  }, [modulesCompleted]);

  // Find the next unopened chest
  const nextIdx = chestMilestones.findIndex((c) => modulesCompleted < c.modules);
  const nextChest = nextIdx >= 0 ? chestMilestones[nextIdx] : null;

  return (
    <>
    {/* Chest unlock popup */}
    <AnimatePresence>
      {showChestPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowChestPopup(null)}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-white dark:bg-[#1a1f2e] rounded-3xl p-8 text-center mx-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Baule sbloccato"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8 }}
              className="flex justify-center mb-4"
            >
              {chestMilestoneIcons[showChestPopup.modules]?.("w-16 h-16")}
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.chestTitle}</h2>
            <p className="text-lg font-bold text-amber-600 mt-2">{showChestPopup.label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{showChestPopup.reward}</p>
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center"
                >
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </motion.span>
              ))}
            </div>
            <Button
              onClick={() => setShowChestPopup(null)}
              className="mt-6 w-full h-12 rounded-xl bg-[#c8a44e] font-semibold shadow-lg"
            >
              Fantastico!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 border border-[#E8E4DC] dark:border-[#2a3040]">
      {/* Chest progress bar */}
      <div className="flex items-center gap-2 mb-4">
        {chestMilestones.map((chest, i) => {
          const isEarned = modulesCompleted >= chest.modules;
          const isCurrent = i === nextIdx;
          return (
            <div key={chest.modules} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all ${
                  isEarned
                    ? "bg-amber-100 dark:bg-amber-900/40 shadow-sm"
                    : isCurrent
                      ? "bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300 dark:ring-amber-700"
                      : "bg-gray-50 dark:bg-gray-800/50"
                }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
              >
                {isEarned ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : chestMilestoneIcons[chest.modules]?.("w-5 h-5")}
              </motion.div>
              <span className={`text-[9px] font-bold ${
                isEarned ? "text-amber-700" : isCurrent ? "text-amber-600" : "text-gray-500"
              }`}>
                {chest.modules} mod
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress to next chest */}
      {nextChest && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              {chestMilestoneIcons[nextChest.modules]?.("w-4 h-4")} {nextChest.label}
            </p>
            <p className="text-[11px] font-bold text-amber-600">
              {modulesCompleted}/{nextChest.modules}
            </p>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((modulesCompleted / nextChest.modules) * 100, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Premio: {nextChest.reward}
          </p>
        </div>
      )}

      {!nextChest && (
        <div className="text-center py-2">
          <p className="text-sm font-bold text-amber-700 flex items-center justify-center gap-1">Tutti i bauli aperti! <Crown className="w-4 h-4" /></p>
          <p className="text-xs text-amber-700 mt-0.5">Sei un vero campione</p>
        </div>
      )}
    </div>
    </>
  );
}
