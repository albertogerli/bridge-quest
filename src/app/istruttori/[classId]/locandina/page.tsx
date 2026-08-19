"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { getClassDetail, type ClassRoom } from "@/lib/instructors";
import { indirizzoIscrizione, qrSvg } from "@/lib/qr";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La locandina da appendere, con il codice della classe e il suo QR.
 *
 * A COSA SERVE. Il codice d'invito oggi si comunica a voce o su WhatsApp, e in
 * un circolo la lezione di prova la si annuncia con un foglio appeso in
 * bacheca. Questo è quel foglio: si stampa, si appende, chi passa inquadra.
 *
 * IL QR NON ISCRIVE NESSUNO. Porta alla pagina delle classi con il codice già
 * scritto — inquadrare un cartello appeso al muro non è un consenso a entrare
 * da qualche parte, e serve comunque un account. Toglie l'unico passaggio che
 * si può togliere: copiare sei caratteri a mano davanti a una bacheca.
 *
 * Su carta sparisce tutto quello che su carta non serve, con lo stesso
 * `@media print` che usa già la dispensa. Il nero è nero: le stampanti dei
 * circoli sono in bianco e nero, e un QR grigio chiaro non lo legge nessuno.
 */
export default function LocandinaPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = useT();
  const { classId } = use(params);
  const [classe, setClasse] = useState<ClassRoom | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void getClassDetail(classId)
      .then((d) => {
        if (vivo) setClasse(d.classRoom);
      })
      .catch((err) => {
        reportError("locandina:classe", err);
        if (vivo) setErrore("Non riesco a leggere questa classe.");
      });
    return () => {
      vivo = false;
    };
  }, [classId]);

  const indirizzo = classe ? indirizzoIscrizione(classe.invite_code) : "";
  const svg = useMemo(() => (indirizzo ? qrSvg(indirizzo) : ""), [indirizzo]);

  if (errore) {
    return <p className="mx-auto max-w-2xl px-4 py-10 text-sm text-destructive">{errore}</p>;
  }

  if (!classe) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  const scaduto =
    classe.invite_expires_at !== null && new Date(classe.invite_expires_at) <= new Date();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="print:hidden">
        <Briciole
          percorso={[
            { etichetta: "Le tue classi", href: "/istruttori" },
            { etichetta: classe.name, href: `/istruttori/${classId}` },
            { etichetta: "Locandina" },
          ]}
        />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("Stampa")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("Un foglio A4 da appendere in bacheca.")}
          </p>
        </div>
        {!classe.invite_active && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {t("Le iscrizioni di questa classe sono chiuse: chi inquadra il codice non entrerà.")}
          </p>
        )}
        {scaduto && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {t("Il codice è scaduto: prima di stampare, sposta o togli la scadenza.")}
          </p>
        )}
      </div>

      <article className="rounded-2xl border border-border p-8 text-center print:border-0 print:p-0 print:text-black">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground print:text-black">
          {t("Corso di bridge")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight print:text-black">
          {classe.name}
        </h1>
        {classe.description && (
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground print:text-black">
            {classe.description}
          </p>
        )}

        <div
          className="mx-auto mt-8 w-56 print:w-64"
          // Il QR è generato qui, non scaricato: nessun servizio esterno vede
          // i codici d'invito delle classi.
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <p className="mt-6 text-sm text-muted-foreground print:text-black">
          {t("Inquadra il codice, oppure vai su")}{" "}
          <span className="font-semibold">bridgelab.it/classi</span>{" "}
          {t("e inserisci")}
        </p>
        <p className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] print:text-black">
          {classe.invite_code}
        </p>

        {classe.invite_expires_at && !scaduto && (
          <p className="mt-4 text-xs text-muted-foreground print:text-black">
            Valido fino al{" "}
            {new Date(classe.invite_expires_at).toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        <p className="mt-8 text-xs text-muted-foreground print:text-black">
          {t("Bridge LAB · un progetto della Federazione Italiana Gioco Bridge")}
        </p>
      </article>
    </div>
  );
}
