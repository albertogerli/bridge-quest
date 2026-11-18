"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { useCatalog } from "@/store/use-catalog-store";
import { useAchievementChecker, AchievementPopup } from "@/components/achievement-popup";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications, updateLastActivity } from "@/hooks/use-notifications";
import { useSharedAuth } from "@/contexts/auth-provider";
import { MarketingConsentBanner } from "@/components/marketing-consent-banner";
import { NotificationsNudge } from "@/components/notifications-nudge";
import { useBeginnerStatus } from "@/hooks/use-beginner-status";
import { LostCard } from "@/components/beginner/lost-card";
import { IlTuoLivello, RiprendiLezione, Saluto } from "@/components/home/hero-section";
import { RigaLink } from "@/components/home/riga-link";
import { ManoDelGiornoTessera } from "@/components/home/mano-del-giorno-tessera";
import { Button } from "@/components/ui/button";
import { usePlayableSmazzate } from "@/store/use-smazzate-store";
import { LicitaSection } from "@/components/home/licita-section";
import { HomeFooter } from "@/components/home/home-footer";
import { ReferralHandler } from "@/components/home/referral-handler";
import { HomeAllievo } from "@/components/home/home-allievo";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { corsiAttivi } from "@/lib/percorso-allievo";
import { TreasureChests } from "@/components/home/treasure-chests";
import { CollectionTeaser } from "@/components/home/collection-teaser";
import { LandingPage } from "@/components/home/landing-page";
import {
  HomeInsegnante,
  preferisceLaBacheca,
  ricordaPreferenzaBacheca,
} from "@/components/home/home-insegnante";
import { GuestLoginReminder } from "@/components/home/banners/guest-login-reminder";
import { PrimaManoBanner } from "@/components/home/banners/prima-mano-banner";
import { SuggestedNextStep } from "@/components/home/banners/suggested-next-step";
import { FindAsdBanner } from "@/components/home/banners/find-asd-banner";
import { useLocalStats } from "@/hooks/use-local-stats";
import { useGameStore, useHasHydrated } from "@/store/use-game-store";
import { GraduationCap, Hourglass, MapPin, Ticket, Zap } from "lucide-react";
import { reportError, segnalaSalvoRete } from "@/lib/report-error";
import {
  CHIAVE_VUOLE_INSEGNARE,
  getMyInstructorRequest,
  mieRichiesteInAttesa,
  type InstructorRequestStatus,
  type RichiestaInAttesa,
} from "@/lib/instructors";
import { InstructorCard } from "@/components/home/instructor-card";
import { useT } from "@/contexts/traduzioni-provider";
import { AvvisoRichiesteAmicizia } from "@/components/avviso-richieste-amicizia";
import { richiestaDaMostrare } from "@/lib/richiesta-home";

// Percorso "Prima Mano": ~16 kB gz di step interattivi che sostituiscono l'intera
// home solo per chi non è ancora onboardato. Fuori dal first load di tutti gli altri.
const PrimaManoOnboarding = dynamic(
  () => import("@/components/prima-mano-onboarding").then((m) => m.PrimaManoOnboarding),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    ),
  },
);
// Modale di riepilogo settimanale: si apre al massimo una volta a settimana.
const WeeklyRecapModal = dynamic(
  () => import("@/components/home/weekly-recap-modal").then((m) => m.WeeklyRecapModal),
  { ssr: false },
);

export function HomeClient({ serverAuthed }: { serverAuthed: boolean }) {
  const t = useT();
  const manoPool = usePlayableSmazzate();
  const { user, profile: authProfile, loading: authLoading, profiloLetto } = useSharedAuth();
  // Solo per chi ha fatto l'accesso: vedi `useEnrolledClasses`.
  const { classes: classiIscritte, isLoaded: classiCaricate, error: erroreClassi } = useEnrolledClasses(!!user);
  /**
   * Le richieste di iscrizione ancora in attesa. Chi ha appena messo il codice
   * del suo insegnante ed è in attesa non ha classi attive: senza questo
   * finiva nell'avvio guidato «Il tuo primo torneo» e nella home generale,
   * cioè in un percorso che il suo insegnante non ha scelto (feedback
   * Trevissoi del 12/10/2026, punto 3.6).
   */
  const [richiesteInAttesa, setRichiesteInAttesa] = useState<RichiestaInAttesa[] | null>(null);
  useEffect(() => {
    if (!user) return;
    let vivo = true;
    mieRichiesteInAttesa()
      .then((r) => { if (vivo) setRichiesteInAttesa(r); })
      .catch((err) => {
        segnalaSalvoRete("home:richieste-in-attesa", err);
        if (vivo) setRichiesteInAttesa([]);
      });
    return () => { vivo = false; };
  }, [user]);
  /**
   * La richiesta per il Portale Insegnanti, se c'è: `undefined` finché non è
   * arrivata. Chi ha chiesto di insegnare non è ancora insegnante — il ruolo
   * arriva con l'approvazione — e senza questo finiva nell'avvio guidato per
   * chi impara (Trevissoi, 14/10/2026).
   */
  const [statoRichiestaInsegnante, setStatoRichiestaInsegnante] =
    useState<InstructorRequestStatus | null | undefined>(undefined);
  useEffect(() => {
    if (!user) return;
    let vivo = true;
    getMyInstructorRequest()
      .then((r) => { if (vivo) setStatoRichiestaInsegnante(r?.status ?? null); })
      .catch((err) => {
        segnalaSalvoRete("home:richiesta-insegnante", err);
        if (vivo) setStatoRichiestaInsegnante(null);
      });
    return () => { vivo = false; };
  }, [user]);
  const [vuoleInsegnare, setVuoleInsegnare] = useState(false);
  const { courses, isLoaded: catalogLoaded } = useCatalog();
  const stats = useLocalStats();
  const profile = useProfile();
  useSpacedReview();
  const { checkReminders } = useNotifications();
  const { isGuidedMode, isStuck, isOnboarded } = useBeginnerStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notOnboarded, setNotOnboarded] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  // Resta montato dopo la prima apertura: l'animazione di uscita di
  // AnimatePresence continua a funzionare e il chunk parte solo se serve.
  const [weeklyRecapArmed, setWeeklyRecapArmed] = useState(false);
  const [weeklyData, setWeeklyData] = useState({ xpEarned: 0, modulesCompleted: 0, handsPlayed: 0, streakDays: 0 });
  const handsPlayed = useGameStore((s) => s.handsPlayed);
  const [isGuest, setIsGuest] = useState(false);

  // UNA richiesta alla volta. La priorità sta in `richiesta-home.ts`.
  const richiesta = richiestaDaMostrare({
    nonAvviato: notOnboarded && !showOnboarding,
    ospiteDaSalvare:
      !user && isGuest && stats.xp === 0 && Object.keys(stats.completedModules).length === 0,
    senzaCircolo: !authProfile?.asd_code,
    autenticato: !!user,
  });
  const [referralToast, setReferralToast] = useState(false);
  /**
   * Chi insegna ha chiesto di vedere la bacheca dell'allievo.
   *
   * Sta in `localStorage` e si legge dopo il mount come gli altri: durante il
   * primo render vale `false`, quindi l'insegnante vede per un istante la
   * propria home anche se aveva scelto la bacheca. È il compromesso già in
   * uso nel resto del file per non avere disallineamenti fra server e client.
   */
  const [vuoleLaBacheca, setVuoleLaBacheca] = useState(false);
  const hydrated = useHasHydrated();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setIsGuest(localStorage.getItem("bq_guest") === "1");
      setVuoleLaBacheca(preferisceLaBacheca());
      setVuoleInsegnare(localStorage.getItem(CHIAVE_VUOLE_INSEGNARE) === "1");
      if (!localStorage.getItem("bq_onboarded")) {
        setShowOnboarding(true);
        setNotOnboarded(true);
      }
    } catch {}
  }, []);

  // Weekly recap — depends on hydrated store values, not stale localStorage.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const today = new Date();
      if (today.getDay() > 1) return; // Sunday or Monday only

      const weekKey = `bq_recap_${today.getFullYear()}-W${Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 604800000)}`;
      const snapshot = (): { xp: number; modules: number; hands: number } => {
        const { xp, completedModules, handsPlayed } = useGameStore.getState();
        return { xp, modules: Object.keys(completedModules).length, hands: handsPlayed };
      };

      if (!localStorage.getItem(weekKey) && localStorage.getItem("bq_onboarded")) {
        const lastSnapshot = JSON.parse(localStorage.getItem("bq_weekly_snapshot") || "{}");
        const current = snapshot();
        const currentStreak = useGameStore.getState().streak;
        if (lastSnapshot.xp !== undefined) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- confronto col precedente snapshot settimanale (localStorage), calcolabile solo sul client dopo il mount
          setWeeklyData({
            xpEarned: current.xp - (lastSnapshot.xp || 0),
            modulesCompleted: current.modules - (lastSnapshot.modules || 0),
            handsPlayed: current.hands - (lastSnapshot.hands || 0),
            streakDays: currentStreak,
          });
          if (current.xp > (lastSnapshot.xp || 0)) {
            setWeeklyRecapArmed(true);
            setShowWeeklyRecap(true);
          }
        }
        localStorage.setItem(weekKey, "1");
        localStorage.setItem("bq_weekly_snapshot", JSON.stringify(current));
      }
      if (!localStorage.getItem("bq_weekly_snapshot")) {
        localStorage.setItem("bq_weekly_snapshot", JSON.stringify(snapshot()));
      }
    } catch (e) {
      // Non è un puro accesso localStorage: c'è parsing + calcolo del recap.
      reportError("home:weekly-recap", e);
    }
  }, [hydrated]);

  // I promemoria si controllano all'apertura. Non se ne programmano più per
  // il futuro: quel setTimeout era da venti ore e non poteva scattare — vedi
  // la nota in use-notifications.ts.
  useEffect(() => {
    checkReminders();
    updateLastActivity();
  }, [checkReminders]);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem("bq_onboarded", "1");
    } catch {}
    setShowOnboarding(false);
  };

  const handleReferralBonus = useCallback(() => {
    setReferralToast(true);
    setTimeout(() => setReferralToast(false), 4000);
  }, []);

  // World summaries derived from the live catalog (Phase 3.3).
  // Memoised so the achievement checker doesn't re-trigger on unrelated state changes.
  const allWorldsData = useMemo(
    () => courses.flatMap((c) => c.worlds),
    [courses],
  );

  const worldsCompleted = useMemo(() => {
    let count = 0;
    for (const w of allWorldsData) {
      const totalModules = w.lessons.reduce(
        (sum, l) => sum + l.modules.length,
        0,
      );
      if (totalModules === 0) continue;
      let completedInWorld = 0;
      for (const lesson of w.lessons) {
        for (const mod of lesson.modules) {
          if (stats.completedModules[`${lesson.id}-${mod.id}`]) completedInWorld++;
        }
      }
      if (completedInWorld === totalModules) count++;
    }
    return count;
  }, [allWorldsData, stats.completedModules]);

  const totalModulesCompleted = Object.keys(stats.completedModules).length;

  // Achievement checker
  const { newBadge, dismiss } = useAchievementChecker({
    xp: stats.xp,
    streak: stats.streak,
    modulesCompleted: totalModulesCompleted,
    handsPlayed,
    worldsCompleted,
  });

  // Find next incomplete module for "Riprendi" CTA (search all courses)
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- il compiler non garantisce l'immutabilità delle dipendenze (dati del catalogo/derivati): salta solo l'ottimizzazione, la memo manuale resta corretta
  const nextModule = useMemo(() => {
    for (const course of courses) {
      for (const w of course.worlds) {
        for (const lesson of w.lessons) {
          for (const mod of lesson.modules) {
            if (!stats.completedModules[`${lesson.id}-${mod.id}`]) {
              return {
                lessonId: lesson.id,
                moduleId: mod.id,
                moduleTitle: mod.title,
                lessonTitle: lesson.title,
                lessonIcon: lesson.icon,
              };
            }
          }
        }
      }
    }
    return null;
  }, [courses, stats.completedModules]);

  const hasStarted = totalModulesCompleted > 0;

  // Effective login state: fall back to the server's decision until client auth
  // resolves. This lets the server render the landing directly (no client-side
  // auth spinner) so the landing HTML is in the initial payload → fast LCP + SEO.
  const isLoggedIn = authLoading ? serverAuthed : !!user;

  // Show landing page for non-authenticated visitors (not guest, not logged in)
  if (!isLoggedIn && !isGuest) {
    return <LandingPage onContinueAsGuest={() => {
      try { localStorage.setItem("bq_guest", "1"); } catch {}
      setIsGuest(true);
    }} />;
  }

  /*
   * IL RUOLO PRIMA DELLA HOME. Senza profilo non si sa se è un insegnante, e
   * mostrare intanto la home generale vuol dire che l'insegnante appena
   * entrato vede la bacheca dell'allievo — ed è quello che ha visto Trevissoi
   * al primo accesso (feedback 5). L'attesa finisce sempre: `profiloLetto`
   * diventa vero anche se la lettura fallisce, e allora si va avanti con
   * quello che si sa.
   */
  if (user && !authProfile && !profiloLetto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label={t("Caricamento in corso")}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">{t("Caricamento...")}</span>
      </div>
    );
  }

  /**
   * L'AVVIO GUIDATO È PER CHI IMPARA. «Il tuo primo torneo — tra 5 minuti
   * giocherai la tua prima mano» accoglieva anche l'insegnante appena
   * abilitato, prima della sua home con le classi (visto nel controllo del
   * 28/09/2026). Il ruolo qui è già noto: il blocco qui sopra aspetta il
   * profilo (che si considera letto anche quando la lettura fallisce).
   */
  const insegnaGia = authProfile?.role === "instructor" || authProfile?.role === "admin";
  /**
   * NEMMENO PER CHI ARRIVA DA UNA CLASSE. Chi è iscritto a un corso, o ha
   * appena chiesto di entrarci con il codice, segue il percorso del suo
   * insegnante: l'avvio guidato generico lo porterebbe altrove. Finché classi
   * e richieste non sono arrivate non si mostra niente di generico — un
   * istante — invece di mostrare l'avvio e poi toglierlo.
   */
  let codiceInSospeso = false;
  try { codiceInSospeso = !!localStorage.getItem("bq_codice_classe"); } catch {}
  const arrivaDaUnaClasse =
    codiceInSospeso || classiIscritte.length > 0 || (richiesteInAttesa?.length ?? 0) > 0;
  const classiNote = !user || ((classiCaricate || erroreClassi !== null) && richiesteInAttesa !== null && statoRichiestaInsegnante !== undefined);
  // Né per chi ha chiesto di insegnare: va alla sua richiesta, non a «tra 5 minuti giocherai».
  const vaVersoIlPortale = vuoleInsegnare || statoRichiestaInsegnante === "pending";
  if (showOnboarding && !insegnaGia && classiNote && !arrivaDaUnaClasse && !vaVersoIlPortale) {
    return <PrimaManoOnboarding onDismiss={handleOnboardingComplete} conAccount={!!user} />;
  }

  /**
   * IL BIVIO PER RUOLO, che prima non esisteva.
   *
   * `profiles.role` c'è da sempre e nessuno lo guardava per decidere cosa
   * mostrare: chi insegna atterrava sulla bacheca dell'allievo e il portale
   * delle classi era da cercare nel menù.
   *
   * Il ramo sta QUI e non prima: la pagina di ingresso e l'avvio guidato
   * valgono per tutti, ruolo compreso — un insegnante alla prima apertura è
   * comunque uno che deve capire dov'è.
   *
   * Non c'è un ramo per l'amministratore: chi amministra è quasi sempre anche
   * insegnante, `/admin` ha già la sua sezione nel menù, e una terza home
   * sarebbe una pagina in più da tenere allineata per due persone.
   */
  const insegna = authProfile?.role === "instructor" || authProfile?.role === "admin";
  const corsiIscritti = corsiAttivi(classiIscritte);


  /*
   * IL SECONDO RAMO: chi segue un corso.
   *
   * Sta DOPO quello dell'insegnante perché molti insegnanti sono anche iscritti
   * a un corso di aggiornamento, e in quel caso deve vincere il loro lavoro.
   *
   * Come per l'insegnante, non toglie niente: `onVaiAllaBacheca` porta al
   * portale di sempre e la scelta viene ricordata. È il vincolo che ci siamo
   * dati — chi è già dentro una classe non perde accesso a cose che vedeva —
   * e vale anche per le diciotto classi che esistevano prima di questa home.
   */
  const segueUnCorso = !insegna && corsiIscritti.length > 0;
  if (segueUnCorso && !vuoleLaBacheca) {
    return (
      <>
        <AvvisoRichiesteAmicizia className="mx-4 mt-4 sm:mx-auto sm:max-w-6xl" />
        <HomeAllievo
          nome={authProfile?.display_name ?? null}
          onVaiAllaBacheca={() => {
            ricordaPreferenzaBacheca(true);
            setVuoleLaBacheca(true);
          }}
        />
      </>
    );
  }

  if (insegna && !vuoleLaBacheca) {
    return (
      <>
      <AvvisoRichiesteAmicizia className="mx-4 mt-4 sm:mx-auto sm:max-w-6xl" />
      <HomeInsegnante
        nome={authProfile?.display_name ?? null}
        onVaiAllaBacheca={() => {
          ricordaPreferenzaBacheca(true);
          setVuoleLaBacheca(true);
        }}
      />
      </>
    );
  }

  // Dashboard needs the lesson catalog. Show spinner until the first
  // successful Supabase fetch lands — non-authenticated visitors already
  // returned above with the landing page, so we never spin for them.
  if (!catalogLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label={t("Caricamento in corso")}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">{t("Caricamento...")}</span>
      </div>
    );
  }

  const avvisi = (
    <>
      <AvvisoRichiesteAmicizia />
      {/*
        In attesa dell'insegnante: la prima cosa da sapere, prima di tutto il
        resto della bacheca. Porta alla classe, dove si vede lo stato.
      */}
      {!insegna && classiIscritte.length === 0 && richiesteInAttesa && richiesteInAttesa.length > 0 && (
        <RigaLink
          href={`/classi/${richiesteInAttesa[0].class_id}`}
          Icona={Hourglass}
          titolo={t("La tua richiesta per «{nome}» è in attesa dell'insegnante", { nome: richiesteInAttesa[0].nome })}
          testo={t("Appena ti accetta, trovi qui la tua classe con i compiti.")}
        />
      )}
      {/* UNA richiesta alla volta: la regola e la priorità stanno in
          `richiesta-home.ts`, con i suoi test. */}
      {richiesta === "ospite" && <GuestLoginReminder />}
      {richiesta === "prima-mano" && <PrimaManoBanner />}
      {/* Chi ha chiesto di insegnare e aspetta: la strada per il portale resta in vista. */}
      {user && !insegna && vaVersoIlPortale && (
        <RigaLink
          href="/diventa-istruttore"
          Icona={GraduationCap}
          titolo={statoRichiestaInsegnante === "pending"
            ? t("La tua richiesta per il Portale Insegnanti è in attesa di approvazione.")
            : t("Hai scelto di insegnare: manca solo la richiesta per il Portale Insegnanti.")}
          testo={statoRichiestaInsegnante === "pending" ? t("Vedi la richiesta →") : t("Inviala ora →")}
        />
      )}
      {richiesta === "notifiche" && <NotificationsNudge />}
    </>
  );

  /*
   * LA HOME DI CHI NON SEGUE UN CORSO (seconda versione, 18/11/2026).
   *
   * Prima erano dieci blocchi impilati, ognuno con la sua larghezza massima
   * (max-w-lg, 3xl, 5xl, 6xl): su un monitor non stavano allineati fra loro e
   * pesavano tutti uguale. Adesso è come la home di chi ha un corso: il saluto,
   * una colonna principale con le cose da fare (riprendere, la mano del giorno,
   * la licita con gli altri) e una colonna a lato con le cose da guardare
   * (livello, codice del corso, premi). Sul telefono la colonna a lato scende
   * sotto. Percorso, Gioca e Scuola non ci sono più come tessere: sono già
   * nella barra di navigazione, in alto a sinistra o in basso.
   */
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:pt-10">
      {/* Referral code handler (reads ?ref= from URL) */}
      <Suspense fallback={null}>
        <ReferralHandler onReferralBonus={handleReferralBonus} />
      </Suspense>

      {/* Marketing consent banner (logged-in users, shown once) */}
      <MarketingConsentBanner
        user={user}
        marketingConsent={authProfile?.marketing_consent ?? null}
      />

      {/* Referral bonus toast */}
      <AnimatePresence>
        {referralToast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl">
              <Zap className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-bold">{t("Bonus +50 XP dal tuo amico!")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement popup */}
      <AchievementPopup badge={newBadge} onDismiss={dismiss} />

      {/* Weekly Recap Modal */}
      {weeklyRecapArmed && (
        <WeeklyRecapModal
          open={showWeeklyRecap}
          onClose={() => setShowWeeklyRecap(false)}
          data={weeklyData}
          title={profile.weeklyRecapTitle}
        />
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Saluto nome={authProfile?.display_name ?? null} />
        {/*
          La strada di ritorno. Senza, «vai alla bacheca» sarebbe una porta a
          senso unico: la preferenza resta salvata, e l'insegnante (o l'allievo
          che ha scelto «il resto del portale», feedback 5) si ritroverebbe la
          bacheca generale per sempre senza sapere perché.
        */}
        {(insegna || corsiIscritti.length > 0) && (
          <Button
            variant="outline"
            onClick={() => {
              ricordaPreferenzaBacheca(false);
              setVuoleLaBacheca(false);
            }}
            className="min-h-10"
          >
            <GraduationCap className="size-4" aria-hidden="true" />
            {insegna ? t("Torna all'area insegnanti") : t("Torna al tuo corso")}
          </Button>
        )}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <div className="grid gap-3 empty:hidden">{avvisi}</div>
          <RiprendiLezione hasStarted={hasStarted} nextModule={nextModule} />
          {hasStarted && !isGuidedMode && <SuggestedNextStep />}
          {isOnboarded && isStuck && <LostCard nextModule={nextModule} />}
          <ManoDelGiornoTessera pool={manoPool} />
          <LicitaSection />
          {/* ===== PER L'INSEGNANTE ===== (non rende nulla se non hai classi) */}
          {!isGuidedMode && <InstructorCard />}
        </div>

        <aside className="grid gap-4">
          <IlTuoLivello stats={stats} totalModulesCompleted={totalModulesCompleted} handsPlayed={handsPlayed} />

          {/*
            L'INVITO A ENTRARE IN UNA CLASSE, per chi non ne ha nessuna. Le
            persone senza classe sono quasi tutti gli iscritti: non manca una
            barriera, manca la porta. L'unico modo di entrare in una classe era
            `/classi`, che chi non ci è mai stato non sa che esiste.
          */}
          {user && classiIscritte.length === 0 && (
            <RigaLink
              href="/classi"
              Icona={Ticket}
              titolo={t("Segui un corso? Hai un codice")}
              testo={t("Il tuo insegnante te l'ha dato: qui entri nella tua classe.")}
            />
          )}
          {/*
            CHI IL CORSO L'HA FINITO NON VA RIMANDATO IN AULA: gli serve il
            passo dopo, un circolo dove giocare.
          */}
          {user && classiIscritte.length > 0 && corsiIscritti.length === 0 && (
            <RigaLink
              href="/trova-circolo"
              Icona={MapPin}
              titolo={t("Il tuo corso è finito")}
              testo={t("Adesso viene il bello: trova un circolo vicino a te e gioca con altri.")}
            />
          )}
          {richiesta === "trova-asd" && <FindAsdBanner />}

          {!isGuidedMode && (
            <section className="grid gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-bold">{t("Prossimo premio")}</h2>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t("{n} moduli", { n: totalModulesCompleted })}
                </span>
              </div>
              <TreasureChests modulesCompleted={totalModulesCompleted} />
            </section>
          )}

          {!isGuidedMode && (
            <CollectionTeaser
              xp={stats.xp}
              streak={stats.streak}
              handsPlayed={handsPlayed}
              completedModules={totalModulesCompleted}
            />
          )}
        </aside>
      </div>

      {/* Achievement popup */}
      <AchievementPopup badge={newBadge} onDismiss={dismiss} />

      {/* Weekly Recap Modal */}
      {weeklyRecapArmed && (
        <WeeklyRecapModal
          open={showWeeklyRecap}
          onClose={() => setShowWeeklyRecap(false)}
          data={weeklyData}
          title={profile.weeklyRecapTitle}
        />
      )}

      {/* Daily login XP toast */}
      <AnimatePresence>
        {stats.dailyLoginAwarded && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ delay: 1, type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-gold-dark text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl" role="status" aria-label={`Login giornaliero: bonus ${10 + Math.min(stats.streak * 5, 50)} XP`}>
              <Zap className="w-5 h-5" aria-hidden="true" />
              Login giornaliero: +{10 + Math.min(stats.streak * 5, 50)} {profile.xpLabel}
              {stats.streak > 1 && <span className="ml-1 text-amber-100">(streak x{stats.streak})</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FIGB FOOTER ===== (hidden on desktop, sidebar shows it) */}
      <div className="mt-8">
        <HomeFooter />
      </div>
    </div>
  );
}
