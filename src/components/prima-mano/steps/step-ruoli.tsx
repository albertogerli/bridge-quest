"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Swords } from "lucide-react";
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

const roles = [
  {
    icon: Play,
    title: "Dichiarante",
    description: "Ha vinto la licita e gestisce la strategia. Gioca anche le carte del morto.",
    color: "text-[#003DA5]",
    bg: "bg-blue-50",
    border: "border-blue-200",
    delay: 0.15,
  },
  {
    icon: Shield,
    title: "Morto",
    description: "Il compagno del dichiarante. Scopre le sue carte sul tavolo e non decide nulla.",
    color: "text-[#c8a44e]",
    bg: "bg-amber-50",
    border: "border-amber-200",
    delay: 0.3,
  },
  {
    icon: Swords,
    title: "Difensori",
    description: "I due avversari. Collaborano per impedire al dichiarante di fare le prese necessarie.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    delay: 0.45,
  },
];

export function StepRuoli({ onComplete, playSound }: StepProps) {
  const [choice, setChoice] = useState<"declarer" | "defender" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const firstTry = useRef(true);

  const handleChoice = (c: "declarer" | "defender") => {
    if (choice === "defender") return;
    setChoice(c);
    if (c === "defender") {
      playSound("correct");
      setShowConfetti(true);
    } else {
      playSound("wrong");
      firstTry.current = false;
    }
  };

  return (
    <StepShell
      kicker="I Protagonisti"
      title="Al tavolo siete in quattro, ma giocano in tre."
      body="Il dichiarante decide la strategia e controlla anche le carte del morto. I due difensori cercano di battere il contratto."
    >
      <ConfettiBurst trigger={showConfetti} count={25} />

      <div className="mt-6 space-y-4">
        {/* Role cards */}
        <div className="grid gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: role.delay }}
                className={`rounded-[24px] border ${role.border} ${role.bg} p-4`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ${role.border} border`}>
                    <Icon className={`h-5 w-5 ${role.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#12305f]">{role.title}</p>
                    <p className="text-sm leading-6 text-[#5c677d]">{role.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-[28px] border border-[#d8d0c0] bg-white p-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8] mb-3">
            Chi gioca la prima carta della mano?
          </p>
          <div className="grid gap-3">
            <ChoiceCard
              label="Il dichiarante"
              description="Ha vinto la licita, quindi inizia lui."
              selected={choice === "declarer"}
              correct={false}
              onClick={() => handleChoice("declarer")}
              disabled={choice === "defender"}
            />
            <ChoiceCard
              label="Il difensore a sinistra del dichiarante"
              description="L'attacco parte dalla difesa."
              selected={choice === "defender"}
              correct
              onClick={() => handleChoice("defender")}
              disabled={choice === "defender"}
            />
          </div>
        </motion.div>

        {/* Explanation */}
        {choice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`rounded-[24px] border px-4 py-3 text-sm leading-6 ${
              choice === "defender"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-rose-300 bg-rose-50 text-rose-800"
            }`}
          >
            {choice === "defender"
              ? "Esatto! La prima carta (apertura) la gioca il difensore alla sinistra del dichiarante. Solo dopo il morto scopre le sue carte."
              : "No, il dichiarante non gioca per primo. La prima carta la gioca il difensore alla sua sinistra."}
          </motion.div>
        )}

        {/* Continue button */}
        {choice === "defender" && (
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
