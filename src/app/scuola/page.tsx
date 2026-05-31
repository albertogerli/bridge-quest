"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useSharedAuth } from "@/contexts/auth-provider";

interface HubCard {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  highlight?: boolean;
}

export default function ScuolaPage() {
  const { profile, loading } = useSharedAuth();
  const isInstructor = profile?.role === "instructor" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin";

  const cards: HubCard[] = [
    {
      href: "/classi",
      emoji: "🎒",
      title: "Le mie classi",
      desc: "I compiti assegnati dai tuoi istruttori e la chat di classe.",
    },
  ];

  if (isInstructor) {
    cards.push({
      href: "/istruttori",
      emoji: "👨‍🏫",
      title: "Portale Istruttori",
      desc: "Crea classi, assegna compiti e segui i progressi degli allievi.",
      highlight: true,
    });
  } else {
    cards.push({
      href: "/diventa-istruttore",
      emoji: "✋",
      title: "Diventa istruttore",
      desc: "Insegni bridge? Richiedi l'accesso al portale istruttori.",
    });
  }

  if (isAdmin) {
    cards.push({
      href: "/admin/classi",
      emoji: "🗂️",
      title: "Tutte le classi (admin)",
      desc: "Vedi tutte le classi create, con istruttore, allievi e compiti.",
    });
    cards.push({
      href: "/admin/istruttori",
      emoji: "📋",
      title: "Richieste istruttori",
      desc: "Approva o rifiuta le candidature a istruttore.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a44e]">Scuola di Bridge</p>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Scuola</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Classi virtuali, compiti e percorsi guidati dai maestri FIGB.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div key={c.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={c.href} className="block h-full">
                <div
                  className={`flex h-full items-center gap-3 rounded-2xl border p-4 transition-all hover:shadow-md ${
                    c.highlight
                      ? "border-transparent bg-gradient-to-r from-[#1B5E3B] to-[#2A7A4F] text-white"
                      : "border-border bg-card"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                      c.highlight ? "bg-white/20" : "bg-muted"
                    }`}
                  >
                    {c.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${c.highlight ? "text-white" : ""}`}>{c.title}</p>
                    <p className={`text-xs ${c.highlight ? "text-white/70" : "text-muted-foreground"}`}>{c.desc}</p>
                  </div>
                  <svg
                    className={`h-4 w-4 shrink-0 ${c.highlight ? "text-white/70" : "text-muted-foreground/50"}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  >
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
