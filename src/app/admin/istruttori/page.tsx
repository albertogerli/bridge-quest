"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  listInstructorRequests,
  reviewInstructorRequest,
  type InstructorRequestAdminRow,
  type InstructorRequestStatus,
} from "@/lib/instructors";

const FILTERS: { value: InstructorRequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "In attesa" },
  { value: "approved", label: "Approvate" },
  { value: "rejected", label: "Rifiutate" },
  { value: "all", label: "Tutte" },
];

export default function AdminInstructorRequestsPage() {
  const { profile, loading: authLoading } = useSharedAuth();
  const isAdmin = profile?.role === "admin";

  const [filter, setFilter] = useState<InstructorRequestStatus | "all">("pending");
  const [rows, setRows] = useState<InstructorRequestAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInstructorRequests(filter === "all" ? undefined : filter);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  async function act(id: string, approve: boolean) {
    setActingId(id);
    try {
      await reviewInstructorRequest(id, approve);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Azione non riuscita");
    } finally {
      setActingId(null);
    }
  }

  if (!authLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Accesso riservato all’amministratore.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
        Richieste istruttori
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Approva o rifiuta le candidature al Portale Istruttori.
      </p>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading || authLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nessuna richiesta in questa categoria.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{r.display_name ?? "Utente"}</CardTitle>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm text-muted-foreground">{r.email}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.asd_code && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">ASD:</span> {r.asd_code}
                  </p>
                )}
                {r.message && (
                  <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">{r.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Inviata il {new Date(r.created_at).toLocaleString("it-IT")}
                </p>
                {r.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => act(r.id, true)}
                      disabled={actingId === r.id}
                    >
                      ✓ Approva
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(r.id, false)}
                      disabled={actingId === r.id}
                    >
                      Rifiuta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: InstructorRequestStatus }) {
  if (status === "approved") return <Badge>Approvata</Badge>;
  if (status === "rejected") return <Badge variant="outline">Rifiutata</Badge>;
  return <Badge variant="secondary">In attesa</Badge>;
}
