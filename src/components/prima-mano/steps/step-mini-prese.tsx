"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ConfettiBurst } from "@/components/celebration-effects";
import { StepShell } from "../step-shell";
import { MiniCard, type MiniCardData } from "../mini-card";
import type { StepProps } from "../types";

interface MiniTrick {
  lead: string;
  west: MiniCardData;
  north: MiniCardData;
  east: MiniCardData;
  southOptions: MiniCardData[];
  correctIndex: number;
  hint: string;
  winMessage: string;
  loseMessage: string;
}

const MINI_TRICKS: MiniTrick[] = [
  {
    lead: "Ovest attacca con il Re di cuori.",
    west: { rank: "K", suit: "heart" },
    north: { rank: "3", suit: "heart" },
    east: { rank: "5", suit: "heart" },
    southOptions: [
      { rank: "A", suit: "heart" },
      { rank: "7", suit: "heart" },
    ],
    correctIndex: 0,
    hint: "Devi rispondere a cuori. Quale vince?",
    winMessage: "Giusto! L'Asso batte il Re.",
    loseMessage: "Il 7 non batte il Re. Serviva l'Asso!",
  },
  {
    lead: "Sei tu ad attaccare. Picche è atout.",
    west: { rank: "4", suit: "spade" },
    north: { rank: "J", suit: "spade" },
    east: { rank: "6", suit: "spade" },
    southOptions: [
      { rank: "A", suit: "spade" },
      { rank: "2", suit: "spade" },
    ],
    correctIndex: 0,
    hint: "Sei il dichiarante. Incassa i tuoi onori!",
    winMessage: "Perfetto! Asso e poi il Fante dal morto: due prese sicure.",
    loseMessage: "Il 2 perde contro il 4. Meglio incassare l'Asso!",
  },
  {
    lead: "Ovest gioca il 3 di quadri.",
    west: { rank: "3", suit: "diamond" },
    north: { rank: "Q", suit: "diamond" },
    east: { rank: "K", suit: "diamond" },
    southOptions: [
      { rank: "A", suit: "diamond" },
      { rank: "5", suit: "diamond" },
    ],
    correctIndex: 0,
    hint: "Est ha messo il Re. Come rispondi?",
    winMessage: "Bravo! L'Asso cattura il Re di Est.",
    loseMessage: "Il 5 non basta: il Re di Est vince la presa.",
  },
  {
    lead: "Ovest gioca il 10 di fiori. Tu non hai fiori!",
    west: { rank: "10", suit: "club" },
    north: { rank: "8", suit: "club" },
    east: { rank: "J", suit: "club" },
    southOptions: [
      { rank: "2", suit: "spade" },
      { rank: "9", suit: "diamond" },
    ],
    correctIndex: 0,
    hint: "Non hai fiori. Picche è atout. Tagli o scarti?",
    winMessage: "Esatto! Hai tagliato con l'atout e vinto la presa!",
    loseMessage: "Il 9 di quadri è solo uno scarto. Potevi tagliare con picche (atout)!",
  },
];

export function StepMiniPrese({ onComplete, playSound }: StepProps) {
  const [trickIndex, setTrickIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [miniWins, setMiniWins] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const trick = MINI_TRICKS[trickIndex];
  const isCorrect = selected !== null ? selected === trick.correctIndex : null;

  const handleSelect = useCallback(
    (index: number) => {
      if (selected !== null) return;
      setSelected(index);

      const correct = index === trick.correctIndex;
      if (correct) {
        playSound("trickWon");
        setMiniWins((w) => w + 1);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1200);
      } else {
        playSound("wrong");
      }
    },
    [selected, trick.correctIndex, playSound]
  );

  const handleNext = useCallback(() => {
    if (trickIndex < MINI_TRICKS.length - 1) {
      setTrickIndex((i) => i + 1);
      setSelected(null);
      playSound("click");
    } else {
      setFinished(true);
      if (miniWins + (isCorrect ? 0 : 0) === MINI_TRICKS.length) {
        // Check if all 4 were correct (miniWins already includes current if correct)
        setShowConfetti(true);
      }
      playSound("levelUp");
    }
  }, [trickIndex, miniWins, isCorrect, playSound]);

  // Recalculate final wins (miniWins state is already updated by the time we finish)
  const finalWins = miniWins;

  if (finished) {
    const perfect = finalWins === MINI_TRICKS.length;
    return (
      <StepShell
        kicker="Riscaldamento"
        title="Quattro prese di pratica."
        body="Ecco come è andata."
      >
        <ConfettiBurst trigger={showConfetti} count={perfect ? 40 : 20} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 rounded-[28px] border border-[#d8d0c0] bg-white p-6 text-center"
        >
          <p className="text-4xl font-black text-[#12305f]">
            {finalWins}/{MINI_TRICKS.length}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#5c677d]">prese vinte!</p>
          {perfect && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-sm font-bold text-[#c8a44e]"
            >
              Perfetto! Nessun errore.
            </motion.p>
          )}
          <p className="mt-4 text-lg font-bold text-[#c8a44e]">+{finalWins * 5} XP</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <Button
            onClick={() => onComplete(finalWins * 5)}
            size="lg"
            className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
          >
            Vai alla partita vera
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </StepShell>
    );
  }

  return (
    <StepShell
      kicker="Riscaldamento"
      title="Quattro prese di pratica."
      body={trick.lead}
    >
      {/* XP toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#c8a44e] px-4 py-2 text-sm font-bold text-white shadow-lg"
          >
            +5 XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {MINI_TRICKS.map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              i < trickIndex
                ? "bg-[#c8a44e]"
                : i === trickIndex
                  ? "bg-[#003DA5] scale-125"
                  : "bg-[#d8d0c0]"
            }`}
          />
        ))}
      </div>

      {/* Streak counter */}
      {miniWins > 0 && trickIndex > 0 && (
        <motion.div
          key={miniWins}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-3 text-center text-sm font-bold text-[#c8a44e]"
        >
          {miniWins} su {trickIndex}! {miniWins === trickIndex ? "\uD83D\uDD25" : ""}
        </motion.div>
      )}

      {/* Table cards */}
      <div className="mt-4 rounded-[28px] border border-[#d8d0c0] bg-white p-5">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a94a8]">
          Carte sul tavolo
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="mb-1 text-[10px] font-bold text-[#8a94a8]">Ovest</p>
            <div className="flex justify-center">
              <MiniCard card={trick.west} disabled locked={false} delay={0.1} size="small" />
            </div>
          </div>
          <div className="text-center">
            <p className="mb-1 text-[10px] font-bold text-[#8a94a8]">Nord</p>
            <div className="flex justify-center">
              <MiniCard card={trick.north} disabled locked={false} delay={0.25} size="small" />
            </div>
          </div>
          <div className="text-center">
            <p className="mb-1 text-[10px] font-bold text-[#8a94a8]">Est</p>
            <div className="flex justify-center">
              <MiniCard card={trick.east} disabled locked={false} delay={0.4} size="small" />
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="mt-3 text-center text-sm italic text-[#5c677d]">{trick.hint}</p>

      {/* South options */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {trick.southOptions.map((card, i) => (
          <div key={`${card.rank}-${card.suit}`} className="flex justify-center">
            <MiniCard
              card={card}
              onClick={() => handleSelect(i)}
              selected={selected === i}
              correct={selected === i ? i === trick.correctIndex : undefined}
              disabled={selected !== null && selected !== i}
              delay={0.5 + i * 0.15}
            />
          </div>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mt-3 rounded-[24px] border px-4 py-3 text-sm leading-6 ${
              isCorrect
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-rose-300 bg-rose-50 text-rose-800"
            }`}
          >
            {isCorrect ? trick.winMessage : trick.loseMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {selected !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4">
          <Button
            onClick={handleNext}
            size="lg"
            className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
          >
            {trickIndex < MINI_TRICKS.length - 1 ? "Prossima presa" : "Vedi risultato"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </StepShell>
  );
}
