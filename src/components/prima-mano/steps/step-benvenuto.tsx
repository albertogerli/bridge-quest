"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { StepShell } from "../step-shell";
import type { StepProps } from "../types";

export function StepBenvenuto({ onComplete, playSound }: StepProps) {
  return (
    <StepShell
      kicker="Arrivo al Club"
      title="Il tuo primo torneo."
      body="Tra 5 minuti giocherai la tua prima mano vera di bridge."
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[24px] border border-[#d8d0c0] bg-white p-4"
        >
          <p className="text-sm font-bold text-[#12305f]">Cosa NON facciamo</p>
          <p className="mt-2 text-sm leading-6 text-[#5c677d]">
            Niente teoria pesante. Zero gergo.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-[24px] border border-[#d8d0c0] bg-white p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#c8a44e]" />
            <p className="text-sm font-bold text-[#12305f]">Cosa facciamo</p>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#5c677d]">
            Quiz, mini-prese e poi una mano vera.
          </p>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <Button
          onClick={() => {
            playSound("click");
            onComplete(5);
          }}
          size="lg"
          className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
        >
          Sono pronto
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </StepShell>
  );
}
