"use client";

import { useEffect, useState } from "react";
import Link from "@/components/link";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
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
import { dettagliClasse } from "@/lib/etichetta-classe";
import { ETICHETTE_STATO } from "@/lib/instructors";
import { createClass } from "@/lib/instructors";
import { useSharedAuth } from "@/contexts/auth-provider";
import { StrumentiLezione } from "@/components/istruttori/strumenti-lezione";
import { ElencoAllieviTutte } from "@/components/istruttori/elenco-allievi-tutte";
import { useT } from "@/contexts/traduzioni-provider";
import { Briciole } from "@/components/briciole";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";

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
  /**
   * L'ASD si mostra solo a chi insegna in più di un circolo: a chi ne ha uno
   * solo comparirebbe identica su ogni riga, dove non distingue niente.
   */
  const mostraAsd = new Set(classes.map((c) => c.asd_code).filter(Boolean)).size > 1;
  const archiviate = classes.filter((c) => c.stato === "archiviata");
  /**
   * Lo storico con un riassunto per classe: quanti allievi ha avuto e quanti
   * compiti (Trevissoi, ottobre 2026: «storico classi con tutte le
   * informazioni di dettaglio e di sintesi»). Due conteggi per classe, solo
   * per le archiviate, che sono poche e si guardano di rado.
   */
  const [sintesi, setSintesi] = useState<Record<string, { allievi: number; compiti: number }>>({});
  const idArchiviate = archiviate.map((c) => c.id).join(",");
  useEffect(() => {
    if (!idArchiviate) return;
    let vivo = true;
    const supabase = createClient();
    void Promise.all(
      idArchiviate.split(",").map(async (id) => {
        const [m, a] = await Promise.all([
          supabase.from("class_members").select("student_id", { count: "exact", head: true }).eq("class_id", id).eq("status", "active"),
          supabase.from("assignments").select("id", { count: "exact", head: true }).eq("class_id", id),
        ]);
        if (m.error || a.error) segnalaSalvoRete("insegnanti:storico", m.error ?? a.error);
        return [id, { allievi: m.count ?? 0, compiti: a.count ?? 0 }] as const;
      }),
    ).then((righe) => {
      if (vivo) setSintesi(Object.fromEntries(righe));
    });
    return () => {
      vivo = false;
    };
  }, [idArchiviate]);

  const [dialogOpen, setDialogOpen] = useState(false);
  /** La classe di cui si è appena copiato il codice: il segno dura due secondi. */
  const [copiato, setCopiato] = useState<string | null>(null);
  // Dalla home dell'insegnante, «+ Nuova classe» arriva qui con `?nuova=1`.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("nuova") === "1") {
      setDialogOpen(true);
    }
  }, []);
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
      {/* Il percorso anche qui, al primo livello: ogni altra pagina del
          portale lo ha, e qui mancava (Trevissoi, feedback 5). */}
      <Briciole percorso={[{ etichetta: t("Home"), href: "/" }, { etichetta: t("Le tue classi") }]} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5a0f] dark:text-[#c8a44e]">
              {t("Portale Insegnanti")}
            </p>
            <span className="rounded-full bg-[#c8a44e]/15 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-[#7a5a0f] dark:text-[#c8a44e]">
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

      {/* States */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="text-pretty" role="alert">{error}</p>
          <Button className="mt-2" variant="outline" size="sm" onClick={() => void refresh()} disabled={isLoading}>
            {t("Riprova")}
          </Button>
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
            {/* Un pulsante solo, quello in alto: due pulsanti diversi per la
                stessa cosa facevano chiedere quale fosse quello giusto
                (Trevissoi, feedback 5). */}
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("Premi «+ Nuova classe» qui sopra: otterrai un codice invito da condividere con gli allievi.")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Class grid */}
      {attive.length > 0 && (
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("Classi attive")} ({attive.length})
        </h2>
      )}
      {/* Schede più basse e tre per riga su schermo largo: con più corsi aperti
          le classi devono stare in una videata (Trevissoi, feedback 5). Il
          codice si copia dalla scheda, senza entrare nella classe. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {attive.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="h-full gap-0 py-0 transition-shadow hover:shadow-lg">
              <Link href={`/istruttori/${c.id}`} className="block flex-1 px-4 pb-2 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg">{c.name}</CardTitle>
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
                {/* Come si riconosce questa classe fra le altre: ASD,
                    livello, periodo. Con quattordici corsi aperti insieme il
                    solo nome non basta — due «Corso Fiori» sono la stessa
                    riga scritta due volte. */}
                {dettagliClasse(c, { mostraAsd }).length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {dettagliClasse(c, { mostraAsd }).join(" · ")}
                  </p>
                )}
                {c.description && (
                  <CardDescription className="line-clamp-1">{c.description}</CardDescription>
                )}
              </Link>
              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
                <span className="text-xs text-muted-foreground">{t("Codice invito")}</span>
                <span className="flex items-center gap-1.5">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold tracking-widest">
                    {c.invite_code}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    aria-label={t("Copia il codice di {classe}", { classe: c.name })}
                    onClick={() => {
                      void navigator.clipboard?.writeText(c.invite_code).then(() => {
                        setCopiato(c.id);
                        setTimeout(() => setCopiato((x) => (x === c.id ? null : x)), 2000);
                      });
                    }}
                  >
                    {copiato === c.id ? (
                      <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="text-xs">{copiato === c.id ? t("Copiato") : t("Copia")}</span>
                  </Button>
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gli allievi di tutte le classi attive: visualizzare, stampare, esportare. */}
      <div className="mt-8">
        <ElencoAllieviTutte classi={attive} />
      </div>

      {/* Strumenti per la lezione: stessi della home, definiti una volta sola.
          Stanno DOPO le classi: tornando dal secondo o terzo livello
          l'insegnante cerca la sua classe, e la trovava in fondo alla pagina
          (Trevissoi, ottobre 2026). */}
      <section className="mb-8 mt-10" aria-labelledby="strumenti-lezione">
        <h2
          id="strumenti-lezione"
          className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground"
        >
          {t("Strumenti per la lezione")}
        </h2>
        <StrumentiLezione />
      </section>

      {archiviate.length > 0 && (
        <div id="storico" className="mt-10 scroll-mt-20">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Storico classi")} ({archiviate.length})
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {archiviate.map((c) => (
              <Link
                key={c.id}
                href={`/istruttori/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{c.name}</span>
                {sintesi[c.id] && (
                  <span className="text-xs text-muted-foreground">
                    {t("{a} allievi · {c} compiti", { a: sintesi[c.id].allievi, c: sintesi[c.id].compiti })}
                    {dettagliClasse(c, { mostraAsd }).length > 0 && ` · ${dettagliClasse(c, { mostraAsd }).join(" · ")}`}
                  </span>
                )}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving) void handleCreate();
                }}
                placeholder={t("es. Corso Fiori 2026")}
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
                placeholder={t("es. Corso base del martedì sera")}
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
