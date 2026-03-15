"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { allSmazzate, fioriSmazzate } from "@/data/all-smazzate";
import { quadriSmazzate } from "@/data/quadri-smazzate";
import { cuoriGiocoSmazzate } from "@/data/cuori-gioco-smazzate";
import { useProfile } from "@/hooks/use-profile";
import {
  Flame, CheckCircle2, Trophy, CalendarDays, Zap, Search,
  Target, Hash, Megaphone, MessageCircle, Brain, Swords,
  Spade, BookOpen, Link2, BarChart3
} from "lucide-react";
import { WeeklyChallengeBanner } from "@/components/weekly-challenge-banner";

export default function GiocaPage() {
  const profile = useProfile();
  const [dailyDone, setDailyDone] = useState(false);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [tournamentDone, setTournamentDone] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [randomIdx, setRandomIdx] = useState(0);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);
      setHandsPlayed(parseInt(localStorage.getItem("bq_hands_played") || "0", 10));
      setRandomIdx(Math.floor(Math.random() * allSmazzate.length));
      // Check tournament completion for current week
      const EPOCH_START = new Date("2024-01-01T00:00:00Z").getTime();
      const weekNum = Math.floor((Date.now() - EPOCH_START) / (7 * 24 * 60 * 60 * 1000));
      setTournamentDone(!!localStorage.getItem(`bq_tournament_week_${weekNum}`));
      setOnboarded(localStorage.getItem("bq_onboarded") === "1");
    } catch {}
  }, []);

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">Gioca</h1>
          <p className="text-sm text-gray-500 mt-1">
            Metti in pratica quello che hai imparato
          </p>
        </motion.div>

        {/* Prima Mano: full card if not done, compact link if completed */}
        {!onboarded ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mb-4"
          >
            <Link href="/prima-mano" className="block" aria-label="Prima Mano: onboarding morbido per iniziare a giocare">
              <div className="relative overflow-hidden rounded-3xl border border-[#c8a44e]/30 bg-[linear-gradient(135deg,#fffaf0_0%,#f0e4c8_50%,#e8d9b0_100%)] p-5 transition-all hover:shadow-xl">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#c8a44e]/15 blur-2xl" />
                <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-[#003DA5]/8 blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#003DA5] text-white shadow-lg shadow-[#003DA5]/20">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#12305f]">Prima Mano</h2>
                      <Badge className="bg-[#c8a44e]/20 text-[#8f6b16] text-[10px] font-bold border-0">
                        3 min
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold border-0">
                        +50 {profile.xpLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#51627f]">
                      3 quiz, 4 mini-prese e poi una mano vera. Il modo più veloce per iniziare.
                    </p>
                  </div>
                  <svg
                    className="h-6 w-6 shrink-0 text-[#12305f]/45"
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mb-3"
          >
            <Link href="/prima-mano" className="block" aria-label="Rifai Prima Mano">
              <div className="flex items-center gap-3 rounded-2xl border border-[#d8d0c0] bg-white px-4 py-3 hover:shadow-md transition-shadow">
                <BookOpen className="w-4 h-4 text-[#003DA5] shrink-0" />
                <span className="text-sm font-medium text-[#12305f]">Rivedi Prima Mano</span>
                <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0 ml-auto">
                  Completato
                </Badge>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Mano Guidata card (after Prima Mano is done) */}
        {onboarded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-3"
          >
            <Link href="/gioca/mano-guidata" className="block" aria-label="Mano Guidata: pratica passo-passo">
              <div className="relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3.5 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Mano Guidata</p>
                    <p className="text-[11px] text-gray-500">Pratica passo-passo con suggerimenti</p>
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-700 text-[10px] font-bold border-0">
                    +35 XP
                  </Badge>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Hero card: Sfida del Giorno */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/gioca/sfida" className="block" aria-label="Sfida del Giorno: una nuova mano ogni giorno">
            <div className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all hover:shadow-xl ${
              dailyDone
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
                : "hero-gradient"
            }`}>
              {!dailyDone && (
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              )}
              <div className="relative flex items-center gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                  dailyDone ? "bg-emerald/10" : "bg-white/15"
                }`}>
                  {dailyDone ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <Flame className="w-7 h-7 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-xl font-semibold ${dailyDone ? "text-emerald-dark" : "text-white"}`}>
                      Sfida del Giorno
                    </h2>
                    {!dailyDone && (
                      <Badge className="bg-amber/20 text-amber-light text-[10px] font-bold border-0">
                        +40 {profile.xpLabel}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${dailyDone ? "text-emerald-dark/60" : "text-white/70"}`}>
                    {dailyDone
                      ? "Sfida completata! Torna domani per una nuova mano."
                      : `Una nuova mano ogni giorno. Gioca e guadagna ${profile.xpLabel} bonus!`}
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

        {/* Torneo Settimanale */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-4"
        >
          <Link href="/gioca/torneo" className="block" aria-label="Torneo Settimanale: 5 mani, stessa sfida per tutti">
            <div className={`relative overflow-hidden rounded-3xl p-5 cursor-pointer transition-all hover:shadow-xl ${
              tournamentDone
                ? "bg-[#003DA5]/5 border border-[#003DA5]/15"
                : "bg-gradient-to-br from-[#003DA5] to-[#002E7A]"
            }`}>
              {!tournamentDone && (
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              )}
              <div className="relative flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                  tournamentDone ? "bg-[#003DA5]/10" : "bg-white/15"
                }`}>
                  {tournamentDone ? <CheckCircle2 className="w-6 h-6 text-[#003DA5]" /> : <Trophy className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-lg font-semibold ${tournamentDone ? "text-[#003DA5]" : "text-white"}`}>
                      Torneo Settimanale
                    </h2>
                    {!tournamentDone && (
                      <Badge className="bg-white/15 text-white/90 text-[10px] font-bold border-0">
                        +150 {profile.xpLabel}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${tournamentDone ? "text-[#003DA5]/60" : "text-white/70"}`}>
                    {tournamentDone
                      ? "Torneo completato! Nuove mani la prossima settimana."
                      : "5 mani, stessa sfida per tutti. Entra in classifica!"}
                  </p>
                </div>
                <svg
                  className={`h-6 w-6 shrink-0 ${tournamentDone ? "text-[#003DA5]/60" : "text-white/60"}`}
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

        {/* Sfida IMP - prominent card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="mt-4"
        >
          <Link href="/amici" className="block" aria-label="Sfida IMP: sfida un amico a 1, 4 o 8 mani con punteggio IMP">
            <div className="relative overflow-hidden rounded-3xl p-5 cursor-pointer transition-all hover:shadow-xl bg-gradient-to-br from-violet-600 to-indigo-700">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  <Swords className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-white">Sfida IMP</h2>
                    <Badge className="bg-amber-400/20 text-amber-200 text-[10px] font-bold border-0 animate-pulse">NUOVO</Badge>
                  </div>
                  <p className="text-sm text-white/70">
                    Sfida un amico a 1, 4 o 8 mani con punteggio IMP
                  </p>
                </div>
                <svg
                  className="h-6 w-6 shrink-0 text-white/60"
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

        {/* Weekly Challenge Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mt-4"
        >
          <WeeklyChallengeBanner />
        </motion.div>

        {/* Mini-Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Mini-Giochi</h2>
            <Badge className="bg-[#003DA5]/10 text-[#003DA5] text-[10px] font-bold border-0">
              9 giochi
            </Badge>
          </div>
          <div className="space-y-2.5">
            {/* Mano del Giorno */}
            <Link href="/gioca/mano-del-giorno" className="block" aria-label="Mano del Giorno: una mano al giorno, uguale per tutti">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-2xl shadow-md shadow-amber-400/20">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Mano del Giorno</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Una mano al giorno, uguale per tutti. Classifica!</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                    +50 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Quiz Lampo */}
            <Link href="/gioca/quiz-lampo" className="block" aria-label="Quiz Lampo: raffica di domande, 30 secondi">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-2xl shadow-md shadow-rose-400/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Quiz Lampo</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Raffica di domande, 30 secondi! Combo multiplier</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 rounded-full px-2 py-0.5">
                    +100 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Trova l'Errore */}
            <Link href="/gioca/trova-errore" className="block" aria-label="Trova l'Errore: trova l'errore nella dichiarazione o giocata">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-2xl shadow-md shadow-red-400/20">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Trova l&apos;Errore</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Trova l&apos;errore nella dichiarazione o giocata</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                    +80 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Impasse o Drop */}
            <Link href="/gioca/impasse" className="block" aria-label="Impasse o Drop: decidi in 5 secondi">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl shadow-md shadow-cyan-400/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Impasse o Drop?</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Decidi in 5 secondi: impasse o caduta?</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 rounded-full px-2 py-0.5">
                    +70 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Conta Veloce */}
            <Link href="/gioca/conta-veloce" className="block" aria-label="Conta Veloce: conta i punti onore a tempo">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-md shadow-emerald-400/20">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Conta Veloce</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Conta i Punti Onore a tempo! Quanto sei veloce?</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                    +80 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Dichiara! */}
            <Link href="/gioca/dichiara" className="block" aria-label="Dichiara: scegli l'apertura giusta per ogni mano">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-2xl shadow-md shadow-amber-400/20">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Dichiara!</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Scegli l&apos;apertura giusta per ogni mano</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                    +80 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Pratica Licita */}
            <Link href="/gioca/pratica-licita" className="block" aria-label="Pratica Licita: esercitati nella dichiarazione">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl shadow-md shadow-indigo-400/20">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Pratica Licita</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Esercitati nella dichiarazione: Texas, Stayman e altro</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    +20-70 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Memory Bridge */}
            <Link href="/gioca/memory" className="block" aria-label="Memory Bridge: abbina carte e concetti">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl shadow-md shadow-purple-400/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Memory Bridge</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Abbina carte e concetti. Allena la memoria!</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 rounded-full px-2 py-0.5">
                    +60 {profile.xpLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Sfida un Amico */}
            <Link href="/gioca/sfida-amico" className="block" aria-label="Sfida un Amico: gioca la stessa mano e confronta i risultati">
              <div className="card-clean rounded-2xl bg-white p-4 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-2xl shadow-md shadow-violet-400/20">
                  <Swords className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15px]">Sfida un Amico</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">Gioca la stessa mano e confronta i risultati</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 rounded-full px-2 py-0.5">
                    +30 {profile.xpLabel}
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
            <Link href={`/gioca/smazzata?random=${randomIdx}`} className="block" aria-label="Pratica Libera: gioca una mano casuale">
              <div className="card-clean rounded-2xl bg-white p-5 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                  <Spade className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px]">
                  Pratica Libera
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                  Gioca una mano casuale dalle {allSmazzate.length} disponibili
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    +30 {profile.xpLabel}
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
            <Link href="/gioca/smazzata" className="block" aria-label="Tutte le Smazzate: sfoglia e gioca le mani per lezione">
              <div className="card-clean rounded-2xl bg-white p-5 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 mb-3">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px]">
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

          {/* Sfida via Link */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.32 }}
          >
            <Link href="/gioca/sfida-link" className="block" aria-label="Sfida via Link: condividi una mano e sfida un amico">
              <div className="card-clean rounded-2xl bg-white p-5 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 mb-3">
                  <Link2 className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px]">
                  Sfida via Link
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                  Condividi un link, giocate la stessa mano e confrontate!
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 rounded-full px-2 py-0.5">
                    +30 {profile.xpLabel}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Analisi AI */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.34 }}
          >
            <Link href="/gioca/analisi" className="block" aria-label="Analisi AI: rivedi le tue mani con commenti dell'intelligenza artificiale">
              <div className="card-clean rounded-2xl bg-white p-5 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 mb-3">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px]">
                  Analisi AI
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                  Rivedi le tue mani con commenti dell&apos;AI carta per carta
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                    Post-partita
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Glossario */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.36 }}
          >
            <Link href="/glossario" className="block" aria-label="Glossario: impara tutti i termini del bridge">
              <div className="card-clean rounded-2xl bg-white p-5 cursor-pointer hover:translate-y-[-2px] transition-all active:translate-y-[2px] h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 mb-3">
                  <span className="text-xl">📖</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px]">
                  Glossario
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                  Impara tutti i termini del bridge
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">
                    A-Z
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
          <div className="card-clean rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Le tue statistiche</h3>
              <Badge variant="outline" className="text-[10px] font-bold text-gray-400 border-gray-200">
                Pratica
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#003DA5]">{handsPlayed}</p>
                <p className="text-[11px] text-gray-500 font-medium">Mani giocate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{allSmazzate.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">Disponibili</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
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
          <div className="card-clean rounded-2xl bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Per corso</h3>
            <div className="space-y-4">
              {/* Fiori */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">♣ Corso Fiori ({fioriSmazzate.length} mani)</p>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((lesson) => (
                    <Link key={`f-${lesson}`} href={`/gioca/smazzata?course=fiori&lesson=${lesson}`}>
                      <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-emerald-50 hover:text-emerald transition-colors p-2.5 cursor-pointer">
                        <span className="text-sm font-bold text-gray-700">{lesson}</span>
                        <span className="text-[9px] text-gray-500 font-bold mt-0.5">8 mani</span>
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
                        <Link key={`q-${lesson}`} href={`/gioca/smazzata?course=quadri&lesson=${lesson}`}>
                          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-colors p-2.5 cursor-pointer">
                            <span className="text-sm font-bold text-gray-700">{lesson}</span>
                            <span className="text-[9px] text-gray-500 font-bold mt-0.5">{count} mani</span>
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
                        <Link key={`cg-${lesson}`} href={`/gioca/smazzata?course=cuori-gioco&lesson=${lesson}`}>
                          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border-2 border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors p-2.5 cursor-pointer">
                            <span className="text-sm font-bold text-gray-700">{lesson}</span>
                            <span className="text-[9px] text-gray-500 font-bold mt-0.5">{count} mani</span>
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
          <div className="card-clean rounded-2xl bg-white p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#003DA5] text-white font-bold text-sm shadow-md shadow-[#003DA5]/20">
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
