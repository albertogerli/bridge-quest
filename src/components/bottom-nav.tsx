"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePercorso } from "@/hooks/use-lingua";
import { motion, AnimatePresence } from "motion/react";
import { hapticTap } from "@/lib/native-bridge";
import { usePendingFriendRequests } from "@/hooks/use-pending-friend-requests";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const MORE_LINKS = [
  { href: "/profilo", emoji: "👤", label: "Profilo" },
  { href: "/amici", emoji: "👥", label: "Amici" },
  { href: "/classifica", emoji: "🏆", label: "Classifica" },
  { href: "/forum", emoji: "💬", label: "Forum" },
  { href: "/negozio", emoji: "🛍️", label: "Negozio" },
  { href: "/trova-circolo", emoji: "📍", label: "Trova ASD" },
  { href: "/scopri", emoji: "🌐", label: "Scopri" },
  { href: "/impostazioni", emoji: "⚙️", label: "Impostazioni" },
];

export function BottomNav() {
  // Senza prefisso di lingua, o sotto `/en` nessuna voce risulta attiva.
  const pathname = usePercorso();
  const [moreOpen, setMoreOpen] = useState(false);
  const pendingFriends = usePendingFriendRequests();
  const moreSheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(moreSheetRef, moreOpen, { onEscape: () => setMoreOpen(false) });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const moreActive = MORE_LINKS.some((l) => isActive(l.href));

  return (
    <>
      {/* "Altro" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} aria-hidden="true" />
            <motion.div
              ref={moreSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bottomnav-more-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-card p-5 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] safe-area-bottom"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true" />
              <p id="bottomnav-more-title" className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Altro</p>
              <div className="grid grid-cols-4 gap-3">
                {MORE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => {
                      hapticTap();
                      setMoreOpen(false);
                    }}
                    aria-label={
                      l.href === "/amici" && pendingFriends > 0
                        ? `${l.label} — ${pendingFriends} richieste in attesa`
                        : l.label
                    }
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors ${
                      isActive(l.href)
                        ? "border-primary/30 bg-primary/5"
                        : "border-border active:bg-muted/50"
                    }`}
                  >
                    <span className="relative text-2xl" aria-hidden="true">
                      {l.emoji}
                      {l.href === "/amici" && pendingFriends > 0 && (
                        <span className="absolute -top-1 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[12px] font-bold text-white">
                          {pendingFriends > 9 ? "9+" : pendingFriends}
                        </span>
                      )}
                    </span>
                    <span className="text-[12px] font-semibold text-foreground/80">{l.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Navigazione principale">
        <div className="bg-card/85 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex max-w-2xl items-end px-0.5 py-1 safe-area-bottom">
            {/* Left group */}
            <div className="flex flex-1 justify-around">
              <NavItem href="/" icon="home" label="Home" active={isActive("/")} />
              <NavItem href="/impara" icon="book" label="Impara" active={isActive("/impara")} />
            </div>
            {/* Center - Gioca always centered */}
            <div className="flex justify-center px-1">
              <PlayButton active={isActive("/gioca")} />
            </div>
            {/* Right group */}
            <div className="flex flex-1 justify-around">
              <NavItem href="/scuola" icon="scuola" label="Scuola" active={isActive("/scuola")} />
              <MoreButton
                active={moreActive || moreOpen}
                expanded={moreOpen}
                badge={pendingFriends > 0}
                onClick={() => setMoreOpen((o) => !o)}
              />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function PlayButton({ active }: { active: boolean }) {
  return (
    <Link
      href="/gioca"
      className="relative -mt-6 flex flex-col items-center"
      aria-label="Gioca"
      onClick={() => hapticTap()}
    >
      <div
        className={`flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-white transition-all active:scale-90 bg-gradient-to-br from-figb to-figb-light shadow-lg shadow-figb/35 ring-1 ring-white/20 ${
          active ? "scale-105" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 ml-0.5" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className="mt-1 text-[12px] font-bold text-primary">Gioca</span>
    </Link>
  );
}

function MoreButton({
  active,
  badge,
  expanded,
  onClick,
}: {
  active: boolean;
  badge?: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        hapticTap();
        onClick();
      }}
      aria-label={
        badge ? "Altro — hai richieste di amicizia in attesa" : "Altro"
      }
      aria-haspopup="dialog"
      aria-expanded={expanded ?? false}
      className={`relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all ${
        active ? "text-primary" : "text-muted-foreground active:scale-95"
      }`}
    >
      {active && (
        <motion.div
          layoutId="bottomnav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[22px] w-[22px]" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        {badge && (
          <span
            className="absolute -top-0.5 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card"
            aria-hidden="true"
          />
        )}
      </span>
      <span className={`relative text-[12px] ${active ? "font-bold" : "font-semibold"}`}>Altro</span>
    </button>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        {!active && <polyline points="9,22 9,12 15,12 15,22" />}
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    scuola: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M22 10L12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
      </svg>
    ),
  };

  return (
    <Link
      href={href}
      onClick={() => hapticTap()}
      className={`relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground active:scale-95"
      }`}
      aria-label={label}
    >
      {active && (
        <motion.div
          layoutId="bottomnav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">{icons[icon]}</span>
      <span className={`relative text-[12px] ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
    </Link>
  );
}
