"use client";

import Link from "next/link";
import { usePercorso } from "@/hooks/use-lingua";
import { useT } from "@/contexts/traduzioni-provider";
import { motion } from "motion/react";
import { hapticTap } from "@/lib/native-bridge";
import { usePendingFriendRequests } from "@/hooks/use-pending-friend-requests";
import { useNascosti } from "@/hooks/use-permessi";

/**
 * Quattro voci, tutte della stessa misura, e nessuna è un menu.
 *
 * COSA C'ERA PRIMA. Cinque: Home, Impara, GIOCA, Scuola, Altro. «Gioca» era
 * un pulsante rialzato e colorato grande il doppio degli altri, «Altro» era
 * un cassetto con dentro otto destinazioni, e due delle cinque — Impara e
 * Scuola — non erano posti: erano altri menu. «Impara» in particolare non
 * portava al percorso, portava a un elenco che conteneva il collegamento al
 * percorso.
 *
 * COSA CAMBIA E PERCHÉ. Il pulsante gigante diceva a tutti di giocare, ed è
 * l'unica cosa che diceva chiaramente. Adesso le quattro voci pesano uguale
 * e la scelta torna a chi apre l'applicazione.
 *
 * «Percorso» punta a `/lezioni`, cioè al percorso vero: il menu intermedio
 * è sparito. «Classe» non c'è, ed è una decisione: la classe la vedono solo
 * 56 persone su 173, e sta già in cima alla home di chi ne ha una
 * (`HomeAllievo`) o nel portale di chi insegna. Una scheda fissa che chiede
 * un codice a chi non sa cosa sia una classe è l'errore descritto in
 * CLAUDE.md — quello del QR che portava a `/classi` — reso permanente.
 *
 * Le otto voci del cassetto non sono sparite: sono andate dove si capiscono,
 * e ognuna ha il suo motivo scritto accanto nella pagina che la ospita.
 */
const VOCI = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/lezioni", icon: "percorso", label: "Percorso" },
  { href: "/gioca", icon: "gioca", label: "Gioca" },
  { href: "/profilo", icon: "profilo", label: "Profilo" },
];

export function BottomNav() {
  // Senza prefisso di lingua, o sotto `/en` nessuna voce risulta attiva.
  const pathname = usePercorso();
  const t = useT();
  const pendingFriends = usePendingFriendRequests();
  // Le voci che l'insegnante non ha ancora aperto non si propongono. Niente
  // lucchetti: un lucchetto dice «ti stanno tenendo fuori», l'assenza dice
  // «non è ancora il momento».
  const { nascosti } = useNascosti();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label={t("Navigazione principale")}>
      <div className="bg-card/85 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex max-w-2xl items-end justify-around px-0.5 py-1 safe-area-bottom">
          {VOCI.filter((v) => !nascosti.has(v.href)).map((v) => (
            <NavItem
              key={v.href}
              href={v.href}
              icon={v.icon}
              label={v.label}
              active={isActive(v.href)}
              // Le richieste di amicizia arrivano nel profilo, che è dove
              // ora vivono gli amici: il pallino va lì o non si vede.
              badge={v.href === "/profilo" && pendingFriends > 0}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  badge = false,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: boolean;
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
    // Una strada che sale a tappe: è il percorso, non un libro. Il libro
    // diceva «teoria», e il percorso non è solo teoria.
    percorso: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M6 20c0-3 3-3 3-6s-3-3-3-6 3-3 3-3" />
        <circle cx="6" cy="20" r="1.6" fill={active ? "currentColor" : "none"} />
        <circle cx="9" cy="8" r="1.6" fill={active ? "currentColor" : "none"} />
        <circle cx="18" cy="5" r="2.2" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
    gioca: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinejoin="round" className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
    profilo: (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  // Tradotta qui dentro e non a ogni chiamata: chi aggiunge una voce nuova non
  // deve ricordarsi di avvolgerla.
  const t = useT();
  const etichetta = t(label);

  return (
    <Link
      href={href}
      onClick={() => hapticTap()}
      className={`relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground active:scale-95"
      }`}
      aria-label={etichetta}
    >
      {active && (
        <motion.div
          layoutId="bottomnav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">
        {icons[icon]}
        {badge && (
          <span
            className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"
            aria-hidden="true"
          />
        )}
      </span>
      <span className={`relative text-[12px] ${active ? "font-bold" : "font-semibold"}`}>{etichetta}</span>
    </Link>
  );
}
