"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useBeginnerStatus } from "@/hooks/use-beginner-status";
import { BookOpen, Target, Brain, ChevronRight, CheckCircle2 } from "lucide-react";

interface GuidedPathProps {
  variant?: "full" | "compact";
}

const STEPS = [
  {
    step: 1,
    label: "Completa la Lezione 1",
    sub: "Impara i fondamenti del bridge",
    href: "/lezioni/0/intro",
    icon: BookOpen,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    step: 2,
    label: "Gioca una Mano Guidata",
    sub: "Metti in pratica con assistenza",
    href: "/gioca/mano-guidata",
    icon: Target,
    gradient: "from-purple-500 to-purple-600",
  },
  {
    step: 3,
    label: "Torna per il Ripasso",
    sub: "Rafforza la memoria domani",
    href: "/ripasso",
    icon: Brain,
    gradient: "from-amber-500 to-amber-600",
  },
];

export function GuidedPath({ variant = "compact" }: GuidedPathProps) {
  const { guidedSteps, markStepDone } = useBeginnerStatus();
  const isFull = variant === "full";

  // Determine current active step (first not completed)
  const currentStep = STEPS.findIndex((s) => !guidedSteps.includes(s.step));
  const activeIdx = currentStep === -1 ? STEPS.length : currentStep;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[22px] border border-[#d8d0c0] bg-white overflow-hidden ${
        isFull ? "shadow-lg" : "shadow-sm"
      }`}
    >
      {/* Header */}
      <div className={`px-5 ${isFull ? "pt-5 pb-3" : "pt-4 pb-2"}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">🧭</span>
          <h3 className={`font-bold text-[#12305f] ${isFull ? "text-lg" : "text-sm"}`}>
            Percorso Consigliato
          </h3>
        </div>
        {isFull && (
          <p className="mt-1 text-sm text-[#5c677d]">
            Tre passi per partire col piede giusto.
          </p>
        )}
      </div>

      {/* Steps */}
      <div className={`px-5 ${isFull ? "pb-5" : "pb-4"} space-y-2`}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = guidedSteps.includes(s.step);
          const isCurrent = i === activeIdx;

          return (
            <motion.div
              key={s.step}
              initial={isFull ? { opacity: 0, x: -16 } : false}
              animate={isFull ? { opacity: 1, x: 0 } : undefined}
              transition={isFull ? { delay: 0.2 + i * 0.15, duration: 0.4 } : undefined}
            >
              <Link href={s.href} onClick={() => markStepDone(s.step)}>
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                    isDone
                      ? "border-emerald-200 bg-emerald-50/50"
                      : isCurrent
                        ? "border-[#c8a44e]/40 bg-[#fffdf5] shadow-sm shadow-[#c8a44e]/10"
                        : "border-[#e5e0d5] bg-[#fafaf7]"
                  }`}
                >
                  {/* Step number / check */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isDone
                        ? "bg-emerald-100"
                        : isCurrent
                          ? `bg-gradient-to-br ${s.gradient} shadow-md`
                          : "bg-gray-100"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCurrent ? "text-white" : "text-gray-400"}`} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        isDone
                          ? "text-emerald-700 line-through decoration-emerald-300"
                          : isCurrent
                            ? "text-[#12305f]"
                            : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </p>
                    {(isFull || isCurrent) && (
                      <p className="text-[11px] text-[#5c677d] mt-0.5 truncate">{s.sub}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  {!isDone && (
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${
                        isCurrent ? "text-[#c8a44e]" : "text-gray-300"
                      }`}
                    />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* All done banner */}
      {activeIdx >= STEPS.length && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-3 text-center">
          <p className="text-sm font-semibold text-emerald-700">
            ✨ Percorso completato! Sei pronto per il corso completo.
          </p>
        </div>
      )}
    </motion.div>
  );
}
