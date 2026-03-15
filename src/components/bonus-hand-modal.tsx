"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface BonusHandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlay: () => void;
}

export function BonusHandModal({
  open,
  onOpenChange,
  onPlay,
}: BonusHandModalProps) {
  const handlePlay = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("bq_bonus_mode", "1");
    localStorage.setItem(`bq_bonus_used_${today}`, "1");
    onPlay();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-amber-300 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-950 dark:border-amber-700 sm:max-w-md overflow-hidden"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex flex-col items-center text-center"
            >
              {/* Golden card visual */}
              <div className="relative mb-4">
                {/* Glow behind the card */}
                <div className="absolute inset-0 bg-amber-400/30 dark:bg-amber-500/20 rounded-full blur-2xl scale-150" />

                {/* Card stack */}
                <div className="relative">
                  {/* Background cards */}
                  <div className="absolute -left-3 -top-1 w-16 h-22 rounded-lg bg-amber-200/60 dark:bg-amber-700/40 rotate-[-8deg] border border-amber-300/50 dark:border-amber-600/50" />
                  <div className="absolute -right-3 -top-1 w-16 h-22 rounded-lg bg-amber-200/60 dark:bg-amber-700/40 rotate-[8deg] border border-amber-300/50 dark:border-amber-600/50" />

                  {/* Main card */}
                  <div className="relative w-20 h-28 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-600 border-2 border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-300/40 dark:shadow-amber-600/30 flex items-center justify-center">
                    <span className="text-3xl" aria-hidden="true">
                      🃏
                    </span>
                  </div>
                </div>

                {/* 2x XP badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="absolute -top-3 -right-6 flex items-center justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/30 rounded-full blur-md" />
                    <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white text-xs font-extrabold tracking-wider shadow-lg shadow-red-500/30 border border-red-400/50">
                      2x XP
                    </div>
                  </div>
                </motion.div>
              </div>

              <DialogHeader className="items-center mt-2">
                <DialogTitle className="text-xl font-extrabold text-amber-800 dark:text-amber-300">
                  Mano Bonus disponibile!
                </DialogTitle>
                <DialogDescription className="text-amber-700/80 dark:text-amber-400/80 text-sm font-medium mt-1">
                  XP raddoppiati solo per questa mano!
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-col gap-2 w-full mt-6 sm:flex-col">
                <button
                  onClick={handlePlay}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-amber-500/30 dark:shadow-amber-600/20 cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, #D97706, #B45309)",
                  }}
                >
                  Gioca la Mano Bonus
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full py-2.5 rounded-xl text-amber-600 dark:text-amber-400 text-sm font-medium transition-colors hover:bg-amber-100/50 dark:hover:bg-amber-900/30 cursor-pointer"
                >
                  Forse dopo
                </button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
