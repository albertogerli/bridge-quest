"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ProfileConfig } from "@/hooks/use-profile";
import type { LessonModule } from "@/lib/catalog";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Barra di navigazione fissa in fondo: «Indietro», «Avanti» (sbloccato solo
 * dopo il tempo minimo di lettura, verificato dall'E2E) e, sull'ultimo passo,
 * il collegamento al modulo o alla lezione successiva.
 */
export function ModuleNav({
  lessonId,
  currentStep,
  isLastStep,
  canAdvance,
  nextModule,
  profile,
  onStepAdvance,
  onSaveAndExit,
}: {
  lessonId: string;
  currentStep: number;
  isLastStep: boolean;
  canAdvance: boolean;
  nextModule: LessonModule | null;
  profile: ProfileConfig;
  onStepAdvance: (nextStep: number) => void;
  onSaveAndExit: () => void;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] lg:pb-6 z-40"
    >
      <div className="mx-auto max-w-6xl">
        {currentStep > 0 && !isLastStep && (
          <div className="flex justify-center mb-1.5">
            <button
              onClick={onSaveAndExit}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("Salva e esci")}
            </button>
          </div>
        )}
        <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-sm p-3 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => onStepAdvance(currentStep - 1)}
              className={`flex-1 rounded-xl font-bold ${profile.profile === "senior" ? "h-14 text-base" : "h-12"}`}
            >
              {t("Indietro")}
            </Button>
          )}
          {!isLastStep ? (
            <Button
              onClick={() => onStepAdvance(currentStep + 1)}
              disabled={!canAdvance}
              className={`flex-1 rounded-xl font-bold shadow-lg ${
                canAdvance
                  ? "bg-emerald hover:bg-emerald-dark shadow-emerald/25"
                  : "bg-muted-foreground/30 cursor-not-allowed shadow-none"
              } ${profile.profile === "senior" ? "h-14 text-base" : "h-12"}`}
            >
              {profile.profile === "senior" ? "Avanti →" : "Avanti"}
            </Button>
          ) : (
            <Link
              href={
                nextModule
                  ? `/lezioni/${lessonId}/${nextModule.id}`
                  : `/lezioni/${lessonId}`
              }
              className="flex-1"
            >
              <Button className="w-full rounded-xl bg-emerald hover:bg-emerald-dark h-12 font-bold shadow-lg shadow-emerald/25">
                {nextModule ? "Prossimo modulo" : "Completa lezione"} →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
