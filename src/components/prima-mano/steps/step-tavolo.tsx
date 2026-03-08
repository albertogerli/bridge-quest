"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { StepShell } from "../step-shell";
import type { StepProps } from "../types";

const positions = [
  { id: "north", label: "Nord", sub: "Compagno", x: "50%", y: "5%", delay: 0.2, suit: "spade" as const },
  { id: "east", label: "Est", sub: "Avversario", x: "85%", y: "42%", delay: 0.5, suit: "diamond" as const },
  { id: "south", label: "Tu (Sud)", sub: "Dichiarante", x: "50%", y: "78%", delay: 0.8, suit: "heart" as const },
  { id: "west", label: "Ovest", sub: "Avversario", x: "15%", y: "42%", delay: 1.1, suit: "club" as const },
];

export function StepTavolo({ onComplete, playSound }: StepProps) {
  const [revealed, setRevealed] = useState(0);

  return (
    <StepShell
      kicker="Prendi Posto"
      title="Quattro giocatori, due squadre."
      body="Tu sei Sud. Il tuo compagno e di fronte."
    >
      <div className="relative mt-6 aspect-square max-w-[320px] mx-auto">
        {/* Table background */}
        <div className="absolute inset-[15%] rounded-[28px] border-2 border-[#d8d0c0] bg-gradient-to-br from-[#1a5f2a] to-[#0d4a1c] shadow-inner" />

        {/* Partnership lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <line x1="50%" y1="18%" x2="50%" y2="82%" stroke="#c8a44e" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="18%" y1="50%" x2="82%" y2="50%" stroke="#888" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {positions.map((pos, i) => {
          const isPlayer = pos.id === "south";
          return (
            <motion.div
              key={pos.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: pos.delay, duration: 0.5, type: "spring" }}
              onAnimationComplete={() => {
                if (i >= revealed) {
                  setRevealed(i + 1);
                  playSound("cardPlay");
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.x, top: pos.y }}
            >
              <div
                className={`rounded-[20px] border-2 px-4 py-3 text-center shadow-md transition-all ${
                  isPlayer
                    ? "border-[#c8a44e] bg-[#fffdf5] shadow-[0_0_20px_rgba(200,164,78,0.3)]"
                    : "border-[#d8d0c0] bg-white"
                }`}
              >
                <div className="flex justify-center mb-1">
                  <SuitSymbol suit={pos.suit} size="sm" />
                </div>
                <p className={`text-sm font-bold ${isPlayer ? "text-[#8f6b16]" : "text-[#12305f]"}`}>
                  {pos.label}
                </p>
                <p className="text-[10px] text-[#5c677d] mt-0.5">{pos.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {revealed >= 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
          <Button
            onClick={() => {
              playSound("click");
              onComplete(5);
            }}
            size="lg"
            className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
          >
            Ho capito, avanti
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </StepShell>
  );
}
