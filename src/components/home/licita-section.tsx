"use client";

import Link from "next/link";
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
    emoji: "🗣️",
    titolo: "Licita e vediamo",
    desc: "Vedi solo la tua mano: dichiara col compagno e prendi le stelle",
    nuovo: true,
    cls: "from-figb to-figb-light",
  },
  {
    href: "/gioca/licita-amico",
    emoji: "👥",
    titolo: "Licita con un amico",
    desc: "Ognuno vede la sua mano e dichiara quando può",
    nuovo: true,
    cls: "from-[#1B5E3B] to-[#2A7A4F]",
  },
  {
    href: "/gioca/torneo-licita",
    emoji: "🏆",
    titolo: "Tornei di licita",
    desc: "8 mani al giorno, 24 a settimana: stesse smazzate per tutti",
    nuovo: false,
    cls: "from-[#c8a44e] to-[#a8842e]",
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
            <div
              className={`flex h-full flex-col gap-1 rounded-2xl bg-gradient-to-br ${p.cls} p-4 text-white transition-all hover:translate-y-[-2px] hover:shadow-lg active:scale-[0.98]`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <span className="text-sm font-bold">{p.titolo}</span>
                {p.nuovo && (
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide">
                    {t("Nuovo")}
                  </span>
                )}
              </div>
              <span className="text-[12px] leading-snug text-white/80">{p.desc}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
