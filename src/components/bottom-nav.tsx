"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Navigazione principale">
      <div className="bg-white dark:bg-[#141821] border-t border-[#e5e7eb] dark:border-[#2a3040] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex max-w-lg items-center justify-around px-0.5 py-1 safe-area-bottom">
          <NavItem href="/" icon="home" label="Home" active={isActive("/")} />
          <NavItem href="/lezioni" icon="book" label="Lezioni" active={isActive("/lezioni")} />
          <PlayButton active={isActive("/gioca")} />
          <NavItem href="/forum" icon="forum" label="Forum" active={isActive("/forum")} />
          <NavItem href="/classifica" icon="trophy" label="Classifica" active={isActive("/classifica")} />
          <NavItem href="/profilo" icon="user" label="Profilo" active={isActive("/profilo")} />
        </div>
      </div>
    </nav>
  );
}

function PlayButton({ active }: { active: boolean }) {
  return (
    <Link
      href="/gioca"
      className="relative -mt-6 flex flex-col items-center"
      aria-label="Gioca"
    >
      <div
        className={`flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-white transition-all active:scale-90 ${
          active
            ? "bg-[#003DA5] shadow-lg shadow-[#003DA5]/30 border border-[#0052CC]"
            : "bg-[#003DA5] shadow-lg shadow-[#003DA5]/30 border border-[#0052CC]"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className={`mt-1 text-[10px] font-bold ${active ? "text-[#003DA5]" : "text-[#003DA5]"}`}>
        Gioca
      </span>
    </Link>
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
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        {!active && <polyline points="9,22 9,12 15,12 15,22" />}
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    forum: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    trophy: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2z" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} className="h-[22px] w-[22px]">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all ${
        active
          ? "text-[#003DA5] bg-[#003DA5]/8"
          : "text-gray-400 hover:text-gray-600 active:scale-95"
      }`}
      aria-label={label}
    >
      {icons[icon]}
      <span className={`text-[10px] ${active ? "font-bold" : "font-semibold"}`}>
        {label}
      </span>
      {active && (
        <div className="absolute -bottom-1 w-5 h-1 rounded-full bg-[#003DA5]" />
      )}
    </Link>
  );
}
