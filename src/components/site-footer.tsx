"use client";

import Link from "next/link";
import Image from "next/image";
import { openConsentPreferences } from "@/lib/consent-client";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* Top row: logos */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG: next/image non ottimizza gli SVG */}
          <img src="/logo-bridgelab.svg" alt="Logo BridgeLab" className="h-6 w-auto opacity-60" />
          <div className="h-4 w-px bg-border" aria-hidden="true" />
          <Image src="/icons/logo-figb.png" alt="Logo FIGB - Federazione Italiana Gioco Bridge" width={400} height={355} className="h-7 w-auto opacity-60" />
          <Image src="/icons/logo-coni.png" alt="Logo CONI - Comitato Olimpico Nazionale Italiano" width={400} height={146} className="h-5 w-auto opacity-60" />
        </div>

        {/* Links row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <Link href="/guida" className="hover:text-foreground/70 transition-colors">
            Guida
          </Link>
          <span className="select-none">·</span>
          <Link href="/privacy" className="hover:text-foreground/70 transition-colors">
            Privacy Policy
          </Link>
          <span className="select-none">·</span>
          <Link href="/privacy#cookie" className="hover:text-foreground/70 transition-colors">
            Cookie Policy
          </Link>
          <span className="select-none">·</span>
          {/* Riapre il banner. Senza, chi ha scelto «Solo necessari» non
              potrebbe più cambiare idea se non cancellando i dati del sito:
              un consenso non revocabile con la stessa facilità con cui è
              stato dato non è un consenso valido. */}
          <button
            type="button"
            onClick={openConsentPreferences}
            className="hover:text-foreground/70 transition-colors underline-offset-2 hover:underline"
          >
            Preferenze cookie
          </button>
          <span className="select-none">·</span>
          <Link href="/termini" className="hover:text-foreground/70 transition-colors">
            Termini di Servizio
          </Link>
          <span className="select-none">·</span>
          <a href="https://www.federbridge.it" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/70 transition-colors">
            FIGB.it
          </a>
          <span className="select-none">·</span>
          <a href="mailto:info@bridgelab.it" className="hover:text-foreground/70 transition-colors">
            Contatti
          </a>
          <span className="select-none">·</span>
          <Link href="/accessibilita" className="hover:text-foreground/70 transition-colors">
            Accessibilità
          </Link>
        </div>

        {/* Bottom line */}
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          Sviluppo: Tourbillon Tech S.r.l. · {new Date().getFullYear()} FIGB
        </p>
      </div>
    </footer>
  );
}
