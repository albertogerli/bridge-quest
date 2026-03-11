"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DesktopNav } from "@/components/desktop-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useSupabaseSync } from "@/hooks/use-supabase-sync";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { AuthProvider } from "@/contexts/auth-provider";
import { CookieBanner } from "@/components/cookie-banner";
import type { UserProfile } from "@/hooks/use-profile";

/** Routes that should be full-screen (no nav, no sidebar) */
const FULL_SCREEN_ROUTES = ["/login", "/admin"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutShellInner>{children}</LayoutShellInner>
    </AuthProvider>
  );
}

function LayoutShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));
  const [profile, setProfile] = useState<UserProfile>("adulto");

  // Load profile for visual adaptation
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bq_profile") as UserProfile | null;
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

  // Continuous Supabase sync (runs on every page, no-op if not logged in)
  useSupabaseSync();

  // Track time spent in app (30s heartbeat, pauses when tab hidden)
  useActivityTracker();

  if (isFullScreen) {
    return (
      <>
        <main id="main-content" className="min-h-svh" data-profile={profile}>{children}</main>
        <CookieBanner />
      </>
    );
  }

  return (
    <div className="flex min-h-svh bg-[#F7F5F0] dark:bg-[#0f1219]" data-profile={profile}>
      {/* Left nav - desktop only */}
      <DesktopNav />

      {/* Center: main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main id="main-content" className="flex-1 pb-20 lg:pb-6">{children}</main>
        <BottomNav />
      </div>

      {/* Right sidebar - desktop only */}
      <div className="hidden lg:block px-6 pt-6">
        <DesktopSidebar />
      </div>

      {/* Cookie consent banner */}
      <CookieBanner />
    </div>
  );
}
