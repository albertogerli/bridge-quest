import Link from "next/link";

export function HomeFooter() {
  return (
    <section className="px-4 sm:px-5 pb-6 lg:hidden">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-[#003DA5]/5 border border-[#003DA5]/15 p-5 text-center">
          <img src="/logo-bridgelab.svg" alt="Logo BridgeLab" className="h-10 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-5 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-figb.png" alt="Logo FIGB - Federazione Italiana Gioco Bridge" className="h-12 w-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-coni.png" alt="Logo CONI - Comitato Olimpico Nazionale Italiano" className="h-9 w-auto" />
          </div>
          <p className="text-xs font-bold text-[#003DA5]/80 uppercase tracking-wider mb-1">
            Un progetto della
          </p>
          <p className="text-lg font-bold text-[#003DA5]">
            Federazione Italiana Gioco Bridge
          </p>
          <p className="mt-2 text-xs text-[#003DA5]/60">
            Commissione Insegnamento · Corsi Fiori, Quadri, Cuori
          </p>
          <p className="mt-2 text-[10px] text-[#003DA5]/40">
            Sviluppo e hosting: Alberto Giovanni Gerli / Tourbillon Tech S.r.l.
          </p>
          <Link href="/privacy" className="mt-2 inline-block text-[10px] text-[#003DA5]/50 underline">
            Privacy e Cookie Policy
          </Link>
        </div>
      </div>
    </section>
  );
}
