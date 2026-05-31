"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  adminListClasses,
  adminClassDetail,
  type AdminClassRow,
  type AdminClassDetail,
} from "@/lib/instructors";

export default function AdminClassesPage() {
  const { profile, loading: authLoading } = useSharedAuth();
  const isAdmin = profile?.role === "admin";

  const [rows, setRows] = useState<AdminClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, AdminClassDetail>>({});

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      try {
        setRows(await adminListClasses());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!details[id]) {
      try {
        const d = await adminClassDetail(id);
        setDetails((prev) => ({ ...prev, [id]: d }));
      } catch {
        /* ignore */
      }
    }
  }

  if (!authLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Accesso riservato all’amministratore.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Home</Link>
      </div>
    );
  }

  const totalMembers = rows.reduce((s, r) => s + r.member_count, 0);
  const totalAssignments = rows.reduce((s, r) => s + r.assignment_count, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Classi</h1>
        <Link href="/admin/istruttori" className="text-sm text-primary hover:underline">→ Richieste istruttori</Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Tutte le classi create sulla piattaforma.
      </p>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading || authLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Stat label="Classi" value={rows.length} />
            <Stat label="Allievi iscritti" value={totalMembers} />
            <Stat label="Compiti assegnati" value={totalAssignments} />
          </div>

          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nessuna classe creata.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((c) => {
                const open = openId === c.id;
                const d = details[c.id];
                return (
                  <Card key={c.id}>
                    <CardHeader className="cursor-pointer" onClick={() => toggle(c.id)}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{c.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Istruttore: <span className="font-medium text-foreground">{c.instructor_name ?? "—"}</span>{" "}
                            ({c.instructor_email}) {c.asd_code && `· ASD ${c.asd_code}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.member_count} allievi</Badge>
                          <Badge variant="outline">{c.assignment_count} compiti</Badge>
                          <Badge variant="secondary" className="font-mono">{c.invite_code}</Badge>
                          {!c.invite_active && <Badge variant="outline">chiusa</Badge>}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Creata il {new Date(c.created_at).toLocaleDateString("it-IT")} · {open ? "▲ chiudi" : "▼ dettagli"}
                      </p>
                    </CardHeader>

                    {open && (
                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Allievi ({d?.members.length ?? "…"})
                          </p>
                          {d ? (
                            d.members.length ? (
                              <ul className="space-y-1 text-sm">
                                {d.members.map((m) => (
                                  <li key={m.id} className="flex justify-between">
                                    <span>{m.name ?? "Allievo"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(m.joined_at).toLocaleDateString("it-IT")}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">Nessun iscritto.</p>
                            )
                          ) : (
                            <p className="text-sm text-muted-foreground">Caricamento…</p>
                          )}
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Compiti ({d?.assignments.length ?? "…"})
                          </p>
                          {d ? (
                            d.assignments.length ? (
                              <ul className="space-y-1 text-sm">
                                {d.assignments.map((a) => (
                                  <li key={a.id} className="flex justify-between">
                                    <span>{a.title}</span>
                                    <span className="text-xs text-muted-foreground">{a.hands} mani</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">Nessun compito.</p>
                            )
                          ) : (
                            <p className="text-sm text-muted-foreground">Caricamento…</p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
