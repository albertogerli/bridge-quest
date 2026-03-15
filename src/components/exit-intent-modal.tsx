"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ExitIntentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlay: () => void;
}

export function ExitIntentModal({
  open,
  onOpenChange,
  onPlay,
}: ExitIntentModalProps) {
  const [handsToday, setHandsToday] = useState(0);

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem(`bq_hands_today_${today}`);
      setHandsToday(stored ? parseInt(stored, 10) || 0 : 0);
    }
  }, [open]);

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`bq_exit_dismissed_${today}`, "1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-blue-200 bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/30 dark:to-gray-950 dark:border-blue-800 sm:max-w-md overflow-hidden"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="flex flex-col items-center text-center"
            >
              {/* Subtle card icon */}
              <div className="relative mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40">
                  <span className="text-2xl" aria-hidden="true">
                    🂡
                  </span>
                </div>
              </div>

              <DialogHeader className="items-center">
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Hai giocato solo {handsToday}{" "}
                  {handsToday === 1 ? "mano" : "mani"} oggi.
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Una mano veloce prima di andare?
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-col gap-2 w-full mt-5 sm:flex-col">
                <button
                  onClick={onPlay}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: "#003DA5" }}
                >
                  Una mano veloce!
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Basta per oggi
                </button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
