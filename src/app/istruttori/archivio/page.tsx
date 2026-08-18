"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import { deleteSavedHand, getSavedHands, type SavedHand } from "@/lib/saved-hands";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

/**
 * L'archivio delle mani salvate.
 *
 * Ogni voce non è una smazzata ma un MOMENTO: la mano nella posizione in cui
 * è stata salvata, carte già giocate comprese. Si riapre nel tavolo di studio
 * esattamente lì — che è il punto: alla lezione dopo non si vuole rigiocare
 * tutto, si vuole ripartire dalla scelta da discutere.
 */
export default function ArchivioPage() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const [mani, setMani] = useState<SavedHand[] | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    getSavedHands().then((m) => { if (vivo) setMani(m); });
    return () => { vivo = false; };
  }, [user, loading]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Riservato agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/archivio" className="underline">{t("Accedi")}</Link>.
        </p>
      </div>
    );
  }

  const elimina = async (id: string) => {
    if (await deleteSavedHand(id)) setMani(await getSavedHands());
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Archive className="w-6 h-6 text-figb" aria-hidden="true" />
          {t("Le tue mani")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ogni voce si riapre nel tavolo di studio esattamente dov&apos;era,
          carte già giocate comprese.
        </p>
      </header>

      {mani === null && <p className="text-sm text-muted-foreground">{t("Carico…")}</p>}

      {mani && mani.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold mb-1">{t("Nessuna mano salvata")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Dal tavolo di studio, quando arrivi al momento che vuoi discutere,
            dagli un nome e salvalo.
          </p>
          <Link href="/istruttori/studio">
            <Button>{t("Vai al tavolo di studio")}</Button>
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {(mani ?? []).map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h2 className="font-semibold">{m.titolo}</h2>
                <p className="text-xs text-muted-foreground">
                  {m.contract ?? "—"}
                  {m.declarer ? ` — dichiara ${ETICHETTA[m.declarer]}` : ""}
                  {" · "}
                  {m.played.length === 0
                    ? "dall'inizio"
                    : `dopo ${m.played.length} cart${m.played.length === 1 ? "a" : "e"}`}
                  {" · "}
                  {new Date(m.created_at).toLocaleDateString("it-IT", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/istruttori/studio?mano=${m.id}`}>
                  <Button variant="outline">{t("Riapri")}</Button>
                </Link>
                <button
                  onClick={() => elimina(m.id)}
                  aria-label={`Elimina ${m.titolo}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(["north", "east", "south", "west"] as Position[]).map((p) => (
                <div key={p} className="min-w-0">
                  <p className="text-xs font-bold text-muted-foreground">
                    {ETICHETTA[p]}{" "}
                    <span className="font-normal">{handHcp(m.hands[p] ?? [])} PO</span>
                  </p>
                  {SUITS.map((suit) => (
                    <p key={suit} className="text-xs font-mono flex items-center gap-1 whitespace-nowrap">
                      <SuitSymbol suit={suit} size="xs" />
                      {formatSuit(m.hands[p] ?? [], suit)}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {m.nota && <p className="text-sm text-muted-foreground mt-2">{m.nota}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join("") : "—";
}
