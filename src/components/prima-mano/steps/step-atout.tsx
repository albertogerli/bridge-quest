"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { ConfettiBurst } from "@/components/celebration-effects";
import { StepShell } from "../step-shell";
import type { StepProps } from "../types";

function ChoiceCard({
  label,
  description,
  selected,
  correct,
  onClick,
  disabled,
}: {
  label: string;
  description: string;
  selected: boolean;
  correct?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      animate={
        selected && !correct
          ? { x: [0, -6, 6, -4, 4, 0] }
          : selected && correct
            ? { scale: [1, 1.03, 1] }
            : {}
      }
      transition={{ duration: 0.4 }}
      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
        selected
          ? correct
            ? "border-emerald-300 bg-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
            : "border-rose-300 bg-rose-50 shadow-[0_10px_30px_rgba(244,63,94,0.12)]"
          : disabled
            ? "border-[#e5e0d5] bg-[#f9f6f0] opacity-50"
            : "border-[#d8d0c0] bg-white hover:border-[#003DA5]/30 hover:bg-[#f7f9ff]"
      }`}
    >
      <p className="text-sm font-bold text-[#12305f]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#5c677d]">{description}</p>
    </motion.button>
  );
}

export function StepAtout({ onComplete, playSound }: StepProps) {
  const [animPhase, setAnimPhase] = useState<"idle" | "played" | "captured">("idle");
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const firstTry = useRef(true);

  // Start the animation sequence on mount (after a brief delay)
  useEffect(() => {
    const t1 = setTimeout(() => setAnimPhase("played"), 800);
    const t2 = setTimeout(() => setAnimPhase("captured"), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleChoice = (c: "yes" | "no") => {
    if (choice === "no") return;
    setChoice(c);
    if (c === "no") {
      playSound("correct");
      setShowConfetti(true);
    } else {
      playSound("wrong");
      firstTry.current = false;
    }
  };

  return (
    <StepShell
      kicker="L'Arma Segreta"
      title="Il taglio non è magia."
      body="Se non hai il seme giocato, puoi tagliare con l'atout. Ma non sei obbligato: puoi anche scartare."
    >
      <ConfettiBurst trigger={showConfetti} count={25} />

      <div className="mt-6 space-y-4">
        {/* Suit badges */}
        <div className="flex justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2"
          >
            <SuitSymbol suit="heart" size="md" />
            <span className="text-sm font-bold text-rose-700">Giocato</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#c8a44e]/40 bg-[#fffdf5] px-4 py-2"
          >
            <SuitSymbol suit="spade" size="md" />
            <span className="text-sm font-bold text-[#8f6b16]">Atout</span>
          </motion.div>
        </div>

        {/* Animation area */}
        <div className="rounded-[28px] border border-[#d8d0c0] bg-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8] mb-4 text-center">
            Il taglio in azione
          </p>

          <div className="relative flex items-center justify-center h-32">
            {/* Heart King (victim) */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={
                animPhase === "idle"
                  ? { opacity: 0, x: -40 }
                  : animPhase === "played"
                    ? { opacity: 1, x: -30 }
                    : { opacity: 0.4, x: -30, scale: 0.85 }
              }
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[22px] border border-[#d8d0c0] bg-[#fffaf0] px-5 py-4 text-center shadow-sm"
            >
              <p className="text-2xl font-black text-red-600">K</p>
              <div className="mt-1.5 flex justify-center">
                <SuitSymbol suit="heart" size="md" />
              </div>
            </motion.div>

            {/* Spade card (trump) swoops in */}
            <AnimatePresence>
              {animPhase === "captured" && (
                <motion.div
                  initial={{ opacity: 0, x: 80, y: 40, rotate: 15 }}
                  animate={{ opacity: 1, x: 30, y: 0, rotate: -2 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                  className="rounded-[22px] border-2 border-[#c8a44e] bg-[#fffdf5] px-5 py-4 text-center shadow-lg shadow-[#c8a44e]/20"
                >
                  <p className="text-2xl font-black text-[#12305f]">2</p>
                  <div className="mt-1.5 flex justify-center">
                    <SuitSymbol suit="spade" size="md" />
                  </div>
                  <div className="mt-1 flex justify-center">
                    <Zap className="h-3.5 w-3.5 text-[#c8a44e]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {animPhase === "captured" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-center text-sm text-[#5c677d]"
            >
              Anche un 2 di atout batte il Re di cuori!
            </motion.p>
          )}
        </div>

        {/* Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-[28px] border border-[#d8d0c0] bg-white p-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8] mb-3">
            Il taglio è obbligatorio?
          </p>
          <div className="grid gap-3">
            <ChoiceCard
              label="Sì, devo per forza tagliare"
              description="Se non ho il seme giocato, devo usare l'atout."
              selected={choice === "yes"}
              correct={false}
              onClick={() => handleChoice("yes")}
              disabled={choice === "no"}
            />
            <ChoiceCard
              label="No, posso tagliare oppure scartare"
              description="Senza il seme giocato, scelgo io cosa fare."
              selected={choice === "no"}
              correct
              onClick={() => handleChoice("no")}
              disabled={choice === "no"}
            />
          </div>
        </motion.div>

        {/* Explanation */}
        {choice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${
              choice === "no"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-rose-300 bg-rose-50 text-rose-800"
            }`}
          >
            {choice === "no"
              ? "Giusto! Tagliare è un'opzione, non un obbligo. A volte conviene scartare una carta inutile piuttosto che sprecare un atout."
              : "No, il taglio non è mai obbligatorio. Puoi sempre scegliere di scartare una carta di un altro seme."}
          </motion.div>
        )}

        {/* Continue */}
        {choice === "no" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button
              onClick={() => onComplete(firstTry.current ? 10 : 5)}
              size="lg"
              className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
            >
              Continua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </StepShell>
  );
}
