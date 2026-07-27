"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { usePendingFriendRequests } from "@/hooks/use-pending-friend-requests";

const primaryNav = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/impara", icon: "book", label: "Impara" },
  { href: "/gioca", icon: "play", label: "Gioca" },
  { href: "/scuola", icon: "scuola", label: "Scuola" },
  { href: "/amici", icon: "friends", label: "Amici" },
  { href: "/classifica", icon: "trophy", label: "Classifica" },
  { href: "/profilo", icon: "user", label: "Profilo" },
];

const moreNav = [
  { href: "/forum", icon: "forum", label: "Forum" },
  { href: "/negozio", icon: "shop", label: "Negozio" },
  { href: "/trova-circolo", icon: "circolo", label: "Trova ASD" },
  { href: "/scopri", icon: "scopri", label: "Scopri" },
];

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      {!a && <polyline points="9,22 9,12 15,12 15,22" />}
    </svg>
  ),
  book: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  dispense: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 ml-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  scuola: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  friends: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  forum: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  trophy: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  ),
  shop: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  circolo: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  scopri: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  user: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

export function DesktopNav() {
  const pathname = usePathname();
  const pendingFriends = usePendingFriendRequests();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderItem = (item: { href: string; icon: string; label: string }) => {
    const active = isActive(item.href);
    if (item.icon === "play") {
      return (
        <Link key={item.href} href={item.href} aria-label={item.label}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] mt-2 mb-2 bg-gradient-to-r from-figb to-figb-light text-white ${
            active ? "shadow-md shadow-figb/25" : "shadow-sm hover:shadow-md"
          }`}>
            {icons[item.icon](active)}
            <span>{item.label}</span>
          </div>
        </Link>
      );
    }
    return (
      <Link key={item.href} href={item.href} aria-label={item.label}>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all active:scale-[0.97] ${
          active
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
        }`}>
          <span className={active ? "" : "text-muted-foreground/70"} aria-hidden="true">
            {icons[item.icon](active)}
          </span>
          <span>{item.label}</span>
          {item.href === "/amici" && pendingFriends > 0 && (
            <span
              className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white"
              aria-label={`${pendingFriends} richieste di amicizia in attesa`}
            >
              {pendingFriends > 9 ? "9+" : pendingFriends}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <nav className="hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 bg-card border-r border-border" aria-label="Navigazione principale">
      {/* Logo */}
      <div className="px-4 pt-4 pb-3">
        <img src="/logo-bridgelab.svg" alt="BridgeLab - Impara il Bridge giocando" className="w-full h-10 object-contain object-left" />
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {primaryNav.map(renderItem)}

        {/* Secondary "Altro" group */}
        <div className="pt-4">
          <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Altro
          </p>
          {moreNav.map(renderItem)}
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="px-3 pb-4">
        <div className="h-px bg-border mb-3" />
        <Link href="/impostazioni" aria-label="Impostazioni">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/impostazioni"
              ? "bg-muted text-foreground/80"
              : "text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground/80"
          }`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Impostazioni</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
