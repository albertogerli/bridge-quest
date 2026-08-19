"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { GraduationCap, Spade, Brain, Trophy, BarChart3, Flame } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useT } from "@/contexts/traduzioni-provider";

interface LandingPageProps {
  onContinueAsGuest: () => void;
}

export function LandingPage({ onContinueAsGuest }: LandingPageProps) {
  const t = useT();
  const features = [
    // Titoli e descrizioni in parole di chi legge, non nostre. Prima c'erano
    // «Analisi DDS» e «Gamification»: la prima non dice nulla a chi non
    // conosce il termine tecnico, la seconda è gergo di chi fa software.
    { icon: <GraduationCap className="w-6 h-6 text-figb" />, title: "I 4 corsi ufficiali FIGB", desc: "49 lezioni, dalle prime prese alla dichiarazione avanzata" },
    { icon: <Spade className="w-6 h-6 text-figb" />, title: "Un tavolo sempre pronto", desc: "Gioca mani vere quando vuoi, contro un avversario che gioca sul serio" },
    { icon: <Brain className="w-6 h-6 text-figb" />, title: "Esercizi e quiz", desc: "Metti alla prova quello che hai studiato, dieci minuti alla volta" },
    { icon: <Trophy className="w-6 h-6 text-figb" />, title: "Tornei e sfide", desc: "Il torneo della settimana, le sfide con gli amici, la classifica" },
    { icon: <BarChart3 className="w-6 h-6 text-figb" />, title: "Rivedi le tue mani", desc: "A fine partita ti mostriamo in quale presa la mano è cambiata" },
    { icon: <Flame className="w-6 h-6 text-figb" />, title: "I tuoi progressi", desc: "Quanto hai studiato, quanto hai giocato, quanto sei migliorato" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {/* Sticky top bar: keeps "Accedi" reachable at any scroll position */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-foreground/5 bg-background/90 px-4 py-2.5 backdrop-blur-sm">
        <span className="font-display text-lg font-bold tracking-tight text-figb dark:text-primary">{t("BridgeLab")}</span>
        <div className="flex items-center gap-2">
          <a
            href="/login?mode=login"
            className="rounded-xl px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-foreground/5"
          >
            {t("Accedi")}
          </a>
          <a
            href="/login?mode=signup"
            className="rounded-xl bg-figb px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-figb-light"
          >
            {t("Inizia gratis")}
          </a>
        </div>
      </header>

      {/* Hero */}
      {/* shrink-0: il contenitore è `flex flex-col`, e senza questo la sezione
          veniva COMPRESSA da ~400px a 144. Titolo, promessa e i tre pulsanti
          finivano fuori dal gradiente, in bianco su fondo avorio: invisibili.
          Ogni visitatore vedeva una fascia colorata vuota al posto della
          pagina di presentazione. */}
      <section className="shrink-0 relative overflow-hidden bg-gradient-to-br from-[#14472D] via-figb to-[#2D7A50] px-5 pt-16 pb-20">
        <div className="relative mx-auto max-w-lg lg:max-w-2xl text-center">
          {/* Suit icons */}
          <motion.div
            className="mb-5 flex items-center justify-center gap-3"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            aria-hidden="true"
          >
            {(["club", "diamond", "heart", "spade"] as const).map((suit, i) => (
              <motion.div
                key={suit}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/20"
              >
                <SuitSymbol suit={suit} size="lg" />
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight font-display"
          >
            {t("Impara il bridge.")}
            <br />
            {t("E poi giocalo.")}
          </motion.h1>
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-base sm:text-lg lg:text-xl text-white/85 max-w-xl mx-auto"
          >
            {t("Il corso ufficiale della Federazione Italiana Gioco Bridge, con un tavolo sempre pronto per fare pratica. Gratis.")}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3 max-w-xs mx-auto"
          >
            <a
              href="/login?mode=signup"
              className="flex items-center justify-center w-full h-14 rounded-2xl bg-white text-figb font-semibold text-base hover:bg-white/90 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
            >
              {t("Inizia gratis")}
            </a>
            <p className="text-center text-xs text-white/60 -mt-1">{t("Nessuna carta di credito richiesta")}</p>
            <a
              href="/login?mode=login"
              className="flex items-center justify-center w-full h-12 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/25 border border-white/20 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              {t("Accedi")}
            </a>
            <button
              onClick={onContinueAsGuest}
              className="w-full text-center text-sm font-semibold text-white/60 hover:text-white/80 transition-colors py-2"
            >
              {t("Prova senza account")}
            </button>
          </motion.div>
        </div>

        {/* Fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-background" aria-hidden="true" />
      </section>

      {/* Features */}
      <section className="shrink-0 px-5 -mt-4 pb-8 relative z-10">
        <div className="mx-auto max-w-lg lg:max-w-4xl">
          <motion.h2
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="font-display text-lg font-bold text-foreground mb-4 text-center"
          >
            {t("Tutto quello che serve per imparare il bridge")}
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.07 }}
                className="rounded-2xl bg-card p-4 border border-border shadow-sm"
              >
                <div className="mb-2">{feat.icon}</div>
                <p className="text-sm font-semibold text-foreground">{feat.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-tight">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suit divider */}
      {/* pointer-events-none: è decorativo e, essendo dentro un <main>
          che si estende, intercettava i clic sui comandi del footer
          sottostante — fra cui «Preferenze cookie». */}
      <div className="flex items-center justify-center gap-3 py-2 pointer-events-none" aria-hidden="true">
        <div className="h-px w-12 bg-foreground/10" />
        <span className="text-[12px] tracking-[0.3em] text-foreground/20 select-none">♠ ♥ ♦ ♣</span>
        <div className="h-px w-12 bg-foreground/10" />
      </div>

      {/* Stats */}
      <section className="shrink-0 px-5 pb-8">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="rounded-2xl bg-figb/5 dark:bg-primary/10 border border-figb/15 dark:border-primary/20 p-6 text-center"
          >
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-figb dark:text-primary">49</p>
                <p className="text-[12px] font-bold text-figb/80 dark:text-primary/80 uppercase">{t("Lezioni")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-figb dark:text-primary">4</p>
                <p className="text-[12px] font-bold text-figb dark:text-primary uppercase">{t("Corsi")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-figb dark:text-primary">200+</p>
                <p className="text-[12px] font-bold text-figb dark:text-primary uppercase">{t("Mani")}</p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG: next/image non ottimizza gli SVG */}
            <img src="/logo-bridgelab.svg" alt={t("Logo BridgeLab")} className="h-10 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-5 mb-3">
              <Image src="/icons/logo-figb.png" alt={t("Logo FIGB - Federazione Italiana Gioco Bridge")} width={400} height={355} className="h-12 w-auto" />
              <Image src="/icons/logo-coni.png" alt={t("Logo CONI - Comitato Olimpico Nazionale Italiano")} width={400} height={146} className="h-9 w-auto" />
            </div>
            <p className="text-xs font-bold text-figb/80 dark:text-primary/80 uppercase tracking-wider mb-1">
              {t("Un progetto della")}
            </p>
            <p className="text-lg font-bold text-figb dark:text-primary">
              {t("Federazione Italiana Gioco Bridge")}
            </p>
            <p className="mt-1 text-xs text-figb/60 dark:text-primary/60">
              {t("Commissione Insegnamento")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="shrink-0 px-5 pb-12">
        <div className="mx-auto max-w-xs">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex flex-col gap-3"
          >
            <a
              href="/login?mode=signup"
              className="flex items-center justify-center w-full h-12 rounded-2xl bg-gradient-to-r from-figb to-figb-light text-white font-semibold text-sm shadow-lg shadow-figb/20 hover:opacity-90 transition-opacity"
            >
              {t("Inizia gratis")}
            </a>
            <p className="text-center text-[12px] text-muted-foreground -mt-1">{t("Nessuna carta di credito richiesta")}</p>
            <a
              href="/login?mode=login"
              className="flex items-center justify-center w-full h-12 rounded-2xl bg-card text-primary font-semibold text-sm border-2 border-primary/20 hover:border-primary/40 transition-all"
            >
              {t("Accedi")}
            </a>
            <button
              onClick={onContinueAsGuest}
              className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {t("Continua senza account")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 pb-8 text-center space-y-1">
        <p className="text-[12px] text-muted-foreground">
          {t("Sviluppo e hosting: Alberto Giovanni Gerli / Tourbillon Tech S.r.l.")}
        </p>
        <p className="text-[12px] text-muted-foreground">
          <a href="/privacy" className="underline hover:text-foreground transition-colors">{t("Privacy e Cookie Policy")}</a>
        </p>
      </footer>
    </div>
  );
}
