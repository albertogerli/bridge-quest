"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { AvvisoRichiesteAmicizia } from "@/components/avviso-richieste-amicizia";
import Link from "@/components/link";
import { useSmazzate } from "@/store/use-smazzate-store";
import { useProfile } from "@/hooks/use-profile";
import { getWeekNum } from "@/lib/tournament-stats";
import { CollegamentiSezione } from "@/components/collegamenti-sezione";
import { ManoDelGiornoTessera } from "@/components/home/mano-del-giorno-tessera";
import { BarChart3, BookOpen, Brain, Calculator, CheckCircle2, Flame, Gavel, GraduationCap, Handshake, Hash, Link2, Megaphone, MessageCircle, MessagesSquare, Radio, Search, Spade, Swords, Target, Trophy, Users, Zap } from "lucide-react";

/**
 * GIOCA, RIDISEGNATA IL 18/11/2026.
 *
 * Prima erano trenta voci in una colonna sola: tre bande blu a gradiente per le
 * sfide, poi una fila di righe larghe quanto lo schermo. Sul computer ogni riga
 * aveva il titolo a sinistra e la freccia a un metro di distanza, e niente
 * diceva da dove cominciare.
 *
 * Adesso: la Mano del giorno in grande, con le carte vere sul panno (il panno
 * solo dove ci sono carte), poi le voci in griglia, raggruppate per quello che
 * alleni — il gioco della carta, la licita, il gioco libero, gli amici. Tutte le
 * tessere sono uguali; il blu pieno resta al solo pulsante della Mano del giorno.
 */

interface Voce {
  href: string;
  titolo: string;
  descrizione: string;
  Icona: LucideIcon;
  nuovo?: boolean;
  /** Un'etichetta a destra (XP, «Fatta»...). */
  etichetta?: string;
  fatta?: boolean;
}

export default function GiocaPage() {
  const t = useT();
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

  const xp = profile.xpLabel;

  const sfide: Voce[] = [
    {
      href: "/gioca/sfida", Icona: dailyDone ? CheckCircle2 : Flame, titolo: t("Sfida del Giorno"),
      descrizione: dailyDone ? t("Sfida completata! Torna domani per una nuova mano.") : t("Una nuova mano ogni giorno."),
      etichetta: dailyDone ? t("Fatta") : `+40 ${xp}`, fatta: dailyDone,
    },
    {
      href: "/gioca/torneo", Icona: tournamentDone ? CheckCircle2 : Trophy, titolo: t("Torneo Settimanale"),
      descrizione: tournamentDone ? t("Torneo completato! Nuove mani la prossima settimana.") : t("5 mani, stessa sfida per tutti. Entra in classifica!"),
      etichetta: tournamentDone ? t("Fatta") : `+150 ${xp}`, fatta: tournamentDone,
    },
    { href: "/amici", Icona: Swords, titolo: t("Sfida IMP"), descrizione: t("Sfida un amico a 1, 4 o 8 mani con punteggio IMP") },
  ];

  const carta: Voce[] = [
    { href: "/gioca/quiz-prese", Icona: Calculator, titolo: t("Quante prese?"), descrizione: t("Vedi tutte le mani e conta le prese di Nord-Sud"), nuovo: true },
    { href: "/gioca/impasse", Icona: Target, titolo: t("Impasse o Drop?"), descrizione: t("Decidi in 5 secondi: impasse o caduta?") },
    { href: "/gioca/segnali", Icona: Radio, titolo: t("Segnali in Difesa"), descrizione: t("In difesa si parla con le carte: dai e leggi i segnali") },
    { href: "/gioca/trova-errore", Icona: Search, titolo: t("Trova l'Errore"), descrizione: t("Trova l'errore nella dichiarazione o giocata") },
    { href: "/gioca/conta-veloce", Icona: Hash, titolo: t("Conta Veloce"), descrizione: t("Conta i Punti Onore a tempo! Quanto sei veloce?") },
    { href: "/gioca/quiz-lampo", Icona: Zap, titolo: t("Quiz Lampo"), descrizione: t("Raffica di domande, 30 secondi! Combo multiplier") },
    { href: "/gioca/memory", Icona: Brain, titolo: t("Memory Bridge"), descrizione: t("Abbina carte e concetti. Allena la memoria!") },
  ];

  const licita: Voce[] = [
    { href: "/gioca/cosa-apri", Icona: Gavel, titolo: t("Cosa apri?"), descrizione: t("Mani sempre nuove: scegli l'apertura giusta"), nuovo: true },
    { href: "/gioca/quale-contratto", Icona: Target, titolo: t("Che contratto giocate?"), descrizione: t("Vedi le due mani: fin dove potete arrivare?"), nuovo: true },
    { href: "/gioca/licita", Icona: Gavel, titolo: t("Licita e vediamo"), descrizione: t("Vedi solo la tua mano: dichiara col compagno e prendi le stelle"), nuovo: true },
    { href: "/gioca/licita-amico", Icona: Users, titolo: t("Licita con un amico"), descrizione: t("Ognuno vede la sua mano e dichiara quando può"), nuovo: true },
    { href: "/gioca/torneo-licita", Icona: Trophy, titolo: t("Tornei di licita"), descrizione: t("8 mani al giorno, 24 a settimana: stesse smazzate per tutti"), nuovo: true },
    { href: "/gioca/dichiara", Icona: Megaphone, titolo: t("Dichiara!"), descrizione: t("Scegli l'apertura giusta per ogni mano") },
    { href: "/gioca/pratica-licita", Icona: MessageCircle, titolo: t("Pratica Licita"), descrizione: t("Esercitati nella dichiarazione: Texas, Stayman e altro") },
  ];

  const libero: Voce[] = [
    { href: `/gioca/smazzata?random=${randomIdx}`, Icona: Spade, titolo: t("Pratica Libera"), descrizione: t("Gioca una mano casuale dalle {n} disponibili", { n: allSmazzate.length }) },
    { href: "/gioca/smazzata", Icona: BookOpen, titolo: t("Tutte le Smazzate"), descrizione: t("Sfoglia e gioca le {n} mani per lezione", { n: allSmazzate.length }) },
    { href: "/gioca/analisi", Icona: BarChart3, titolo: t("Analisi AI"), descrizione: t("Rivedi le tue mani con commenti dell'AI carta per carta") },
    { href: "/glossario", Icona: BookOpen, titolo: t("Glossario"), descrizione: t("Impara tutti i termini del bridge") },
  ];

  const amici: Voce[] = [
    { href: "/gioca/sfida-coppie", Icona: Swords, titolo: t("Sfida 2 contro 2"), descrizione: t("Voi due contro un'altra coppia, sulle stesse smazzate"), nuovo: true },
    { href: "/gioca/sfida-amico", Icona: Swords, titolo: t("Sfida un Amico"), descrizione: t("Gioca la stessa mano e confronta i risultati") },
    { href: "/gioca/sfida-link", Icona: Link2, titolo: t("Sfida via Link"), descrizione: t("Condividi un link, giocate la stessa mano e confrontate!") },
  ];

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-balance lg:text-4xl">{t("Gioca")}</h1>
        <p className="mt-1 text-muted-foreground text-pretty">{t("Metti in pratica quello che hai imparato")}</p>
      </header>

      <AvvisoRichiesteAmicizia className="mb-6" />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ManoDelGiornoTessera pool={playableSmazzate} />
        <div className="grid content-start gap-4">
          {onboarded && (
            <Tessera voce={{ href: "/gioca/mano-guidata", Icona: Target, titolo: t("Mano Guidata"), descrizione: t("Pratica passo-passo con suggerimenti"), etichetta: `+35 ${xp}` }} />
          )}
          <Tessera voce={{ href: "/gioca/minibridge", Icona: GraduationCap, titolo: t("MiniBridge"), descrizione: t("Gioca senza licita: conta i punti e scegli il contratto"), etichetta: t("Beta") }} />
        </div>
      </div>

      <Gruppo titolo={t("Sfide")} voci={sfide} />
      <Gruppo titolo={t("Gioco della carta")} voci={carta} />
      <Gruppo titolo={t("Licita")} voci={licita} />
      <Gruppo titolo={t("Gioco libero")} voci={libero} />
      <Gruppo titolo={t("Con gli amici")} voci={amici} />

      {/* Qui e non in un cassetto: classifiche, amici e forum si cercano
          quando si sta giocando, non quando si stanno cercando le
          impostazioni. */}
      <div className="mt-10">
        <CollegamentiSezione
          titolo="Con gli altri"
          voci={[
            { href: "/classifica", icona: Trophy, etichetta: "Classifica", descrizione: "Come vai rispetto agli altri" },
            { href: "/amici", icona: Users, etichetta: "Amici", descrizione: "Sfida chi conosci" },
            { href: "/trova-compagno", icona: Handshake, etichetta: "Trova un compagno", descrizione: "Cerca qualcuno con cui giocare" },
            { href: "/forum", icona: MessagesSquare, etichetta: "Forum", descrizione: "Domande e discussioni" },
          ]}
        />
      </div>
    </div>
  );
}

/**
 * La Mano del giorno, con le carte di Sud sul panno. È la stessa mano che la
 * pagina della Mano del giorno sceglie (stessa funzione, stessa pool), così chi
 * tocca «Gioca la mano» ritrova le carte che ha appena visto.
 */
function Gruppo({ titolo, voci }: { titolo: string; voci: Voce[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-display text-lg font-bold">{titolo}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {voci.map((v) => <Tessera key={v.href} voce={v} />)}
      </div>
    </section>
  );
}

function Tessera({ voce }: { voce: Voce }) {
  const t = useT();
  const { Icona } = voce;
  return (
    <Link
      href={voce.href}
      className="group flex min-h-20 items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${voce.fatta ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : "bg-primary/10 text-primary"}`}
        aria-hidden="true"
      >
        <Icona className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-foreground">{voce.titolo}</span>
          {voce.nuovo && <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-bold text-foreground">{t("Nuovo")}</span>}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground text-pretty">{voce.descrizione}</span>
      </span>
      {voce.etichetta && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${voce.fatta ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
          {voce.etichetta}
        </span>
      )}
    </Link>
  );
}
