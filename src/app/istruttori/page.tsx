"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyClasses } from "@/store/use-classes-store";
import { ETICHETTE_STATO } from "@/lib/instructors";
import { createClass } from "@/lib/instructors";
import { useSharedAuth } from "@/contexts/auth-provider";
import { StrumentiLezione } from "@/components/istruttori/strumenti-lezione";
import { useT } from "@/contexts/traduzioni-provider";

export default function IstruttoriPage() {
  const t = useT();
  const { profile } = useSharedAuth();
  const { classes, isLoading, isLoaded, error, refresh } = useMyClasses();
  /**
   * Le archiviate scendono in fondo, in una sezione a parte.
   *
   * Non spariscono: archiviare è una transizione di stato, non una
   * cancellazione, e i corsi finiti sono la memoria dell'insegnante. Ma
   * nemmeno restano mescolate a quelle di quest'anno, o dopo tre stagioni
   * l'elenco non si legge più.
   */
  const attive = classes.filter((c) => c.stato !== "archiviata");
  const archiviate = classes.filter((c) => c.stato === "archiviata");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createClass({
        name: name.trim(),
        description: description.trim() || null,
        asdCode: profile?.asd_code ?? null,
      });
      setName("");
      setDescription("");
      setDialogOpen(false);
      await refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore nella creazione della classe");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a44e]">
              {t("Portale Istruttori")}
            </p>
            <span className="rounded-full bg-[#c8a44e]/15 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-[#9a7b2e] dark:text-[#c8a44e]">
              {t("Beta")}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            {t("Le tue classi")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Crea classi virtuali, assegna smazzate e segui i progressi dei tuoi allievi.")}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          + Nuova classe
        </Button>
      </div>

      {/* Strumenti per la lezione: stessi della home, definiti una volta sola.
          Stanno PRIMA delle classi perché si usano a ogni lezione, mentre una
          classe si crea una volta e poi si apre di rado. */}
      <section className="mb-8" aria-labelledby="strumenti-lezione">
        <h2
          id="strumenti-lezione"
          className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground"
        >
          {t("Strumenti per la lezione")}
        </h2>
        <StrumentiLezione />
      </section>

      {/* States */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoaded && isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      )}

      {isLoaded && classes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">🎓</span>
            <p className="font-display text-lg font-semibold">{t("Nessuna classe ancora")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("Crea la tua prima classe: otterrai un codice invito da condividere con gli allievi.")}
            </p>
            <Button onClick={() => setDialogOpen(true)} className="mt-2">
              + Crea la prima classe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Class grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {attive.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/istruttori/${c.id}`} className="block h-full">
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-xl">{c.name}</CardTitle>
                    {c.stato !== "aperta" ? (
                      <Badge variant="secondary" className="shrink-0">
                        {ETICHETTE_STATO[c.stato]}
                      </Badge>
                    ) : (
                      !c.invite_active && (
                        <Badge variant="outline" className="shrink-0">
                          {t("Iscrizioni chiuse")}
                        </Badge>
                      )
                    )}
                  </div>
                  {c.description && (
                    <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t("Codice invito")}</span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold tracking-widest">
                    {c.invite_code}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {archiviate.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Archiviate")} ({archiviate.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {archiviate.map((c) => (
              <Link
                key={c.id}
                href={`/istruttori/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{c.name}</span>
                <span className="ml-auto font-mono text-xs tracking-widest text-muted-foreground">
                  {c.invite_code}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{t("Nuova classe")}</DialogTitle>
            <DialogDescription>
              {t("Dai un nome alla classe. Genereremo un codice invito da condividere con gli allievi.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="class-name" className="text-sm font-medium">
                {t("Nome classe")}
              </label>
              <input
                id="class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Corso Fiori 2026"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="class-desc" className="text-sm font-medium">
                {t("Descrizione")} <span className="text-muted-foreground">(facoltativa)</span>
              </label>
              <textarea
                id="class-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="es. Corso base del martedì sera"
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {t("Annulla")}
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? t("Creazione…") : t("Crea classe")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
