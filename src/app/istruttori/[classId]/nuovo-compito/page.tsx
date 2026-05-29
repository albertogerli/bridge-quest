"use client";

import { useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useValidatedSmazzate } from "@/store/use-smazzate-store";
import { useCatalog } from "@/store/use-catalog-store";
import { createAssignment } from "@/lib/instructors";
import {
  smazzataDifficulty,
  DIFFICULTY_CHIP,
  DIFFICULTY_LABELS,
  type SmazzataDifficulty,
} from "@/lib/smazzata-meta";

type DiffFilter = "tutte" | SmazzataDifficulty;

export default function NuovoCompitoPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const router = useRouter();

  const smazzate = useValidatedSmazzate();
  const { courses } = useCatalog();

  // lesson id -> { courseName, lessonTitle }
  const lessonMeta = useMemo(() => {
    const map = new Map<number, { courseName: string; lessonTitle: string }>();
    for (const c of courses) {
      for (const l of c.lessons) {
        map.set(l.id, { courseName: c.name, lessonTitle: l.title });
      }
    }
    return map;
  }, [courses]);

  // Lessons that actually have smazzate, for the lesson filter dropdown.
  const lessonOptions = useMemo(() => {
    const ids = Array.from(new Set(smazzate.map((s) => s.lesson))).sort((a, b) => a - b);
    return ids.map((id) => ({
      id,
      label: lessonMeta.get(id)
        ? `${lessonMeta.get(id)!.courseName} · ${lessonMeta.get(id)!.lessonTitle}`
        : `Lezione ${id}`,
    }));
  }, [smazzate, lessonMeta]);

  // Filters
  const [lessonFilter, setLessonFilter] = useState<number | "tutte">("tutte");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("tutte");
  const [search, setSearch] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return smazzate.filter((s) => {
      if (lessonFilter !== "tutte" && s.lesson !== lessonFilter) return false;
      if (diffFilter !== "tutte" && smazzataDifficulty(s) !== diffFilter) return false;
      if (q && !`${s.title} ${s.contract} ${s.id}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [smazzate, lessonFilter, diffFilter, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim() || selected.size === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createAssignment({
        classId,
        title: title.trim(),
        smazzataIds: Array.from(selected),
        instructorNote: note.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      router.push(`/istruttori/${classId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore nella creazione del compito");
      setSaving(false);
    }
  }

  const selectClass =
    "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 pb-28 sm:px-6">
      <Link href={`/istruttori/${classId}`} className="text-sm text-muted-foreground hover:underline">
        ← Dettaglio classe
      </Link>
      <h1 className="mt-3 mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
        Nuovo compito
      </h1>

      {/* Assignment meta */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium">
            Titolo del compito
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. Compito 1 — L'impasse"
            className={`${selectClass} w-full`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="due" className="text-sm font-medium">
            Scadenza <span className="text-muted-foreground">(facoltativa)</span>
          </label>
          <input
            id="due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`${selectClass} w-full`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="note" className="text-sm font-medium">
            Nota per gli allievi <span className="text-muted-foreground">(facoltativa)</span>
          </label>
          <input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. Concentratevi sulla scelta della linea di gioco"
            className={`${selectClass} w-full`}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={lessonFilter}
          onChange={(e) =>
            setLessonFilter(e.target.value === "tutte" ? "tutte" : Number(e.target.value))
          }
          className={selectClass}
        >
          <option value="tutte">Tutte le lezioni</option>
          {lessonOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>

        <select
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value as DiffFilter)}
          className={selectClass}
        >
          <option value="tutte">Tutte le difficoltà</option>
          <option value="facile">Facile</option>
          <option value="medio">Medio</option>
          <option value="difficile">Difficile</option>
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per titolo o contratto…"
          className={`${selectClass} min-w-[180px] flex-1`}
        />
      </div>

      <p className="mb-2 text-xs text-muted-foreground">
        {filtered.length} smazzate · {selected.size} selezionate
      </p>

      {/* Smazzata list */}
      <div className="space-y-2">
        {filtered.map((s) => {
          const diff = smazzataDifficulty(s);
          const isSel = selected.has(s.id);
          const meta = lessonMeta.get(s.lesson);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSel
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  isSel ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {isSel && "✓"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {meta ? `${meta.courseName} · ${meta.lessonTitle}` : `Lezione ${s.lesson}`}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 font-mono">
                {s.contract}
              </Badge>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_CHIP[diff]}`}
              >
                {DIFFICULTY_LABELS[diff]}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nessuna smazzata con questi filtri.
          </p>
        )}
      </div>

      {/* Sticky create bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur lg:left-[88px]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-sm">
            <span className="font-semibold">{selected.size}</span> mani selezionate
            {saveError && <span className="ml-3 text-destructive">{saveError}</span>}
          </div>
          <Button
            onClick={handleCreate}
            disabled={saving || !title.trim() || selected.size === 0}
          >
            {saving ? "Creazione…" : "Crea compito"}
          </Button>
        </div>
      </div>
    </div>
  );
}
