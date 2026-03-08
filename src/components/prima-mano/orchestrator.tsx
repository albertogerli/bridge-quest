"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen } from "lucide-react";
import { useSounds } from "@/hooks/use-sounds";
import { awardGameXp } from "@/lib/xp-utils";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { ProgressSidebar } from "./progress-sidebar";
import { STEPS, type StepId, type HandResult } from "./types";

import { StepBenvenuto } from "./steps/step-benvenuto";
import { StepTavolo } from "./steps/step-tavolo";
import { StepPresa } from "./steps/step-presa";
import { StepObbligo } from "./steps/step-obbligo";
import { StepRuoli } from "./steps/step-ruoli";
import { StepAtout } from "./steps/step-atout";
import { StepMiniPrese } from "./steps/step-mini-prese";
import { StepManoVera } from "./steps/step-mano-vera";
import { StepVittoria } from "./steps/step-vittoria";

const STORAGE_KEY = "bq_onboarded";
const GAME_ID = "prima-mano-v2";
const QUIZ_STEPS = new Set<StepId>(["presa", "obbligo", "ruoli", "atout"]);

export function PrimaManoV2({
  onDismiss,
  returnHref,
}: {
  onDismiss?: () => void;
  returnHref?: string;
}) {
  const router = useRouter();
  const { playSound } = useSounds();

  const [currentStep, setCurrentStep] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [miniPreseScore, setMiniPreseScore] = useState({ won: 0, total: 4 });
  const [handResult, setHandResult] = useState<HandResult | null>(null);

  const stepId = STEPS[currentStep].id;
  const isManoVera = stepId === "mano-vera";

  const persistOnboarding = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      if (!localStorage.getItem("bq_profile")) {
        localStorage.setItem("bq_profile", "adulto");
      }
    } catch {}
  }, []);

  const handleSkip = useCallback(() => {
    persistOnboarding();
    onDismiss?.();
    if (returnHref) router.push(returnHref);
  }, [persistOnboarding, onDismiss, returnHref, router]);

  const handleStepComplete = useCallback(
    (xpEarned: number) => {
      const sid = STEPS[currentStep].id;
      const newTotalXp = totalXp + xpEarned;

      // Track quiz scores
      if (QUIZ_STEPS.has(sid)) {
        setQuizTotal((t) => t + 1);
        if (xpEarned >= 10) setQuizCorrect((c) => c + 1);
      }

      // Track mini-prese
      if (sid === "mini-prese") {
        setMiniPreseScore({ won: Math.round(xpEarned / 5), total: 4 });
      }

      setTotalXp(newTotalXp);

      // Advance to next step
      if (currentStep < STEPS.length - 1) {
        const nextIdx = currentStep + 1;
        setCurrentStep(nextIdx);

        // Reaching vittoria — persist and award total XP
        if (STEPS[nextIdx].id === "vittoria") {
          awardGameXp(GAME_ID, newTotalXp);
          persistOnboarding();
        }
      } else {
        // vittoria completed
        persistOnboarding();
      }
    },
    [currentStep, totalXp, persistOnboarding],
  );

  const handleHandResult = useCallback((result: HandResult) => {
    setHandResult(result);
  }, []);

  const renderStep = () => {
    const props = { onComplete: handleStepComplete, playSound };
    switch (stepId) {
      case "benvenuto":
        return <StepBenvenuto {...props} />;
      case "tavolo":
        return <StepTavolo {...props} />;
      case "presa":
        return <StepPresa {...props} />;
      case "obbligo":
        return <StepObbligo {...props} />;
      case "ruoli":
        return <StepRuoli {...props} />;
      case "atout":
        return <StepAtout {...props} />;
      case "mini-prese":
        return <StepMiniPrese {...props} />;
      case "mano-vera":
        return <StepManoVera {...props} onHandResult={handleHandResult} />;
      case "vittoria":
        return (
          <StepVittoria
            {...props}
            totalXp={totalXp}
            handResult={handResult}
            quizScore={{ correct: quizCorrect, total: quizTotal }}
            miniPreseScore={miniPreseScore}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f7f1e5_42%,_#eee2c8_100%)]">
      {/* Decorative floating suits */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {(
          [
            { suit: "club" as const, top: "12%", left: "8%" },
            { suit: "diamond" as const, top: "22%", right: "10%" },
            { suit: "heart" as const, bottom: "22%", left: "9%" },
            { suit: "spade" as const, bottom: "14%", right: "12%" },
          ] as const
        ).map((item, i) => {
          const { suit, ...pos } = item;
          return (
            <motion.div
              key={suit}
              className="absolute opacity-[0.08]"
              style={pos}
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SuitSymbol suit={suit} size="xl" />
            </motion.div>
          );
        })}
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full">
          {/* Mobile progress bar (visible < lg, when sidebar is hidden) */}
          {!isManoVera && (
            <div className="mb-4 flex items-center justify-between rounded-full border border-[#d8d0c0] bg-white/80 px-4 py-2 backdrop-blur-sm lg:hidden">
              <span className="text-xs font-bold text-[#8f6b16]">
                {currentStep + 1}/{STEPS.length}
              </span>
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < currentStep
                        ? "bg-[#c8a44e]"
                        : i === currentStep
                          ? "bg-[#003DA5]"
                          : "bg-[#d8d0c0]"
                    }`}
                  />
                ))}
              </div>
              {totalXp > 0 && (
                <span className="text-xs font-bold text-[#c8a44e]">
                  +{totalXp} XP
                </span>
              )}
            </div>
          )}

          <div
            className={`grid w-full gap-6 ${
              isManoVera
                ? "grid-cols-[auto_1fr]"
                : "lg:grid-cols-[1.05fr_0.95fr]"
            }`}
          >
            {/* Sidebar */}
            {isManoVera ? (
              <ProgressSidebar
                steps={STEPS}
                currentStep={currentStep}
                xpEarned={totalXp}
                collapsed
              />
            ) : (
              <div className="hidden lg:block">
                <ProgressSidebar
                  steps={STEPS}
                  currentStep={currentStep}
                  xpEarned={totalXp}
                />
              </div>
            )}

            {/* Step content */}
            <div className="flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepId}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.98 }}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Skip + FIGB footer — hidden on vittoria */}
              {stepId !== "vittoria" && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <BookOpen className="h-4 w-4 text-[#8f6b16]" />
                    <span className="hidden sm:inline">
                      Ispirato alla logica FIGB dell&apos;ingresso morbido al
                      tavolo.
                    </span>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="rounded-[22px] border border-[#d8d0c0] bg-white px-5 py-2 text-sm font-semibold text-[#5c677d] transition-colors hover:text-[#12305f]"
                  >
                    Salta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
