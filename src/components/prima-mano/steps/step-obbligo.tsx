"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { MiniCard } from "../mini-card";
import { ConfettiBurst } from "@/components/celebration-effects";
import { StepShell } from "../step-shell";
import type { StepProps } from "../types";
import type { MiniCardData } from "../mini-card";

interface HandCard extends MiniCardData {
  id: string;
  locked: boolean;
}

const scenario1Hand: HandCard[] = [
  { id: "kh", rank: "K", suit: "heart", locked: false },
  { id: "7h", rank: "7", suit: "heart", locked: false },
  { id: "3h", rank: "3", suit: "heart", locked: false },
  { id: "as", rank: "A", suit: "spade", locked: true },
  { id: "5s", rank: "5", suit: "spade", locked: true },
];

const scenario2Hand: HandCard[] = [
  { id: "as2", rank: "A", suit: "spade", locked: false },
  { id: "ks2", rank: "K", suit: "spade", locked: false },
  { id: "8d", rank: "8", suit: "diamond", locked: false },
  { id: "5d", rank: "5", suit: "diamond", locked: false },
  { id: "3c", rank: "3", suit: "club", locked: false },
];

export function StepObbligo({ onComplete, playSound }: StepProps) {
  const [scenario, setScenario] = useState<1 | 2>(1);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [shakeCard, setShakeCard] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [scenario1Done, setScenario1Done] = useState(false);
  const [scenario2Done, setScenario2Done] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setTooltip(null), 2000);
  };

  const handleScenario1Tap = (card: HandCard) => {
    if (scenario1Done) return;

    if (card.locked) {
      playSound("wrong");
      setShakeCard(card.id);
      setTooltip("Devi rispondere al seme!");
      clearTooltip();
      setTimeout(() => setShakeCard(null), 500);
      return;
    }

    // Heart card tapped - correct
    playSound("correct");
    setSelectedCard(card.id);
    setScenario1Done(true);
  };

  const handleScenario2Tap = (card: HandCard) => {
    if (scenario2Done) return;

    // Any card is valid
    playSound("correct");
    setSelectedCard(card.id);
    setScenario2Done(true);
    setShowConfetti(true);
  };

  const hand = scenario === 1 ? scenario1Hand : scenario2Hand;
  const done = scenario === 1 ? scenario1Done : scenario2Done;

  return (
    <StepShell
      kicker="L'Obbligo"
      title="Devi rispondere al seme."
      body="Se hai carte del seme giocato, DEVI giocare una di quelle. Solo se non ne hai, puoi giocare qualsiasi altra carta."
    >
      <ConfettiBurst trigger={showConfetti} count={25} />

      <div className="mt-6 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`scenario-${scenario}`}
            initial={{ opacity: 0, x: scenario === 2 ? 40 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* Scenario header */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#003DA5] text-[11px] font-bold text-white">
                {scenario}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8]">
                {scenario === 1 ? "Hai il seme giocato" : "Non hai il seme giocato"}
              </p>
            </div>

            {/* Lead card */}
            <div className="rounded-[28px] border border-[#d8d0c0] bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8] mb-3">
                Ovest gioca:
              </p>
              <div className="flex justify-center">
                <div className="rounded-[22px] border-2 border-[#c8a44e] bg-[#fffdf5] px-5 py-4 text-center shadow-md">
                  <p className="text-2xl font-black text-red-600">Q</p>
                  <div className="mt-1.5 flex justify-center">
                    <SuitSymbol suit="heart" size="md" />
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-[#8a94a8]">Ovest</p>
                </div>
              </div>
            </div>

            {/* Player hand */}
            <div className="rounded-[28px] border border-[#d8d0c0] bg-[#fffaf0] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8] mb-3">
                La tua mano &mdash; scegli una carta:
              </p>
              <div className="grid grid-cols-5 gap-2">
                {hand.map((card, i) => {
                  const isShaking = shakeCard === card.id;
                  const isSelected = selectedCard === card.id;

                  return (
                    <motion.div
                      key={card.id}
                      animate={isShaking ? { x: [0, -5, 5, -3, 3, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <MiniCard
                        card={{ rank: card.rank, suit: card.suit }}
                        onClick={() =>
                          scenario === 1
                            ? handleScenario1Tap(card)
                            : handleScenario2Tap(card)
                        }
                        selected={isSelected}
                        correct={isSelected ? true : undefined}
                        disabled={done && !isSelected}
                        locked={card.locked}
                        delay={i * 0.08}
                        size="small"
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {tooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 rounded-[16px] border border-rose-300 bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-700"
                  >
                    <Lock className="mr-1 inline h-3.5 w-3.5" />
                    {tooltip}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Explanation */}
            {done && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-[24px] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
              >
                {scenario === 1
                  ? "Bravo! Avevi cuori in mano, quindi dovevi per forza rispondere a cuori. Le picche erano bloccate."
                  : "Esatto! Senza cuori in mano, sei libero di giocare qualsiasi carta. Puoi tagliare, scartare... decidi tu."}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Transition to scenario 2 or final continue */}
        {scenario === 1 && scenario1Done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={() => {
                playSound("click");
                setScenario(2);
                setSelectedCard(null);
                setTooltip(null);
              }}
              size="lg"
              className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
            >
              E se non ho cuori?
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {scenario === 2 && scenario2Done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={() => onComplete(10)}
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
