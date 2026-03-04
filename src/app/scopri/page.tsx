"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Globe, ExternalLink, BookOpen, Trophy, Users, Brain,
  Landmark, Heart, Lightbulb, ArrowLeft, Award
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function ScopriPage() {
  return (
    <div className="pt-6 px-4 sm:px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Breadcrumb */}
        <motion.div {...fadeUp} className="mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link href="/" className="hover:text-[#003DA5] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#003DA5] font-semibold">Scopri il Bridge</span>
          </div>
        </motion.div>

        {/* ===== HEADER ===== */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003DA5] to-[#0066FF] shadow-lg shadow-[#003DA5]/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Scopri il Bridge
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Storia, curiosita e link utili
              </p>
            </div>
          </div>
        </motion.div>

        {/* ===== LA FIGB ===== */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6"
        >
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm overflow-hidden">
            {/* FIGB Header */}
            <div className="bg-gradient-to-r from-[#003DA5] to-[#0052CC] px-5 py-4">
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5 text-white/80" />
                <h2 className="text-lg font-bold text-white">La FIGB</h2>
              </div>
            </div>

            <div className="p-5">
              {/* Logos */}
              <div className="flex items-center justify-center gap-6 mb-5">
                <img
                  src="/icons/logo-figb.png"
                  alt="FIGB - Federazione Italiana Gioco Bridge"
                  className="h-16 w-auto"
                />
                <img
                  src="/icons/logo-coni.png"
                  alt="CONI - Comitato Olimpico Nazionale Italiano"
                  className="h-12 w-auto"
                />
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                La <strong>Federazione Italiana Gioco Bridge</strong> (FIGB) e l&apos;organismo
                ufficiale che governa il bridge sportivo in Italia. Fondata nel <strong>1936</strong>,
                e membro del <strong>CONI</strong> (Comitato Olimpico Nazionale Italiano) e conta
                circa <strong>35.000 tesserati</strong> e oltre <strong>300 circoli</strong> su tutto
                il territorio nazionale.
              </p>

              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
                La FIGB organizza campionati a livello regionale, nazionale e internazionale,
                promuove l&apos;insegnamento del bridge nelle scuole e nei circoli, e rappresenta
                l&apos;Italia nelle competizioni europee e mondiali.
              </p>

              {/* Links */}
              <div className="space-y-2">
                <a
                  href="https://www.federbridge.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#003DA5]/5 border border-[#003DA5]/15 hover:bg-[#003DA5]/10 transition-colors group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#003DA5]/10">
                    <Globe className="w-4 h-4 text-[#003DA5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">federbridge.it</p>
                    <p className="text-xs text-gray-500">Sito ufficiale della Federazione</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#003DA5]/50 group-hover:text-[#003DA5] transition-colors shrink-0" />
                </a>

                <a
                  href="https://www.bridgeditalia.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#003DA5]/5 border border-[#003DA5]/15 hover:bg-[#003DA5]/10 transition-colors group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#003DA5]/10">
                    <BookOpen className="w-4 h-4 text-[#003DA5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">bridgeditalia.it</p>
                    <p className="text-xs text-gray-500">Bridge d&apos;Italia Magazine - Notizie e approfondimenti</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#003DA5]/50 group-hover:text-[#003DA5] transition-colors shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ===== STORIA DEL BRIDGE ===== */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm overflow-hidden">
            {/* History Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-white/80" />
                <h2 className="text-lg font-bold text-white">Storia del Bridge</h2>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-5">
                {/* Timeline items */}
                <TimelineItem
                  year="XVII sec."
                  title="Le origini: il Whist"
                  description="Il bridge affonda le sue radici nel Whist, un gioco di carte nato in Inghilterra nel XVII secolo. Dall'evoluzione del Whist nacquero varianti sempre piu sofisticate."
                  color="bg-gray-500"
                />

                <TimelineItem
                  year="1925"
                  title="Nasce il Contract Bridge"
                  description="Harold Stirling Vanderbilt, miliardario americano e appassionato giocatore di carte, inventa il Contract Bridge durante una crociera nel Canale di Panama. Le regole che codifica diventeranno lo standard mondiale."
                  color="bg-blue-500"
                />

                <TimelineItem
                  year="1935"
                  title="Primo Campionato del Mondo"
                  description="Si disputa il primo Campionato del Mondo di bridge, sancendo la nascita del bridge come disciplina sportiva a livello internazionale."
                  color="bg-emerald-500"
                />

                <TimelineItem
                  year="1957-1975"
                  title="L'era della Squadra Azzurra"
                  description="L'Italia domina il bridge mondiale con la leggendaria Squadra Azzurra (Blue Team), vincendo 16 titoli mondiali in meno di vent'anni - un record senza precedenti nella storia dello sport della mente."
                  color="bg-[#003DA5]"
                  highlight
                />
              </div>

              {/* Blue Team Champions */}
              <div className="mt-6 p-4 rounded-xl bg-[#003DA5]/5 border border-[#003DA5]/15">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    I campioni della Squadra Azzurra
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ChampionCard
                    name="Giorgio Belladonna"
                    detail="16 titoli mondiali (record assoluto)"
                    icon={<Award className="w-4 h-4 text-amber-500" />}
                  />
                  <ChampionCard
                    name="Benito Garozzo"
                    detail="13 titoli mondiali"
                    icon={<Trophy className="w-4 h-4 text-amber-500" />}
                  />
                  <ChampionCard
                    name="Pietro Forquet"
                    detail="13 titoli mondiali"
                    icon={<Trophy className="w-4 h-4 text-amber-500" />}
                  />
                  <ChampionCard
                    name="Walter Avarelli"
                    detail="11 titoli mondiali"
                    icon={<Trophy className="w-4 h-4 text-amber-500" />}
                  />
                </div>
              </div>

              {/* IOC Recognition */}
              <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Brain className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Il bridge e riconosciuto come <strong>&quot;sport della mente&quot;</strong> dal
                  Comitato Olimpico Internazionale (CIO) dal 1999.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ===== LO SAPEVI? ===== */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Lo sapevi?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FunFactCard
              icon={<Globe className="w-5 h-5 text-blue-500" />}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              title="100+ paesi"
              description="Il bridge e giocato in oltre 100 paesi in tutti i continenti, con milioni di appassionati."
            />
            <FunFactCard
              icon={<Users className="w-5 h-5 text-emerald-500" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              title="Giocatori illustri"
              description="Bill Gates e Warren Buffett sono appassionati giocatori di bridge e spesso giocano insieme."
            />
            <FunFactCard
              icon={<Heart className="w-5 h-5 text-rose-500" />}
              iconBg="bg-rose-100 dark:bg-rose-900/30"
              title="635 miliardi di combinazioni"
              description="Esistono 635.013.559.600 diverse distribuzioni possibili delle carte a bridge."
            />
            <FunFactCard
              icon={<Brain className="w-5 h-5 text-purple-500" />}
              iconBg="bg-purple-100 dark:bg-purple-900/30"
              title="Benefici cognitivi"
              description="Studi scientifici hanno dimostrato che giocare a bridge aiuta a prevenire il declino cognitivo."
            />
          </div>
        </motion.section>

        {/* ===== LINK UTILI ===== */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-6"
        >
          <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-4">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-white/80" />
                <h2 className="text-lg font-bold text-white">Link utili</h2>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {/* Federazione Italiana */}
              <ExternalLinkCard
                href="https://www.federbridge.it"
                title="Federazione Italiana Gioco Bridge"
                subtitle="Sito ufficiale FIGB"
                icon={<Landmark className="w-4 h-4 text-[#003DA5]" />}
              />

              {/* Bridge d'Italia */}
              <ExternalLinkCard
                href="https://www.bridgeditalia.it"
                title="Bridge d'Italia Magazine"
                subtitle="Notizie, tornei e approfondimenti"
                icon={<BookOpen className="w-4 h-4 text-[#003DA5]" />}
              />

              {/* World Bridge Federation */}
              <ExternalLinkCard
                href="https://www.worldbridge.org"
                title="World Bridge Federation"
                subtitle="Federazione mondiale di bridge"
                icon={<Globe className="w-4 h-4 text-[#003DA5]" />}
              />

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

              {/* Social */}
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Social
              </p>

              <ExternalLinkCard
                href="https://www.facebook.com/federbridge"
                title="Facebook"
                subtitle="FIGB - Pagina ufficiale"
                icon={
                  <svg className="w-4 h-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                }
              />

              <ExternalLinkCard
                href="https://www.instagram.com/figbridge"
                title="Instagram"
                subtitle="@figbridge"
                icon={
                  <svg className="w-4 h-4 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                }
              />
            </div>
          </div>
        </motion.section>

        {/* ===== BACK LINK ===== */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#003DA5] hover:text-[#002E7A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function TimelineItem({
  year,
  title,
  description,
  color,
  highlight,
}: {
  year: string;
  title: string;
  description: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${color} shrink-0 mt-1.5`} />
        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className={`pb-4 ${highlight ? "bg-[#003DA5]/5 -mx-2 px-3 py-3 rounded-xl border border-[#003DA5]/15" : ""}`}>
        <span className={`text-xs font-bold ${highlight ? "text-[#003DA5]" : "text-gray-400"}`}>
          {year}
        </span>
        <h3 className={`text-sm font-bold mt-0.5 ${highlight ? "text-[#003DA5]" : "text-gray-900 dark:text-gray-100"}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function ChampionCard({
  name,
  detail,
  icon,
}: {
  name: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#141821] rounded-xl p-3 border border-[#e5e0d5] dark:border-[#2a3040]">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{name}</p>
      </div>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{detail}</p>
    </div>
  );
}

function FunFactCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#e5e0d5] dark:border-[#2a3040] shadow-sm p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} mb-3`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function ExternalLinkCard({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#003DA5] transition-colors shrink-0" />
    </a>
  );
}
