"use client";

import { useEffect, useState, use } from "react";
import { Briciole } from "@/components/briciole";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getClassAssignments,
  getMyAssignmentProgress,
  type Assignment,
} from "@/lib/instructors";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { ClassChat } from "@/components/instructor/class-chat";
import { ClassLeaderboard } from "@/components/instructors/class-leaderboard";
import { useSharedAuth } from "@/contexts/auth-provider";
import { getOpenLiveTable } from "@/lib/live-table";
import { useT } from "@/contexts/traduzioni-provider";

export default function StudentClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);
  const { classes } = useEnrolledClasses();
  const classRoom = classes.find((c) => c.id === classId);
  const { profile } = useSharedAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  /**
   * Il tavolo aperto dall'insegnante.
   *
   * La pagina dell'insegnante dice «gli allievi lo trovano nella loro classe»,
   * e non era vero: nessun collegamento in tutta l'app puntava al tavolo:
   * l'unico modo di arrivarci era digitare l'indirizzo a mano. Si ricontrolla
   * ogni quindici secondi, perché la classe la si apre prima della lezione e
   * il tavolo arriva dopo.
   */
  const [tavoloAperto, setTavoloAperto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const cerca = () => {
      void getOpenLiveTable(classId).then((id) => {
        if (vivo) setTavoloAperto(id);
      });
    };
    cerca();
    const t = setInterval(cerca, 15000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [classId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getClassAssignments(classId);
        const prog = await getMyAssignmentProgress(list.map((a) => a.id));
        if (active) {
          setAssignments(list);
          setProgress(prog);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Errore nel caricamento");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [classId]);

  function isDone(a: Assignment): boolean {
    const done = progress.get(a.id);
    return !!done && a.smazzata_ids.every((id) => done.has(id));
  }

  const todo = assignments.filter((a) => !isDone(a));
  const completed = assignments.filter(isDone);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le mie classi", href: "/classi" },
          { etichetta: classRoom?.name ?? "Classe" },
        ]}
      />
      <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {classRoom?.name ?? "Classe"}
      </h1>

      {tavoloAperto && (
        <Link
          href={`/classi/${classId}/tavolo`}
          className="mb-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">{t("C'è un tavolo aperto")}</span>
            <span className="block text-xs text-muted-foreground">
              {t("L'insegnante sta mostrando una mano adesso.")}
            </span>
          </span>
          <span className="ml-auto shrink-0 text-sm font-semibold text-primary">{t("Entra →")}</span>
        </Link>
      )}

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      ) : assignments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Il tuo istruttore non ha ancora assegnato compiti.")}
        </p>
      ) : (
        <div className="space-y-8">
          <AssignmentSection
            label="Da fare"
            items={todo}
            classId={classId}
            progress={progress}
            emptyText="Tutto fatto! 🎉"
          />
          {completed.length > 0 && (
            <AssignmentSection
              label="Completati"
              items={completed}
              classId={classId}
              progress={progress}
              done
            />
          )}
        </div>
      )}

      {/* Class leaderboard */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          🏆 Classifica della classe
        </h2>
        <ClassLeaderboard classId={classId} highlightUserId={profile?.id} />
      </section>

      {/* Class chat */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Chat della classe")}
        </h2>
        <ClassChat classId={classId} />
      </section>
    </div>
  );
}

function AssignmentSection({
  label,
  items,
  classId,
  progress,
  done = false,
  emptyText,
}: {
  label: string;
  items: Assignment[];
  classId: string;
  progress: Map<string, Set<string>>;
  done?: boolean;
  emptyText?: string;
}) {
  const t = useT();
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const doneCount = progress.get(a.id)?.size ?? 0;
            return (
              <Link
                key={a.id}
                href={`/classi/${classId}/compito/${a.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      {done ? (
                        <Badge>{t("Completato ✓")}</Badge>
                      ) : (
                        <Badge variant="outline">
                          {doneCount}/{a.smazzata_ids.length}
                        </Badge>
                      )}
                    </div>
                    {a.instructor_note && (
                      <CardDescription>{a.instructor_note}</CardDescription>
                    )}
                    {a.due_date && (
                      <CardDescription>
                        Scadenza: {new Date(a.due_date).toLocaleDateString("it-IT")}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
