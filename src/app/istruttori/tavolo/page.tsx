"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Users, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { getMyClasses, type ClassRoom } from "@/lib/instructors";
import {
  closeLiveTable,
  getOpenLiveTable,
  openLiveTable,
  setLiveHands,
  setRevealed,
  setShowContract,
  watchLiveTable,
  type LiveTable,
} from "@/lib/live-table";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const SEATS: { key: Position; label: string }[] = [
  { key: "north", label: "Nord" },
  { key: "east", label: "Est" },
  { key: "south", label: "Sud" },
  { key: "west", label: "Ovest" },
];

/**
 * Il tavolo condiviso, lato insegnante.
 *
 * Qui si vedono tutte e quattro le mani e si decide cosa vede la classe. Ogni
 * comando è una scrittura sul database: gli allievi collegati la ricevono
 * subito, senza dover ricaricare nulla.
 *
 * Le mani coperte non arrivano affatto ai loro browser — il filtro è dentro il
 * database, non qui. Vedi `src/lib/live-table.ts`.
 */
export default function TavoloPage() {
  return (
    <Suspense fallback={null}>
      <Tavolo />
    </Suspense>
  );
}

function Tavolo() {
  const { user, loading } = useSharedAuth();
  const params = useSearchParams();

  const [classi, setClassi] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState(params.get("classe") ?? "");
  const [tableId, setTableId] = useState<string | null>(null);
  const [statoGrezzo, setStato] = useState<LiveTable | null>(null);
  const [modelloId, setModelloId] = useState(DEAL_TEMPLATES[0].id);
  const [seed, setSeed] = useState(2026);
  const [indice, setIndice] = useState(0);
  const [occupato, setOccupato] = useState(false);

  useEffect(() => {
    getMyClasses()
      .then((c) => {
        setClassi(c);
        setClassId((attuale) => attuale || c[0]?.id || "");
      })
      .catch((err) => reportError("tavolo:classi", err));
  }, []);

  useEffect(() => {
    if (!classId) return;
    getOpenLiveTable(classId).then(setTableId);
  }, [classId]);

  useEffect(() => {
    if (!tableId) return;
    return watchLiveTable(tableId, setStato);
  }, [tableId]);

  // Chiuso il tavolo, lo stato precedente non va azzerato dentro un effetto:
  // si ignora e basta. Un `setState` in effetto qui produrrebbe un render in
  // più e il lint del progetto lo vieta, con ragione.
  const stato = tableId ? statoGrezzo : null;

  const modello = DEAL_TEMPLATES.find((t) => t.id === modelloId) ?? DEAL_TEMPLATES[0];
  const mani = useMemo(
    () => generateDeals(modello.constraints, { count: 8, seed }).deals,
    [modello, seed]
  );

  const apri = useCallback(async () => {
    if (!classId || !mani.length) return;
    setOccupato(true);
    const id = await openLiveTable({
      classId,
      hands: mani[0],
      titolo: `${modello.label} — mano 1`,
    });
    setIndice(0);
    setTableId(id);
    setOccupato(false);
  }, [classId, mani, modello.label]);

  const mandaMano = async (i: number) => {
    if (!tableId || !mani[i]) return;
    setIndice(i);
    await setLiveHands(tableId, mani[i], { titolo: `${modello.label} — mano ${i + 1}` });
  };

  const scopri = async (seat: Position) => {
    if (!tableId || !stato) return;
    const attuali = new Set(stato.revealed);
    if (attuali.has(seat)) attuali.delete(seat);
    else attuali.add(seat);
    await setRevealed(tableId, [...attuali]);
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Riservato agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/tavolo" className="underline">Accedi</Link>.
        </p>
      </div>
    );
  }

  const manoCorrente = stato?.hands ?? mani[indice];

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Users className="w-6 h-6 text-figb" aria-hidden="true" />
          Tavolo condiviso
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tu vedi tutte e quattro le mani. Gli allievi vedono solo la propria,
          e le altre quando le scopri tu.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="classe" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Classe
          </label>
          <select
            id="classe"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setTableId(null); }}
            className="h-11 px-3 rounded-xl border border-border bg-card text-sm min-w-[12rem]"
          >
            {classi.length === 0 && <option value="">Nessuna classe</option>}
            {classi.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="argomento" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Argomento
          </label>
          <select
            id="argomento"
            value={modelloId}
            onChange={(e) => setModelloId(e.target.value)}
            className="h-11 px-3 rounded-xl border border-border bg-card text-sm"
          >
            {DEAL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>Altre mani</Button>

        {!tableId ? (
          <Button disabled={!classId || occupato} onClick={apri}>
            <Play className="w-4 h-4 mr-1" aria-hidden="true" />
            {occupato ? "Apro…" : "Apri il tavolo"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={async () => { await closeLiveTable(tableId); setTableId(null); }}
          >
            <Square className="w-4 h-4 mr-1" aria-hidden="true" />
            Chiudi
          </Button>
        )}
      </div>

      {tableId && (
        <div className="rounded-2xl border border-figb/30 bg-figb/5 p-4 mb-5">
          <p className="text-sm font-medium mb-2">
            Il tavolo è aperto. Gli allievi lo trovano nella loro classe.
          </p>
          <div className="flex flex-wrap gap-2">
            {mani.map((_, i) => (
              <Button
                key={i}
                variant={i === indice ? "default" : "outline"}
                onClick={() => mandaMano(i)}
              >
                Mano {i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Il tavolo: Nord in alto, Sud in basso, Ovest ed Est ai lati. */}
      <div className="grid grid-cols-3 gap-3">
        <div />
        <Posto seat="north" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} />
        <div />
        <Posto seat="west" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} />
        <div className="flex items-center justify-center">
          <div className="rounded-2xl border-2 border-dashed border-border w-full h-full min-h-[7rem]" aria-hidden="true" />
        </div>
        <Posto seat="east" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} />
        <div />
        <Posto seat="south" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} />
        <div />
      </div>

      {tableId && stato && (
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <Button onClick={() => setRevealed(tableId, SEATS.map((s) => s.key))}>
            <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
            Scopri tutte alla classe
          </Button>
          <Button variant="outline" onClick={() => setRevealed(tableId, [])}>
            <EyeOff className="w-4 h-4 mr-1" aria-hidden="true" />
            Ricopri
          </Button>
          <Button variant="outline" onClick={() => setShowContract(tableId, !stato.showContract)}>
            {stato.showContract ? "Nascondi il contratto" : "Mostra il contratto"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Un posto al tavolo.
 *
 * L'insegnante lo vede sempre; il riquadro dice se in quel momento lo vede
 * anche la classe. È l'informazione che serve mentre si parla: «questa
 * l'hanno davanti anche loro».
 */
function Posto({
  seat,
  hands,
  stato,
  onToggle,
  attivo,
}: {
  seat: Position;
  hands: Partial<Record<Position, Card[]>> | undefined;
  stato: LiveTable | null;
  onToggle: (s: Position) => void;
  attivo: boolean;
}) {
  const etichetta = SEATS.find((s) => s.key === seat)!.label;
  const cards = hands?.[seat] ?? [];
  const vistaDaTutti = stato?.revealed.includes(seat) ?? false;

  return (
    <div
      className={`rounded-2xl border-2 p-3 ${
        vistaDaTutti ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-border bg-card"
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-bold">{etichetta}</span>
        <span className="text-xs text-muted-foreground">{handHcp(cards)} PO</span>
      </div>
      {SUITS.map((suit) => (
        <p key={suit} className="text-base font-mono flex items-center gap-1.5 leading-snug">
          <SuitSymbol suit={suit} size="xs" />
          {formatSuit(cards, suit)}
        </p>
      ))}
      {attivo && (
        <button
          onClick={() => onToggle(seat)}
          className="mt-2 w-full text-xs font-semibold rounded-lg border border-border py-1.5 hover:bg-muted"
          aria-pressed={vistaDaTutti}
        >
          {vistaDaTutti ? "La classe la vede" : "Mostra alla classe"}
        </button>
      )}
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
