"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SuitSymbol } from "@/components/bridge/suit-symbol";

const navItems = [
  { href: "/", icon: "home", label: "Home", color: "indigo" as const },
  { href: "/lezioni", icon: "book", label: "Lezioni", color: "blue" as const },
  { href: "/gioca", icon: "play", label: "Gioca", color: "purple" as const },
  { href: "/forum", icon: "forum", label: "Forum", color: "purple" as const },
  { href: "/classifica", icon: "trophy", label: "Classifica", color: "amber" as const },
  { href: "/profilo", icon: "user", label: "Profilo", color: "rose" as const },
];

const colorStyles = {
  indigo: { active: "bg-indigo-50 text-indigo-600 border-indigo-300", icon: "text-indigo-500" },
  emerald: { active: "bg-emerald-50 text-emerald-600 border-emerald-300", icon: "text-emerald-500" },
  blue: { active: "bg-blue-50 text-blue-600 border-blue-300", icon: "text-blue-500" },
  purple: { active: "bg-purple-50 text-purple-600 border-purple-300", icon: "text-purple-500" },
  amber: { active: "bg-amber-50 text-amber-600 border-amber-300", icon: "text-amber-500" },
  rose: { active: "bg-rose-50 text-rose-600 border-rose-300", icon: "text-rose-500" },
};

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
  play: (a) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 ml-0.5">
      <path d="M8 5v14l11-7z" />
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
  user: (a) => (
    <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 2} className="h-5 w-5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

export function DesktopNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 bg-white border-r-2 border-[#e5e0d5]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            {(["club", "heart", "diamond", "spade"] as const).map((suit) => (
              <div key={suit} className="w-5 h-5 flex items-center justify-center">
                <SuitSymbol suit={suit} size="sm" />
              </div>
            ))}
          </div>
        </div>
        <h1 className="text-lg font-extrabold text-gray-900 mt-2">BridgeQuest</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Corsi FIGB</p>
      </div>

      <div className="h-px bg-[#e5e0d5] mx-4" />

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const colors = colorStyles[item.color];
          const isPlay = item.icon === "play";

          if (isPlay) {
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-[0.97] mt-2 mb-2 ${
                  active
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-purple-400/30"
                    : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-[0_4px_0_#6d28d9] hover:shadow-[0_3px_0_#6d28d9] hover:translate-y-[1px] active:shadow-[0_1px_0_#6d28d9] active:translate-y-[3px]"
                }`}>
                  {icons[item.icon](active)}
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all active:scale-[0.97] ${
                active
                  ? `${colors.active} border-2 font-extrabold`
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-bold border-2 border-transparent"
              }`}>
                <span className={active ? "" : "text-gray-400"}>
                  {icons[item.icon](active)}
                </span>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <div className="px-3 pb-4">
        <div className="h-px bg-[#e5e0d5] mb-3" />
        <Link href="/impostazioni">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            pathname === "/impostazioni"
              ? "bg-gray-100 text-gray-700"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
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
