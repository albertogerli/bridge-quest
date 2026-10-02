"use client";

import Link from "@/components/link";
import { UserPlus } from "lucide-react";
import { usePendingFriendRequests } from "@/hooks/use-pending-friend-requests";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * «Hai una richiesta di amicizia»: un avviso che si legge, non un pallino.
 *
 * PERCHÉ. Al telefono — e nell'app iOS, che è il sito in un guscio — l'unico
 * segnale era un pallino rosso sulla scheda «Gioca», senza spiegazione, e la
 * pagina Amici stava in fondo a Gioca. Il 01/10/2026 nel database c'erano 92
 * richieste mai risposte. Sta in cima a Home, Gioca e Profilo, e porta dritto
 * alla scheda delle richieste.
 */
export function AvvisoRichiesteAmicizia({ className = "" }: { className?: string }) {
  const t = useT();
  const n = usePendingFriendRequests();
  if (n === 0) return null;
  return (
    <Link
      href="/amici?tab=richieste"
      className={`flex min-h-14 items-center gap-3 rounded-2xl border border-figb/30 bg-figb/5 px-4 py-3 transition-colors hover:bg-figb/10 ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-figb text-white">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex-1 text-sm font-semibold">
        {n === 1 ? t("Hai una richiesta di amicizia") : t("Hai {n} richieste di amicizia", { n })}
      </span>
      <span className="text-sm font-bold text-figb">{t("Rispondi")} →</span>
    </Link>
  );
}
