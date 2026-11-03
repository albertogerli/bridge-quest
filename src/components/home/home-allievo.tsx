"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { useCatalog } from "@/store/use-catalog-store";
import {
  getClassAssignments, getMyAssignmentProgress,
  type Assignment, type ClassRoom,
} from "@/lib/instructors";
import { corsiAttivi, daFareAdesso, percorsoDelCorso } from "@/lib/percorso-allievo";
import { reportError, segnalaSalvoRete } from "@/lib/report-error";
import { createClient } from "@/lib/supabase/client";
import { novitaDeiCompiti } from "@/lib/novita-insegnante";
import { BenvenutoCorso } from "@/components/classi/benvenuto-corso";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { ChevronRight, FileText, MessageSquareText, Users } from "lucide-react";
import { CompitoInEvidenza } from "@/components/home/compito-in-evidenza";

/**
 * La home di chi segue un corso.
 *
 * L'ORDINE È UNA RISPOSTA A UNA DOMANDA SOLA. Un allievo apre il portale per
 * sapere «devo fare qualcosa?». Se la risposta è in fondo alla pagina, la
 * risposta non c'è. Quindi: cosa fare, dove sei, i materiali, la classe.
 *
 * CON PIÙ CORSI SI UNISCE L'AZIONE E SI SEPARA LA STRUTTURA. I compiti di tutti
 * i corsi stanno in un elenco solo, per scadenza; i percorsi restano blocchi
 * distinti, perché sono programmi, insegnanti e compagni diversi.
 *
 * NIENTE LINGUETTE, ed è una scelta con due motivi. Il primo: chi ha un compito
 * in scadenza nel corso non selezionato non lo vedrebbe. Il secondo, più
 * profondo: le linguette costringono l'allievo a sapere in quale corso sta una
 * cosa PRIMA di poterla cercare, e quello è un modello mentale da
 * amministratore, non da studente.
 *
 * I DUE TRATTAMENTI CONVIVONO QUI. Le lezioni non ancora assegnate ci sono,
 * grigie, e dichiarano chi le aprirà: sono un pezzo del percorso che aspetta.
 * Le funzioni ludiche non ancora aperte non compaiono affatto — quelle le
 * toglie `permessi-allievo.ts` dalla navigazione. Opposti di proposito.
 */
export function HomeAllievo({ nome, onVaiAllaBacheca }: { nome: string | null; onVaiAllaBacheca: () => void }) {
  const t = useT();
  const { lingua } = useLingua();
  const { classes } = useEnrolledClasses();
  const { courses } = useCatalog();
  const [compiti, setCompiti] = useState<Map<string, Assignment[]>>(new Map());
  const [fatti, setFatti] = useState<Map<string, Set<string>>>(new Map());
  /** Per compito, le mani su cui l'insegnante ha scritto qualcosa di non ancora visto. */
  const [novita, setNovita] = useState<Map<string, string[]>>(new Map());

  const attivi = useMemo(() => corsiAttivi(classes), [classes]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      let ids: string[] = [];
      try {
        // IN PARALLELO, NON IN FILA. Le classi si chiedono tutte insieme:
        // una per volta, con due corsi sono due viaggi in sequenza — e
        // l'insegnante che ne segue quattordici li aspetta tutti e quattordici
        // prima di vedere qualcosa. Le richieste sono indipendenti, quindi
        // metterle in fila non dava nessuna garanzia in cambio del tempo.
        const liste = await Promise.all(attivi.map((c) => getClassAssignments(c.id)));
        const perClasse = new Map<string, Assignment[]>(
          attivi.map((c, i) => [c.id, liste[i]]),
        );
        const tutti: Assignment[] = liste.flat();
        ids = tutti.map((a) => a.id);
        const prog = await getMyAssignmentProgress(tutti.map((a) => a.id));
        if (!vivo) return;
        setCompiti(perClasse);
        setFatti(prog);
      } catch (err) {
        // Il percorso si vede lo stesso: meglio una home senza i compiti che
        // nessuna home.
        reportError("home-allievo:compiti", err);
        return;
      }
      // Dopo i compiti, e a parte: se l'avviso non arriva, la home c'è lo stesso.
      try {
        const { data } = await createClient().auth.getUser();
        if (!data.user) return;
        const n = await novitaDeiCompiti(ids, data.user.id);
        if (vivo) setNovita(n);
      } catch (err) {
        segnalaSalvoRete("home-allievo:novita", err);
      }
    })();
    return () => { vivo = false; };
  }, [attivi]);

  const eFatto = useMemo(
    () => (a: Assignment) => {
      const done = fatti.get(a.id);
      return !!done && a.smazzata_ids.every((id) => done.has(id));
    },
    [fatti],
  );

  const daFare = useMemo(
    () => daFareAdesso(attivi, compiti, eFatto),
    [attivi, compiti, eFatto],
  );

  const piuCorsi = attivi.length > 1;

  /** Le lezioni di un corso, con lo stato che l'allievo vede. */
  function righeDi(classe: ClassRoom) {
    const suoi = compiti.get(classe.id) ?? [];
    const assegnate = new Set(suoi.map((a) => a.lesson_id).filter((n): n is number => n != null));
    const completate = new Set(
      suoi.filter(eFatto).map((a) => a.lesson_id).filter((n): n is number => n != null),
    );
    // Le lezioni del corso da cui vengono i compiti: senza compiti non si sa
    // quale corso sia, e mostrare tutti i corsi sarebbe rumore.
    const corso = courses.find((c) => c.lessons.some((l) => assegnate.has(l.id)));
    if (!corso) return [];
    // Solo le lezioni già aperte dall'insegnante. L'elenco intero, con «la
    // aprirà il tuo insegnante» su tutte le successive, faceva vedere
    // all'allievo quanto mancava invece di quello che ha fatto — e il
    // percorso lo decide l'insegnante, può cambiare (Trevissoi, feedback 5).
    return percorsoDelCorso(corso.lessons.map((l) => l.id), assegnate, completate)
      .filter((r) => r.stato !== "in-attesa")
      .map((r) => ({ ...r, titolo: corso.lessons.find((l) => l.id === r.lessonId)?.title ?? "" }));
  }

  /** Il giorno in cui l'insegnante ha aperto la lezione: il primo compito che la porta. */
  function apertaIl(classe: ClassRoom, lessonId: number) {
    const date = (compiti.get(classe.id) ?? [])
      .filter((a) => a.lesson_id === lessonId)
      .map((a) => a.created_at)
      .sort();
    return date[0]
      ? new Date(date[0]).toLocaleDateString(lingua === "en" ? "en-US" : "it-IT", { day: "numeric", month: "short" })
      : "";
  }
  /** Il compito con cui riprendere una lezione in corso. */
  function compitoDellaLezione(classe: ClassRoom, lessonId: number) {
    return (compiti.get(classe.id) ?? []).find((a) => a.lesson_id === lessonId && !eFatto(a))
      ?? (compiti.get(classe.id) ?? []).find((a) => a.lesson_id === lessonId);
  }

  const [primo, ...altri] = daFare;
  const giocateDi = (a: Assignment) => a.smazzata_ids.filter((id) => fatti.get(a.id)?.has(id)).length;

  /*
   * DIREZIONE «IBRIDO» (02/11/2026). Luce calda per leggere, panno appena
   * compaiono le carte: il compito da fare è l'unica cosa grande, con le carte
   * della prossima mano. Il resto sono righe semplici. Sul computer due colonne
   * vere invece di una colonna stretta al centro. L'ordine delle cose non
   * cambia: cosa fare, dove sei, i materiali, la classe.
   */
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {nome ? t("Ciao {nome}", { nome }) : t("Ciao")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {piuCorsi
            ? t("Segui {n} corsi", { n: attivi.length })
            : [attivi[0]?.name, attivi[0]?.asd_code].filter(Boolean).join(" · ")}
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        {/* ── Da fare adesso ─────────────────────────────────────────────── */}
        <div className="grid gap-4">
          <AvvisoInsegnante compiti={compiti} novita={novita} classi={piuCorsi ? attivi : []} />
          {!primo ? (
            <section className="rounded-3xl bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Da fare adesso")}</p>
              <p className="mt-2 text-muted-foreground">{t("Niente da fare in questo momento. Te lo diremo quando arriva.")}</p>
            </section>
          ) : (
            /* «Riprendi» solo a chi ha cominciato: era scritto anche su un
               compito mai aperto (Trevissoi, feedback 5). */
            <CompitoInEvidenza
              assignment={primo.assignment}
              classe={primo.classe}
              giocate={giocateDi(primo.assignment)}
              prossima={primo.assignment.smazzata_ids.find((id) => !fatti.get(primo.assignment.id)?.has(id)) ?? null}
              conClasse={piuCorsi}
            />
          )}
          {altri.length > 0 && (
            <section>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Dopo")}</h2>
              <ul className="divide-y divide-border">
                {altri.map(({ assignment, classe }) => {
                  const giocate = giocateDi(assignment);
                  return (
                    <li key={assignment.id}>
                      <Link
                        href={`/classi/${classe.id}/compito/${assignment.id}`}
                        className="flex min-h-14 items-center gap-3 py-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{assignment.title}</span>
                          <span className="block text-sm text-muted-foreground tabular-nums">
                            {piuCorsi ? `${classe.name} · ` : ""}
                            {giocate === 0
                              ? `${assignment.smazzata_ids.length} ${t("mani")}`
                              : t("Riprendi · {n} di {m}", { n: giocate, m: assignment.smazzata_ids.length })}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <div className="grid gap-8">
          {!piuCorsi && attivi[0] && <BenvenutoCorso classe={attivi[0]} />}

          {/* ── Il percorso, un blocco per corso ───────────────────────── */}
          {attivi.map((classe) => {
            const righe = righeDi(classe);
            if (righe.length === 0) return null;
            return (
              <section key={classe.id}>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {piuCorsi ? classe.name : t("Il tuo percorso")}
                </h2>
                <ol className="divide-y divide-border">
                  {righe.map((r) => {
                    const compito = r.stato === "in-corso" ? compitoDellaLezione(classe, r.lessonId) : undefined;
                    return (
                      <li key={r.lessonId} className="grid grid-cols-[3.25rem_2rem_1fr_auto] items-center gap-3 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{apertaIl(classe, r.lessonId)}</span>
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            r.stato === "completata"
                              ? "bg-emerald-700 text-white"
                              : r.stato === "in-corso"
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                : "bg-muted text-muted-foreground"
                          }`}
                          aria-hidden="true"
                        >
                          {r.stato === "completata" ? "✓" : r.numero}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">
                            {t("Lezione")} {r.numero} · {r.titolo}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            {r.stato === "completata"
                              ? t("completata")
                              : r.stato === "in-corso"
                                ? t("in corso")
                                : /* Si dichiara, non sparisce: genera attesa invece di sospetto. */
                                  t("la aprirà il tuo insegnante")}
                          </span>
                        </span>
                        {compito ? (
                          <Link href={`/classi/${classe.id}/compito/${compito.id}`}>
                            <Button size="sm">{t("Apri")}</Button>
                          </Link>
                        ) : <span />}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}

          {/* ── Materiali e classe ─────────────────────────────────────── */}
          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Per il corso")}</h2>
            <ul className="divide-y divide-border">
              {attivi.map((c) => (
                // La classe viaggia nell'indirizzo: chi ci torna da un link non deve
                // trovarsi «le dispense del sito» invece dei materiali del suo corso.
                <RigaLink key={`d-${c.id}`} href={`/dispense?classe=${c.id}`} icona={<FileText className="h-5 w-5" aria-hidden="true" />}>
                  {piuCorsi ? `${t("Dispense")} — ${c.name}` : t("Dispense del corso")}
                </RigaLink>
              ))}
              {attivi.map((c) => (
                <RigaLink key={`c-${c.id}`} href={`/classi/${c.id}`} icona={<Users className="h-5 w-5" aria-hidden="true" />}>
                  {piuCorsi ? c.name : t("La tua classe")}
                </RigaLink>
              ))}
            </ul>
            {piuCorsi && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("Due chat separate: i compagni non sono gli stessi.")}
              </p>
            )}
          </section>

          {/*
            IL RESTO DEL PORTALE LO APRE L'INSEGNANTE. Il cursore «Quanto del
            portale è aperto» c'era già nelle impostazioni della classe, ma questo
            pulsante lo ignorava: compariva dal primo giorno, e l'allievo usciva
            dal percorso del corso prima del tempo (Trevissoi, feedback 5: «deve
            essere attivabile dall'insegnante, verso il termine del corso»).
          */}
          {attivi.some((c) => c.accesso_libero !== "solo-il-corso") && (
            <button
              onClick={onVaiAllaBacheca}
              className="min-h-11 justify-self-start text-sm text-muted-foreground underline underline-offset-4"
            >
              {t("Vai al resto del portale")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * «Il tuo insegnante ti ha scritto»: commenti e risposte sulle mani non ancora
 * visti, un compito per riga. In cima, perché è l'unica cosa della home che
 * qualcuno ha scritto apposta per questo allievo. Sparisce quando apre il compito.
 */
function AvvisoInsegnante({
  compiti,
  novita,
  classi,
}: {
  compiti: Map<string, Assignment[]>;
  novita: Map<string, string[]>;
  /** Con più corsi, per scrivere di quale classe è il compito. */
  classi: ClassRoom[];
}) {
  const t = useT();
  const righe = [...compiti.entries()].flatMap(([classId, lista]) =>
    lista.filter((a) => novita.has(a.id)).map((a) => ({ classId, a, mani: novita.get(a.id)!.length })),
  );
  if (righe.length === 0) return null;
  return (
    <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5" aria-live="polite">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("Il tuo insegnante ti ha scritto")}
      </p>
      <ul className="mt-2 divide-y divide-primary/15">
        {righe.map(({ classId, a, mani }) => (
          <li key={a.id}>
            <Link href={`/classi/${classId}/compito/${a.id}`} className="flex min-h-12 items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{a.title}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {classi.length > 0 ? `${classi.find((c) => c.id === classId)?.name ?? ""} · ` : ""}
                  {mani === 1 ? t("Su una mano") : t("Su {n} mani", { n: mani })}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RigaLink({ href, icona, children }: { href: string; icona: React.ReactNode; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center gap-3 py-3 font-medium">
        <span className="text-muted-foreground">{icona}</span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}
