"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { useCatalog } from "@/store/use-catalog-store";
import {
  getClassAssignments, getMyAssignmentProgress,
  type Assignment, type ClassRoom,
} from "@/lib/instructors";
import { corsiAttivi, daFareAdesso, percorsoDelCorso } from "@/lib/percorso-allievo";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

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
export function HomeAllievo({ onVaiAllaBacheca }: { onVaiAllaBacheca: () => void }) {
  const t = useT();
  const { classes } = useEnrolledClasses();
  const { courses } = useCatalog();
  const [compiti, setCompiti] = useState<Map<string, Assignment[]>>(new Map());
  const [fatti, setFatti] = useState<Map<string, Set<string>>>(new Map());

  const attivi = useMemo(() => corsiAttivi(classes), [classes]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const perClasse = new Map<string, Assignment[]>();
        const tutti: Assignment[] = [];
        for (const c of attivi) {
          const lista = await getClassAssignments(c.id);
          perClasse.set(c.id, lista);
          tutti.push(...lista);
        }
        const prog = await getMyAssignmentProgress(tutti.map((a) => a.id));
        if (!vivo) return;
        setCompiti(perClasse);
        setFatti(prog);
      } catch (err) {
        // Il percorso si vede lo stesso: meglio una home senza i compiti che
        // nessuna home.
        reportError("home-allievo:compiti", err);
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
    return percorsoDelCorso(corso.lessons.map((l) => l.id), assegnate, completate)
      .map((r) => ({ ...r, titolo: corso.lessons.find((l) => l.id === r.lessonId)?.title ?? "" }));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-5">
      <h1 className="font-display text-2xl font-bold">
        {piuCorsi ? t("I tuoi corsi") : (attivi[0]?.name ?? t("Il tuo corso"))}
      </h1>
      {!piuCorsi && attivi[0]?.asd_code && (
        <p className="mt-1 text-sm text-muted-foreground">{attivi[0].asd_code}</p>
      )}

      {/* ── Da fare adesso ───────────────────────────────────────────────── */}
      <h2 className="mt-7 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("Da fare adesso")}
      </h2>
      {daFare.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {t("Niente da fare in questo momento. Te lo diremo quando arriva.")}
        </p>
      ) : (
        daFare.map(({ assignment, classe }) => (
          <div key={assignment.id} className="mb-2 rounded-xl bg-card p-4 shadow-sm">
            {piuCorsi && (
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
                {classe.name}
              </p>
            )}
            <p className="font-semibold">{assignment.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {assignment.smazzata_ids.length} {t("mani")}
            </p>
            <Link href={`/classi/${classe.id}/compito/${assignment.id}`}>
              <Button size="sm" className="mt-3">{t("Riprendi")}</Button>
            </Link>
          </div>
        ))
      )}

      {/* ── Il percorso, un blocco per corso ─────────────────────────────── */}
      {attivi.map((classe) => {
        const righe = righeDi(classe);
        if (righe.length === 0) return null;
        return (
          <section key={classe.id}>
            <h2 className="mt-7 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {piuCorsi ? classe.name : t("Il tuo percorso")}
            </h2>
            <div className="divide-y divide-border rounded-xl bg-card px-4 shadow-sm">
              {righe.map((r) => (
                <div key={r.lessonId} className="flex items-center gap-3 py-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      r.stato === "completata"
                        ? "bg-emerald-700 text-white"
                        : r.stato === "in-corso"
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.stato === "completata" ? "✓" : r.numero}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-sm ${r.stato === "in-attesa" ? "text-muted-foreground" : "font-medium"}`}>
                      {t("Lezione")} {r.numero} — {r.titolo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.stato === "completata"
                        ? t("completata")
                        : r.stato === "in-corso"
                          ? t("in corso")
                          : /* Si dichiara, non sparisce: genera attesa invece di sospetto. */
                            t("la aprirà il tuo insegnante")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* ── Materiali e classe ───────────────────────────────────────────── */}
      <h2 className="mt-7 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("Materiali")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {attivi.map((c) => (
          // La classe viaggia nell'indirizzo: chi ci torna da un link non deve
          // trovarsi «le dispense del sito» invece dei materiali del suo corso.
          <Link key={c.id} href={`/dispense?classe=${c.id}`}>
            <Button variant="outline" size="sm">
              {piuCorsi ? `${t("Dispense")} — ${c.name}` : t("Dispense del corso")}
            </Button>
          </Link>
        ))}
      </div>

      <h2 className="mt-7 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {piuCorsi ? t("Le tue classi") : t("La tua classe")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {attivi.map((c) => (
          <Link key={c.id} href={`/classi/${c.id}`}>
            <Button variant="outline" size="sm">{c.name}</Button>
          </Link>
        ))}
      </div>
      {piuCorsi && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("Due chat separate: i compagni non sono gli stessi.")}
        </p>
      )}

      {/* Il portale resta raggiungibile: le funzioni non proposte non sono
          vietate, e chi le cerca deve poterle trovare. */}
      <button
        onClick={onVaiAllaBacheca}
        className="mt-8 min-h-11 text-sm text-muted-foreground underline underline-offset-4"
      >
        {t("Vai al resto del portale")}
      </button>
    </div>
  );
}
