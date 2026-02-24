"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "bq_tutorial_done";

interface TutorialStep {
  /** Where the bubble should point: position on screen */
  target: "south" | "north" | "highlighted" | "center" | "trickcount";
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    target: "south",
    title: "Le tue carte",
    description: "Queste sono le tue carte. Sei il dichiarante!",
  },
  {
    target: "north",
    title: "Il Morto",
    description:
      "Questo è il morto, il tuo compagno. Giochi anche le sue carte.",
  },
  {
    target: "highlighted",
    title: "Carte giocabili",
    description:
      "Le carte evidenziate in verde sono quelle giocabili. Solo queste possono essere selezionate.",
  },
  {
    target: "center",
    title: "Gioca una carta",
    description:
      "Tocca una carta per giocarla. Apparirà al centro del tavolo.",
  },
  {
    target: "trickcount",
    title: "Prese fatte",
    description:
      "Qui vedi le prese fatte. Obiettivo: raggiungere il contratto!",
  },
];

/**
 * Positions the tutorial bubble relative to the bridge table.
 * Returns tailwind classes for absolute positioning within the overlay.
 */
function getBubblePosition(target: TutorialStep["target"]): {
  containerClass: string;
  arrowDirection: "up" | "down" | "none";
} {
  switch (target) {
    case "south":
      return {
        containerClass: "bottom-[28%] left-1/2 -translate-x-1/2",
        arrowDirection: "down",
      };
    case "north":
      return {
        containerClass: "top-[18%] left-1/2 -translate-x-1/2",
        arrowDirection: "up",
      };
    case "highlighted":
      return {
        containerClass: "bottom-[32%] left-1/2 -translate-x-1/2",
        arrowDirection: "down",
      };
    case "center":
      return {
        containerClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        arrowDirection: "none",
      };
    case "trickcount":
      return {
        containerClass: "top-[40%] left-1/2 -translate-x-1/2",
        arrowDirection: "up",
      };
    default:
      return {
        containerClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        arrowDirection: "none",
      };
  }
}

function ArrowDown() {
  return (
    <div className="flex justify-center">
      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/95" />
    </div>
  );
}

function ArrowUp() {
  return (
    <div className="flex justify-center">
      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white/95" />
    </div>
  );
}

export function GameTutorial() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "true") {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable, don't show
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const step = STEPS[currentStep];
  const { containerClass, arrowDirection } = getBubblePosition(step.target);
  const isLast = currentStep === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 pointer-events-auto"
          style={{ touchAction: "manipulation" }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60 rounded-3xl" />

          {/* Step indicator dots */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-5 bg-emerald-400"
                    : idx < currentStep
                      ? "w-1.5 bg-white/60"
                      : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>

          {/* Skip button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-10 text-white/60 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
          >
            Salta tutorial
          </button>

          {/* Tutorial bubble */}
          <div className={`absolute z-10 ${containerClass}`}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: arrowDirection === "down" ? 12 : arrowDirection === "up" ? -12 : 0, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="flex flex-col items-center"
            >
              {arrowDirection === "up" && <ArrowUp />}

              <div className="bg-white/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-2xl shadow-black/30 max-w-[280px] w-max">
                {/* Step number badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    {currentStep + 1}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    {step.title}
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">
                  {step.description}
                </p>

                {/* Action button */}
                <button
                  onClick={handleNext}
                  className="mt-3 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2.5 transition-colors shadow-md shadow-emerald-500/25"
                >
                  {isLast ? "Iniziamo!" : "Avanti"}
                </button>
              </div>

              {arrowDirection === "down" && <ArrowDown />}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
