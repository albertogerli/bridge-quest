"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ChevronLeft, ChevronRight, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { getAssignment } from "@/lib/instructors";
import type { Smazzata } from "@/lib/catalog";
import { ComandoProiezione } from "@/components/istruttori/comando-proiezione";
import { PannelloDivisioni } from "@/components/bridge/pannello-divisioni";
import { PannelloMinibridge } from "@/components/bridge/pannello-minibridge";
import { PulsanteSegnalazione } from "@/components/pulsante-segnalazione";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const SEATS: { key: Position; label: string; tasto: string }[] = [
  { key: "north", label: "Nord", tasto: "n" },
  { key: "east", label: "Est", tasto: "e" },
  { key: "south", label: "Sud", tasto: "s" },
  { key: "west", label: "Ovest", tasto: "o" },
];

interface Mano {
  hands: Record<Position, Card[]>;
  titolo: string;
  /** Contratto e dichiarante: fanno parte della soluzione, restano coperti. */
  soluzione?: string;
}

/**
 * Lavagna da proiettare.
 *
 * PERCHÉ NON BASTAVA UNA PAGINA QUALSIASI
 * In aula il proiettore è lontano e la sala è illuminata: quello che si legge
 * benissimo su un telefono a trenta centimetri sparisce a otto metri. Qui le
 * carte sono grandi, il contrasto è massimo e non c'è nient'altro sullo
 * schermo — niente barra di navigazione, niente punteggi, niente inviti a
 * giocare.
 *
 * E soprattutto: OGNI MANO SI SCOPRE SEPARATAMENTE. Il senso dell'esercizio in
 * aula è mostrare quello che l'allievo vedrebbe al tavolo e non un dito di
 * più; una lavagna che mostra tutto subito è una soluzione, non un esercizio.
 * Anche il contratto resta coperto finché non lo si chiede.
 *
 * I comandi hanno una scorciatoia da tastiera perché l'insegnante parla
 * guardando la classe, non lo schermo: N/E/S/O scoprono un posto, T tutto,
 * C il contratto, frecce per cambiare mano.
 */
export default function LavagnaPage() {
  return (
    <Suspense fallback={null}>
      <Lavagna />
    </Suspense>
  );
}

function Lavagna() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const params = useSearchParams();
  const compitoId = params.get("compito");

  const [indice, setIndice] = useState(0);
  const [scoperti, setScoperti] = useState<Set<Position>>(new Set());
  const [soluzioneVisibile, setSoluzioneVisibile] = useState(false);
  const [daCompito, setDaCompito] = useState<Mano[] | null>(null);
  const [modelloId, setModelloId] = useState(DEAL_TEMPLATES[0].id);
  const [seed, setSeed] = useState(2026);
  const [divisioniVisibili, setDivisioniVisibili] = useState(false);
  /**
   * Le prime lezioni del Corso Fiori si fanno senza dichiarazione: acceso
   * questo, la lavagna smette di parlare di contratto e mostra i punti delle
   * due linee, chi gioca e quante prese dice la tabella. È una modalità della
   * lavagna, non un'altra pagina — chi sta spiegando non deve andare altrove.
   */
  const [minibridge, setMinibridge] = useState(false);

  useEffect(() => {
    if (!compitoId) return;
    getAssignment(compitoId)
      .then((a) => {
        const mani = (a.custom_hands ?? []).map(
          (s: Smazzata): Mano => ({
            hands: s.hands,
            titolo: s.title,
            soluzione: `${s.contract} — dichiara ${nomePosto(s.declarer)}`,
          })
        );
        setDaCompito(mani);
      })
      .catch((err) => reportError("lavagna:compito", err));
  }, [compitoId]);

  const generate = useMemo<Mano[]>(() => {
    const modello = DEAL_TEMPLATES.find((t) => t.id === modelloId) ?? DEAL_TEMPLATES[0];
    const { deals } = generateDeals(modello.constraints, { count: 8, seed });
    return deals.map((d, i) => ({ hands: d, titolo: `${modello.label} — mano ${i + 1}` }));
  }, [modelloId, seed]);

  const mani = daCompito && daCompito.length > 0 ? daCompito : generate;
  const mano = mani[Math.min(indice, mani.length - 1)];

  const scopri = useCallback((seat: Position) => {
    setScoperti((prev) => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else next.add(seat);
      return next;
    });
  }, []);

  const cambiaMano = useCallback(
    (delta: number) => {
      setIndice((i) => Math.max(0, Math.min(mani.length - 1, i + delta)));
      // Ogni mano riparte coperta: è il punto della lavagna.
      setScoperti(new Set());
      setSoluzioneVisibile(false);
    },
    [mani.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const seat = SEATS.find((s) => s.tasto === k);
      if (seat) { scopri(seat.key); return; }
      if (k === "t") { setScoperti(new Set(SEATS.map((s) => s.key))); return; }
      if (k === "x") { setScoperti(new Set()); setSoluzioneVisibile(false); return; }
      if (k === "c") { setSoluzioneVisibile((v) => !v); return; }
      if (e.key === "ArrowRight") cambiaMano(1);
      if (e.key === "ArrowLeft") cambiaMano(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scopri, cambiaMano]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Riservato agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/lavagna" className="underline">{t("Accedi")}</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-4">
      <header className="flex flex-wrap items-center gap-2 mb-4">
        <h1 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mr-auto">
          <Presentation className="w-4 h-4" aria-hidden="true" />
          {t("Lavagna")}
        </h1>

        {!compitoId && (
          <>
            <select
              aria-label={t("Argomento")}
              value={modelloId}
              onChange={(e) => { setModelloId(e.target.value); setIndice(0); setScoperti(new Set()); }}
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm"
            >
              {DEAL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => { setSeed((s) => s + 1); setIndice(0); setScoperti(new Set()); }}>
              {t("Altre mani")}
            </Button>
          </>
        )}

        <Button variant="outline" onClick={() => cambiaMano(-1)} aria-label={t("Mano precedente")}>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
        <span className="text-sm font-semibold tabular-nums px-1">
          {Math.min(indice + 1, mani.length)} / {mani.length}
        </span>
        <Button variant="outline" onClick={() => cambiaMano(1)} aria-label={t("Mano successiva")}>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </header>

      <p className="text-center text-xl font-bold font-display mb-4">{mano?.titolo}</p>

      {/* Disposizione del tavolo: Nord in alto, Sud in basso, Ovest ed Est ai
          lati. È l'unica forma in cui un giocatore legge una smazzata. */}
      <div className="grid grid-cols-3 gap-3 max-w-5xl mx-auto">
        <div />
        <Casella seat="north" mano={mano} scoperti={scoperti} onToggle={scopri} />
        <div />

        <Casella seat="west" mano={mano} scoperti={scoperti} onToggle={scopri} />
        <div className="flex items-center justify-center">
          <div className="rounded-2xl border-2 border-dashed border-border w-full h-full min-h-[8rem]" aria-hidden="true" />
        </div>
        <Casella seat="east" mano={mano} scoperti={scoperti} onToggle={scopri} />

        <div />
        <Casella seat="south" mano={mano} scoperti={scoperti} onToggle={scopri} />
        <div />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <Button onClick={() => setScoperti(new Set(SEATS.map((s) => s.key)))}>
          <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
          {t("Scopri tutte")}
        </Button>
        <Button variant="outline" onClick={() => { setScoperti(new Set()); setSoluzioneVisibile(false); }}>
          <EyeOff className="w-4 h-4 mr-1" aria-hidden="true" />
          {t("Copri tutto")}
        </Button>
        {mano?.soluzione && (
          <Button variant="outline" onClick={() => setSoluzioneVisibile((v) => !v)}>
            {soluzioneVisibile ? "Nascondi il contratto" : "Mostra il contratto"}
          </Button>
        )}
        <Button variant="outline" onClick={() => setDivisioniVisibili((v) => !v)}>
          {divisioniVisibili ? "Nascondi le divisioni" : "Divisioni dei semi"}
        </Button>
        <Button variant={minibridge ? "default" : "outline"} onClick={() => setMinibridge((v) => !v)}>
          {t("Minibridge")}
        </Button>
        <ComandoProiezione
          mani={mano?.hands ?? {}}
          titolo={mano?.titolo}
          doppioMorto={soluzioneVisibile ? mano?.soluzione : null}
          scopertiEsterni={[...scoperti]}
        />
      </div>

      {minibridge && mano && (
        <div className="mx-auto mt-6 max-w-2xl">
          <PannelloMinibridge mani={mano.hands} />
        </div>
      )}

      {/*
        Il pannello guarda solo le mani SCOPERTE, non tutte e quattro: è il conto
        che farebbe un giocatore seduto al tavolo, ed è quello che si vuole far
        vedere. Con tutte scoperte non ci sarebbe niente da stimare.
      */}
      {divisioniVisibili && mano && (
        <div className="mx-auto mt-6 max-w-2xl">
          <PannelloDivisioni
            noti={Object.fromEntries(
              (Object.keys(mano.hands) as Position[])
                .filter((p) => scoperti.has(p))
                .map((p) => [p, mano.hands[p]]),
            )}
            avversari={["west", "east"]}
          />
        </div>
      )}

      {soluzioneVisibile && mano?.soluzione && (
        <p className="text-center text-2xl font-bold text-figb mt-4">{mano.soluzione}</p>
      )}

      <PulsanteSegnalazione zona="lavagna" contestoExtra={{ smazzataId: mano?.titolo ?? null }} />

      <p className="text-center text-xs text-muted-foreground mt-6">
        {t("Tastiera:")} <strong>N</strong> <strong>E</strong> <strong>S</strong> <strong>O</strong> scoprono un posto ·{" "}
        <strong>T</strong> tutte · <strong>X</strong> copri · <strong>C</strong> contratto · frecce per cambiare mano
      </p>
    </div>
  );
}

/** Una mano nella sua casella: coperta finché l'insegnante non la scopre. */
function Casella({
  seat,
  mano,
  scoperti,
  onToggle,
}: {
  seat: Position;
  mano: Mano | undefined;
  scoperti: Set<Position>;
  onToggle: (s: Position) => void;
}) {
  const etichetta = SEATS.find((s) => s.key === seat)!.label;
  const visibile = scoperti.has(seat);
  const cards = mano?.hands[seat] ?? [];

  return (
    <button
      onClick={() => onToggle(seat)}
      aria-pressed={visibile}
      aria-label={`${etichetta}: ${visibile ? "scoperta" : "coperta"}`}
      className="text-left rounded-2xl border-2 border-border bg-card p-4 min-h-[8rem] hover:border-figb/50 transition-colors"
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-lg font-bold">{etichetta}</span>
        {visibile && (
          <span className="text-sm text-muted-foreground">{handHcp(cards)} PO</span>
        )}
      </div>

      {visibile ? (
        SUITS.map((suit) => (
          <p key={suit} className="text-2xl font-mono flex items-center gap-2 leading-snug">
            <SuitSymbol suit={suit} size="sm" />
            {formatSuit(cards, suit)}
          </p>
        ))
      ) : (
        <p className="text-muted-foreground text-lg py-6 text-center">coperta</p>
      )}
    </button>
  );
}

function nomePosto(p: Position): string {
  return SEATS.find((s) => s.key === p)?.label ?? p;
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
