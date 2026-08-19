"use client";

import { usePathname, useRouter } from "next/navigation";
import { usePercorso } from "@/hooks/use-lingua";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DesktopNav } from "@/components/desktop-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useSupabaseSync } from "@/hooks/use-supabase-sync";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { AuthProvider, useSharedAuth } from "@/contexts/auth-provider";
import { RicordaLingua } from "@/components/ricorda-lingua";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { useExitIntent } from "@/hooks/use-exit-intent";
import type { UserProfile } from "@/hooks/use-profile";
import { configureStatusBar } from "@/lib/native-bridge";

// Overlay one-shot presenti nel layout condiviso (quindi in TUTTE le route) ma
// invisibili al primo paint: caricarli staticamente costava a ogni pagina il
// loro codice + @radix-ui/react-dialog (usato solo da ExitIntentModal qui).
// Entrambi renderizzano `null` finché non si aprono → ssr:false è trasparente.
const NewVersionGuide = dynamic(
  () => import("@/components/new-version-guide").then((m) => m.NewVersionGuide),
  { ssr: false },
);
const ExitIntentModal = dynamic(
  () => import("@/components/exit-intent-modal").then((m) => m.ExitIntentModal),
  { ssr: false },
);

/** Routes that should be full-screen (no nav, no sidebar) */
// La lavagna va proiettata in aula: barra di navigazione, punteggi e inviti a
// giocare sullo schermo grande sono rumore che distrae la classe.
const FULL_SCREEN_ROUTES = ["/login", "/admin", "/istruttori/lavagna"];

/** Routes accessible without authentication */
// /glossario è SSR pubblico per la SEO (perf 2026-07): senza di esso qui, chi
// arriva da Google veniva rimbalzato al login e il lavoro SEO era vanificato.
const PUBLIC_ROUTES = ["/", "/login", "/registrati", "/auth", "/privacy", "/termini", "/accessibilita", "/glossario"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* DENTRO l'AuthProvider, non nel layout: legge l'utente, e fuori da qui
          `useSharedAuth` lancia — il che in sviluppo rendeva ogni pagina un
          errore 500. In produzione non si vedeva, perché le pagine
          prerenderizzate venivano servite lo stesso: un difetto che il build
          nasconde è peggio di uno che rompe subito. */}
      <RicordaLingua />
      <LayoutShellInner>{children}</LayoutShellInner>
    </AuthProvider>
  );
}

function LayoutShellInner({ children }: { children: React.ReactNode }) {
  // Il percorso SENZA prefisso di lingua: `/en/gioca` deve valere `/gioca` in
  // ogni confronto, o sotto `/en` le rotte pubbliche non risultano pubbliche e
  // il gate qui sotto spedisce al login chi apre la home inglese.
  const pathname = usePercorso();
  const router = useRouter();
  const { user, loading: authLoading } = useSharedAuth();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => r === "/" ? pathname === "/" : pathname.startsWith(r));
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const { showExitModal, setShowExitModal } = useExitIntent();
  // Una volta armato resta montato: così l'animazione di chiusura del Dialog
  // continua a funzionare e il chunk viene scaricato solo alla prima apertura.
  const [exitModalArmed, setExitModalArmed] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- latch monodirezionale: arma il modale alla prima apertura e non lo smonta più, così l'animazione di chiusura resta fluida
    if (showExitModal) setExitModalArmed(true);
  }, [showExitModal]);

  /**
   * Auth gate: chi non è collegato va al login, PORTANDOSI DIETRO DOVE STAVA
   * ANDANDO.
   *
   * Prima mandava a `/login` e basta. Il proxy la destinazione la conserva
   * (`?redirect=`), ma il proxy protegge solo `/admin`: per tutto il resto
   * arriva prima questo cancello, e la buttava via. Il costo si vede quando
   * qualcuno riceve un collegamento diretto — un compito mandato su WhatsApp
   * dall'insegnante, per dire: fa il login e si ritrova sulla home, a cercare
   * a mano la cosa su cui aveva appena cliccato.
   *
   * Si usa il percorso INTERO, prefisso di lingua compreso: `usePercorso()` lo
   * toglie per i confronti qui sopra, ma come destinazione servirebbe quello
   * vero, o un inglese tornerebbe sulla pagina italiana.
   */
  const percorsoIntero = usePathname();
  useEffect(() => {
    if (!authLoading && !user && !isPublic) {
      const dove = percorsoIntero && percorsoIntero !== "/" ? percorsoIntero : null;
      router.replace(dove ? `/login?redirect=${encodeURIComponent(dove)}` : "/login");
    }
  }, [authLoading, user, isPublic, router, percorsoIntero]);

  // Load profile for visual adaptation
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bq_profile") as UserProfile | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      if (stored) setProfile(stored);
    } catch {}

    // Listen for profile changes (cross-tab via storage, same-tab via custom event)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "bq_profile" && e.newValue) setProfile(e.newValue as UserProfile);
    };
    const handleCustom = (e: Event) => {
      setProfile((e as CustomEvent).detail as UserProfile);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("bq_profile_change", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("bq_profile_change", handleCustom);
    };
  }, []);

  // Configure native status bar (no-op on web)
  useEffect(() => { configureStatusBar(); }, []);

  // Continuous Supabase sync (runs on every page, no-op if not logged in)
  useSupabaseSync();

  // Track time spent in app (30s heartbeat, pauses when tab hidden)
  useActivityTracker();

  // Show loading spinner while auth resolves on protected routes
  if (!isPublic && (authLoading || !user)) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      </div>
    );
  }

  if (isFullScreen) {
    return (
      <>
        <main id="main-content" className="min-h-svh" data-profile={profile}>{children}</main>
        <CookieBanner />
      </>
    );
  }

  return (
    <div className="flex min-h-svh bg-background safe-area-top" data-profile={profile}>
      {/* Left nav - desktop only */}
      <DesktopNav />

      {/* Center: main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* pb-28: il bottone "Gioca" e' alto 60px e sporge di 24 sopra la barra
            (-mt-6), piu' la sua ombra. Con pb-20 copriva l'ultima riga di
            contenuto su OGNI schermata — "4 CORSI" nella landing, il titolo
            "Pratica" su Gioca, "Completa il mondo precedente" su Lezioni. */}
        <main id="main-content" className="flex-1 pb-28 lg:pb-6">{children}</main>
        <div className="hidden lg:block">
          <SiteFooter />
        </div>
        <BottomNav />
      </div>

      {/* Right sidebar - desktop only */}
      <div className="hidden lg:block px-6 pt-6">
        <DesktopSidebar />
      </div>

      {/* Cookie consent banner */}
      <CookieBanner />

      {/* One-time guide to the reorganised version */}
      <NewVersionGuide />

      {/* Exit intent modal */}
      {exitModalArmed && (
        <ExitIntentModal
          open={showExitModal}
          onOpenChange={setShowExitModal}
          onPlay={() => {
            setShowExitModal(false);
            router.push('/gioca/smazzata');
          }}
        />
      )}
    </div>
  );
}
