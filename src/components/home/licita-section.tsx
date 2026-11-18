"use client";

import { ChevronRight, Gavel, Trophy, Users } from "lucide-react";

import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La licita in prima pagina.
 *
 * PERCHÉ STA QUI E NON SOLO DENTRO /gioca. È la parte del prodotto su cui si
 * gioca davvero con gli altri — le stesse smazzate per tutti, il confronto col
 * campo, i tornei con la classifica — ed era raggiungibile solo scendendo di
 * un livello nell'hub. Tre voci nascoste dietro un tocco in più sono tre voci
 * che gli iscritti non sanno che esistono.
 *
 * TRE PORTE ALLA STESSA COSA, in ordine di quanto è facile cominciare: da soli
 * col compagno finto, con un amico vero, o nel torneo dove si finisce in
 * classifica. Il sottotitolo dice cosa succede davvero, non cosa promette.
 *
 * Un foglio solo con tre righe, non tre tessere: sono tre modi della stessa
 * cosa, e tre tessere uguali in fila si leggono come tre cose diverse
 * (18/11/2026).
 */
const PORTE = [
  {
    href: "/gioca/licita",
    Icona: Gavel,
    titolo: "Licita e vediamo",
    desc: "Vedi solo la tua mano: dichiara col compagno e prendi le stelle",
    nuovo: true,
  },
  {
    href: "/gioca/licita-amico",
    Icona: Users,
    titolo: "Licita con un amico",
    desc: "Ognuno vede la sua mano e dichiara quando può",
    nuovo: true,
  },
  {
    href: "/gioca/torneo-licita",
    Icona: Trophy,
    titolo: "Tornei di licita",
    desc: "8 mani al giorno, 24 a settimana: stesse smazzate per tutti",
    nuovo: false,
  },
];

export function LicitaSection() {
  const t = useT();
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <h2 className="font-display text-lg font-bold">{t("Dichiara con gli altri")}</h2>
        <Link href="/gioca" className="text-sm font-semibold text-primary hover:underline">
          {t("Tutti i giochi")}
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-border border-t border-border">
        {PORTE.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="flex min-h-16 items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                <p.Icona className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{t(p.titolo)}</span>
                  {p.nuovo && (
                    <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-bold text-foreground">{t("Nuovo")}</span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground text-pretty">{t(p.desc)}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
