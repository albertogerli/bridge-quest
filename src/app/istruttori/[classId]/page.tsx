"use client";

import { useEffect, useState, use } from "react";
import { Briciole } from "@/components/briciole";
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
import { AssegnaLezioni } from "@/components/instructors/assegna-lezioni";
import { Rubinetto } from "@/components/istruttori/rubinetto";
import { IngressoAula } from "@/components/istruttori/ingresso-aula";
import { invitoClasse, linkWhatsApp } from "@/lib/whatsapp";
import {
  getClassDetail,
  regenerateInviteCode,
  setInviteActive,
  decidiIscrizione,
  decidiIscrizioni,
  aggiornaImpostazioniClasse,
  ETICHETTE_STATO,
  type ClassDetail,
  type StatoClasse,
} from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";
import { copiaTesto } from "@/lib/appunti";

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
  /** La copia non è riuscita: il codice va letto e trascritto a mano. */
  const [copiaFallita, setCopiaFallita] = useState(false);
  /** Le richieste spuntate, per decidere in blocco. */
  const [selezionate, setSelezionate] = useState<Set<string>>(new Set());
  /** Righe che la decisione in blocco non ha toccato: vanno dette, non nascoste. */
  const [nonDecise, setNonDecise] = useState<number>(0);

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

  /** Decide in blocco le richieste spuntate. */
  async function decidiSelezionate(decisione: "approva" | "respingi") {
    const ids = [...selezionate];
    if (ids.length === 0) return;
    setBusy(true);
    setNonDecise(0);
    try {
      const { nonDecisi } = await decidiIscrizioni(classId, ids, decisione);
      // Se qualcuna non è passata lo si dice: «fatto» per gente rimasta in
      // attesa manderebbe l'insegnante a lezione con una lista sbagliata.
      setNonDecise(nonDecisi.length);
      setSelezionate(new Set());
      await load();
    } finally {
      setBusy(false);
    }
  }

  function spunta(studentId: string) {
    setSelezionate((precedenti) => {
      const nuove = new Set(precedenti);
      if (nuove.has(studentId)) nuove.delete(studentId);
      else nuove.add(studentId);
      return nuove;
    });
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

  /**
   * Il codice invito negli appunti.
   *
   * Qui non c'era nessun `catch`: la promessa rifiutata finiva fra gli errori
   * non gestiti e, peggio, la schermata diceva «copiato» comunque. Su questo
   * codice si regge l'ingresso di tutta la classe, quindi un insegnante che lo
   * incolla e non trova niente lo scopre davanti agli allievi.
   */
  async function copyCode() {
    if (!detail) return;
    const esito = await copiaTesto(detail.classRoom.invite_code);
    if (esito !== "copiato") {
      setCopiaFallita(true);
      setTimeout(() => setCopiaFallita(false), 4000);
      return;
    }
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
      <Briciole
        percorso={[
          { etichetta: "Le tue classi", href: "/istruttori" },
          { etichetta: classRoom.name },
        ]}
      />

      {/* Header */}
      <div className="mb-6">
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
          <span className="text-xs text-muted-foreground">
            {copiaFallita
              ? t("Non è riuscita: leggilo e trascrivilo a mano.")
              : copied
                ? t("Copiato ✓")
                : t("Tocca per copiare")}
          </span>
          {!classRoom.invite_active && (
            <Badge variant="outline">{t("Iscrizioni chiuse")}</Badge>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          {/*
            Il gruppo della classe su WhatsApp esiste già e gli allievi lo
            leggono: un indirizzo `wa.me` con il testo pronto è tutto quello
            che serve per usarlo, senza servizi esterni né permessi.
          */}
          <a
            href={linkWhatsApp(invitoClasse(classRoom.name, classRoom.invite_code))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline">
              {t("Invita su WhatsApp")}
            </Button>
          </a>
          <Link href={`/istruttori/${classId}/aula`}>
            <Button size="sm">{t("Apri l'aula")}</Button>
          </Link>
          <Link href={`/istruttori/${classId}/allievi`}>
            <Button size="sm" variant="outline">
              {t("Allievi e tavoli")}
            </Button>
          </Link>
          <Link href={`/istruttori/${classId}/locandina`}>
            <Button size="sm" variant="outline">
              {t("Locandina da appendere")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={busy}>
            {t("Rigenera codice")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={busy}>
            {classRoom.invite_active ? t("Chiudi iscrizioni") : t("Riapri iscrizioni")}
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

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={classRoom.risultati_nominativi}
              disabled={busy}
              onChange={(e) =>
                void cambiaImpostazione({ risultati_nominativi: e.target.checked })
              }
            />
            <span>
              <span className="font-medium">{t("Nel confronto si vedono i nomi")}</span>
              <span className="block text-xs text-muted-foreground">
                {classRoom.risultati_nominativi
                  ? "Ogni allievo vede chi ha mantenuto e chi no."
                  : "Ognuno vede come è andata agli altri, ma senza nomi. È il modo in cui il confronto resta un aiuto invece che una classifica."}
              </span>
            </span>
          </label>

          {/*
            IL RUBINETTO.
            Sta qui, nelle impostazioni della classe, e non in una schermata a
            parte: l'insegnante lo muove a fine lezione mentre chiude la sala,
            dal telefono, e deve trovarlo dov'è già andato per il resto.
          */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("Quanto portale vedono i tuoi allievi")}</p>
            <Rubinetto
              accessoLibero={classRoom.accesso_libero}
              permessi={classRoom.permessi}
              busy={busy}
              onCambia={(campi) => void cambiaImpostazione(campi)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="link-video" className="text-sm font-medium">
              {t("Stanza di videoconferenza")}
            </label>
            <input
              id="link-video"
              type="url"
              defaultValue={classRoom.link_video ?? ""}
              placeholder="https://meet.google.com/… oppure Zoom"
              disabled={busy}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (classRoom.link_video ?? "")) {
                  void cambiaImpostazione({ link_video: v || null });
                }
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t("Compare all'allievo accanto al materiale, e finisce da solo nel messaggio da mandare sul gruppo.")}
            </p>
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
              <option value="bozza">{t("Bozza — la sto preparando, non si entra")}</option>
              <option value="aperta">{t("Aperta — si entra e si lavora")}</option>
              <option value="chiusa">{t("Chiusa — niente nuovi iscritti, chi c’è continua")}</option>
              <option value="archiviata">{t("Archiviata — corso finito")}</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {t("Chiudere e archiviare non cancella niente: allievi, compiti e risultati restano tutti.")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* L'ingresso in aula, senza registrazione */}
      <div className="mb-6">
        <IngressoAula classId={classId} />
      </div>

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

          {/* Barra delle azioni in blocco. Il caso vero è un corso con quaranta
              aderenti: venti clic sono venti occasioni di sbagliarne uno. */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 pb-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={selezionate.size === inAttesa.length && inAttesa.length > 0}
                onChange={(e) =>
                  setSelezionate(
                    e.target.checked ? new Set(inAttesa.map((m) => m.student_id)) : new Set(),
                  )
                }
              />
              {t("Seleziona tutte")}
            </label>
            {selezionate.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selezionate.size} {t("selezionate")}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void decidiSelezionate("approva")}>
                    {t("Falle entrare")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void decidiSelezionate("respingi")}
                  >
                    {t("Respingi")}
                  </Button>
                </div>
              </>
            )}
          </div>

          {nonDecise > 0 && (
            <p className="border-b border-border px-6 py-3 text-sm text-amber-700 dark:text-amber-300">
              {t("Alcune richieste non sono state applicate e sono rimaste in attesa:")}{" "}
              {nonDecise}. {t("Riprova su quelle rimaste.")}
            </p>
          )}

          <CardContent className="divide-y divide-border p-0">
            {inAttesa.map((m) => (
              <div key={m.student_id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                <label className="flex min-h-11 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={selezionate.has(m.student_id)}
                    onChange={() => spunta(m.student_id)}
                    aria-label={`${t("Seleziona")} ${m.display_name ?? ""}`}
                  />
                </label>
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
          <TabsTrigger value="lezioni">{t("Lezioni")}</TabsTrigger>
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

        {/* Lezioni: assegnare in blocco */}
        <TabsContent value="lezioni" className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            {t("Un tocco assegna tutte le mani della lezione. Per un compito su misura c'è «Nuovo compito».")}
          </p>
          <AssegnaLezioni classId={classId} />
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
