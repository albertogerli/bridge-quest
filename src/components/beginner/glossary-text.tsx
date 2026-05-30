"use client";

import { useEffect, useRef, useState, Fragment, type ReactNode } from "react";

/**
 * Auto-wraps known bridge terms in a plain string with a beginner tooltip.
 *
 * Uses its OWN ultra-simple, jargon-free definitions (not the main glossary,
 * whose definitions reference other jargon and confuse absolute beginners).
 * Only the FIRST occurrence of each term per text block is wrapped.
 */

interface TermDef {
  emoji: string;
  label: string;
  def: string;
  forms: string[]; // surface forms / inflections
}

const TERMS: Record<string, TermDef> = {
  seme: {
    emoji: "♠️",
    label: "Seme",
    def: "Uno dei 4 gruppi di carte: picche ♠, cuori ♥, quadri ♦, fiori ♣. Ogni gruppo ha 13 carte, dall'Asso al 2.",
    forms: ["seme", "semi"],
  },
  presa: {
    emoji: "🃏",
    label: "Presa",
    def: "Un giro: ognuno dei 4 giocatori cala una carta. Chi cala la carta più forte porta via il giro e fa “una presa”.",
    forms: ["presa", "prese"],
  },
  atout: {
    emoji: "⚔️",
    label: "Atout (briscola)",
    def: "Il gruppo di carte “comandante” della mano: una sua carta batte qualsiasi carta degli altri tre gruppi, proprio come la briscola.",
    forms: ["atout"],
  },
  dichiarante: {
    emoji: "🧑‍✈️",
    label: "Dichiarante",
    def: "Il giocatore che guida la mano: gioca le proprie carte e anche quelle del compagno, che sono scoperte sul tavolo.",
    forms: ["dichiarante"],
  },
  morto: {
    emoji: "🤝",
    label: "Morto",
    def: "Il compagno del dichiarante: mette le sue carte scoperte sul tavolo e non gioca; a deciderle è il dichiarante.",
    forms: ["morto"],
  },
  contratto: {
    emoji: "🎯",
    label: "Contratto",
    def: "L'obiettivo della mano: quante prese la tua coppia promette di fare (e con quale gruppo come briscola).",
    forms: ["contratto", "contratti"],
  },
  taglio: {
    emoji: "✂️",
    label: "Taglio",
    def: "Quando non hai carte del gruppo richiesto, puoi calare una carta della briscola e portare via il giro: si dice “tagliare”.",
    forms: ["taglio", "tagliare", "tagli", "tagliato", "taglia", "tagliando"],
  },
  scarto: {
    emoji: "🗑️",
    label: "Scarto",
    def: "Quando non hai carte del gruppo richiesto e non vuoi (o non puoi) tagliare, butti via una carta che non ti serve.",
    forms: ["scarto", "scartare", "scarti", "scartato", "scarta", "scartando"],
  },
  attacco: {
    emoji: "👉",
    label: "Attacco",
    def: "La primissima carta giocata nella mano. La cala l'avversario seduto alla sinistra del dichiarante.",
    forms: ["attacco", "attacca", "attaccare", "attacchi"],
  },
  onori: {
    emoji: "👑",
    label: "Onori",
    def: "Le carte più forti di ogni gruppo: Asso, Re, Donna, Fante e 10.",
    forms: ["onori", "onore"],
  },
  incassare: {
    emoji: "💰",
    label: "Incassare",
    def: "Giocare le tue carte più forti per portare via subito i giri che sono già tuoi.",
    forms: ["incassa", "incassare", "incassi", "incassato"],
  },
  difensori: {
    emoji: "🛡️",
    label: "Difensori",
    def: "I due avversari del dichiarante: provano a impedirgli di fare le prese che ha promesso.",
    forms: ["difensori", "difensore"],
  },
  licita: {
    emoji: "🗣️",
    label: "Licita",
    def: "La fase iniziale in cui le coppie fanno “offerte” a turno per stabilire l'obiettivo (il contratto).",
    forms: ["licita"],
  },
  apertura: {
    emoji: "📢",
    label: "Apertura",
    def: "La prima offerta fatta nella licita.",
    forms: ["apertura"],
  },
};

const SURFACE_TO_KEY: Record<string, string> = {};
for (const [key, t] of Object.entries(TERMS)) {
  for (const f of t.forms) SURFACE_TO_KEY[f.toLowerCase()] = key;
}
const ALL_SURFACES = Object.keys(SURFACE_TO_KEY).sort((a, b) => b.length - a.length);
const TERM_RE = new RegExp(`\\b(${ALL_SURFACES.join("|")})\\b`, "gi");

function BeginnerTip({ def, children }: { def: TermDef; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    timer.current = setTimeout(() => setOpen(false), 6000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        className="cursor-help border-b border-dashed border-[#c8a44e]/50 font-semibold text-inherit"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
      >
        {children}
        <span className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#c8a44e]/20 text-[8px] font-bold text-[#8f6b16] align-text-top">
          ?
        </span>
      </span>
      {open && (
        <span className="absolute bottom-full left-1/2 z-[60] mb-2 -translate-x-1/2 whitespace-normal" role="tooltip">
          <span className="block w-64 rounded-2xl border border-[#c8a44e]/30 bg-[#fffdf5] px-4 py-3 text-left shadow-xl shadow-[#c8a44e]/10">
            <span className="mb-1.5 flex items-center gap-2">
              <span className="text-base">{def.emoji}</span>
              <span className="text-sm font-bold text-[#12305f]">{def.label}</span>
            </span>
            <span className="block text-xs leading-relaxed text-[#44536d]">{def.def}</span>
          </span>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#fffdf5]" />
        </span>
      )}
    </span>
  );
}

export function GlossaryText({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  const text = children;

  const out: ReactNode[] = [];
  const used = new Set<string>();
  let last = 0;
  let key = 0;
  TERM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TERM_RE.exec(text)) !== null) {
    const surface = m[0];
    const gkey = SURFACE_TO_KEY[surface.toLowerCase()];
    if (!gkey || used.has(gkey)) continue;
    used.add(gkey);
    if (m.index > last) out.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    out.push(
      <BeginnerTip key={key++} def={TERMS[gkey]}>
        {surface}
      </BeginnerTip>
    );
    last = m.index + surface.length;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}
