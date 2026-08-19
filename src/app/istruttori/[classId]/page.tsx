"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClassChat } from "@/components/instructor/class-chat";
import { ClassLeaderboard } from "@/components/instructors/class-leaderboard";
import {
  getClassDetail,
  regenerateInviteCode,
  setInviteActive,
  decidiIscrizione,
  aggiornaImpostazioniClasse,
  ETICHETTE_STATO,
  type ClassDetail,
  type StatoClasse,
} from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);

  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getClassDetail(classId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento della classe");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function handleRegenerate() {
    if (!confirm("Rigenerare il codice invito? Quello attuale smetterà di funzionare.")) return;
    setBusy(true);
    try {
      await regenerateInviteCode(classId);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive() {
    if (!detail) return;
    setBusy(true);
    try {
      await setInviteActive(classId, !detail.classRoom.invite_active);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function decidi(studentId: string, decisione: "approva" | "respingi") {
    setBusy(true);
    try {
      await decidiIscrizione(classId, studentId, decisione);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function cambiaImpostazione(campi: Parameters<typeof aggiornaImpostazioniClasse>[1]) {
    setBusy(true);
    try {
      await aggiornaImpostazioniClasse(classId, campi);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!detail) return;
    void navigator.clipboard.writeText(detail.classRoom.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Classe non trovata"}</p>
        <Link href="/istruttori" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Torna alle classi
        </Link>
      </div>
    );
  }

  const { classRoom, members, inAttesa, assignments } = detail;
  const scadenza = classRoom.invite_expires_at
    ? new Date(classRoom.invite_expires_at)
    : null;
  const scaduto = scadenza !== null && scadenza <= new Date();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/istruttori" className="text-sm text-muted-foreground hover:underline">
        ← Le tue classi
      </Link>

      {/* Header */}
      <div className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            {classRoom.name}
          </h1>
          {classRoom.stato !== "aperta" && (
            <Badge variant={classRoom.stato === "archiviata" ? "outline" : "secondary"}>
              {ETICHETTE_STATO[classRoom.stato]}
            </Badge>
          )}
        </div>
        {classRoom.description && (
          <p className="mt-1 text-sm text-muted-foreground">{classRoom.description}</p>
        )}
      </div>

      {/* Invite code panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("Codice invito")}</CardTitle>
          <CardDescription>
            {t("Condividilo con gli allievi: lo inseriscono nella sezione “Le mie classi”.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyCode}
            className="rounded-lg bg-muted px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] transition-colors hover:bg-muted/70"
            title={t("Copia")}
          >
            {classRoom.invite_code}
          </button>
          <span className="text-xs text-muted-foreground">{copied ? "Copiato ✓" : "Tocca per copiare"}</span>
          {!classRoom.invite_active && (
            <Badge variant="outline">{t("Iscrizioni chiuse")}</Badge>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={busy}>
            {t("Rigenera codice")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={busy}>
            {classRoom.invite_active ? "Chiudi iscrizioni" : "Riapri iscrizioni"}
          </Button>
        </CardFooter>
      </Card>

      {/* Chi entra, e quando */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("Chi può entrare")}</CardTitle>
          <CardDescription>
            {t("Il codice da solo non basta se chiedi di approvare le iscrizioni.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={!classRoom.approvazione_automatica}
              disabled={busy}
              onChange={(e) =>
                void cambiaImpostazione({ approvazione_automatica: !e.target.checked })
              }
            />
            <span>
              <span className="font-medium">{t("Approvo io ogni iscrizione")}</span>
              <span className="block text-xs text-muted-foreground">
                {classRoom.approvazione_automatica
                  ? "Adesso chiunque abbia il codice entra subito."
                  : "Le richieste ti arrivano qui sotto e la classe non si vede finché non approvi."}
              </span>
            </span>
          </label>

          <div className="space-y-1.5">
            <label htmlFor="scadenza-codice" className="text-sm font-medium">
              {t("Il codice scade il")}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="scadenza-codice"
                type="date"
                disabled={busy}
                value={scadenza ? scadenza.toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  void cambiaImpostazione({
                    invite_expires_at: e.target.value
                      ? new Date(`${e.target.value}T23:59:59`).toISOString()
                      : null,
                  })
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              {scadenza && (
                <Badge variant={scaduto ? "destructive" : "secondary"}>
                  {scaduto ? "Scaduto" : `Valido fino al ${scadenza.toLocaleDateString("it-IT")}`}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {t("Vuoto = non scade.")}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stato-classe" className="text-sm font-medium">
              {t("Stato della classe")}
            </label>
            <select
              id="stato-classe"
              value={classRoom.stato}
              disabled={busy}
              onChange={(e) => void cambiaImpostazione({ stato: e.target.value as StatoClasse })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm sm:w-auto"
            >
              <option value="bozza">Bozza — la sto preparando, non si entra</option>
              <option value="aperta">Aperta — si entra e si lavora</option>
              <option value="chiusa">Chiusa — niente nuovi iscritti, chi c&rsquo;è continua</option>
              <option value="archiviata">Archiviata — corso finito</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {t("Chiudere e archiviare non cancella niente: allievi, compiti e risultati restano tutti.")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Richieste in attesa */}
      {inAttesa.length > 0 && (
        <Card className="mb-6 border-primary/40">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("In attesa di una risposta")} ({inAttesa.length})
            </CardTitle>
            <CardDescription>
              {t("Finché non decidi non vedono compiti né chat.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {inAttesa.map((m) => (
              <div key={m.student_id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
                  {(m.display_name ?? "?").charAt(0)}
                </div>
                <span className="text-sm font-medium">
                  {m.display_name ?? "Allievo senza nome"}
                </span>
                <span className="text-xs text-muted-foreground">
                  ha chiesto il {new Date(m.joined_at).toLocaleDateString("it-IT")}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void decidi(m.student_id, "approva")}>
                    {t("Fallo entrare")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void decidi(m.student_id, "respingi")}
                  >
                    {t("No")}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="compiti">
        <TabsList>
          <TabsTrigger value="compiti">Compiti ({assignments.length})</TabsTrigger>
          <TabsTrigger value="allievi">Allievi ({members.length})</TabsTrigger>
          <TabsTrigger value="classifica">{t("Classifica")}</TabsTrigger>
          <TabsTrigger value="chat">{t("Chat")}</TabsTrigger>
        </TabsList>

        {/* Compiti */}
        <TabsContent value="compiti" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Link href={`/istruttori/${classId}/nuovo-compito`}>
              <Button>+ Nuovo compito</Button>
            </Link>
          </div>

          {assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("Nessun compito assegnato. Crea il primo selezionando le smazzate dal catalogo.")}
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <Link key={a.id} href={`/istruttori/${classId}/compito/${a.id}`} className="block">
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                        {a.mode === "live" && <Badge>{t("Live")}</Badge>}
                      </div>
                      <CardDescription>
                        {a.smazzata_ids.length} {a.smazzata_ids.length === 1 ? "mano" : "mani"}
                        {a.due_date && ` · scadenza ${new Date(a.due_date).toLocaleDateString("it-IT")}`}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Allievi */}
        <TabsContent value="allievi" className="mt-4">
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("Nessun allievo iscritto. Condividi il codice invito per farli entrare.")}
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {members.map((m) => (
                <div key={m.student_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
                    {(m.display_name ?? "?").charAt(0)}
                  </div>
                  <span className="text-sm font-medium">
                    {m.display_name ?? "Allievo senza nome"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    iscritto il {new Date(m.joined_at).toLocaleDateString("it-IT")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Classifica */}
        <TabsContent value="classifica" className="mt-4">
          <ClassLeaderboard classId={classId} />
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="mt-4">
          <ClassChat classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
