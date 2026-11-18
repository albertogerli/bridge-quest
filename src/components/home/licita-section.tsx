"use client";

import { Gavel, Trophy, Users } from "lucide-react";

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
 * classifica. Il sottotitolo dice cosa succede davvero, non cosa promette:
 * chi legge deve poter scegliere senza entrare a provare.
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
    <section className="mx-auto max-w-6xl px-4 sm:px-5 pt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("Dichiara")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {PORTE.map((p) => (
          <Link key={p.href} href={p.href} className="block">
            <div className="flex h-full flex-col gap-1 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                  <p.Icona className="size-4" />
                </span>
                <span className="font-bold">{t(p.titolo)}</span>
                {p.nuovo && (
                  <span className="ml-auto rounded-full bg-gold/25 px-2 py-0.5 text-xs font-bold text-foreground">
                    {t("Nuovo")}
                  </span>
                )}
              </div>
              <span className="text-sm leading-snug text-muted-foreground">{t(p.desc)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
