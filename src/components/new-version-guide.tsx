"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

/**
 * One-time "what's new" guide for existing users landing on the reorganised
 * version. Explains the three hubs (Impara / Gioca / Scuola) and the new
 * MiniBridge mode. Shown once (localStorage flag), only to users who already
 * completed the Prima Mano onboarding — brand-new users get Prima Mano instead.
 */

const SEEN_KEY = "bq_guide_v2_seen";

interface Slide {
  emoji: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  accent: string; // gradient classes
}

const SLIDES: Slide[] = [
  {
    emoji: "✨",
    title: "Benvenuto nella nuova BridgeLab",
    body: "Abbiamo riorganizzato tutto per renderlo più semplice. Ora c'è un punto d'ingresso chiaro per ogni cosa: Impara, Gioca e Scuola. Ecco una mappa veloce.",
    accent: "from-[#1B5E3B] to-[#2A7A4F]",
  },
  {
    emoji: "🎓",
    title: "Impara",
    body: "Il tuo percorso passo dopo passo — Prima Mano, MiniBridge, i corsi e le mani guidate — con sempre evidenziato il “prossimo passo”. Qui trovi anche dispense, glossario e ripasso.",
    href: "/impara",
    cta: "Apri Impara",
    accent: "from-[#1B5E3B] to-[#2A7A4F]",
  },
  {
    emoji: "🎮",
    title: "Gioca",
    body: "Tutti i modi per giocare, ordinati: Pratica (allena una singola abilità), Sfide (competi) e Gioco libero. E prova il nuovo MiniBridge: giochi una mano intera senza licita, contando i punti.",
    href: "/gioca",
    cta: "Apri Gioca",
    accent: "from-figb to-figb-light",
  },
  {
    emoji: "👨‍🏫",
    title: "Scuola",
    body: "Le classi virtuali: gli istruttori assegnano compiti e seguono i progressi, gli allievi giocano le mani assegnate e chattano con la classe. Se insegni, qui richiedi l'accesso al Portale Istruttori.",
    href: "/scuola",
    cta: "Apri Scuola",
    accent: "from-[#c8a44e] to-[#a8842e]",
  },
];

export function NewVersionGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY) === "1";
      const onboarded = localStorage.getItem("bq_onboarded") === "1";
      // Only existing (already-onboarded) users who haven't seen the guide.
      if (!seen && onboarded) {
        // small delay so it doesn't fight with page mount
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setOpen(false);
  };

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl"
          >
            {/* header band */}
            <div className={`flex flex-col items-center gap-2 bg-gradient-to-br ${slide.accent} px-6 pb-6 pt-8 text-center text-white`}>
              <span className="text-5xl">{slide.emoji}</span>
              <h2 className="font-display text-2xl font-bold">{slide.title}</h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{slide.body}</p>

              {slide.href && (
                <Link
                  href={slide.href}
                  onClick={close}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {slide.cta} →
                </Link>
              )}

              {/* dots */}
              <div className="mt-6 flex items-center justify-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Vai alla slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === step ? "w-6 bg-primary" : "w-2 bg-border"
                    }`}
                  />
                ))}
              </div>

              {/* actions */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <button onClick={close} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Salta
                </button>
                <button
                  onClick={() => (isLast ? close() : setStep((s) => s + 1))}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
                >
                  {isLast ? "Inizia" : "Avanti"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
