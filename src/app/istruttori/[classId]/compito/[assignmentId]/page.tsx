"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useValidatedSmazzate } from "@/store/use-smazzate-store";
import {
  getAssignment,
  getClassDetail,
  getAssignmentResults,
  type Assignment,
  type ClassMember,
  type AssignmentResultRow,
} from "@/lib/instructors";

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Compito non trovato"}</p>
        <Link href={`/istruttori/${classId}`} className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Torna alla classe
        </Link>
      </div>
    );
  }

  const smazzataIds = assignment.smazzata_ids;
  const colLabel = (id: string) => {
    const s = validated.find((sm) => sm.id === id);
    return s ? s.contract : id;
  };

  // Per-hand difficulty signal: how many students went down on each hand.
  const downPerHand = smazzataIds.map(
    (id) => members.filter((m) => cellFor(m.student_id, id).state === "down").length
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link href={`/istruttori/${classId}`} className="text-sm text-muted-foreground hover:underline">
        ← Dettaglio classe
      </Link>
      <h1 className="mt-3 mb-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {assignment.title}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {members.length} {members.length === 1 ? "allievo" : "allievi"} · {smazzataIds.length}{" "}
        {smazzataIds.length === 1 ? "mano" : "mani"}
      </p>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500" /> Contratto mantenuto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500" /> Caduto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-muted" /> Non giocata
        </span>
      </div>

      {members.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nessun allievo iscritto a questa classe.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-semibold">
                  Allievo
                </th>
                {smazzataIds.map((id, i) => (
                  <th key={id} className="px-2 py-2 text-center font-semibold">
                    <div className="font-mono text-xs">{colLabel(id)}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">M{i + 1}</div>
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
                    return (
                      <td key={id} className="px-2 py-2 text-center">
                        <HeatCell cell={cell} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Footer: down count per hand (class difficulty signal) */}
              <tr className="bg-muted/30 text-xs text-muted-foreground">
                <td className="sticky left-0 z-10 bg-muted/30 px-3 py-2 font-semibold">
                  Cadute / classe
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
    </div>
  );
}

function HeatCell({ cell }: { cell: Cell }) {
  if (cell.state === "empty") {
    return <span className="inline-block h-7 w-12 rounded border border-border bg-muted" aria-label="Non giocata" />;
  }
  const made = cell.state === "made";
  const label =
    cell.result === 0 ? "=" : cell.result > 0 ? `+${cell.result}` : `${cell.result}`;
  return (
    <span
      className={`inline-flex h-7 w-12 items-center justify-center rounded text-xs font-bold text-white ${
        made ? "bg-emerald-500" : "bg-red-500"
      }`}
      title={
        cell.tricksMade != null && cell.tricksNeeded != null
          ? `${cell.tricksMade}/${cell.tricksNeeded} prese`
          : undefined
      }
    >
      {label}
    </span>
  );
}
