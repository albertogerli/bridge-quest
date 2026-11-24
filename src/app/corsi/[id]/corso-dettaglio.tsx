"use client";

import {
  CalendarDays,
  Clock,
  Euro,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import {
  ETICHETTA_LIVELLO,
  linkTelefono,
  linkWhatsapp,
  orariLeggibili,
  type CorsoPubblico,
} from "@/lib/corsi";
import {
  BollinoTipo,
  Locandina,
  dataCorso,
  linkMappa,
} from "@/components/corsi/scheda-corso";

export function CorsoDettaglio({ corso }: { corso: CorsoPubblico }) {
  const t = useT();
  const { lingua } = useLingua();
  const c = corso.circolo;
  return (
    <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      {/* Senza locandina la colonna di destra non c'è: un riquadro grigio
          grande quanto un foglio non dice niente in più del titolo. */}
      <div
        className={`grid items-start gap-6 ${corso.locandinaUrl ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]" : "max-w-3xl"}`}
      >
        <div className="grid gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <BollinoTipo tipo={corso.tipo} />
              <span className="text-sm font-semibold text-muted-foreground">
                {t(ETICHETTA_LIVELLO[corso.livello])}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold text-balance">
              {c.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {[c.address, c.city].filter(Boolean).join(", ")}
            </p>
          </div>

          <section
            className="grid gap-3 rounded-2xl border border-border bg-card p-5"
            aria-label={t("Quando e con chi")}
          >
            <p className="flex items-start gap-3">
              <CalendarDays
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>
                {t("Prima lezione {data}", {
                  data: dataCorso(corso.primaLezione, lingua, true),
                })}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <Clock
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="tabular-nums">
                {orariLeggibili(corso.orari, t)}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <User
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{t("Maestro: {nome}", { nome: corso.maestro })}</span>
            </p>
            {corso.costo && (
              <p className="flex items-start gap-3">
                <Euro
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-pretty">{corso.costo}</span>
              </p>
            )}
            {corso.note && (
              <p className="whitespace-pre-line text-pretty text-muted-foreground">
                {corso.note}
              </p>
            )}
          </section>

          <section className="flex flex-wrap gap-2" aria-label={t("Contatti")}>
            <a
              href={linkTelefono(corso.telefono)}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Phone className="size-5" aria-hidden="true" />
              <span className="tabular-nums">
                {t("Chiama {telefono}", { telefono: corso.telefono })}
              </span>
            </a>
            {corso.whatsapp && (
              <a
                href={linkWhatsapp(corso.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 font-semibold hover:bg-muted"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {corso.email && (
              <a
                href={`mailto:${corso.email}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 font-semibold hover:bg-muted"
              >
                <Mail className="size-5" aria-hidden="true" />
                {t("Scrivi")}
              </a>
            )}
            <a
              href={linkMappa(c)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 font-semibold hover:bg-muted"
            >
              <MapPin className="size-5" aria-hidden="true" />
              {t("Come arrivare")}
            </a>
          </section>

          {(corso.programma || corso.programmaUrl) && (
            <section
              className="rounded-2xl border border-border bg-card p-5"
              aria-labelledby="programma"
            >
              <h2 id="programma" className="font-display text-xl font-bold">
                {t("Programma delle lezioni")}
              </h2>
              {corso.programma && (
                <p className="mt-2 whitespace-pre-line text-pretty">
                  {corso.programma}
                </p>
              )}
              {corso.programmaUrl && (
                <a
                  href={corso.programmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
                >
                  <FileText className="size-4" aria-hidden="true" />
                  {t("Programma in PDF")}
                </a>
              )}
            </section>
          )}

          {corso.tipo === "bridge-5" && (
            <p className="text-sm text-pretty text-muted-foreground">
              {t(
                "Bridge 5.0 è il nuovo metodo FIGB: si impara giocando da subito, con le lezioni e le mani su BridgeLab anche fra un incontro e l'altro.",
              )}
            </p>
          )}

          <Link
            href="/corsi"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("Tutti i corsi")}
          </Link>
        </div>

        {corso.locandinaUrl && (
          <aside className="grid gap-2">
            <Locandina corso={corso} grande />
            {
              <a
                href={corso.locandinaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <FileText className="size-4" aria-hidden="true" />
                {t("Apri la locandina")}
              </a>
            }
          </aside>
        )}
      </div>
    </div>
  );
}
