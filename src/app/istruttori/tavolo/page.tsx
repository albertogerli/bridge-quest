"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Users, Play, Square, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { getValidCards, parseContract } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { calcTableAndPar } from "@/lib/dds-table";
import { parAssignmentFromContracts } from "@/lib/par-contract";
import {
  createAssignment,
  getClassDetail,
  getMyClasses,
  type ClassMember,
  type ClassRoom,
} from "@/lib/instructors";
import {
  closeLiveTable,
  getOpenLiveTable,
  openLiveTable,
  setLiveHands,
  setRevealed,
  playLiveCard,
  setContract,
  registraManoVista,
  maniViste,
  CONTRATTI,
  setSeats,
  setShowContract,
  statoDelGioco,
  undoLiveCard,
  watchLiveTable,
  type LiveTable,
} from "@/lib/live-table";
import { ComandoProiezione } from "@/components/istruttori/comando-proiezione";
import { PannelloDivisioni } from "@/components/bridge/pannello-divisioni";
import { PulsanteSegnalazione } from "@/components/pulsante-segnalazione";
import { SondaggioAula } from "@/components/istruttori/sondaggio-aula";
import { useT } from "@/contexts/traduzioni-provider";

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
  const t = useT();
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
  const [divisioniVisibili, setDivisioniVisibili] = useState(false);
  const [assegnando, setAssegnando] = useState(false);
  const [assegnato, setAssegnato] = useState("");
  const [allievi, setAllievi] = useState<ClassMember[]>([]);

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
    getClassDetail(classId)
      .then((d) => setAllievi(d.members.filter((m) => m.status === "active")))
      .catch((err) => reportError("tavolo:allievi", err));
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

  /**
   * IL CONTRATTO DEL TAVOLO, che prima non veniva mai impostato.
   *
   * `openLiveTable` e `setLiveHands` accettano contratto e dichiarante da
   * sempre, e nessuno dei due call site li passava: restavano `NULL`. Da lì in
   * poi `statoDelGioco` non partiva, `gioco` era sempre `null`, tutte le carte
   * erano disabilitate e il pannello del turno non compariva mai. Il gioco
   * carta per carta era tutto scritto — database, funzioni, interfaccia — e
   * irraggiungibile per un parametro mai passato.
   *
   * Si propone il PAR della mano, cioè il contratto in cui la smazzata va
   * giocata: è la risposta giusta alla domanda «cosa si dichiara qui», ed è già
   * quello che fa il tavolo di studio. L'insegnante lo cambia se vuole far
   * giocare altro — al tavolo didattico capita spesso, «proviamo a giocarla a
   * 4 cuori e vediamo cosa succede».
   *
   * Se il solver non risponde si va su 3SA da Sud: un contratto qualunque ma
   * giocabile è meglio di un tavolo su cui non si può muovere una carta.
   */
  const contrattoDellaMano = useCallback(async (deal: Record<Position, Card[]>) => {
    try {
      const { table, par } = await calcTableAndPar(deal, "north", "none");
      const a = parAssignmentFromContracts(par.contracts, table, deal);
      if (a) return a;
    } catch (err) {
      reportError("tavolo:par", err);
    }
    return { contract: "3SA", declarer: "south" as Position };
  }, []);

  const apri = useCallback(async () => {
    if (!classId || !mani.length) return;
    setOccupato(true);
    const scelto = await contrattoDellaMano(mani[0]);
    const id = await openLiveTable({
      classId,
      hands: mani[0],
      titolo: `${modello.label} — mano 1`,
      contract: scelto.contract,
      declarer: scelto.declarer,
    });
    setIndice(0);
    setTableId(id);
    if (id) {
      await registraManoVista(id, {
        hands: mani[0],
        titolo: `${modello.label} — mano 1`,
        contract: scelto.contract,
        declarer: scelto.declarer,
      });
    }
    setOccupato(false);
  }, [classId, mani, modello.label, contrattoDellaMano]);

  const mandaMano = async (i: number) => {
    if (!tableId || !mani[i]) return;
    setIndice(i);
    setOccupato(true);
    const scelto = await contrattoDellaMano(mani[i]);
    await setLiveHands(tableId, mani[i], {
      titolo: `${modello.label} — mano ${i + 1}`,
      contract: scelto.contract,
      declarer: scelto.declarer,
    });
    await registraManoVista(tableId, {
      hands: mani[i],
      titolo: `${modello.label} — mano ${i + 1}`,
      contract: scelto.contract,
      declarer: scelto.declarer,
    });
    setOccupato(false);
  };

  const cambiaContratto = async (contract: string, declarer: Position) => {
    if (!tableId) return;
    await setContract(tableId, contract, declarer);
  };

  // I posti già assegnati arrivano dal tavolo stesso, così due insegnanti sullo
  // stesso tavolo vedono la stessa cosa.
  const postoDi = stato?.seatOf ?? {};

  const assegnaPosto = async (studentId: string, seat: string) => {
    if (!tableId) return;
    const next: Record<string, Position> = { ...postoDi };
    if (seat) next[studentId] = seat as Position;
    else delete next[studentId];
    await setSeats(tableId, next);
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
          <Link href="/login?redirect=/istruttori/tavolo" className="underline">{t("Accedi")}</Link>.
        </p>
      </div>
    );
  }

  const manoCorrente = stato?.hands ?? mani[indice];

  // Turno e presa in corso dalle carte giocate, con le stesse regole del resto
  // del gioco. L'insegnante gioca per CHIUNQUE: serve quando un allievo non sa
  // che fare o gli cade la connessione, ed è la differenza fra un tavolo
  // didattico e un tavolo da torneo.
  const trump = stato?.contract ? parseContract(stato.contract).trumpSuit : null;
  const gioco = stato?.declarer
    ? statoDelGioco(stato.played ?? [], stato.declarer, trump)
    : null;
  const giocabiliOra = gioco && stato
    ? getValidCards(stato.hands[gioco.turno] ?? [], gioco.presaCorrente)
    : [];
  const giocabiliSet = new Set(giocabiliOra.map((c) => `${c.suit}-${c.rank}`));

  /**
   * Le mani di oggi diventano il compito.
   *
   * IL CERCHIO SI CHIUDE QUI. Chi era in aula le rigioca a casa, e chi era
   * assente le riceve comunque — è il caso più frequente e oggi il meno
   * gestito: l'assente non perde la lezione, perde solo la spiegazione a voce.
   * Il compito va a TUTTA la classe, non ai presenti, e proprio per questo.
   *
   * Le mani vanno in `custom_hands` con un id proprio: non stanno nel catalogo,
   * sono quelle generate stasera per questa classe. Il commento è la nota che
   * l'insegnante ha già scritto sul titolo della mano.
   */
  const assegnaManiDiOggi = async () => {
    if (!tableId || !classId) return;
    setAssegnando(true);
    setAssegnato("");
    try {
      const viste = await maniViste(tableId);
      if (viste.length === 0) {
        setAssegnato("Non hai ancora mostrato nessuna mano.");
        return;
      }
      const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long" });
      const smazzate = viste.map((m, i) => ({
        id: `lezione-${tableId.slice(0, 8)}-${i}`,
        lesson: 0,
        board: i + 1,
        title: m.titolo ?? `Mano ${i + 1}`,
        contract: m.contract ?? "3SA",
        declarer: (m.declarer ?? "south") as Position,
        openingLead: m.hands.west?.[0] ?? m.hands.north[0],
        vulnerability: "none" as const,
        hands: m.hands,
      }));
      await createAssignment({
        classId,
        title: `Le mani della lezione del ${oggi}`,
        smazzataIds: smazzate.map((s) => s.id),
        customHands: smazzate,
        instructorNote: "Le mani che abbiamo visto insieme. Rigiocale quante volte vuoi.",
      });
      setAssegnato(`Assegnate ${smazzate.length} mani a tutta la classe.`);
    } catch (err) {
      reportError("tavolo:assegna-oggi", err);
      setAssegnato("Non sono riuscito ad assegnarle.");
    } finally {
      setAssegnando(false);
    }
  };

  const giocaPer = async (seat: Position, carta: Card) => {
    if (!tableId) return;
    await playLiveCard(tableId, carta, seat);
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Users className="w-6 h-6 text-figb" aria-hidden="true" />
          {t("Tavolo condiviso")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Tu vedi tutte e quattro le mani. Gli allievi vedono solo la propria, e le altre quando le scopri tu.")}
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="classe" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t("Classe")}
          </label>
          <select
            id="classe"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setTableId(null); }}
            className="h-11 px-3 rounded-xl border border-border bg-card text-sm min-w-[12rem]"
          >
            {classi.length === 0 && <option value="">{t("Nessuna classe")}</option>}
            {classi.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="argomento" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t("Argomento")}
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

        <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>{t("Altre mani")}</Button>

        {!tableId ? (
          <Button disabled={!classId || occupato} onClick={apri}>
            <Play className="w-4 h-4 mr-1" aria-hidden="true" />
            {occupato ? t("Apro…") : t("Apri il tavolo")}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={async () => { await closeLiveTable(tableId); setTableId(null); }}
          >
            <Square className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Chiudi")}
          </Button>
        )}
      </div>

      {tableId && (
        <div className="rounded-2xl border border-figb/30 bg-figb/5 p-4 mb-5">
          <p className="text-sm font-medium mb-2">
            {t("Il tavolo è aperto. Gli allievi lo trovano nella loro classe.")}
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

      {tableId && stato && allievi.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
            {t("Chi siede dove")}
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {t("Ogni allievo vede la mano del posto che gli assegni. Senza posto vede solo quello che scopri a tutti — ed è la situazione normale a inizio lezione, non un errore.")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {allievi.map((a) => (
              <div key={a.student_id} className="flex items-center gap-2">
                <span className="text-sm min-w-0 flex-1 truncate">
                  {a.display_name || "Allievo"}
                </span>
                <select
                  aria-label={`Posto di ${a.display_name || "allievo"}`}
                  value={postoDi[a.student_id] ?? ""}
                  onChange={(e) => assegnaPosto(a.student_id, e.target.value)}
                  className="h-9 px-2 rounded-lg border border-border bg-card text-xs"
                >
                  <option value="">nessun posto</option>
                  {SEATS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {gioco && tableId && (
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
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-sm font-semibold">
              Gioca {SEATS.find((s) => s.key === gioco.turno)?.label}
            </span>
            <Button variant="outline" onClick={() => undoLiveCard(tableId)}>
              <Undo2 className="w-4 h-4 mr-1" aria-hidden="true" />
              {t("Annulla l'ultima")}
            </Button>
          </div>
        </div>
      )}

      {/* Il tavolo: Nord in alto, Sud in basso, Ovest ed Est ai lati. */}
      <div className="grid grid-cols-3 gap-3">
        <div />
        <Posto seat="north" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} turno={gioco?.turno} giocabiliSet={giocabiliSet} onGioca={giocaPer} />
        <div />
        <Posto seat="west" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} turno={gioco?.turno} giocabiliSet={giocabiliSet} onGioca={giocaPer} />
        <div className="flex items-center justify-center">
          <div className="rounded-2xl border-2 border-dashed border-border w-full h-full min-h-[7rem]" aria-hidden="true" />
        </div>
        <Posto seat="east" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} turno={gioco?.turno} giocabiliSet={giocabiliSet} onGioca={giocaPer} />
        <div />
        <Posto seat="south" hands={manoCorrente} stato={stato} onToggle={scopri} attivo={!!tableId} turno={gioco?.turno} giocabiliSet={giocabiliSet} onGioca={giocaPer} />
        <div />
      </div>

      {tableId && stato && (
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <Button onClick={() => setRevealed(tableId, SEATS.map((s) => s.key))}>
            <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Scopri tutte alla classe")}
          </Button>
          <Button variant="outline" onClick={() => setRevealed(tableId, [])}>
            <EyeOff className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Ricopri")}
          </Button>
          <Button variant="outline" onClick={() => setShowContract(tableId, !stato.showContract)}>
            {stato.showContract ? t("Nascondi il contratto") : t("Mostra il contratto")}
          </Button>
          {classId && (
            <SondaggioAula
              classId={classId}
              giocabili={giocabiliOra}
              smazzataId={stato?.titolo ?? null}
            />
          )}
          <Button variant="outline" disabled={assegnando} onClick={() => void assegnaManiDiOggi()}>
            {assegnando ? t("Assegno…") : t("Assegna le mani di oggi")}
          </Button>
          <Button variant="outline" onClick={() => setDivisioniVisibili((v) => !v)}>
            {divisioniVisibili ? t("Nascondi le divisioni") : t("Divisioni dei semi")}
          </Button>
          {/*
            Alla proiezione va lo stato del tavolo, non quello del database: le
            mani che l'insegnante ha in mano sono le stesse, ma cosa la classe
            vede lo decide questo pannello e non `revealed`, che riguarda gli
            allievi collegati con il telefono.
          */}
          <ComandoProiezione
            mani={stato.hands}
            titolo={stato.titolo}
            giocate={stato.played}
            contratto={stato.contract}
            dichiarante={stato.declarer}
            scopertiEsterni={stato.revealed}
          />
        </div>
      )}

      {assegnato && (
        <p className="mx-auto mt-3 max-w-2xl rounded-lg border border-border bg-card p-3 text-center text-sm">
          {assegnato}
        </p>
      )}

      <PulsanteSegnalazione
        zona="tavolo"
        contestoExtra={{
          classId,
          contratto: stato?.contract ?? null,
          dichiarante: stato?.declarer ?? null,
          carteGiocate: stato?.played?.length ?? 0,
        }}
      />

      {divisioniVisibili && stato && (
        <div className="mx-auto mt-4 max-w-2xl">
          <PannelloDivisioni
            noti={stato.hands}
            giocate={stato.played}
            avversari={
              stato.declarer === "east" || stato.declarer === "west"
                ? ["north", "south"]
                : ["west", "east"]
            }
          />
        </div>
      )}

      {/*
        Il contratto si può cambiare in corsa: al tavolo didattico succede di
        continuo — «riproviamola a 4 cuori e vediamo cosa cambia». Il valore
        proposto è il par della mano, calcolato quando la mano è partita.
      */}
      {tableId && stato && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-card p-3">
          <span className="text-sm font-medium text-muted-foreground">{t("Si gioca")}</span>
          <select
            aria-label={t("Contratto")}
            value={stato.contract ?? ""}
            onChange={(e) => void cambiaContratto(e.target.value, stato.declarer ?? "south")}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {CONTRATTI.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">{t("giocato da")}</span>
          <select
            aria-label={t("Dichiarante")}
            value={stato.declarer ?? "south"}
            onChange={(e) => void cambiaContratto(stato.contract ?? "3SA", e.target.value as Position)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {SEATS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          {gioco && (
            <span className="text-xs text-muted-foreground">
              {t("Tocca a")} {SEATS.find((s) => s.key === gioco.turno)?.label}
            </span>
          )}
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
  seat, hands, stato, onToggle, attivo, turno, giocabiliSet, onGioca,
}: {
  seat: Position;
  hands: Partial<Record<Position, Card[]>> | undefined;
  stato: LiveTable | null;
  onToggle: (s: Position) => void;
  attivo: boolean;
  turno?: Position;
  giocabiliSet: Set<string>;
  onGioca: (seat: Position, c: Card) => void;
}) {
  const t = useT();
  const etichetta = SEATS.find((s) => s.key === seat)!.label;
  const cards = hands?.[seat] ?? [];
  const vistaDaTutti = stato?.revealed.includes(seat) ?? false;
  const suoTurno = turno === seat;

  return (
    <div
      className={`rounded-2xl border-2 p-3 ${
        suoTurno
          ? "border-figb bg-figb/5"
          : vistaDaTutti
            ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
            : "border-border bg-card"
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-bold">{etichetta}</span>
        <span className="text-xs text-muted-foreground">{handHcp(cards)} PO</span>
      </div>
      {SUITS.map((suit) => {
        const delSeme = cards
          .filter((c) => c.suit === suit)
          .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
        if (delSeme.length === 0) {
          return (
            <p key={suit} className="text-base font-mono flex items-center gap-1.5 leading-snug">
              <SuitSymbol suit={suit} size="xs" />—
            </p>
          );
        }
        return (
          <div key={suit} className="flex items-center gap-1 flex-wrap leading-snug">
            <SuitSymbol suit={suit} size="xs" />
            {delSeme.map((c) => {
              const giocabile = attivo && turno === seat && giocabiliSet.has(`${c.suit}-${c.rank}`);
              return (
                <button
                  key={`${c.suit}-${c.rank}`}
                  disabled={!giocabile}
                  onClick={() => onGioca(seat, c)}
                  className={`text-base font-mono px-1 rounded ${
                    giocabile ? "bg-figb/10 hover:bg-figb/20 border border-figb/40" : ""
                  }`}
                >
                  {c.rank}
                </button>
              );
            })}
          </div>
        );
      })}
      {attivo && (
        <button
          onClick={() => onToggle(seat)}
          className="mt-2 w-full text-xs font-semibold rounded-lg border border-border py-1.5 hover:bg-muted"
          aria-pressed={vistaDaTutti}
        >
          {vistaDaTutti ? t("La classe la vede") : t("Mostra alla classe")}
        </button>
      )}
    </div>
  );
}
