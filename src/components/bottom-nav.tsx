"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Navigazione principale">
      <div className="bg-white dark:bg-[#141821] border-t-3 border-[#e5e0d5] dark:border-[#2a3040] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex max-w-lg items-center justify-around px-0.5 py-1 safe-area-bottom">
          <NavItem href="/" icon="home" label="Home" active={isActive("/")} color="indigo" />
          <NavItem href="/lezioni" icon="book" label="Lezioni" active={isActive("/lezioni")} color="blue" />
          <PlayButton active={isActive("/gioca")} />
          <NavItem href="/forum" icon="forum" label="Forum" active={isActive("/forum")} color="purple" />
          <NavItem href="/classifica" icon="trophy" label="Classifica" active={isActive("/classifica")} color="amber" />
          <NavItem href="/profilo" icon="user" label="Profilo" active={isActive("/profilo")} color="rose" />
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
            ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-400/40 border-2 border-amber-300"
            : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-400/40 border-2 border-violet-400 pulse-glow"
        }`}
        style={{ borderBottom: active ? "4px solid #d97706" : "4px solid #6d28d9" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className={`mt-1 text-[10px] font-extrabold ${active ? "text-amber-600" : "text-purple-600"}`}>
        Gioca
      </span>
    </Link>
  );
}

const colorMap = {
  emerald: { active: "text-emerald-600 bg-emerald-50", dot: "bg-emerald-500" },
  indigo: { active: "text-indigo-600 bg-indigo-50", dot: "bg-indigo-500" },
  blue: { active: "text-blue-600 bg-blue-50", dot: "bg-blue-500" },
  purple: { active: "text-purple-600 bg-purple-50", dot: "bg-purple-500" },
  amber: { active: "text-amber-600 bg-amber-50", dot: "bg-amber-500" },
  rose: { active: "text-rose-600 bg-rose-50", dot: "bg-rose-500" },
};

function NavItem({
  href,
  icon,
  label,
  active,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  color: keyof typeof colorMap;
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

  const colors = colorMap[color];

  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all ${
        active
          ? colors.active
          : "text-gray-400 hover:text-gray-600 active:scale-95"
      }`}
      aria-label={label}
    >
      {icons[icon]}
      <span className={`text-[10px] ${active ? "font-extrabold" : "font-semibold"}`}>
        {label}
      </span>
      {active && (
        <div className={`absolute -bottom-1 w-5 h-1 rounded-full ${colors.dot}`} />
      )}
    </Link>
  );
}
