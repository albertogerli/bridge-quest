"use client";

import { usePathname } from "next/navigation";
import { DesktopNav } from "@/components/desktop-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { BottomNav } from "@/components/bottom-nav";

/** Routes that should be full-screen (no nav, no sidebar) */
const FULL_SCREEN_ROUTES = ["/login", "/admin"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullScreen) {
    return <div className="min-h-svh">{children}</div>;
  }

  return (
    <div className="flex min-h-svh bg-[#F7F5F0]">
      {/* Left nav - desktop only */}
      <DesktopNav />

      {/* Center: main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 lg:pb-6">{children}</main>
        <BottomNav />
      </div>

      {/* Right sidebar - desktop only */}
      <div className="hidden lg:block px-6 pt-6">
        <DesktopSidebar />
      </div>
    </div>
  );
}
