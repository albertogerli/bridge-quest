"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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

const trickCards = [
  { label: "Q", player: "Ovest", delay: 0.1 },
  { label: "A", player: "Nord", delay: 0.3 },
  { label: "7", player: "Est", delay: 0.5 },
  { label: "10", player: "Sud", delay: 0.7 },
];

export function StepPresa({ onComplete, playSound }: StepProps) {
  const [choice, setChoice] = useState<"ace" | "queen" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const firstTry = useRef(true);

  const handleChoice = (c: "ace" | "queen") => {
    if (choice === "ace") return;
    setChoice(c);
    if (c === "ace") {
      playSound("correct");
      setShowConfetti(true);
    } else {
      playSound("wrong");
      firstTry.current = false;
    }
  };

  return (
    <StepShell
      kicker="La Prima Regola"
      title="Qui conta una sola cosa."
      body="Ogni giro si giocano 4 carte, una per giocatore. Chi gioca la carta piu alta del seme comandato vince la presa."
    >
      <ConfettiBurst trigger={showConfetti} count={25} />

      <div className="mt-6 space-y-4">
        <div className="rounded-[28px] border border-[#d8d0c0] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8]">
            Chi vince questa presa?
          </p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {trickCards.map((card) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 30, rotate: -5 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotate: 0,
                  ...(choice === "ace" && card.label === "A"
                    ? { boxShadow: "0 0 20px rgba(200,164,78,0.5)" }
                    : {}),
                }}
                transition={{ delay: card.delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-[22px] border border-[#d8d0c0] bg-[#fffaf0] px-3 py-4 text-center shadow-sm ${
                  choice === "ace" && card.label === "A" ? "ring-2 ring-[#c8a44e]" : ""
                }`}
              >
                <p className="text-[10px] font-bold text-[#8a94a8] mb-1">{card.player}</p>
                <p className="text-2xl font-black text-[#12305f]">{card.label}</p>
                <div className="mt-2 flex justify-center">
                  <SuitSymbol suit="spade" size="md" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <ChoiceCard
            label="Asso di picche"
            description="E la carta piu alta del seme giocato."
            selected={choice === "ace"}
            correct
            onClick={() => handleChoice("ace")}
            disabled={choice === "ace"}
          />
          <ChoiceCard
            label="Donna di picche"
            description="E alta, ma non abbastanza."
            selected={choice === "queen"}
            correct={false}
            onClick={() => handleChoice("queen")}
            disabled={choice === "ace"}
          />
        </div>

        {choice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${
              choice === "ace"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-rose-300 bg-rose-50 text-rose-800"
            }`}
          >
            {choice === "ace"
              ? "Giusto! La presa la vince la carta piu alta del seme giocato."
              : "Quasi. Qui vince l'Asso di picche, perche nel seme giocato e la carta piu alta."}
          </motion.div>
        )}

        {choice === "ace" && (
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
