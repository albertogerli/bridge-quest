"use client";

import { CalendarDays, Clock, FileText, GraduationCap, MapPin, MessageCircle, Phone, User } from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { ETICHETTA_LIVELLO, ETICHETTA_TIPO, linkTelefono, linkWhatsapp, orariLeggibili } from "@/lib/corsi";
import type { CorsoPubblico } from "@/lib/corsi";

export function dataCorso(iso: string, lingua: string, conGiorno = false): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lingua === "en" ? "en-US" : "it-IT", {
    ...(conGiorno ? { weekday: "long" as const } : {}),
    day: "numeric",
    month: "long",
  });
}

export function linkMappa(c: CorsoPubblico["circolo"]): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${c.name}, ${c.address || c.city}`)}`;
}

/** Il bollino del tipo: il 5.0 in blu FIGB, il tradizionale neutro. */
export function BollinoTipo({ tipo }: { tipo: CorsoPubblico["tipo"] }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        tipo === "bridge-5" ? "bg-primary text-primary-foreground" : "border border-border bg-muted text-foreground"
      }`}
    >
      {t(ETICHETTA_TIPO[tipo])}
    </span>
  );
}

/**
 * La locandina in piccolo. Un PDF non si vede in miniatura: al suo posto un
 * foglio con il nome del circolo. Senza locandina, lo stesso foglio: la
 * scheda non deve avere un buco.
 */
export function Locandina({ corso, grande = false }: { corso: CorsoPubblico; grande?: boolean }) {
  const t = useT();
  if (corso.locandinaUrl && !corso.locandinaPdf) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- indirizzo firmato di Supabase, che cambia: next/image lo metterebbe in cache con la firma dentro
      <img
        src={corso.locandinaUrl}
        alt={t("Locandina del corso a {circolo}", { circolo: corso.circolo.name })}
        className={`w-full rounded-xl border border-border bg-muted object-cover ${grande ? "max-h-[70dvh] object-contain" : "aspect-[3/4]"}`}
        loading="lazy"
      />
    );
  }
  if (!grande) {
    // In piccolo, accanto al titolo che dice già il circolo: solo un segno.
    return (
      <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted text-muted-foreground">
        {corso.locandinaPdf ? <FileText className="size-7" aria-hidden="true" /> : <GraduationCap className="size-7" aria-hidden="true" />}
        {corso.locandinaPdf && <span className="text-xs font-bold">PDF</span>}
        <span className="sr-only">{corso.locandinaPdf ? t("Locandina in PDF") : t("Corso di bridge")}</span>
      </div>
    );
  }
  return (
    <div className="flex min-h-48 w-full flex-col justify-between rounded-xl border border-border bg-muted p-4">
      <span className="text-xs font-bold uppercase text-muted-foreground">{t("Corso di bridge")}</span>
      <span className="font-display text-lg font-bold leading-tight text-balance">{corso.circolo.name}</span>
      {corso.locandinaPdf ? (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <FileText className="size-4" aria-hidden="true" />
          {t("Locandina in PDF")}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">{t(ETICHETTA_LIVELLO[corso.livello])}</span>
      )}
    </div>
  );
}

export function SchedaCorso({ corso, km }: { corso: CorsoPubblico; km: number | null }) {
  const t = useT();
  const { lingua } = useLingua();
  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
      <Link href={`/corsi/${corso.id}`} aria-label={t("Apri il corso a {circolo}", { circolo: corso.circolo.name })}>
        <Locandina corso={corso} />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <BollinoTipo tipo={corso.tipo} />
          <span className="text-xs font-semibold text-muted-foreground">{t(ETICHETTA_LIVELLO[corso.livello])}</span>
          {km !== null && (
            <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">
              {km < 1 ? t("meno di 1 km") : t("{km} km", { km: Math.round(km) })}
            </span>
          )}
        </div>
        <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-balance">
          <Link href={`/corsi/${corso.id}`} className="hover:underline">
            {corso.circolo.name}
          </Link>
        </h2>
        <ul className="mt-2 grid gap-1 text-sm text-pretty">
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{[corso.circolo.city, corso.circolo.province].filter(Boolean).join(" · ")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{t("Dal {data}", { data: dataCorso(corso.primaLezione, lingua) })}</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="tabular-nums">{orariLeggibili(corso.orari, t)}</span>
          </li>
          <li className="flex items-start gap-2">
            <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{corso.maestro}</span>
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={linkTelefono(corso.telefono)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Phone className="size-4" aria-hidden="true" />
            <span className="tabular-nums">{corso.telefono}</span>
          </a>
          {corso.whatsapp && (
            <a
              href={linkWhatsapp(corso.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          )}
          <Link
            href={`/corsi/${corso.id}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"
          >
            {t("Dettagli")}
          </Link>
        </div>
      </div>
    </article>
  );
}
