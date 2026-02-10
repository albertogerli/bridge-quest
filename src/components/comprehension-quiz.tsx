"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { comprehensionData, type ComprehensionQuestion } from "@/data/comprensione-data";

interface ComprehensionQuizProps {
  lessonId: number;
  onComplete: (score: number, total: number) => void;
  onSkip: () => void;
}

export function ComprehensionQuiz({ lessonId, onComplete, onSkip }: ComprehensionQuizProps) {
  const data = comprehensionData.find((d) => d.lessonId === lessonId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!data || data.questions.length === 0) return null;

  const question = data.questions[currentIdx];
  const isCorrect = selected === question?.correctAnswer;
  const total = data.questions.length;

  const handleSelect = useCallback(
    (idx: number) => {
      if (showResult) return;
      setSelected(idx);
      setShowResult(true);
      if (idx === question.correctAnswer) {
        setScore((s) => s + 1);
      }
      // Increment weekly quiz counter
      try {
        const prev = parseInt(localStorage.getItem("bq_weekly_quizzes") || "0", 10);
        localStorage.setItem("bq_weekly_quizzes", String(prev + 1));
      } catch {}
    },
    [showResult, question]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= total) {
      setFinished(true);
      const finalScore = score + (selected === question.correctAnswer ? 0 : 0); // score already updated
      onComplete(score, total);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    }
  }, [currentIdx, total, score, onComplete, selected, question]);

  if (finished) {
    const stars = score === total ? 3 : score >= total * 0.66 ? 2 : 1;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 text-center shadow-xl border border-gray-100"
      >
        <div className="text-5xl mb-3">
          {stars === 3 ? "🌟" : stars === 2 ? "⭐" : "💪"}
        </div>
        <h3 className="text-xl font-extrabold text-gray-900">
          {stars === 3 ? "Perfetto!" : stars === 2 ? "Ben fatto!" : "Continua a studiare!"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {score}/{total} risposte corrette
        </p>
        <div className="flex justify-center gap-1 mt-3">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`text-2xl ${s <= stars ? "" : "opacity-20"}`}>
              ⭐
            </span>
          ))}
        </div>
        <Button
          onClick={() => onComplete(score, total)}
          className="mt-5 w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm"
        >
          Continua
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Verifica comprensione
          </span>
        </div>
        <button
          onClick={onSkip}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
        >
          Salta
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4">
        {data.questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < currentIdx
                ? "bg-emerald-400"
                : i === currentIdx
                ? "bg-emerald-600"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <p className="text-sm font-bold text-gray-900 mb-4">
            {question.question}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((opt, i) => {
              let bg = "bg-gray-50 hover:bg-gray-100 border-gray-200";
              let text = "text-gray-700";

              if (showResult) {
                if (i === question.correctAnswer) {
                  bg = "bg-emerald-50 border-emerald-400";
                  text = "text-emerald-800";
                } else if (i === selected && !isCorrect) {
                  bg = "bg-red-50 border-red-400";
                  text = "text-red-800";
                } else {
                  bg = "bg-gray-50 border-gray-200 opacity-50";
                }
              } else if (selected === i) {
                bg = "bg-emerald-50 border-emerald-300";
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={showResult}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${bg} ${text}`}
                  whileTap={showResult ? {} : { scale: 0.98 }}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold border border-gray-200 flex-shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={`mt-3 p-3 rounded-xl text-xs ${
                    isCorrect
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className="font-bold">
                    {isCorrect ? "Corretto! " : "Non proprio. "}
                  </span>
                  {question.explanation}
                </div>
                <Button
                  onClick={handleNext}
                  className="mt-3 w-full h-10 rounded-xl bg-gray-900 font-bold text-sm"
                >
                  {currentIdx + 1 >= total ? "Vedi risultato" : "Prossima"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
