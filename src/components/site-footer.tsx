"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200/60 dark:border-gray-700/40 bg-[#F7F5F0]/80 dark:bg-[#0f1219]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* Top row: logos */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <img src="/logo-bridgelab.svg" alt="Logo BridgeLab" className="h-6 w-auto opacity-60" />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
          <img src="/icons/logo-figb.png" alt="Logo FIGB - Federazione Italiana Gioco Bridge" className="h-7 w-auto opacity-60" />
          <img src="/icons/logo-coni.png" alt="Logo CONI - Comitato Olimpico Nazionale Italiano" className="h-5 w-auto opacity-60" />
        </div>

        {/* Links row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          <span className="select-none">·</span>
          <Link href="/privacy#cookie" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Cookie Policy
          </Link>
          <span className="select-none">·</span>
          <Link href="/termini" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Termini di Servizio
          </Link>
          <span className="select-none">·</span>
          <a href="https://www.federbridge.it" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            FIGB.it
          </a>
          <span className="select-none">·</span>
          <a href="mailto:info@bridgelab.it" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Contatti
          </a>
          <span className="select-none">·</span>
          <Link href="/accessibilita" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Accessibilità
          </Link>
        </div>

        {/* Bottom line */}
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-3">
          Sviluppo: Tourbillon Tech S.r.l. · {new Date().getFullYear()} FIGB
        </p>
      </div>
    </footer>
  );
}
