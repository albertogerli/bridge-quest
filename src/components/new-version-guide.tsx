"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/link";
import { motion, AnimatePresence } from "motion/react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useT } from "@/contexts/traduzioni-provider";
import { useSharedAuth } from "@/contexts/auth-provider";

/**
 * La guida «cosa è cambiato», una volta sola, per chi usava già il sito.
 *
 * DUE DIFETTI CORRETTI IL 28/09/2026, dopo un controllo esterno:
 *  - raccontava la riorganizzazione PRECEDENTE («Impara, Gioca e Scuola»),
 *    mentre la barra oggi ha Home, Percorso, Gioca e Profilo: descriveva
 *    voci che non c'erano più;
 *  - per capire se l'utente «c'era già» guardava `bq_onboarded`, che ha anche
 *    chi ha appena finito l'avvio guidato: ogni nuovo iscritto si sentiva
 *    dire «abbiamo riorganizzato tutto» dopo cinque minuti di sito.
 * Ora la si mostra solo agli account creati prima della riorganizzazione.
 */

const SEEN_KEY = "bq_guide_v3_seen";
/** Il giorno della riorganizzazione della barra: chi è nato dopo non ha niente da ritrovare. */
const RIORGANIZZAZIONE = "2026-09-28T00:00:00Z";

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
    title: "BridgeLab è cambiata",
    body: "La barra ha quattro voci: Home, Percorso, Gioca e Profilo. Se sei iscritto a una classe, compare anche Classe. Ecco dove sono le cose che usavi.",
    accent: "from-[#1B5E3B] to-[#2A7A4F]",
  },
  {
    emoji: "🎓",
    title: "Percorso",
    body: "Il tuo corso, lezione dopo lezione, con il punto da cui riprendere. Qui trovi anche la Prima Mano, le dispense e il ripasso.",
    href: "/lezioni",
    cta: "Apri il Percorso",
    accent: "from-[#1B5E3B] to-[#2A7A4F]",
  },
  {
    emoji: "🎮",
    title: "Gioca",
    body: "Tornei, sfide, la mano contro il computer, il MiniBridge e i giochi per allenare una singola abilità.",
    href: "/gioca",
    cta: "Apri Gioca",
    accent: "from-figb to-figb-light",
  },
  {
    emoji: "👤",
    title: "Profilo",
    body: "I tuoi progressi, i premi, gli amici e le impostazioni. Se insegni, da qui chiedi l'accesso al portale insegnanti.",
    href: "/profilo",
    cta: "Apri il Profilo",
    accent: "from-[#c8a44e] to-[#a8842e]",
  },
];

export function NewVersionGuide() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { user } = useSharedAuth();
  const utenteDiPrima = !!user?.created_at && user.created_at < RIORGANIZZAZIONE;

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY) === "1";
      if (!seen && utenteDiPrima) {
        // small delay so it doesn't fight with page mount
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [utenteDiPrima]);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setOpen(false);
  };

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open, { onEscape: close });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-version-guide-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

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
              <span className="text-5xl" aria-hidden="true">{slide.emoji}</span>
              <h2 id="new-version-guide-title" className="font-display text-2xl font-bold">{t(slide.title)}</h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{t(slide.body)}</p>

              {slide.href && (
                <Link
                  href={slide.href}
                  onClick={close}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {t(slide.cta ?? "")} →
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
                  {t("Salta")}
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
