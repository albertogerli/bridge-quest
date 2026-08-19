"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useFriends } from "@/hooks/use-friends";
import { Asta } from "@/components/bridge/asta";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { generateDeals, handHcp } from "@/lib/deal-generator";
import {
  apriLicita, contrattoFinale, dichiara, leggiLicita, mieLicite,
  turnoDi, type RigaElenco, type SessioneLicita,
} from "@/lib/licita-a-due";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

/**
 * Licita con un amico, avversari BEN.
 *
 * ASINCRONA, ed è la scelta che conta: dichiari quando puoi, il tuo compagno
 * risponde quando può. Chiedere a due persone di trovarsi online nello stesso
 * momento è già metà della rinuncia, e i nostri iscritti hanno in media
 * cinquant'anni.
 *
 * Vedi solo la TUA mano — nemmeno quella del compagno, perché l'esercizio è
 * proprio intendersi senza vederla. Il filtro è nel database: qui non c'è
 * niente da nascondere perché non arriva niente da nascondere.
 *
 * Le dichiarazioni degli avversari le calcola BEN nel browser di chi ha appena
 * parlato, e vengono inviate come dichiarazioni di quel posto.
 */
export default function LicitaAmicoPage() {
  return (
    <Suspense fallback={null}>
      <LicitaAmico />
    </Suspense>
  );
}

function LicitaAmico() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const params = useSearchParams();
  const router = useRouter();
  const idAperta = params.get("s");

  const { friends } = useFriends();
  const [elenco, setElenco] = useState<RigaElenco[] | null>(null);
  const [sessione, setSessione] = useState<SessioneLicita | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState("");
  // Il seme si estrae una volta al montaggio: `Date.now()` nel corpo del
  // componente sarebbe una funzione impura chiamata durante il render, e a
  // ogni ri-render darebbe mani diverse.
  const [seme, setSeme] = useState(() => Math.floor(Date.now() % 1_000_000));

  const ricarica = useCallback(async () => {
    if (idAperta) setSessione(await leggiLicita(idAperta));
    else setElenco(await mieLicite());
  }, [idAperta]);

  /**
   * All'apertura, se la licita è ferma sul turno di un avversario la si
   * sblocca.
   *
   * PERCHÉ PUÒ RESTARE FERMA. Gli avversari li fa dichiarare il server, ma
   * qualcuno deve chiederglielo, e a chiederlo è il browser di chi ha appena
   * parlato. Se quel browser si chiude nel mezzo — schermo bloccato, rete che
   * cade, scheda chiusa — la licita resta lì per sempre, in attesa di un robot
   * che nessuno ha svegliato. È il difetto peggiore possibile in una funzione
   * asincrona: non dà errori, semplicemente non succede più niente.
   */
  useEffect(() => {
    if (loading || !user) return;
    let vivo = true;
    (idAperta ? leggiLicita(idAperta) : mieLicite())
      .then(async (r) => {
        if (!vivo) return;
        if (!idAperta) { setElenco(r as RigaElenco[]); return; }

        const s = r as SessioneLicita | null;
        setSessione(s);
        if (!s || s.chiusa || s.turno === "north" || s.turno === "south") return;

        await fetch("/api/licita/avversario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: s.id }),
        }).catch((err) => reportError("licita-amico:sblocca", err));
        const aggiornata = await leggiLicita(idAperta);
        if (vivo) setSessione(aggiornata);
      })
      .catch((err) => reportError("licita-amico:carica", err));
    return () => { vivo = false; };
  }, [idAperta, user, loading]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login?redirect=/gioca/licita-amico" className="underline">{t("Accedi")}</Link>{" "}
          per licitare con un amico.
        </p>
      </div>
    );
  }

  // ── Una licita aperta ────────────────────────────────────────────────────
  if (idAperta) {
    if (!sessione) {
      return (
        <div className="min-h-screen px-4 py-16 max-w-md mx-auto text-center">
          <p className="text-sm text-muted-foreground">{t("Licita non trovata.")}</p>
          <Link href="/gioca/licita-amico" className="text-sm underline">{t("Torna all'elenco")}</Link>
        </div>
      );
    }

    const mia = sessione.hands[sessione.seat] ?? [];
    const tocca = sessione.turno === sessione.seat && !sessione.chiusa;
    const contratto = contrattoFinale(sessione.bids);

    const invia = async (bid: string) => {
      setAttesa(true);
      setErrore("");
      const r = await dichiara(sessione.id, bid);
      if (!r.ok) {
        setErrore(r.errore ?? "Non è stato possibile dichiarare.");
        setAttesa(false);
        return;
      }
      // Gli avversari li fa dichiarare il SERVER: le loro mani non arrivano
      // qui, ed è tutto il punto — se arrivassero, i due amici potrebbero
      // leggerle e la licita non varrebbe niente.
      try {
        await fetch("/api/licita/avversario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessione.id }),
        });
      } catch (err) {
        reportError("licita-amico:avversari", err);
      }
      await ricarica();
      setAttesa(false);
    };

    return (
      <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
        <Link href="/gioca/licita-amico" className="text-sm text-muted-foreground hover:underline">
          ← Le tue licite
        </Link>

        <div className="rounded-2xl border border-border bg-card p-5 my-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary">Sei {ETICHETTA[sessione.seat]}</Badge>
            <span className="text-xs text-muted-foreground">{handHcp(mia)} PO</span>
          </div>
          {SUITS.map((suit) => (
            <p key={suit} className="text-lg font-mono flex items-center gap-2">
              <SuitSymbol suit={suit} size="sm" />
              {formatSuit(mia, suit)}
            </p>
          ))}
        </div>

        <div className="mb-4">
          <Asta
            dealer={sessione.dealer}
            bids={sessione.bids}
            ioSono={sessione.seat}
            onDichiara={tocca ? invia : undefined}
            disabilitato={attesa}
          />
        </div>

        {errore && <p className="text-sm text-destructive mb-3">{errore}</p>}

        {sessione.chiusa ? (
          <div className="rounded-2xl border border-figb/30 bg-figb/5 p-4">
            <p className="font-semibold mb-2">
              {contratto ? `Contratto: ${contratto}` : "Passo generale"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Ora si vedono tutte le mani: guardate insieme se il contratto era quello giusto.")}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {(["north", "east", "south", "west"] as Position[]).map((p) => (
                <div key={p}>
                  <p className="text-xs font-bold text-muted-foreground mb-0.5">
                    {ETICHETTA[p]} <span className="font-normal">{handHcp(sessione.hands[p] ?? [])} PO</span>
                  </p>
                  {SUITS.map((suit) => (
                    <p key={suit} className="text-xs font-mono flex items-center gap-1">
                      <SuitSymbol suit={suit} size="xs" />
                      {formatSuit(sessione.hands[p] ?? [], suit)}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : tocca ? (
          <p className="text-sm font-semibold text-center py-2">{t("Tocca a te")}</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Tocca a {ETICHETTA[sessione.turno]}. Puoi chiudere la pagina: quando
            il tuo compagno avrà dichiarato, la troverai qui.
          </p>
        )}
      </div>
    );
  }

  // ── Elenco ───────────────────────────────────────────────────────────────
  /** Apre una licita nuova e restituisce dove andare. */
  const nuova = async (partnerId: string): Promise<string | null> => {
    setAttesa(true);
    const { deals } = generateDeals({}, { count: 1, seed: seme });
    // Il prossimo invito avrà mani diverse.
    setSeme((s) => s + 7919);
    const id = await apriLicita({ partnerId, hands: deals[0], dealer: "south" });
    setAttesa(false);
    if (!id) setErrore("Non è stato possibile aprire la licita.");
    return id;
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Users className="w-6 h-6 text-figb" aria-hidden="true" />
          {t("Licita con un amico")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Ognuno vede solo la propria mano e dichiara quando può. Agli avversari pensa il computer.")}
        </p>
      </header>

      {errore && <p className="text-sm text-destructive mb-3">{errore}</p>}

      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {t("Invita un amico")}
      </h2>
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-6">
          Non hai ancora amici sulla piattaforma.{" "}
          <Link href="/amici" className="underline">{t("Trovane uno")}</Link> e potrete
          licitare insieme.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {friends.map((f) => {
            const altro = f.user_id === user.id ? f.friend_id : f.user_id;
            return (
              <Button
                key={f.id}
                variant="outline"
                disabled={attesa}
                onClick={async () => {
                  const id = await nuova(altro);
                  if (id) router.push(`/gioca/licita-amico?s=${id}`);
                }}
              >
                {f.profile?.display_name ?? "Amico"}
              </Button>
            );
          })}
        </div>
      )}

      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {t("Le tue licite")}
      </h2>
      {elenco === null && <p className="text-sm text-muted-foreground">{t("Carico…")}</p>}
      {elenco?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("Nessuna licita aperta.")}</p>
      )}
      <ul className="space-y-2">
        {(elenco ?? []).map((r) => {
          const tuo = !r.chiusa && turnoDi(r.dealer, r.bids) === r.seat;
          return (
            <li key={r.id}>
              <Link
                href={`/gioca/licita-amico?s=${r.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">
                    Con {r.compagno ?? "un amico"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.chiusa
                      ? `Chiusa · ${contrattoFinale(r.bids) ?? "passo generale"}`
                      : `${r.bids.length} dichiarazioni`}
                  </p>
                </div>
                {tuo && (
                  <span className="text-xs font-bold text-foreground bg-gold/25 rounded-full px-2 py-0.5 shrink-0">
                    {t("Tocca a te")}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
