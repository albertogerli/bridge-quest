"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppunti } from "@/hooks/use-appunti";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppuntiPage() {
  const { appunti, clearAll } = useAppunti();
  const profile = useProfile();
  const isSenior = profile.profile === "senior";
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  // Group appunti by lessonId
  const grouped = appunti.reduce<Record<number, typeof appunti>>((acc, a) => {
    if (!acc[a.lessonId]) acc[a.lessonId] = [];
    acc[a.lessonId].push(a);
    return acc;
  }, {});

  const lessonIds = Object.keys(grouped).map(Number).sort((a, b) => a - b);
  const totalRules = appunti.reduce((sum, a) => sum + a.rules.length, 0);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0f1219] pb-28 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-5 pt-14 pb-8 lg:pt-8">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="text-white/70 text-sm font-medium hover:text-white transition-colors">
            ← Home
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-4xl">📝</span>
            <div>
              <h1 className={`font-extrabold text-white ${isSenior ? "text-2xl" : "text-xl"}`}>
                I Miei Appunti
              </h1>
              <p className={`text-white/70 ${isSenior ? "text-base" : "text-sm"}`}>
                {totalRules > 0
                  ? `${totalRules} regole salvate da ${lessonIds.length} lezioni`
                  : "Le regole che impari verranno salvate qui"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 -mt-4">
        {appunti.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-[#e5e0d5] shadow-sm p-8 text-center"
          >
            <span className="text-5xl block mb-4">📖</span>
            <h3 className={`font-bold text-gray-700 ${isSenior ? "text-lg" : "text-base"}`}>
              Nessun appunto ancora
            </h3>
            <p className={`text-gray-500 mt-2 ${isSenior ? "text-base" : "text-sm"}`}>
              Completa i moduli delle lezioni e le regole importanti verranno salvate automaticamente qui.
            </p>
            <Link href="/lezioni">
              <Button className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">
                Vai alle lezioni
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {lessonIds.map((lid, idx) => {
              const lessonAppunti = grouped[lid];
              const firstEntry = lessonAppunti[0];
              const isExpanded = expandedLesson === lid;
              const lessonRuleCount = lessonAppunti.reduce((s, a) => s + a.rules.length, 0);

              return (
                <motion.div
                  key={lid}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl bg-white border border-[#e5e0d5] shadow-sm overflow-hidden"
                >
                  {/* Lesson header - clickable accordion */}
                  <button
                    onClick={() => setExpandedLesson(isExpanded ? null : lid)}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-md">
                      {lid}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-gray-900 truncate ${isSenior ? "text-base" : "text-[15px]"}`}>
                        {firstEntry.lessonTitle}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lessonAppunti.length} moduli · {lessonRuleCount} regole
                      </p>
                    </div>
                    <motion.svg
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="h-5 w-5 text-gray-400 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </motion.svg>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-4 border-t border-gray-100 pt-3">
                          {lessonAppunti.map((entry, mi) => (
                            <div key={mi}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                <span className={`font-semibold text-indigo-700 ${isSenior ? "text-base" : "text-sm"}`}>
                                  {entry.moduleTitle}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-auto">{entry.date}</span>
                              </div>
                              <ul className="space-y-1.5 ml-4">
                                {entry.rules.map((rule, ri) => (
                                  <li key={ri} className="flex gap-2 items-start">
                                    <span className="text-blue-400 mt-0.5 shrink-0">
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </span>
                                    <span className={`text-gray-700 leading-snug ${isSenior ? "text-base" : "text-sm"}`}>
                                      {rule}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Clear all button */}
            <div className="pt-4 text-center">
              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  Cancella tutti gli appunti
                </button>
              ) : (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <p className={`text-red-700 font-medium ${isSenior ? "text-base" : "text-sm"}`}>
                    Sei sicuro? Questa azione non si puo annullare.
                  </p>
                  <div className="flex gap-3 justify-center mt-3">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setShowConfirmClear(false)}
                    >
                      Annulla
                    </Button>
                    <Button
                      className="rounded-xl bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        clearAll();
                        setShowConfirmClear(false);
                      }}
                    >
                      Cancella tutto
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
