"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSmazzate } from "@/store/use-smazzate-store";
import { useProfile } from "@/hooks/use-profile";
import { getWeekNum } from "@/lib/tournament-stats";
import {
  Flame, CheckCircle2, Trophy, CalendarDays, Zap, Search,
  Target, Hash, Megaphone, MessageCircle, Brain, Swords,
  Spade, BookOpen, Link2, BarChart3, Radio, Calculator, Gavel, Users } from "lucide-react";

export default function GiocaPage() {
  const profile = useProfile();
  const [dailyDone, setDailyDone] = useState(false);
  const [tournamentDone, setTournamentDone] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [randomIdx, setRandomIdx] = useState(0);
  const { smazzate: allSmazzate, playable: playableSmazzate, isLoaded } = useSmazzate();

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setDailyDone(localStorage.getItem("bq_daily_completed") === today);
      // Pratica Libera: pesca da playable per evitare smazzate con HCP incoerenti.
      // Salviamo l'INDICE in playable, ma il routing usa allSmazzate: convertiamo.
      if (playableSmazzate.length > 0) {
        const picked = playableSmazzate[Math.floor(Math.random() * playableSmazzate.length)];
        const idxInAll = allSmazzate.findIndex((s) => s.id === picked.id);
        setRandomIdx(idxInAll >= 0 ? idxInAll : 0);
      }
      // Check tournament completion for current week (stesso calcolo della
      // pagina torneo: duplicarlo qui rischiava di far divergere le settimane)
      const weekNum = getWeekNum(Date.now());
      setTournamentDone(!!localStorage.getItem(`bq_tournament_week_${weekNum}`));
      setOnboarded(localStorage.getItem("bq_onboarded") === "1");
    } catch {}
  }, [isLoaded, allSmazzate, playableSmazzate]);

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-foreground font-display">Gioca</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Metti in pratica quello che hai imparato
          </p>
        </motion.div>

        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Inizia da qui</h2>

        {/* Mano Guidata card (after Prima Mano is done) */}
        {onboarded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-3"
          >
            <Link href="/gioca/mano-guidata" className="block" aria-label="Mano Guidata: pratica passo-passo">
              <div className="relative overflow-hidden rounded-2xl border border-figb/20 bg-figb/5 px-4 py-3.5 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-figb shadow-md">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Mano Guidata</p>
                    <p className="text-[12px] text-muted-foreground">Pratica passo-passo con suggerimenti</p>
                  </div>
                  <Badge className="bg-muted text-muted-foreground text-[12px] font-bold border-0">
                    +35 XP
                  </Badge>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* MiniBridge card (beginner method: from minibridge to bridge) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="mb-3"
        >
          <Link href="/gioca/minibridge" className="block" aria-label="MiniBridge: gioca senza licita, decidi col conteggio dei punti">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3.5 hover:shadow-md transition-all dark:border-emerald-900 dark:from-emerald-950/40 dark:to-green-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                  <span className="text-lg">🎓</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">MiniBridge</p>
                    <span className="rounded-full bg-[#c8a44e]/15 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-[#9a7b2e] dark:text-[#c8a44e]">Beta</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">Gioca senza licita: conta i punti e scegli il contratto</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sfide</h2>

        {/* Hero card: Sfida del Giorno */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/gioca/sfida" className="block" aria-label="Sfida del Giorno: una nuova mano ogni giorno">
            <div className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all hover:shadow-xl ${
              dailyDone
                ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-950/40 dark:to-green-950/30 border border-green-200 dark:border-emerald-900"
                : "hero-gradient"
            }`}>
              {!dailyDone && (
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              )}
              <div className="relative flex items-center gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                  dailyDone ? "bg-emerald/10" : "bg-white/15"
                }`}>
                  {dailyDone ? <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" /> : <Flame className="w-7 h-7 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-xl font-semibold ${dailyDone ? "text-emerald-dark dark:text-emerald-300" : "text-white"}`}>
                      Sfida del Giorno
                    </h2>
                    {!dailyDone && (
                      <Badge className="bg-amber/20 text-amber-light text-[12px] font-bold border-0">
                        +40 {profile.xpLabel}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${dailyDone ? "text-emerald-dark/60 dark:text-emerald-400/80" : "text-white/70"}`}>
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
                ? "bg-primary/5 border border-primary/15"
                : "bg-gradient-to-br from-figb to-figb-dark"
            }`}>
              {!tournamentDone && (
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              )}
              <div className="relative flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                  tournamentDone ? "bg-primary/10" : "bg-white/15"
                }`}>
                  {tournamentDone ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Trophy className="w-6 h-6 text-figb" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-lg font-semibold ${tournamentDone ? "text-primary" : "text-white"}`}>
                      Torneo Settimanale
                    </h2>
                    {!tournamentDone && (
                      <Badge className="bg-white/15 text-white/90 text-[12px] font-bold border-0">
                        +150 {profile.xpLabel}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${tournamentDone ? "text-primary/60" : "text-white/70"}`}>
                    {tournamentDone
                      ? "Torneo completato! Nuove mani la prossima settimana."
                      : "5 mani, stessa sfida per tutti. Entra in classifica!"}
                  </p>
                </div>
                <svg
                  className={`h-6 w-6 shrink-0 ${tournamentDone ? "text-primary/60" : "text-white/60"}`}
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
            <div className="relative overflow-hidden rounded-3xl p-5 cursor-pointer transition-all hover:shadow-xl bg-gradient-to-br from-figb-dark to-figb">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  <Swords className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-white">Sfida IMP</h2>
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

        {/* Mini-Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground font-display">Pratica</h2>
            <Badge className="bg-primary/10 text-primary text-[12px] font-bold border-0">
              allenati su una mossa
            </Badge>
          </div>
          <div className="space-y-2.5">
            {/* Mano del Giorno */}
            <Link href="/gioca/mano-del-giorno" className="block" aria-label="Mano del Giorno: una mano al giorno, uguale per tutti">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <CalendarDays className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Mano del Giorno</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Una mano al giorno, uguale per tutti. Classifica!</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Quiz Lampo */}
            <Link href="/gioca/quiz-lampo" className="block" aria-label="Quiz Lampo: raffica di domande, 30 secondi">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Zap className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Quiz Lampo</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Raffica di domande, 30 secondi! Combo multiplier</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Quante prese — mani generate, risposta dal double dummy */}
            <Link href="/gioca/quiz-prese" className="block" aria-label="Quante prese: conta le prese di Nord-Sud">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Calculator className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Quante prese?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Vedi tutte le mani e conta le prese di Nord-Sud</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5">
                    Nuovo
                  </span>
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Cosa apri — licita su mani generate, risposta dedotta dalla mano */}
            <Link href="/gioca/cosa-apri" className="block" aria-label="Cosa apri: scegli l'apertura giusta">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Gavel className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Cosa apri?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Mani sempre nuove: scegli l&apos;apertura giusta</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5">
                    Nuovo
                  </span>
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Che contratto giocate — valutazione della mano, metro = double dummy */}
            <Link href="/gioca/quale-contratto" className="block" aria-label="Che contratto giocate: scegli fin dove arrivare">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Target className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Che contratto giocate?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Vedi le due mani: fin dove potete arrivare?</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5">
                    Nuovo
                  </span>
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Licita e vediamo — dichiari vedendo solo la tua mano, voto sul par */}
            <Link href="/gioca/licita" className="block" aria-label="Licita e vediamo: dichiara e ricevi le stelle">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Gavel className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Licita e vediamo</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Vedi solo la tua mano: dichiara col compagno e prendi le stelle</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5">
                    Nuovo
                  </span>
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Licita con un amico — asincrona, avversari BEN */}
            <Link href="/gioca/licita-amico" className="block" aria-label="Licita con un amico">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Users className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Licita con un amico</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Ognuno vede la sua mano e dichiara quando può</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5">
                    Nuovo
                  </span>
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Trova l'Errore */}
            <Link href="/gioca/trova-errore" className="block" aria-label="Trova l'Errore: trova l'errore nella dichiarazione o giocata">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Search className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Trova l&apos;Errore</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Trova l&apos;errore nella dichiarazione o giocata</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Impasse o Drop */}
            <Link href="/gioca/impasse" className="block" aria-label="Impasse o Drop: decidi in 5 secondi">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Target className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Impasse o Drop?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Decidi in 5 secondi: impasse o caduta?</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Conta Veloce */}
            <Link href="/gioca/conta-veloce" className="block" aria-label="Conta Veloce: conta i punti onore a tempo">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Hash className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Conta Veloce</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Conta i Punti Onore a tempo! Quanto sei veloce?</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Segnali in Difesa */}
            <Link href="/gioca/segnali" className="block" aria-label="Segnali in Difesa: dai e leggi i segnali del compagno">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Radio className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Segnali in Difesa</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">In difesa si parla con le carte: dai e leggi i segnali</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Dichiara! */}
            <Link href="/gioca/dichiara" className="block" aria-label="Dichiara: scegli l'apertura giusta per ogni mano">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Megaphone className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Dichiara!</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Scegli l&apos;apertura giusta per ogni mano</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Pratica Licita */}
            <Link href="/gioca/pratica-licita" className="block" aria-label="Pratica Licita: esercitati nella dichiarazione">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <MessageCircle className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Pratica Licita</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Esercitati nella dichiarazione: Texas, Stayman e altro</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Memory Bridge */}
            <Link href="/gioca/memory" className="block" aria-label="Memory Bridge: abbina carte e concetti">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Brain className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Memory Bridge</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Abbina carte e concetti. Allena la memoria!</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

            {/* Sfida un Amico */}
            <Link href="/gioca/sfida-amico" className="block" aria-label="Sfida un Amico: gioca la stessa mano e confronta i risultati">
              <div className="card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-figb/10 text-figb">
                  <Swords className="w-6 h-6 text-figb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[15px]">Sfida un Amico</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Gioca la stessa mano e confronta i risultati</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,6 15,12 9,18"/></svg>
                </div>
              </div>
            </Link>

          </div>
        </motion.div>

        <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">Gioco libero</h2>

        {/* Two-column cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* Pratica Libera */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Link href={`/gioca/smazzata?random=${randomIdx}`} className="block" aria-label="Pratica Libera: gioca una mano casuale">
              <div className="card-clean card-interactive rounded-2xl bg-card p-5 cursor-pointer h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-figb/10 mb-3">
                  <Spade className="w-6 h-6 text-figb" />
                </div>
                <h3 className="font-semibold text-foreground text-[15px]">
                  Pratica Libera
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  Gioca una mano casuale dalle {allSmazzate.length} disponibili
                </p>
                <div className="mt-3 flex items-center gap-1.5">
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
              <div className="card-clean card-interactive rounded-2xl bg-card p-5 cursor-pointer h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 mb-3">
                  <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground text-[15px]">
                  Tutte le Smazzate
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  Sfoglia e gioca le {allSmazzate.length} mani per lezione
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 rounded-full px-2 py-0.5">
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
              <div className="card-clean card-interactive rounded-2xl bg-card p-5 cursor-pointer h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-figb/10 mb-3">
                  <Link2 className="w-6 h-6 text-figb" />
                </div>
                <h3 className="font-semibold text-foreground text-[15px]">
                  Sfida via Link
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  Condividi un link, giocate la stessa mano e confrontate!
                </p>
                <div className="mt-3 flex items-center gap-1.5">
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
              <div className="card-clean card-interactive rounded-2xl bg-card p-5 cursor-pointer h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 mb-3">
                  <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-foreground text-[15px]">
                  Analisi AI
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  Rivedi le tue mani con commenti dell&apos;AI carta per carta
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 rounded-full px-2 py-0.5">
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
              <div className="card-clean card-interactive rounded-2xl bg-card p-5 cursor-pointer h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-figb/10 mb-3">
                  <span className="text-xl">📖</span>
                </div>
                <h3 className="font-semibold text-foreground text-[15px]">
                  Glossario
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  Impara tutti i termini del bridge
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    A-Z
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Maestro Fiori tip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-4 mb-6"
        >
          <div className="card-clean rounded-2xl bg-card p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-figb text-white font-bold text-sm shadow-md shadow-figb/20">
                M
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="font-bold text-sm text-foreground">Maestro Fiori</p>
                  <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[12px] font-bold border-0">
                    Consiglio
                  </Badge>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
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
