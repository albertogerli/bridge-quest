import Link from "next/link";
import { SuitSymbol } from "@/components/bridge/suit-symbol";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-figb/5 dark:from-primary/10 via-background to-background flex flex-col items-center justify-center px-6 text-center">
      {/* Flipped card illustration */}
      <div className="relative mb-8">
        <div className="w-28 h-40 rounded-2xl bg-gradient-to-br from-figb to-figb-dark shadow-xl shadow-figb/20 flex items-center justify-center rotate-6">
          <div className="absolute inset-2 rounded-xl border-2 border-white/10" />
          <span className="text-5xl text-white/60 font-bold">?</span>
        </div>
        <div className="absolute -bottom-2 -left-3 w-28 h-40 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 shadow-lg -rotate-12 -z-10" />
      </div>

      <h1 className="text-4xl font-black text-foreground font-display mb-2">404</h1>
      <p className="text-lg font-bold text-foreground/80 mb-1">Pagina non trovata</p>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        Questa carta non è nel mazzo! La pagina che cerchi non esiste o è stata spostata.
      </p>

      {/* Navigation links */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-figb text-white font-semibold text-sm shadow-lg shadow-figb/20 hover:bg-figb-dark transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Home
        </Link>
        <Link
          href="/lezioni"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-card text-foreground/80 font-semibold text-sm border-2 border-border hover:border-figb/30 dark:hover:border-primary/40 transition-colors"
        >
          Lezioni
        </Link>
        <Link
          href="/gioca"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-card text-foreground/80 font-semibold text-sm border-2 border-border hover:border-figb/30 dark:hover:border-primary/40 transition-colors"
        >
          Gioca
        </Link>
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-card text-foreground/80 font-semibold text-sm border-2 border-border hover:border-figb/30 dark:hover:border-primary/40 transition-colors"
        >
          Forum
        </Link>
      </div>

      {/* Suit decorations */}
      <div className="flex gap-3 mt-10 opacity-20">
        {(["club", "diamond", "heart", "spade"] as const).map((suit) => (
          <SuitSymbol key={suit} suit={suit} size="lg" />
        ))}
      </div>
    </div>
  );
}
