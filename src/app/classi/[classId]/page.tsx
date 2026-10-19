"use client";

import { useCallback, useEffect, useState, use } from "react";
import { Briciole } from "@/components/briciole";
import Link from "@/components/link";
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
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/store/use-catalog-store";
import { SondaggioAllievo } from "@/components/sondaggio-allievo";
import { BenvenutoCorso } from "@/components/classi/benvenuto-corso";
import { useT } from "@/contexts/traduzioni-provider";
import { useAlRitorno } from "@/hooks/use-al-ritorno";
import { statoClasseAllievo, type StatoClasseAllievo } from "@/lib/classe-allievo";
import { segnalaSalvoRete } from "@/lib/report-error";
import { materialiPubblicati } from "@/lib/materiali-lezione-db";
import { raggruppaPerLezione, type MaterialeLezione, type TipoMateriale } from "@/lib/materiali-lezione";
import { CollegamentoMateriale } from "@/components/collegamento-materiale";
import { ClipboardList, FileText } from "lucide-react";

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
  const { courses } = useCatalog();
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

  /**
   * Attivo, in attesa, respinto o non iscritto. Prima la pagina dava per
   * scontato «attivo», e chi era in attesa vedeva tre messaggi sbagliati
   * (vedi `classe-allievo.ts`). Si rilegge al ritorno sulla pagina: quando
   * l'insegnante approva, la classe si apre da sola.
   */
  const [iscrizione, setIscrizione] = useState<StatoClasseAllievo | null>(null);
  const leggiIscrizione = useCallback(() => {
    statoClasseAllievo(classId)
      .then(setIscrizione)
      .catch((err) => segnalaSalvoRete("classe-allievo:stato", err));
  }, [classId]);
  useEffect(() => {
    leggiIscrizione();
  }, [leggiIscrizione]);
  useAlRitorno(leggiIscrizione, 30_000, iscrizione !== null && iscrizione.stato !== "active");
  const attivo = iscrizione?.stato === "active";

  /**
   * I materiali che l'insegnante ha già fatto uscire. Cosa è uscito lo decide
   * il database: qui arrivano solo quelli pubblicati, e se la funzione non è
   * ancora attiva arriva un elenco vuoto e la sezione non compare.
   */
  const [materiali, setMateriali] = useState<MaterialeLezione[]>([]);
  useEffect(() => {
    if (!attivo) return;
    let vivo = true;
    void materialiPubblicati(classId).then((m) => {
      if (vivo) setMateriali(m);
    });
    return () => {
      vivo = false;
    };
  }, [classId, attivo]);

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
    if (!attivo) return;
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
  }, [classId, attivo]);

  function isDone(a: Assignment): boolean {
    const done = progress.get(a.id);
    return !!done && a.smazzata_ids.every((id) => done.has(id));
  }

  /**
   * I corsi da cui vengono i compiti di questa classe.
   *
   * Si ricavano dalle lezioni assegnate invece di chiedere alla classe «di che
   * corso sei»: quel dato non esiste, e un insegnante può benissimo assegnare
   * una lezione di Quadri a una classe nata su Fiori. Così l'elenco segue
   * quello che è stato davvero assegnato.
   */
  const corsiDellaClasse = courses.filter((c) =>
    c.lessons.some((l) => assignments.some((a) => a.lesson_id === l.id)),
  );

  const todo = assignments.filter((a) => !isDone(a));
  const completed = assignments.filter(isDone);
  const nomeClasse = classRoom?.name ?? iscrizione?.nome ?? t("La tua classe");

  if (iscrizione && !attivo) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Briciole percorso={[{ etichetta: "Le mie classi", href: "/classi" }, { etichetta: nomeClasse }]} />
        <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">{nomeClasse}</h1>
        <div className="rounded-2xl border border-amber-400/60 bg-card p-5">
          <p className="font-semibold">
            {iscrizione.stato === "pending"
              ? t("La tua richiesta è in attesa dell'insegnante")
              : iscrizione.stato === "rejected"
                ? t("La tua richiesta non è stata accettata")
                : t("Non sei iscritto a questa classe")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {iscrizione.stato === "pending"
              ? t("Appena ti accetta, qui trovi i compiti, la chat e i materiali del corso. Non serve rimandare il codice.")
              : iscrizione.stato === "rejected"
                ? t("Se pensi sia un errore, parlane con il tuo insegnante.")
                : t("Per entrare ti serve il codice che ti ha dato il tuo insegnante.")}
          </p>
          {iscrizione.stato !== "pending" && (
            <Link href="/classi" className="mt-3 inline-block text-sm font-semibold text-primary">
              {t("Le mie classi →")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le mie classi", href: "/classi" },
          { etichetta: nomeClasse },
        ]}
      />
      <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
        {nomeClasse}
      </h1>

      {classRoom && <BenvenutoCorso classe={classRoom} />}

      <SondaggioAllievo classId={classId} />

      {classRoom?.link_video && (
        <a
          href={classRoom.link_video}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <Video className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">
              {t("Entra in videoconferenza")}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t("La stanza del corso, quella di sempre.")}
            </span>
          </span>
          <span className="ml-auto shrink-0 text-sm font-semibold text-primary">→</span>
        </a>
      )}

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

      {/* Prima dei compiti: dopo la lezione si guarda, si legge, e poi ci si esercita. */}
      {attivo && materiali.length > 0 && <MaterialiDelleLezioni materiali={materiali} />}

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      ) : assignments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Il tuo insegnante non ha ancora assegnato compiti.")}
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

      {/*
        LA CLASSIFICA SOLO SE L'INSEGNANTE L'HA PUBBLICATA. Si vedeva sempre,
        anche quando l'insegnante non aveva ancora raccolto niente, e agli
        allievi in attesa dava un errore. L'interruttore è quello che già
        decide se nel confronto compaiono i nomi: una classifica è proprio
        quello (feedback Trevissoi del 12/10/2026).
      */}
      {attivo && classRoom?.risultati_nominativi && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            🏆 {t("Classifica della classe")}
          </h2>
          <ClassLeaderboard classId={classId} highlightUserId={profile?.id} />
        </section>
      )}

      {/*
        I MATERIALI, RAGGIUNTI DALLA CLASSE.
        Le dispense stanno dove sono sempre state — non si duplica niente — ma
        finora ci si arrivava solo dal menu del portale, e sembravano materiale
        «del sito». Passando dalla classe l'allievo li legge come roba del suo
        corso, che è la richiesta di Giuseppe Trevissoi. Il corso viaggia
        nell'indirizzo: chi fa Quadri non atterra sulle dispense di Fiori.
      */}
      {corsiDellaClasse.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Materiali del corso")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {corsiDellaClasse.map((c) => (
              <Link key={c.id} href={`/dispense?corso=${c.id}`}>
                <Button variant="outline" size="sm">
                  {t("Dispense")} — {c.name}
                </Button>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Le stesse dispense del portale, aperte sul corso che stai seguendo.")}
          </p>
        </section>
      )}

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

const ICONE_MATERIALE: Record<TipoMateriale, typeof Video> = {
  video: Video,
  dispensa: FileText,
  esercizio: ClipboardList,
};

/**
 * Videolezione, dispensa ed esercizio di ogni lezione, come li ha fatti uscire
 * l'insegnante. La lezione uscita per ultima sta in cima: è quella di ieri
 * sera, e chi apre la classe il giorno dopo cerca quella.
 */
function MaterialiDelleLezioni({ materiali }: { materiali: MaterialeLezione[] }) {
  const t = useT();
  const gruppi = raggruppaPerLezione(materiali, "pubblicazione");
  const nomeTipo: Record<TipoMateriale, string> = {
    video: t("Videolezione"),
    dispensa: t("Dispensa"),
    esercizio: t("Esercizio"),
  };
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("Materiali delle lezioni")}
      </h2>
      <div className="space-y-4">
        {gruppi.map((g) => (
          <div key={g.lezione} className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 font-display text-base font-semibold">{g.lezione}</h3>
            <ul className="space-y-2">
              {g.materiali.map((m) => {
                const Icona = ICONE_MATERIALE[m.tipo];
                return (
                  <li key={m.id}>
                    <CollegamentoMateriale
                      url={m.url}
                      className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <Icona className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">{m.titolo}</span>
                        <span className="block text-xs text-muted-foreground">{nomeTipo[m.tipo]}</span>
                      </span>
                      <span className="ml-auto shrink-0 text-sm font-semibold text-primary" aria-hidden="true">
                        →
                      </span>
                    </CollegamentoMateriale>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
