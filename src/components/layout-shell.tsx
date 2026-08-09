"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DesktopNav } from "@/components/desktop-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useSupabaseSync } from "@/hooks/use-supabase-sync";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { AuthProvider, useSharedAuth } from "@/contexts/auth-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { NewVersionGuide } from "@/components/new-version-guide";
import { SiteFooter } from "@/components/site-footer";
import { useExitIntent } from "@/hooks/use-exit-intent";
import { ExitIntentModal } from "@/components/exit-intent-modal";
import type { UserProfile } from "@/hooks/use-profile";
import { configureStatusBar } from "@/lib/native-bridge";

/** Routes that should be full-screen (no nav, no sidebar) */
const FULL_SCREEN_ROUTES = ["/login", "/admin"];

/** Routes accessible without authentication */
// /glossario è SSR pubblico per la SEO (perf 2026-07): senza di esso qui, chi
// arriva da Google veniva rimbalzato al login e il lavoro SEO era vanificato.
const PUBLIC_ROUTES = ["/", "/login", "/registrati", "/auth", "/privacy", "/termini", "/accessibilita", "/glossario"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutShellInner>{children}</LayoutShellInner>
    </AuthProvider>
  );
}

function LayoutShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useSharedAuth();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => r === "/" ? pathname === "/" : pathname.startsWith(r));
  const [profile, setProfile] = useState<UserProfile>("adulto");
  const { showExitModal, setShowExitModal } = useExitIntent();

  // Auth gate: redirect to login if not authenticated on protected routes
  useEffect(() => {
    if (!authLoading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [authLoading, user, isPublic, router]);

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
        <main id="main-content" className="flex-1 pb-20 lg:pb-6">{children}</main>
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
      <ExitIntentModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        onPlay={() => {
          setShowExitModal(false);
          router.push('/gioca/smazzata');
        }}
      />
    </div>
  );
}
