"use client";

import { useMemo, useRef, useState, use, useEffect } from "react";
import { Briciole } from "@/components/briciole";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useValidatedSmazzate } from "@/store/use-smazzate-store";
import { useCatalog } from "@/store/use-catalog-store";
import { type VisibilitaSoluzioni, createAssignment } from "@/lib/instructors";
import {
  ETICHETTE_CONSEGNA,
  elencaMieiEsercizi,
  type EsercizioPosizione,
} from "@/lib/esercizi-posizione";
import { parsePbn } from "@/lib/pbn";
import type { Smazzata } from "@/lib/catalog";
import {
  smazzataDifficulty,
  DIFFICULTY_CHIP,
  DIFFICULTY_LABELS,
  type SmazzataDifficulty,
} from "@/lib/smazzata-meta";
import { useT } from "@/contexts/traduzioni-provider";

type DiffFilter = "tutte" | SmazzataDifficulty;

export default function NuovoCompitoPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
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
  const [soluzioni, setSoluzioni] = useState<VisibilitaSoluzioni>("dopo-il-gioco");
  const [minibridge, setMinibridge] = useState(false);
  /**
   * Gli esercizi di posizione salvati a lezione.
   *
   * Compaiono qui e non in una pagina a parte: l'insegnante che compone il
   * compito di stasera ha in mente «le mani più quella posizione che abbiamo
   * discusso», ed è un gesto solo.
   */
  const [esercizi, setEsercizi] = useState<EsercizioPosizione[]>([]);
  const [eserciziScelti, setEserciziScelti] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── PBN import: custom hands from any dealing program ──────────────────
  const [imported, setImported] = useState<Smazzata[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePbnFile(file: File) {
    try {
      const text = await file.text();
      // Unique-per-import id prefix so two imports never collide
      const prefix = `pbn-${Date.now().toString(36)}`;
      const { deals, errors } = parsePbn(text, prefix);
      setImportErrors(errors);
      if (deals.length > 0) {
        setImported((prev) => [...prev, ...deals]);
        // Imported hands start selected: that's why the instructor loaded them
        setSelected((prev) => {
          const next = new Set(prev);
          for (const d of deals) next.add(d.id);
          return next;
        });
      }
    } catch {
      setImportErrors(["Impossibile leggere il file PBN."]);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImported(id: string) {
    setImported((prev) => prev.filter((s) => s.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

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

  useEffect(() => {
    void elencaMieiEsercizi().then(setEsercizi);
  }, []);

  async function handleCreate() {
    if (!title.trim() || (selected.size === 0 && eserciziScelti.size === 0)) return;
    setSaving(true);
    setSaveError(null);
    try {
      const customHands = imported.filter((s) => selected.has(s.id));
      await createAssignment({
        classId,
        title: title.trim(),
        smazzataIds: Array.from(selected),
        instructorNote: note.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        soluzioni,
        minibridge,
        esercizioIds: Array.from(eserciziScelti),
        customHands,
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
    <div className="mx-auto w-full max-w-4xl px-4 py-8 pb-44 sm:px-6 lg:pb-28">
      <Briciole
        percorso={[
          { etichetta: "Le tue classi", href: "/istruttori" },
          { etichetta: "La classe", href: `/istruttori/${classId}` },
          { etichetta: "Nuovo compito" },
        ]}
      />
      <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {t("Nuovo compito")}
      </h1>

      {/* Assignment meta */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium">
            {t("Titolo del compito")}
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
            {t("Scadenza")} <span className="text-muted-foreground">(facoltativa)</span>
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
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={minibridge}
              onChange={(e) => setMinibridge(e.target.checked)}
            />
            <span>
              <span className="font-medium">{t("Minibridge")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("Senza dichiarazione: chi ha più punti gioca e il livello viene dalla tabella. Per le prime lezioni.")}
              </span>
            </span>
          </label>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="soluzioni" className="text-sm font-medium">
            {t("Soluzioni")}
          </label>
          <select
            id="soluzioni"
            value={soluzioni}
            onChange={(e) => setSoluzioni(e.target.value as VisibilitaSoluzioni)}
            className={`${selectClass} w-full`}
          >
            <option value="dopo-il-gioco">{t("Dopo che l'allievo ha giocato la mano")}</option>
            <option value="dopo-la-scadenza">{t("Solo dopo la scadenza")}</option>
            <option value="subito">{t("Subito, come aiuto durante l'esercizio")}</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {soluzioni === "dopo-la-scadenza" && !dueDate
              ? "Senza una scadenza le soluzioni non si aprono mai: metti una data qui sopra."
              : "Il commento del maestro non arriva nemmeno al browser dell'allievo finché non gli spetta."}
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="note" className="text-sm font-medium">
            {t("Nota per gli allievi")} <span className="text-muted-foreground">(facoltativa)</span>
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

      {/* Gli esercizi di posizione salvati a lezione */}
      {esercizi.length > 0 && (
        <div className="mb-6 rounded-lg border border-border p-4">
          <p className="mb-1 text-sm font-semibold">{t("Le posizioni che hai salvato")}</p>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("Vanno nel compito insieme alle mani: l'allievo le trova in fondo all'elenco.")}
          </p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {esercizi.map((e) => {
              const scelto = eserciziScelti.has(e.id);
              return (
                <label
                  key={e.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    checked={scelto}
                    onChange={() =>
                      setEserciziScelti((prev) => {
                        const n = new Set(prev);
                        if (scelto) n.delete(e.id);
                        else n.add(e.id);
                        return n;
                      })
                    }
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{e.titolo}</span>
                    <span className="block text-xs text-muted-foreground">
                      {ETICHETTE_CONSEGNA[e.consegna]}
                      {e.gruppo && ` · ${e.gruppo}`}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* PBN import */}
      <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t("Importa mani da file PBN")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Carica smazzate dal tuo programma di smazzatura (Dealer4, BridgeComposer, BBO…).")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("Scegli file .pbn")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pbn,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePbnFile(f);
            }}
          />
        </div>

        {importErrors.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-400">
            {importErrors.map((err, i) => (
              <li key={i}>⚠ {err}</li>
            ))}
          </ul>
        )}

        {imported.length > 0 && (
          <div className="mt-3 space-y-2">
            {imported.map((s) => {
              const isSel = selected.has(s.id);
              return (
                <div
                  key={s.id}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 ${
                    isSel ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      isSel
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                    aria-label={isSel ? "Deseleziona" : "Seleziona"}
                  >
                    {isSel && "✓"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Importata da PBN · Board {s.board}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono">
                    {s.contract}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => removeImported(s.id)}
                    className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                    aria-label={t("Rimuovi mano importata")}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
          <option value="tutte">{t("Tutte le lezioni")}</option>
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
          <option value="tutte">{t("Tutte le difficoltà")}</option>
          <option value="facile">{t("Facile")}</option>
          <option value="medio">{t("Medio")}</option>
          <option value="difficile">{t("Difficile")}</option>
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Cerca per titolo o contratto…")}
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
            {t("Nessuna smazzata con questi filtri.")}
          </p>
        )}
      </div>

      {/* Sticky create bar */}
      <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-border bg-background/95 backdrop-blur lg:bottom-0 lg:left-[88px]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-sm">
            <span className="font-semibold">{selected.size}</span> mani selezionate
            {!title.trim() && selected.size > 0 && (
              <span className="ml-3 text-amber-600">{t("Inserisci un titolo per assegnare")}</span>
            )}
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
