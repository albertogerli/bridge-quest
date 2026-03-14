"use client";

import { motion } from "motion/react";
import { Check, Star } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import type { StepConfig } from "./types";

export function ProgressSidebar({
  steps,
  currentStep,
  xpEarned,
  collapsed,
}: {
  steps: StepConfig[];
  currentStep: number;
  xpEarned: number;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[20px] border border-[#d7d0bf] bg-[#0f2f5f] px-2 py-4 shadow-lg">
        <div className="text-[10px] font-bold text-white/80">{currentStep + 1}/{steps.length}</div>
        <div className="flex flex-col gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < currentStep
                  ? "bg-[#c8a44e]"
                  : i === currentStep
                    ? "bg-white"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
        {xpEarned > 0 && (
          <div className="mt-2 text-[10px] font-bold text-[#f0d37a]">{xpEarned}</div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[36px] border border-[#d7d0bf] bg-[#0f2f5f] p-6 text-white shadow-[0_30px_80px_rgba(15,47,95,0.28)] sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/55">
            FIGB Bridge LAB
          </p>
          <p className="mt-2 text-sm text-white/70">
            Il Tuo Primo Torneo
          </p>
        </div>
        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white/80">
          {currentStep + 1}/{steps.length}
        </div>
      </div>

      <div className="mt-8 h-2 rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#c8a44e] to-[#f0d37a]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="mt-8 grid gap-3">
        {steps.map((item, index) => {
          const active = index === currentStep;
          const done = index < currentStep;
          return (
            <div
              key={item.id}
              className={`rounded-[24px] border px-4 py-3 transition-all ${
                active
                  ? "border-white/15 bg-white/10"
                  : done
                    ? "border-[#c8a44e]/25 bg-[#c8a44e]/10"
                    : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2">
                {done && <Check className="h-3.5 w-3.5 text-[#f0d37a]" />}
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                    active ? "text-white/70" : done ? "text-[#f0d37a]" : "text-white/35"
                  }`}
                >
                  {item.kicker}
                </p>
              </div>
              <p
                className={`mt-1 text-sm font-semibold ${
                  active ? "text-white" : done ? "text-white/90" : "text-white/45"
                }`}
              >
                {item.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* XP counter */}
      <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
          XP Guadagnati
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c8a44e]/20">
            <Star className="h-5 w-5 text-[#f0d37a]" />
          </div>
          <motion.p
            key={xpEarned}
            initial={{ scale: 1.3, color: "#f0d37a" }}
            animate={{ scale: 1, color: "#ffffff" }}
            className="text-lg font-semibold text-white"
          >
            +{xpEarned} XP
          </motion.p>
        </div>
      </div>

      {/* Decorative suits */}
      <div className="mt-6 flex justify-center gap-3 opacity-20">
        {(["spade", "heart", "diamond", "club"] as const).map((s) => (
          <SuitSymbol key={s} suit={s} size="lg" />
        ))}
      </div>
    </div>
  );
}
