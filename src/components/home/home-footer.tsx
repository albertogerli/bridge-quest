import Link from "next/link";
import Image from "next/image";

export function HomeFooter() {
  return (
    <section className="px-4 sm:px-5 pb-6 lg:hidden">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-figb/5 dark:bg-primary/10 border border-figb/15 dark:border-primary/20 p-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG: next/image non ottimizza gli SVG */}
          <img src="/logo-bridgelab.svg" alt="Logo BridgeLab" className="h-10 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-5 mb-3">
            <Image src="/icons/logo-figb.png" alt="Logo FIGB - Federazione Italiana Gioco Bridge" width={400} height={355} className="h-12 w-auto" />
            <Image src="/icons/logo-coni.png" alt="Logo CONI - Comitato Olimpico Nazionale Italiano" width={400} height={146} className="h-9 w-auto" />
          </div>
          <p className="text-xs font-bold text-figb/80 dark:text-primary/80 uppercase tracking-wider mb-1">
            Un progetto della
          </p>
          <p className="text-lg font-bold text-figb dark:text-primary">
            Federazione Italiana Gioco Bridge
          </p>
          <p className="mt-2 text-xs text-figb/60 dark:text-primary/60">
            Commissione Insegnamento · Corsi Fiori, Quadri, Cuori
          </p>
          <p className="mt-2 text-[10px] text-figb/40 dark:text-primary/50">
            Sviluppo e hosting: Alberto Giovanni Gerli / Tourbillon Tech S.r.l.
          </p>
          <Link href="/privacy" className="mt-2 inline-block text-[10px] text-figb/50 dark:text-primary/60 underline">
            Privacy e Cookie Policy
          </Link>
        </div>
      </div>
    </section>
  );
}
