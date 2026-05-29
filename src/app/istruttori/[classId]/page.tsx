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
import {
  getClassDetail,
  regenerateInviteCode,
  setInviteActive,
  type ClassDetail,
} from "@/lib/instructors";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
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
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Classe non trovata"}</p>
        <Link href="/istruttori" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Torna alle classi
        </Link>
      </div>
    );
  }

  const { classRoom, members, assignments } = detail;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/istruttori" className="text-sm text-muted-foreground hover:underline">
        ← Le tue classi
      </Link>

      {/* Header */}
      <div className="mt-3 mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {classRoom.name}
        </h1>
        {classRoom.description && (
          <p className="mt-1 text-sm text-muted-foreground">{classRoom.description}</p>
        )}
      </div>

      {/* Invite code panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Codice invito</CardTitle>
          <CardDescription>
            Condividilo con gli allievi: lo inseriscono nella sezione “Le mie classi”.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyCode}
            className="rounded-lg bg-muted px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] transition-colors hover:bg-muted/70"
            title="Copia"
          >
            {classRoom.invite_code}
          </button>
          <span className="text-xs text-muted-foreground">{copied ? "Copiato ✓" : "Tocca per copiare"}</span>
          {!classRoom.invite_active && (
            <Badge variant="outline">Iscrizioni chiuse</Badge>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={busy}>
            Rigenera codice
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={busy}>
            {classRoom.invite_active ? "Chiudi iscrizioni" : "Riapri iscrizioni"}
          </Button>
        </CardFooter>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="compiti">
        <TabsList>
          <TabsTrigger value="compiti">Compiti ({assignments.length})</TabsTrigger>
          <TabsTrigger value="allievi">Allievi ({members.length})</TabsTrigger>
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
              Nessun compito assegnato. Crea il primo selezionando le smazzate dal catalogo.
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <Link key={a.id} href={`/istruttori/${classId}/compito/${a.id}`} className="block">
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                        {a.mode === "live" && <Badge>Live</Badge>}
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
              Nessun allievo iscritto. Condividi il codice invito per farli entrare.
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
      </Tabs>
    </div>
  );
}
