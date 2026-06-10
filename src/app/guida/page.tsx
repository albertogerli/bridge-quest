"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

/**
 * Guida all'app — permanent, browsable tutorial ("come funziona BridgeLab").
 * Complements the one-shot onboarding (Prima Mano) and the what's-new modal
 * (NewVersionGuide): this page is always reachable from footer / Impara.
 */

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

interface Feature {
  emoji: string;
  title: string;
  desc: string;
  href?: string;
  cta?: string;
}

interface Section {
  id: string;
  emoji: string;
  title: string;
  intro: string;
  features: Feature[];
}

const SECTIONS: Section[] = [
  {
    id: "primi-passi",
    emoji: "🚀",
    title: "Primi passi",
    intro:
      "Mai giocato a bridge? Nessun problema: in 5 minuti giochi la tua prima mano, senza regole da studiare prima.",
    features: [
      {
        emoji: "🃏",
        title: "Prima Mano",
        desc: "Il punto di partenza: giochi subito una mano vera, guidato carta per carta. Niente teoria, solo gioco.",
        href: "/prima-mano",
        cta: "Gioca la tua prima mano",
      },
      {
        emoji: "🎓",
        title: "MiniBridge",
        desc: "Una mano completa senza la licita: conti i punti, scegli il contratto e giochi. Il ponte perfetto verso il bridge vero.",
        href: "/gioca/minibridge",
        cta: "Prova MiniBridge",
      },
      {
        emoji: "📚",
        title: "Corso Fiori",
        desc: "Il primo dei 4 corsi: lezioni brevi con quiz, pensate per chi parte da zero. Ogni modulo si sblocca col precedente.",
        href: "/lezioni",
        cta: "Inizia il corso",
      },
    ],
  },
  {
    id: "impara",
    emoji: "🎓",
    title: "Impara",
    intro:
      "Il percorso di studio: corsi, lezioni con quiz, mani guidate e gli strumenti per fissare quello che impari.",
    features: [
      {
        emoji: "📚",
        title: "Corsi e lezioni",
        desc: "4 corsi progressivi (Fiori, Quadri, Cuori gioco e licita). Ogni lezione ha moduli teorici, quiz e smazzate da giocare.",
        href: "/lezioni",
      },
      {
        emoji: "🎬",
        title: "Mani guidate",
        desc: "Il Maestro gioca con te: a ogni presa ti spiega perché una carta è giusta o sbagliata.",
        href: "/gioca/mano-guidata",
      },
      {
        emoji: "🔁",
        title: "Ripasso intelligente",
        desc: "Le domande che sbagli (e gli errori che fai giocando!) tornano al momento giusto, con la ripetizione spaziata. Controlla qui ogni tanto: è il modo più rapido per migliorare.",
        href: "/ripasso",
      },
      {
        emoji: "📄",
        title: "Dispense e Glossario",
        desc: "Materiale da scaricare e tutti i termini del bridge spiegati in parole semplici.",
        href: "/glossario",
      },
    ],
  },
  {
    id: "gioca",
    emoji: "🎮",
    title: "Gioca",
    intro:
      "Tutti i modi per metterti alla prova: dalla mano quotidiana ai minigiochi che allenano una singola abilità.",
    features: [
      {
        emoji: "🎯",
        title: "Mano del Giorno",
        desc: "Ogni giorno una mano nuova, uguale per tutti. Alla fine scopri come sei andato rispetto al resto del campo.",
        href: "/gioca/mano-del-giorno",
      },
      {
        emoji: "♠️",
        title: "Smazzate",
        desc: "Le mani delle lezioni, da giocare quando vuoi. Hai un piano di gioco da scegliere prima della prima carta, aiuti progressivi (💡 tre livelli, dall'indizio alla carta consigliata), la possibilità di ritirare una carta in modalità pratica e di reclamare le prese quando la mano è fatta.",
        href: "/gioca/smazzata",
      },
      {
        emoji: "🧩",
        title: "Su cosa lavorare",
        desc: "A fine mano l'app riconosce gli errori tipici (un taglio mancato, una vincente scartata…) e li aggiunge al tuo ripasso, collegandoli alla lezione giusta.",
        href: "/ripasso",
      },
      {
        emoji: "⚡",
        title: "Minigiochi",
        desc: "Quiz Lampo, Conta Veloce, Impasse o Drop?, Trova l'Errore, Memory, Dichiara!, Pratica Licita e il nuovo Segnali in Difesa: 2 minuti per allenare un'abilità precisa.",
        href: "/gioca",
      },
      {
        emoji: "⚔️",
        title: "Sfide e classifiche",
        desc: "La Sfida Settimanale, le sfide con gli amici e la classifica generale: il bridge è più bello in compagnia.",
        href: "/classifica",
      },
    ],
  },
  {
    id: "scuola",
    emoji: "🏫",
    title: "Scuola e classi",
    intro:
      "BridgeLab funziona anche come classe virtuale, per chi segue un corso in un circolo o con un insegnante.",
    features: [
      {
        emoji: "🧑‍🎓",
        title: "Per gli allievi",
        desc: "Entri nella classe con il codice del tuo insegnante, giochi le mani assegnate come compito, chatti con i compagni e vedi la classifica di classe.",
        href: "/classi",
      },
      {
        emoji: "👨‍🏫",
        title: "Per gli istruttori",
        desc: "Il Portale Istruttori: crei classi, assegni compiti (anche importando le tue smazzate da file PBN), rivedi le mani giocate carta per carta e scopri gli errori ricorrenti di ogni allievo.",
        href: "/diventa-istruttore",
        cta: "Richiedi l'accesso",
      },
    ],
  },
  {
    id: "progressi",
    emoji: "📈",
    title: "Progressi e profilo",
    intro: "Tutto quello che fai lascia un segno: punti, serie, obiettivi e ricompense.",
    features: [
      {
        emoji: "⭐",
        title: "XP e livelli",
        desc: "Ogni quiz, mano o minigioco ti dà punti esperienza. Salendo di livello sblocchi nuove ricompense.",
        href: "/profilo",
      },
      {
        emoji: "🔥",
        title: "Streak",
        desc: "Gioca almeno una volta al giorno e la tua serie cresce. Nel negozio trovi i congela-streak per i giorni di pausa.",
        href: "/profilo",
      },
      {
        emoji: "🎯",
        title: "Obiettivi settimanali",
        desc: "Ogni settimana piccole missioni (quiz, mani, XP…) con bonus alla fine.",
        href: "/obiettivi",
      },
      {
        emoji: "🃏",
        title: "Collezione e negozio",
        desc: "Carte da collezionare giocando e un negozio dove spendere i punti guadagnati.",
        href: "/collezione",
      },
    ],
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Quanto costa BridgeLab?",
    a: "Niente: è gratuita, un progetto della Federazione Italiana Gioco Bridge per far conoscere il bridge.",
  },
  {
    q: "Non ho mai giocato a bridge. Da dove comincio?",
    a: "Da Prima Mano: giochi subito una mano vera, guidato passo passo. Poi MiniBridge e il Corso Fiori. L'app ti suggerisce sempre il prossimo passo nella sezione Impara.",
  },
  {
    q: "Cosa fa la lampadina 💡 durante una mano?",
    a: "Sono gli aiuti progressivi: il primo tocco dà un indizio generale, il secondo restringe la scelta, il terzo indica la carta consigliata. Usarli costa un po' di XP, ma è il modo migliore per imparare quando sei bloccato.",
  },
  {
    q: "Ho giocato una carta per sbaglio, posso ritirarla?",
    a: "Sì, in modalità pratica trovi il pulsante per annullare l'ultima giocata. Nelle sfide e nei compiti invece la carta giocata resta giocata — come al tavolo!",
  },
  {
    q: "Cosa significa “reclamare le prese”?",
    a: "Quando il finale è ovvio (hai solo carte vincenti) puoi dichiarare chiuse le prese rimanenti senza giocarle una a una, come si fa nel bridge vero.",
  },
  {
    q: "Come funziona il Ripasso?",
    a: "Raccoglie le domande dei quiz che hai sbagliato e gli errori che fai giocando le mani, e te li ripropone a distanza di tempo crescente (ripetizione spaziata): è scientificamente il modo più efficace per ricordare.",
  },
  {
    q: "Seguo un corso in un circolo: come uso l'app con la mia classe?",
    a: "Chiedi al tuo insegnante il codice della classe e inseriscilo nella sezione Scuola. Da lì trovi i compiti assegnati, la chat e la classifica di classe.",
  },
  {
    q: "Posso usare BridgeLab su telefono e tablet?",
    a: "Sì: funziona da browser su qualsiasi dispositivo, si può installare come app (PWA) ed è disponibile per iPhone e iPad sull'App Store. I tuoi progressi si sincronizzano con l'account.",
  },
];

export default function GuidaPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function rewatchTour() {
    try {
      localStorage.removeItem("bq_guide_v2_seen");
    } catch {}
    router.push("/");
  }

  return (
    <div className="px-4 pb-24 pt-6 sm:px-5">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <motion.div {...fadeUp} className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-primary">Guida</span>
        </motion.div>

        {/* Hero */}
        <motion.div {...fadeUp} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Come funziona BridgeLab
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            La mappa completa dell&apos;app: cosa c&apos;è, dove si trova e da dove
            conviene iniziare. Cinque minuti di lettura, poi al tavolo!
          </p>

          {/* Section chips + tour */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {s.emoji} {s.title}
              </a>
            ))}
            <a
              href="#faq"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ❓ Domande frequenti
            </a>
            <button
              onClick={rewatchTour}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-95"
            >
              ✨ Rivedi il tour di benvenuto
            </button>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, si) => (
            <motion.section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: si * 0.03 }}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">{section.emoji}</span>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {section.title}
                </h2>
              </div>
              <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{section.intro}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {section.features.map((f) => {
                  const inner = (
                    <div className="card-clean flex h-full flex-col rounded-2xl bg-white p-4 transition-all hover:translate-y-[-2px]">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-xl">{f.emoji}</span>
                        <h3 className="text-[15px] font-semibold text-gray-900">{f.title}</h3>
                      </div>
                      <p className="flex-1 text-[13px] leading-relaxed text-gray-500">{f.desc}</p>
                      {f.href && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                          {f.cta ?? "Provalo"} →
                        </span>
                      )}
                    </div>
                  );
                  return f.href ? (
                    <Link key={f.title} href={f.href} className="block" aria-label={f.title}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={f.title}>{inner}</div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

        {/* FAQ */}
        <motion.section
          id="faq"
          className="mt-12 scroll-mt-24"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl">❓</span>
            <h2 className="font-display text-2xl font-bold text-foreground">Domande frequenti</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Le risposte alle domande che riceviamo più spesso.
          </p>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border-b border-border last:border-0">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="text-sm font-semibold text-foreground">{item.q}</span>
                    <span
                      className={`shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Closing CTA */}
        <motion.div
          className="mt-10 rounded-2xl bg-gradient-to-br from-[#1B5E3B] to-[#2A7A4F] p-6 text-center text-white"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="font-display text-xl font-bold">Pronto a giocare?</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/80">
            Il modo migliore per imparare il bridge è giocarlo. Ti aspettiamo al tavolo.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/prima-mano"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1B5E3B] transition-transform active:scale-95"
            >
              🃏 Gioca la tua prima mano
            </Link>
            <Link
              href="/gioca"
              className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-bold text-white transition-transform active:scale-95"
            >
              🎮 Vai a Gioca
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
