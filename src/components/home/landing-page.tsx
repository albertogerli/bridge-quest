"use client";

import { motion } from "motion/react";
import { GraduationCap, Spade, Brain, Trophy, BarChart3, Flame } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";

interface LandingPageProps {
  onContinueAsGuest: () => void;
}

export function LandingPage({ onContinueAsGuest }: LandingPageProps) {
  const features = [
    { icon: <GraduationCap className="w-6 h-6 text-indigo-600" />, title: "49 Lezioni", desc: "4 corsi FIGB completi, dalla base all'avanzato" },
    { icon: <Spade className="w-6 h-6 text-gray-700" />, title: "Gioca Subito", desc: "Mani interattive con AI avversaria intelligente" },
    { icon: <Brain className="w-6 h-6 text-purple-600" />, title: "Quiz & Mini-giochi", desc: "6 tipi di quiz, 9 mini-giochi, ripasso intelligente" },
    { icon: <Trophy className="w-6 h-6 text-amber-600" />, title: "Tornei & Sfide", desc: "Torneo settimanale, sfida amici, classifica" },
    { icon: <BarChart3 className="w-6 h-6 text-blue-600" />, title: "Analisi DDS", desc: "Analisi double-dummy post-mano professionale" },
    { icon: <Flame className="w-6 h-6 text-orange-500" />, title: "Gamification", desc: "XP, streak, badge, premi e collezionabili" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F5F0] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {/* Sticky top bar: keeps "Accedi" reachable at any scroll position */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-black/5 bg-[#F7F5F0]/90 px-4 py-2.5 backdrop-blur-sm">
        <span className="font-display text-lg font-bold tracking-tight text-[#003DA5]">BridgeLab</span>
        <div className="flex items-center gap-2">
          <a
            href="/login?mode=login"
            className="rounded-xl px-3 py-2 text-sm font-bold text-[#003DA5] transition-colors hover:bg-black/5"
          >
            Accedi
          </a>
          <a
            href="/login?mode=signup"
            className="rounded-xl bg-[#003DA5] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#003DA5]/90"
          >
            Inizia gratis
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14472D] via-[#003DA5] to-[#2D7A50] px-5 pt-16 pb-20">
        <div className="relative mx-auto max-w-lg text-center">
          {/* Suit icons */}
          <motion.div
            className="mb-5 flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            aria-hidden="true"
          >
            {(["club", "diamond", "heart", "spade"] as const).map((suit, i) => (
              <motion.div
                key={suit}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20"
              >
                <SuitSymbol suit={suit} size="lg" />
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-display"
          >
            FIGB Bridge LAB
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-base sm:text-lg text-white/80 max-w-md mx-auto"
          >
            Impara il bridge giocando. Il corso ufficiale della Federazione Italiana Gioco Bridge, gamificato.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3 max-w-xs mx-auto"
          >
            <a
              href="/login?mode=signup"
              className="flex items-center justify-center w-full h-14 rounded-2xl bg-white text-[#003DA5] font-semibold text-base hover:bg-white/90 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
            >
              Inizia gratis
            </a>
            <p className="text-center text-xs text-white/60 -mt-1">Nessuna carta di credito richiesta</p>
            <a
              href="/login?mode=login"
              className="flex items-center justify-center w-full h-12 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/25 border border-white/20 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Accedi
            </a>
            <button
              onClick={onContinueAsGuest}
              className="w-full text-center text-sm font-semibold text-white/60 hover:text-white/80 transition-colors py-2"
            >
              Prova senza account
            </button>
          </motion.div>
        </div>

        {/* Fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#F7F5F0]" aria-hidden="true" />
      </section>

      {/* Features */}
      <section className="px-5 -mt-4 pb-8 relative z-10">
        <div className="mx-auto max-w-lg">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg font-bold text-gray-900 mb-4 text-center"
          >
            Tutto quello che serve per imparare il bridge
          </motion.h2>

          <div className="grid grid-cols-2 gap-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.07 }}
                className="rounded-2xl bg-white p-4 border border-gray-200 shadow-warm-sm"
              >
                <div className="mb-2">{feat.icon}</div>
                <p className="text-sm font-semibold text-gray-900">{feat.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suit divider */}
      <div className="flex items-center justify-center gap-3 py-2" aria-hidden="true">
        <div className="h-px w-12 bg-[#1B5E3B]/10" />
        <span className="text-[10px] tracking-[0.3em] text-[#1B5E3B]/20 select-none">♠ ♥ ♦ ♣</span>
        <div className="h-px w-12 bg-[#1B5E3B]/10" />
      </div>

      {/* Stats */}
      <section className="px-5 pb-8">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="rounded-2xl bg-[#003DA5]/5 border border-[#003DA5]/15 p-6 text-center"
          >
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-[#003DA5]">49</p>
                <p className="text-[10px] font-bold text-[#003DA5]/80 uppercase">Lezioni</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#003DA5]">4</p>
                <p className="text-[10px] font-bold text-[#003DA5]/70 uppercase">Corsi</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#003DA5]">200+</p>
                <p className="text-[10px] font-bold text-[#003DA5]/70 uppercase">Mani</p>
              </div>
            </div>
            <img src="/logo-bridgelab.svg" alt="Logo BridgeLab" className="h-10 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-5 mb-3">
              <img src="/icons/logo-figb.png" alt="Logo FIGB - Federazione Italiana Gioco Bridge" className="h-12 w-auto" />
              <img src="/icons/logo-coni.png" alt="Logo CONI - Comitato Olimpico Nazionale Italiano" className="h-9 w-auto" />
            </div>
            <p className="text-xs font-bold text-[#003DA5]/80 uppercase tracking-wider mb-1">
              Un progetto della
            </p>
            <p className="text-lg font-bold text-[#003DA5]">
              Federazione Italiana Gioco Bridge
            </p>
            <p className="mt-1 text-xs text-[#003DA5]/60">
              Commissione Insegnamento
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-12">
        <div className="mx-auto max-w-xs">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex flex-col gap-3"
          >
            <a
              href="/login?mode=signup"
              className="flex items-center justify-center w-full h-12 rounded-2xl bg-[#003DA5] text-white font-semibold text-sm shadow-lg shadow-[#003DA5]/20 hover:opacity-90 transition-opacity"
            >
              Inizia gratis
            </a>
            <p className="text-center text-[11px] text-gray-400 -mt-1">Nessuna carta di credito richiesta</p>
            <a
              href="/login?mode=login"
              className="flex items-center justify-center w-full h-12 rounded-2xl bg-white text-[#003DA5] font-semibold text-sm border-2 border-[#003DA5]/20 hover:border-[#003DA5]/40 transition-all"
            >
              Accedi
            </a>
            <button
              onClick={onContinueAsGuest}
              className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Continua senza account
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-8 text-center space-y-1">
        <p className="text-[10px] text-gray-400">
          Sviluppo e hosting: Alberto Giovanni Gerli / Tourbillon Tech S.r.l.
        </p>
        <p className="text-[11px] text-gray-400">
          <a href="/privacy" className="underline hover:text-gray-600 transition-colors">Privacy e Cookie Policy</a>
        </p>
      </footer>
    </div>
  );
}
