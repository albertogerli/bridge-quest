"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { GraduationCap, Users, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STRUMENTI_LEZIONE } from "@/components/istruttori/strumenti-lezione";
import { getMyClasses, getClassDetail, ETICHETTE_STATO, type ClassRoom } from "@/lib/instructors";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La home di chi insegna.
 *
 * PERCHÉ NE SERVIVA UNA. `profiles.role` esiste da sempre e nessuno lo
 * guardava per decidere cosa mostrare: dopo il login l'insegnante atterrava
 * sulla stessa bacheca dell'allievo, con la sua striscia di giorni e i suoi
 * XP, e il portale delle classi era da cercare nel menù. La prima cosa che
 * vede chi apre il sito dovrebbe essere il suo lavoro.
 *
 * NON SOSTITUISCE LA BACHECA, LA ANTICIPA. Un insegnante è anche uno che
 * gioca — molti fanno i corsi e poi si allenano come tutti — e togliergli
 * progressi e striscia sarebbe una perdita, non una semplificazione. Sotto c'è
 * un collegamento che ci riporta, e la scelta resta memorizzata.
 *
 * LE RICHIESTE IN ATTESA SONO IL MOTIVO PRINCIPALE per cui questa pagina
 * esiste: da quando l'approvazione manuale è possibile, un allievo che aspetta
 * è qualcuno che non può fare i compiti. Se nessuno guarda, aspetta e basta.
 */

const CHIAVE_PREFERENZA = "bq_home_allievo";

export function HomeInsegnante({
  nome,
  onVaiAllaBacheca,
}: {
  nome: string | null;
  onVaiAllaBacheca: () => void;
}) {
  const t = useT();
  const [classi, setClassi] = useState<ClassRoom[]>([]);
  const [inAttesa, setInAttesa] = useState<Record<string, number>>({});
  const [caricando, setCaricando] = useState(true);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const elenco = await getMyClasses();
        if (!vivo) return;
        setClassi(elenco);

        /**
         * Il conteggio delle richieste costa una lettura per classe, ma solo
         * per quelle in cui l'approvazione è manuale: sulle altre non ci può
         * essere nessuno in attesa, e chiederlo sarebbe traffico per una
         * risposta nota.
         */
        const daControllare = elenco.filter(
          (c) => !c.approvazione_automatica && c.stato !== "archiviata",
        );
        const conteggi: Record<string, number> = {};
        await Promise.all(
          daControllare.map(async (c) => {
            try {
              const d = await getClassDetail(c.id);
              if (d.inAttesa.length > 0) conteggi[c.id] = d.inAttesa.length;
            } catch (err) {
              reportError("home-insegnante:attesa", err);
            }
          }),
        );
        if (vivo) setInAttesa(conteggi);
      } catch (err) {
        reportError("home-insegnante:classi", err);
      } finally {
        if (vivo) setCaricando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const attive = classi.filter((c) => c.stato !== "archiviata");
  const totaleInAttesa = Object.values(inAttesa).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a44e]">
          {t("Area insegnanti")}
        </p>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {nome ? `Ciao ${nome}` : "Ciao"}
        </h1>
      </motion.div>

      {totaleInAttesa > 0 && (
        <div className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-bold text-foreground">
            {totaleInAttesa === 1
              ? "Un allievo aspetta di essere approvato"
              : `${totaleInAttesa} allievi aspettano di essere approvati`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("Finché non decidi non vedono compiti né chat.")}
          </p>
        </div>
      )}

      {/* Le classi */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("Le tue classi")}</h2>
          <Link href="/istruttori" className="text-sm text-primary hover:underline">
            {t("Tutte")} <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>

        {caricando ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : attive.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <GraduationCap className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {t("Non hai ancora classi. Creane una e avrai un codice da dare agli allievi.")}
            </p>
            <Link href="/istruttori">
              <Button className="mt-3" size="sm">
                {t("Crea la prima classe")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {attive.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/istruttori/${c.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-base font-semibold">{c.name}</span>
                  {inAttesa[c.id] ? (
                    <Badge className="shrink-0">{inAttesa[c.id]} in attesa</Badge>
                  ) : (
                    c.stato !== "aperta" && (
                      <Badge variant="secondary" className="shrink-0">
                        {ETICHETTE_STATO[c.stato]}
                      </Badge>
                    )
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("Codice")} <span className="font-mono tracking-widest">{c.invite_code}</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Gli strumenti della lezione */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold">{t("Per la lezione")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STRUMENTI_LEZIONE.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <s.icona className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{s.titolo}</span>
                <span className="block text-xs text-muted-foreground">{s.descrizione}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <button
        onClick={onVaiAllaBacheca}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {t("Vai alla tua bacheca: lezioni, striscia, punti")}
      </button>
    </div>
  );
}

/** Se chi insegna ha chiesto di vedere la bacheca dell'allievo. */
export function preferisceLaBacheca(): boolean {
  try {
    return localStorage.getItem(CHIAVE_PREFERENZA) === "1";
  } catch {
    return false;
  }
}

export function ricordaPreferenzaBacheca(bacheca: boolean): void {
  try {
    if (bacheca) localStorage.setItem(CHIAVE_PREFERENZA, "1");
    else localStorage.removeItem(CHIAVE_PREFERENZA);
  } catch {}
}
