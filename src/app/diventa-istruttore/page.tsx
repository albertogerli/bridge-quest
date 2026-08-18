"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  getMyInstructorRequest,
  submitInstructorRequest,
  type InstructorRequest,
} from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";

export default function DiventaIstruttorePage() {
  const t = useT();
  const { profile, loading: authLoading } = useSharedAuth();
  const isInstructor = profile?.role === "instructor" || profile?.role === "admin";

  const [request, setRequest] = useState<InstructorRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await getMyInstructorRequest();
        if (active) setRequest(r);
      } catch {
        // non-blocking
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitInstructorRequest({
        message: message.trim(),
        asdCode: profile?.asd_code ?? null,
      });
      setSent(true);
      setRequest((prev) =>
        prev
          ? { ...prev, status: "pending", message: message.trim() || null }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invio non riuscito");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a44e]">
          {t("Portale Istruttori")}
        </p>
        <span className="rounded-full bg-[#c8a44e]/15 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-[#9a7b2e] dark:text-[#c8a44e]">
          {t("Beta")}
        </span>
      </div>
      <h1 className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {t("Diventa istruttore")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Il Portale Istruttori ti permette di creare classi virtuali, assegnare compiti
        (mani da giocare e materiale da studiare) e seguire i progressi dei tuoi allievi.
        Le richieste vengono approvate manualmente dallo staff FIGB.
      </p>

      {(loading || authLoading) && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      )}

      {!loading && !authLoading && (
        <>
          {isInstructor ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl">✅</span>
                <p className="font-display text-lg font-semibold">{t("Sei già istruttore")}</p>
                {request?.review_message && (
                  <p className="max-w-sm rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                    💬 {request.review_message}
                  </p>
                )}
                <Link href="/istruttori">
                  <Button>{t("Vai al Portale Istruttori")}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : request?.status === "pending" || sent ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl">⏳</span>
                <p className="font-display text-lg font-semibold">{t("Richiesta in attesa di approvazione")}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {t("Abbiamo ricevuto la tua richiesta. Riceverai accesso al portale non appena verrà approvata.")}
                </p>
              </CardContent>
            </Card>
          ) : request?.status === "rejected" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Richiesta non approvata")}</CardTitle>
                <CardDescription>
                  {t("La tua richiesta precedente non è stata approvata. Puoi inviarne una nuova.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {request?.review_message && (
                  <p className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                    💬 {request.review_message}
                  </p>
                )}
                <RequestForm
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  error={error}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Invia la tua richiesta")}</CardTitle>
                <CardDescription>
                  {t("Raccontaci brevemente chi sei e in quale ASD insegni (facoltativo).")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestForm
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  error={error}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function RequestForm({
  message,
  setMessage,
  onSubmit,
  submitting,
  error,
}: {
  message: string;
  setMessage: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Es. Sono maestro FIGB presso l'ASD Bridge Milano, insegno al corso base del martedì…"
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={onSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Invio…" : "Invia richiesta"}
      </Button>
    </div>
  );
}
