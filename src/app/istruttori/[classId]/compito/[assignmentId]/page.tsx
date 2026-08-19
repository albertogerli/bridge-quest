"use client";

import { useEffect, useMemo, useState, use } from "react";
import { Briciole } from "@/components/briciole";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useValidatedSmazzate } from "@/store/use-smazzate-store";
// Replay della mano: si apre su richiesta a fine partita.
const HandReplay = dynamic(
  () => import("@/components/bridge/hand-replay").then((m) => m.HandReplay),
  { ssr: false },
);
import { parseContract, type GameState } from "@/lib/bridge-engine";
import {
  PLAY_ERROR_LABELS,
  type PlayErrorCategory,
} from "@/lib/play-error-classifier";
import {
  getAssignment,
  getClassDetail,
  getAssignmentResults,
  type Assignment,
  type ClassMember,
  type AssignmentResultRow,
} from "@/lib/instructors";
import {
  difficolta,
  formattaDurata,
  ripulisci,
  type Difficolta,
  type TempiMano,
} from "@/lib/tempi";
import { useT } from "@/contexts/traduzioni-provider";

/** Cell state for the heatmap. */
type Cell =
  | { state: "made"; result: number; tricksMade?: number; tricksNeeded?: number }
  | { state: "down"; result: number; tricksMade?: number; tricksNeeded?: number }
  | { state: "empty" };

export default function AssignmentResultsPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const t = useT();
  const { classId, assignmentId } = use(params);
  const validated = useValidatedSmazzate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [results, setResults] = useState<AssignmentResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [a, detail, res] = await Promise.all([
          getAssignment(assignmentId),
          getClassDetail(classId),
          getAssignmentResults(assignmentId),
        ]);
        if (active) {
          setAssignment(a);
          setMembers(detail.members);
          setResults(res);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Errore nel caricamento dei risultati");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [classId, assignmentId]);

  // Lookup: `${studentId}|${smazzataId}` -> latest result row
  const resultMap = useMemo(() => {
    const m = new Map<string, AssignmentResultRow>();
    for (const r of results) m.set(`${r.student_id}|${r.smazzata_id}`, r);
    return m;
  }, [results]);

  function cellFor(studentId: string, smazzataId: string): Cell {
    const r = resultMap.get(`${studentId}|${smazzataId}`);
    if (!r) return { state: "empty" };
    const d = r.details ?? {};
    const tricksMade = typeof d.tricksMade === "number" ? d.tricksMade : undefined;
    const tricksNeeded = typeof d.tricksNeeded === "number" ? d.tricksNeeded : undefined;
    return {
      state: r.score >= 0 ? "made" : "down",
      result: r.score,
      tricksMade,
      tricksNeeded,
    };
  }

  // ── Card-by-card replay of a student's hand ──────────────────────────────
  const [replay, setReplay] = useState<{ title: string; gameState: GameState } | null>(null);

  function playOf(studentId: string, smazzataId: string) {
    const r = resultMap.get(`${studentId}|${smazzataId}`);
    const play = (r?.details as { play?: { hands?: unknown; tricks?: unknown } } | undefined)?.play;
    return play?.tricks && play?.hands ? play : null;
  }

  function openReplay(studentId: string, smazzataId: string, studentName: string) {
    const play = playOf(studentId, smazzataId);
    const sm =
      validated.find((s) => s.id === smazzataId) ??
      assignment?.custom_hands?.find((s) => s.id === smazzataId);
    if (!play || !sm) return;
    const gameState = {
      hands: play.hands,
      tricks: play.tricks,
      contract: sm.contract,
      declarer: sm.declarer,
      trumpSuit: parseContract(sm.contract).trumpSuit,
    } as unknown as GameState;
    setReplay({ title: `${studentName} · ${sm.contract}`, gameState });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Compito non trovato"}</p>
        <Link href={`/istruttori/${classId}`} className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Torna alla classe
        </Link>
      </div>
    );
  }

  const smazzataIds = assignment.smazzata_ids;
  const colLabel = (id: string) => {
    const s =
      validated.find((sm) => sm.id === id) ??
      assignment.custom_hands?.find((sm) => sm.id === id);
    return s ? s.contract : id;
  };

  /**
   * I tempi di riflessione, per allievo e per mano.
   *
   * Due segnali, e sono opposti: chi ci ha messo molto su una carta e ha
   * sbagliato non sapeva come fare — la spiegazione non è arrivata — e chi ha
   * risposto subito e ha sbagliato non si è accorto che c'era una scelta. Con
   * il solo esito si confondono, e sono due lezioni diverse da rifare.
   *
   * I tempi arrivano già ripuliti dal client, ma si ripassano da `ripulisci`:
   * `details` è un jsonb scritto dal browser, e fidarsi di un numero che arriva
   * da lì per calcolare una media di classe vuol dire che basta una scheda
   * lasciata aperta per spostarla.
   */
  const tempiPerAllievo = members
    .map((m) => {
      const voci: { smazzataId: string; t: TempiMano; mantenuto: boolean; segnale: Difficolta }[] = [];
      for (const id of smazzataIds) {
        const r = resultMap.get(`${m.student_id}|${id}`);
        const grezzi = (r?.details as { tempi?: { decisioni?: number[] } } | undefined)?.tempi
          ?.decisioni;
        if (!Array.isArray(grezzi) || grezzi.length === 0) continue;
        const t = ripulisci(grezzi);
        const mantenuto = (r?.score ?? -1) >= 0;
        voci.push({ smazzataId: id, t, mantenuto, segnale: difficolta(t, mantenuto) });
      }
      return {
        studentId: m.student_id,
        name: m.display_name ?? "Allievo",
        voci,
        totaleMs: voci.reduce((a, v) => a + v.t.totaleMs, 0),
        daGuardare: voci.filter((v) => v.segnale !== "normale"),
      };
    })
    .filter((r) => r.voci.length > 0);

  /** Quale mano ha richiesto più tempo alla classe: è quella da rispiegare. */
  const tempoPerMano = smazzataIds
    .map((id) => {
      const durate = tempiPerAllievo
        .flatMap((r) => r.voci.filter((v) => v.smazzataId === id))
        .map((v) => v.t.totaleMs);
      return {
        id,
        mediana: durate.length
          ? [...durate].sort((a, b) => a - b)[Math.floor(durate.length / 2)]
          : 0,
        quanti: durate.length,
      };
    })
    .filter((x) => x.quanti > 0)
    .sort((a, b) => b.mediana - a.mediana);

  // Per-hand difficulty signal: how many students went down on each hand.
  const downPerHand = smazzataIds.map(
    (id) => members.filter((m) => cellFor(m.student_id, id).state === "down").length
  );

  // ── Error taxonomy: aggregate the rule-based play errors per student ─────
  // (recorded by the student app in details.errors, see play-error-classifier)
  const errorTaxonomy = members
    .map((m) => {
      const counts = new Map<PlayErrorCategory, number>();
      for (const id of smazzataIds) {
        const r = resultMap.get(`${m.student_id}|${id}`);
        const errs = (r?.details as { errors?: { category?: string }[] } | undefined)
          ?.errors;
        if (!Array.isArray(errs)) continue;
        for (const e of errs) {
          if (e?.category && e.category in PLAY_ERROR_LABELS) {
            const cat = e.category as PlayErrorCategory;
            counts.set(cat, (counts.get(cat) ?? 0) + 1);
          }
        }
      }
      return {
        studentId: m.student_id,
        name: m.display_name ?? "Allievo",
        counts: [...counts.entries()].sort((a, b) => b[1] - a[1]),
      };
    })
    .filter((row) => row.counts.length > 0);

  // Most frequent theme across the whole class (worth a recap in lesson)
  const classTheme = (() => {
    const totals = new Map<PlayErrorCategory, number>();
    for (const row of errorTaxonomy)
      for (const [cat, n] of row.counts) totals.set(cat, (totals.get(cat) ?? 0) + n);
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
    return top && top[1] >= 2 ? top : null;
  })();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le tue classi", href: "/istruttori" },
          { etichetta: "La classe", href: `/istruttori/${classId}` },
          { etichetta: assignment.title },
        ]}
      />
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {assignment.title}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {members.length} {members.length === 1 ? "allievo" : "allievi"} · {smazzataIds.length}{" "}
        {smazzataIds.length === 1 ? "mano" : "mani"}
      </p>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500" /> {t("Contratto mantenuto")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500" /> {t("Caduto")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-muted" /> {t("Non giocata")}
        </span>
        <span className="text-muted-foreground">▶ Clicca una cella giocata per rivedere la mano</span>
      </div>

      {members.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Nessun allievo iscritto a questa classe.")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-semibold">
                  {t("Allievo")}
                </th>
                {smazzataIds.map((id, i) => (
                  <th key={id} className="px-2 py-2 text-center font-semibold">
                    <div className="font-mono text-xs">{colLabel(id)}</div>
                    <div className="text-[12px] font-normal text-muted-foreground">M{i + 1}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.student_id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">
                    {m.display_name ?? "Allievo"}
                  </td>
                  {smazzataIds.map((id) => {
                    const cell = cellFor(m.student_id, id);
                    const playable = !!playOf(m.student_id, id);
                    return (
                      <td key={id} className="px-2 py-2 text-center">
                        <HeatCell
                          cell={cell}
                          playable={playable}
                          onClick={
                            playable
                              ? () => openReplay(m.student_id, id, m.display_name ?? "Allievo")
                              : undefined
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Footer: down count per hand (class difficulty signal) */}
              <tr className="bg-muted/30 text-xs text-muted-foreground">
                <td className="sticky left-0 z-10 bg-muted/30 px-3 py-2 font-semibold">
                  {t("Cadute / classe")}
                </td>
                {downPerHand.map((n, i) => (
                  <td key={i} className="px-2 py-2 text-center font-semibold">
                    <span className={n > members.length / 2 ? "text-red-600" : ""}>{n}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tempi di riflessione ── */}
      {tempiPerAllievo.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold text-foreground">
            {t("Quanto ci hanno pensato")}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Il tempo non è un voto: serve a distinguere chi non sapeva come fare da chi non si
            è accorto che c&rsquo;era una scelta. Agli allievi non compare nessuna classifica di
            velocità.
          </p>

          {tempoPerMano.length > 1 && (
            <p className="mb-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              La mano che ha richiesto più tempo alla classe è la{" "}
              <strong>{colLabel(tempoPerMano[0].id)}</strong> ({formattaDurata(tempoPerMano[0].mediana)}{" "}
              di mediana): è quella da rivedere per prima.
            </p>
          )}

          <div className="divide-y divide-border rounded-lg border border-border">
            {tempiPerAllievo
              .slice()
              .sort((a, b) => b.daGuardare.length - a.daGuardare.length)
              .map((r) => (
                <div key={r.studentId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formattaDurata(r.totaleMs)} in tutto · {r.voci.length}{" "}
                    {r.voci.length === 1 ? "mano" : "mani"}
                  </span>
                  <span className="ml-auto flex flex-wrap gap-1.5">
                    {r.daGuardare.map((v) => (
                      <span
                        key={v.smazzataId}
                        className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                          v.segnale === "lento-e-sbagliato"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                        title={
                          v.segnale === "lento-e-sbagliato"
                            ? `${formattaDurata(v.t.massimoMs)} sulla decisione più lunga, e la mano è caduta: non sapeva come fare.`
                            : "Ha giocato di getto e la mano è caduta: non si è accorto che c'era una scelta."
                        }
                      >
                        {colLabel(v.smazzataId)}:{" "}
                        {v.segnale === "lento-e-sbagliato" ? "ci ha pensato" : "di getto"}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Error taxonomy per student ── */}
      {errorTaxonomy.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold text-foreground">
            {t("Su cosa lavorare")}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("Errori di gioco rilevati automaticamente nelle mani del compito.")}
          </p>

          {classTheme && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="font-bold">{t("Tema della classe:")}</span>{" "}
              {PLAY_ERROR_LABELS[classTheme[0]].toLowerCase()} ({classTheme[1]}{" "}
              {classTheme[1] === 1 ? "caso" : "casi"}) — vale un ripasso alla
              prossima lezione.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left font-semibold">{t("Allievo")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("Errori ricorrenti")}</th>
                </tr>
              </thead>
              <tbody>
                {errorTaxonomy.map((row) => (
                  <tr key={row.studentId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {row.counts.map(([cat, n]) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                          >
                            {PLAY_ERROR_LABELS[cat]}
                            {n > 1 && <span className="font-bold">×{n}</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {replay && (
          <HandReplay gameState={replay.gameState} onClose={() => setReplay(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function HeatCell({
  cell,
  playable,
  onClick,
}: {
  cell: Cell;
  playable?: boolean;
  onClick?: () => void;
}) {
  const t = useT();
  if (cell.state === "empty") {
    return <span className="inline-block h-7 w-12 rounded border border-border bg-muted" aria-label={t("Non giocata")} />;
  }
  const made = cell.state === "made";
  const label =
    cell.result === 0 ? "=" : cell.result > 0 ? `+${cell.result}` : `${cell.result}`;
  const title =
    cell.tricksMade != null && cell.tricksNeeded != null
      ? `${cell.tricksMade}/${cell.tricksNeeded} prese${playable ? " · clicca per rivedere" : ""}`
      : playable
        ? "Clicca per rivedere la mano"
        : undefined;
  const base = `inline-flex h-7 w-12 items-center justify-center rounded text-xs font-bold text-white ${
    made ? "bg-emerald-500" : "bg-red-500"
  }`;
  if (playable) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${base} cursor-pointer ring-offset-1 transition hover:ring-2 hover:ring-primary/60`}
      >
        {label}
      </button>
    );
  }
  return (
    <span className={base} title={title}>
      {label}
    </span>
  );
}
