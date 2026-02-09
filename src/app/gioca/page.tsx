"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { allSmazzate, fioriSmazzate } from "@/data/all-smazzate";
import { quadriSmazzate } from "@/data/quadri-smazzate";
import { cuoriGiocoSmazzate } from "@/data/cuori-gioco-smazzate";

export default function GiocaPage() {
  const [dailyDone, setDailyDone] = useState(false);
  const [handsPlayed, setHandsPlayed] = useState(0);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);
      setHandsPlayed(parseInt(localStorage.getItem("bq_hands_played") || "0", 10));
    } catch {}
  }, []);

  // Pick a random smazzata for "Pratica Libera"
  const randomIdx = Math.floor(Math.random() * allSmazzate.length);

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-extrabold text-gray-900">Gioca</h1>
          <p className="text-sm text-gray-500 mt-1">
            Metti in pratica quello che hai imparato
          </p>
        </motion.div>

        {/* Hero card: Sfida del Giorno */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/gioca/sfida" className="block">
            <div className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all hover:shadow-xl ${
              dailyDone
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200"
                : "hero-gradient"
            }`}>
              {!dailyDone && (
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              )}
              <div className="relative flex items-center gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                  dailyDone ? "bg-emerald/10" : "bg-white/15"
                }`}>
                  {dailyDone ? "✅" : "🔥"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-xl font-extrabold ${dailyDone ? "text-emerald-dark" : "text-white"}`}>
                      Sfida del Giorno
                    </h2>
                    {!dailyDone && (
                      <Badge className="bg-amber/20 text-amber-light text-[10px] font-bold border-0">
                        +40 XP
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${dailyDone ? "text-emerald-dark/60" : "text-white/70"}`}>
                    {dailyDone
                      ? "Sfida completata! Torna domani per una nuova mano."
                      : "Una nuova mano ogni giorno. Gioca e guadagna XP bonus!"}
                  </p>
                </div>
                <svg
                  className={`h-6 w-6 shrink-0 ${dailyDone ? "text-emerald" : "text-white/60"}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Mini-Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-extrabold text-gray-900">Mini-Giochi</h2>
            <Badge className="bg-purple-50 text-purple-600 text-[10px] font-bold border-0">
              Nuovo
            </Badge>
          </div>
          <div className="space-y-2.5">
            {/* Conta Veloce */}
            <Link href="/gioca/conta-veloce" className="block">
              <div className="card-elevated rounded-2xl bg-white p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-md shadow-emerald-400/20">
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-[15px]">Conta Veloce</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Conta i Punti Onore a tempo! Quanto sei veloce?</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-emerald bg-emerald-50 rounded-full px-2 py-0.5">
                    +80 XP
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Dichiara! */}
            <Link href="/gioca/dichiara" className="block">
              <div className="card-elevated rounded-2xl bg-white p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-2xl shadow-md shadow-amber-400/20">
                  📢
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-[15px]">Dichiara!</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Scegli l&apos;apertura giusta per ogni mano</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                    +80 XP
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Memory Bridge */}
            <Link href="/gioca/memory" className="block">
              <div className="card-elevated rounded-2xl bg-white p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl shadow-md shadow-purple-400/20">
                  🧠
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-[15px]">Memory Bridge</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Abbina carte e concetti. Allena la memoria!</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 rounded-full px-2 py-0.5">
                    +60 XP
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Two-column cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* Pratica Libera */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Link href={`/gioca/smazzata?random=${randomIdx}`} className="block">
              <div className="card-elevated rounded-2xl bg-white p-5 cursor-pointer hover:shadow-lg transition-all h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                  <span className="text-2xl">🃏</span>
                </div>
                <h3 className="font-extrabold text-gray-900 text-[15px]">
                  Pratica Libera
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                  Gioca una mano casuale dalle {allSmazzate.length} disponibili
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    +30 XP
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Sfoglia Smazzate */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/gioca/smazzata" className="block">
              <div className="card-elevated rounded-2xl bg-white p-5 cursor-pointer hover:shadow-lg transition-all h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 mb-3">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="font-extrabold text-gray-900 text-[15px]">
                  Tutte le Smazzate
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                  Sfoglia e gioca le {allSmazzate.length} mani per lezione
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                    {allSmazzate.length} mani
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <div className="card-elevated rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">Le tue statistiche</h3>
              <Badge variant="outline" className="text-[10px] font-bold text-gray-400 border-gray-200">
                Pratica
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-extrabold text-emerald">{handsPlayed}</p>
                <p className="text-[11px] text-gray-500 font-medium">Mani giocate</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{allSmazzate.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">Disponibili</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-amber-500">
                  {handsPlayed > 0 ? Math.round((handsPlayed / allSmazzate.length) * 100) : 0}%
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Esplorate</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick-play by lesson */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-4"
        >
          <div className="card-elevated rounded-2xl bg-white p-5">
            <h3 className="font-extrabold text-gray-900 mb-3">Per corso</h3>
            <div className="space-y-4">
              {/* Fiori */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">♣ Corso Fiori ({fioriSmazzate.length} mani)</p>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((lesson) => (
                    <Link key={`f-${lesson}`} href={`/gioca/smazzata?lesson=${lesson}`}>
                      <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald transition-colors p-2.5 cursor-pointer">
                        <span className="text-sm font-extrabold text-gray-700">{lesson}</span>
                        <span className="text-[9px] text-gray-400 font-bold mt-0.5">8 mani</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Quadri */}
              {quadriSmazzate.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">♦ Corso Quadri ({quadriSmazzate.length} mani)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from(new Set(quadriSmazzate.map(s => s.lesson))).sort((a,b) => a-b).map((lesson) => {
                      const count = quadriSmazzate.filter(s => s.lesson === lesson).length;
                      return (
                        <Link key={`q-${lesson}`} href={`/gioca/smazzata?lesson=${lesson}`}>
                          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-colors p-2.5 cursor-pointer">
                            <span className="text-sm font-extrabold text-gray-700">{lesson}</span>
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5">{count} mani</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Cuori Gioco */}
              {cuoriGiocoSmazzate.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">♥ Cuori Gioco ({cuoriGiocoSmazzate.length} mani)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from(new Set(cuoriGiocoSmazzate.map(s => s.lesson))).sort((a,b) => a-b).map((lesson) => {
                      const count = cuoriGiocoSmazzate.filter(s => s.lesson === lesson).length;
                      return (
                        <Link key={`cg-${lesson}`} href={`/gioca/smazzata?lesson=${lesson}`}>
                          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors p-2.5 cursor-pointer">
                            <span className="text-sm font-extrabold text-gray-700">{lesson}</span>
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5">{count} mani</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Maestro Fiori tip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-4 mb-6"
        >
          <div className="card-elevated rounded-2xl bg-white p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white font-extrabold text-sm shadow-md shadow-emerald/30">
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="font-bold text-sm text-gray-900">Maestro Fiori</p>
                  <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-0">
                    Consiglio
                  </Badge>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  La pratica rende perfetti! Gioca le mani delle lezioni che hai completato per consolidare i concetti.
                  Prova i mini-giochi per allenare velocità e memoria!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
