"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { handHcp } from "@/lib/deal-generator";
import {
  getOpenLiveTable,
  playLiveCard,
  statoDelGioco,
  watchLiveTable,
  type LiveTable,
} from "@/lib/live-table";
import { getValidCards, parseContract } from "@/lib/bridge-engine";
import { SondaggioAllievo } from "@/components/sondaggio-allievo";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

/**
 * Il tavolo condiviso, lato allievo.
 *
 * Si vede la propria mano e quelle che l'insegnante ha scoperto. Le altre non
 * sono nascoste dall'interfaccia: non arrivano proprio — il filtro sta dentro
 * il database (`live_table_view`), quindi aprire gli strumenti per
 * sviluppatori non serve a nulla. È l'unica difesa che regge in una classe.
 *
 * Chi non ha ancora un posto assegnato vede solo ciò che è scoperto per tutti:
 * è la situazione normale all'inizio della lezione, non un errore.
 */
export default function TavoloAllievoPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);
  const { user, loading } = useSharedAuth();
  const [tableId, setTableId] = useState<string | null>(null);
  const [stato, setStato] = useState<LiveTable | null>(null);
  const [cercato, setCercato] = useState(false);
  const [errore, setErrore] = useState("");

  /**
   * Si RICHIEDE finché un tavolo non c'è.
   *
   * La pagina dice «puoi lasciare la pagina aperta», e prima non era vero:
   * questo effetto girava una volta sola al montaggio, e il realtime ascolta
   * solo gli UPDATE di un tavolo che si conosce già — l'INSERT di un tavolo
   * nuovo non lo sentiva nessuno. Chi apriva la pagina prima dell'insegnante
   * restava su «nessun tavolo aperto» per sempre.
   *
   * Ogni otto secondi, e solo finché non si è trovato: appena c'è il tavolo
   * subentra il canale realtime e questo si ferma.
   */
  useEffect(() => {
    if (tableId) return;
    let vivo = true;
    const cerca = () => {
      void getOpenLiveTable(classId)
        .then((id) => {
          if (!vivo) return;
          if (id) setTableId(id);
        })
        .finally(() => {
          if (vivo) setCercato(true);
        });
    };
    cerca();
    const t = setInterval(cerca, 8000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [classId, tableId]);

  useEffect(() => {
    if (!tableId) return;
    return watchLiveTable(tableId, setStato);
  }, [tableId]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href={`/login?redirect=/classi/${classId}/tavolo`} className="underline">{t("Accedi")}</Link>{" "}
          per vedere il tavolo della tua classe.
        </p>
      </div>
    );
  }

  if (cercato && !tableId) {
    return (
      <div className="min-h-screen px-4 py-16 max-w-md mx-auto text-center">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold font-display mb-2">{t("Nessun tavolo aperto")}</h1>
        <p className="text-sm text-muted-foreground">
          Quando l&apos;insegnante apre il tavolo, la mano comparirà qui da sola:
          puoi lasciare la pagina aperta.
        </p>
      </div>
    );
  }

  const visibili = (Object.keys(stato?.hands ?? {}) as Position[]).filter(
    (p) => (stato?.hands[p]?.length ?? 0) > 0
  );

  // Turno e presa in corso si ricavano dalle carte giocate: il database
  // conserva solo quelle, le regole stanno in un posto solo.
  const trump = stato?.contract ? parseContract(stato.contract).trumpSuit : null;
  const gioco = stato?.declarer
    ? statoDelGioco(stato.played ?? [], stato.declarer, trump)
    : null;
  const tocca = gioco?.turno === stato?.seat && stato?.seat != null;
  const miePlayable = tocca && stato?.seat
    ? getValidCards(stato.hands[stato.seat] ?? [], gioco?.presaCorrente ?? [])
    : [];
  const playableSet = new Set(miePlayable.map((c) => `${c.suit}-${c.rank}`));

  const gioca = async (carta: Card) => {
    if (!tableId) return;
    setErrore("");
    const esito = await playLiveCard(tableId, carta);
    if (!esito.ok) setErrore(esito.errore ?? "Carta non giocabile.");
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <header className="mb-4 text-center">
        <h1 className="text-xl font-bold font-display">{stato?.titolo ?? "Tavolo della classe"}</h1>
        {stato?.seat ? (
          <p className="text-sm text-muted-foreground mt-1">
            {t("Sei")}<strong>{ETICHETTA[stato.seat]}</strong>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Non hai ancora un posto: vedi le mani che l&apos;insegnante scopre.
          </p>
        )}
      </header>

      {/*
        Il sondaggio sta QUI e non solo nella pagina della classe: durante la
        lezione l'allievo è al tavolo, e una domanda che compare da un'altra
        parte è una domanda a cui non risponde nessuno.
      */}
      <SondaggioAllievo classId={classId} />

      {stato?.contract && (
        <p className="text-center text-lg font-bold text-figb mb-4">
          {stato.contract}
          {stato.declarer ? ` — dichiara ${ETICHETTA[stato.declarer]}` : ""}
        </p>
      )}

      {gioco && (
        <div className="rounded-2xl border border-border bg-card p-3 mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Presa {gioco.prese.length + 1} · Nord-Sud {gioco.preseNs} · Est-Ovest {gioco.preseEw}
          </p>
          <div className="flex items-center justify-center gap-3 min-h-[2rem]">
            {gioco.presaCorrente.map((p, i) => (
              <span key={i} className="text-lg font-mono flex items-center gap-1">
                <SuitSymbol suit={p.card.suit} size="xs" />
                {p.card.rank}
              </span>
            ))}
            {gioco.presaCorrente.length === 0 && (
              <span className="text-xs text-muted-foreground">presa nuova</span>
            )}
          </div>
          <p className="text-sm font-semibold mt-1">
            {tocca ? "Tocca a te" : `Gioca ${ETICHETTA[gioco.turno]}`}
          </p>
        </div>
      )}

      {errore && <p className="text-sm text-destructive text-center mb-3">{errore}</p>}

      {visibili.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          L&apos;insegnante non ha ancora scoperto nessuna mano.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibili.map((p) => (
            <div
              key={p}
              className={`rounded-2xl border-2 p-4 ${
                p === stato?.seat ? "border-figb bg-figb/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-bold text-lg">
                  {ETICHETTA[p]}
                  {p === stato?.seat && (
                    <span className="ml-2 text-xs font-semibold text-figb">la tua mano</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {handHcp(stato?.hands[p] ?? [])} PO
                </span>
              </div>
              {SUITS.map((suit) => {
                const delSeme = (stato?.hands[p] ?? [])
                  .filter((c) => c.suit === suit)
                  .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
                if (delSeme.length === 0) {
                  return (
                    <p key={suit} className="text-xl font-mono flex items-center gap-2 leading-snug">
                      <SuitSymbol suit={suit} size="sm" />—
                    </p>
                  );
                }
                return (
                  <div key={suit} className="flex items-center gap-2 flex-wrap leading-snug">
                    <SuitSymbol suit={suit} size="sm" />
                    {delSeme.map((c) => {
                      const mia = p === stato?.seat;
                      const giocabile = mia && playableSet.has(`${c.suit}-${c.rank}`);
                      return (
                        <button
                          key={`${c.suit}-${c.rank}`}
                          disabled={!giocabile}
                          onClick={() => gioca(c)}
                          className={`text-xl font-mono px-1 rounded ${
                            giocabile
                              ? "bg-figb/10 hover:bg-figb/20 border border-figb/40"
                              : mia ? "opacity-50" : ""
                          }`}
                        >
                          {c.rank}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6">
        La pagina si aggiorna da sola quando l&apos;insegnante cambia mano.
      </p>
    </div>
  );
}
