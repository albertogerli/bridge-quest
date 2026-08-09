"use client";

import { AnimatePresence, motion } from "motion/react";
import { pickParticleSpin } from "@/lib/lesson-module";
import type { FloatingXp, Particle } from "../_types";

/**
 * Effetti a schermo intero: XP che vola via, popup di passaggio di livello e
 * emoji che esplodono (profilo giovane).
 */
export function ModuleEffects({
  floatingXp,
  xpLabel,
  showLevelUp,
  closeLevelUp,
  levelUpRef,
  levelUpTitle,
  levelUpLevel,
  particles,
}: {
  floatingXp: FloatingXp[];
  xpLabel: string;
  showLevelUp: boolean;
  closeLevelUp: () => void;
  levelUpRef: React.RefObject<HTMLDivElement | null>;
  levelUpTitle: string;
  levelUpLevel: number;
  particles: Particle[];
}) {
  return (
    <>
      {/* === FLOATING XP ANIMATIONS === */}
      {floatingXp.map((f) => (
        <motion.div
          key={f.id}
          className="fixed pointer-events-none z-[70] font-bold text-amber-500 text-lg"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 0, scale: 1.5, y: -80 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          +{f.amount} {xpLabel}
        </motion.div>
      ))}

      {/* === LEVEL UP POPUP === */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={closeLevelUp}
          >
            <motion.div
              ref={levelUpRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="level-up-title"
              initial={{ y: 50, rotate: -5 }}
              animate={{ y: 0, rotate: 0 }}
              exit={{ y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/40 mx-6 max-w-sm"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8 }}
                className="text-6xl mb-3"
                aria-hidden="true"
              >
                🎉
              </motion.div>
              <h3 id="level-up-title" className="text-2xl font-bold text-amber-900">{levelUpTitle}</h3>
              <p className="text-amber-800 font-bold mt-2 text-lg">
                Livello {levelUpLevel}
              </p>
              <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
                {["⭐", "⭐", "⭐"].map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="text-3xl"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
              <p className="text-sm text-amber-700 mt-3">Tocca per continuare</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating particles (giovane) */}
      {particles.map((p) => {
        const spin = pickParticleSpin();
        return (
          <motion.div
            key={p.id}
            className="fixed pointer-events-none z-[60]"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0, y: -60, rotate: spin.rotate }}
            transition={{ duration: 1 }}
          >
            <span className="text-2xl">{spin.emoji}</span>
          </motion.div>
        );
      })}
    </>
  );
}

/** Notifiche temporanee: XP guadagnati, bozza salvata, traguardo raggiunto. */
export function ModuleToasts({
  showXpPop,
  xpPopAmount,
  xpLabel,
  saveToast,
  achievement,
}: {
  showXpPop: boolean;
  xpPopAmount: number;
  xpLabel: string;
  saveToast: boolean;
  achievement: string | null;
}) {
  return (
    <>
      {/* XP popup */}
      <AnimatePresence>
        {showXpPop && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-20 right-5 z-50 bg-amber-400 text-white font-bold text-lg px-4 py-2 rounded-2xl shadow-xl"
          >
            ⚡ +{xpPopAmount} {xpLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2"
          >
            <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20,6 9,17 4,12" />
            </svg>
            Progressi salvati
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement popup */}
      <AnimatePresence>
        {achievement && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-figb text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <span className="text-xl">🏅</span>
            {achievement}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
