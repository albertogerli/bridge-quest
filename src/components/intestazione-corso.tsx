"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/link";
import { DesktopNav } from "@/components/desktop-nav";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useT } from "@/contexts/traduzioni-provider";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { usePercorso } from "@/hooks/use-lingua";
import { homeDi } from "@/lib/lingua";

/**
 * L'intestazione della modalità corso (vedi `use-modalita-corso.ts`).
 *
 * A sinistra un solo tasto apre la navigazione generale in un pannello; a
 * destra chi è collegato e «Esci», dove ci si aspetta di trovarli. Tutto il
 * resto della larghezza va al contenuto della classe.
 */
export function IntestazioneCorso() {
  const t = useT();
  const { user, profile, signOut } = useSharedAuth();
  const [aperto, setAperto] = useState(false);
  const pannello = useRef<HTMLDivElement>(null);
  const percorso = usePercorso();

  useFocusTrap(pannello, aperto, { onEscape: () => setAperto(false) });

  // Si sceglie una voce, si cambia pagina: il pannello si chiude da solo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chiusura del pannello al cambio di pagina: deriva dalla navigazione, non da un evento della pagina
    setAperto(false);
  }, [percorso]);

  const nome = profile?.display_name?.trim() || user?.email || "";

  async function esci() {
    await signOut();
    try { localStorage.removeItem("bq_guest"); } catch {}
    window.location.href = homeDi(window.location.pathname);
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5">
        <button
          type="button"
          onClick={() => setAperto(true)}
          aria-label={t("Apri il menù")}
          aria-expanded={aperto}
          aria-controls="menu-generale"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link href="/" aria-label={t("BridgeLab - Impara il Bridge giocando")} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG: next/image non ottimizza gli SVG */}
          <img src="/logo-bridgelab.svg" alt="" className="h-8 w-auto" />
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {/* Il nome porta al profilo: è lì che lo si cerca per cambiare i dati
              o eliminare l'account (Trevissoi, 14/10/2026: «in fondo alla
              pagina non vedo nulla» — il profilo stava solo dietro il menu). */}
          {nome && (
            <Link
              href="/profilo"
              title={nome}
              className="hidden max-w-[16rem] truncate rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:inline"
            >
              {nome}
            </Link>
          )}
          {user && (
            <button
              type="button"
              onClick={() => void esci()}
              aria-label={t("Esci dal tuo account")}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t("Esci")}
            </button>
          )}
        </div>
      </header>

      {aperto && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t("Chiudi il menù")}
            onClick={() => setAperto(false)}
            className="absolute inset-0 h-full w-full bg-foreground/30"
          />
          <div
            ref={pannello}
            id="menu-generale"
            role="dialog"
            aria-modal="true"
            aria-label={t("Menù")}
            className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-border bg-card shadow-lg"
          >
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setAperto(false)}
                aria-label={t("Chiudi il menù")}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <DesktopNav variante="pannello" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
