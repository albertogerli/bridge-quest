"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, Copy, Mail, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { linkWhatsApp } from "@/lib/whatsapp";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Un messaggio già scritto, da mandare con il mezzo che l'insegnante usa.
 *
 * PERCHÉ NON SOLO WHATSAPP. Il pulsante apriva `wa.me`, che dal computer porta
 * a WhatsApp Web o all'app desktop: chi non li ha installati, o non vuole
 * collegarli, restava senza modo di mandare il codice dell'aula o l'avviso del
 * compito (Trevissoi, feedback 6: «non possiamo renderlo un requisito»). Copiare
 * il testo copre qualunque altro canale — SMS, Telegram, il registro del
 * circolo — e l'email apre il programma di posta con oggetto e testo pronti.
 *
 * Un menu e non tre pulsanti: nelle righe dei compiti ce ne sono già cinque.
 */
export function MandaMessaggio({
  testo,
  oggetto,
  etichetta,
  variante = "outline",
}: {
  testo: string;
  /** L'oggetto dell'email. */
  oggetto: string;
  etichetta: string;
  variante?: "outline" | "ghost";
}) {
  const t = useT();
  const menu = useRef<HTMLDetailsElement>(null);
  const [copiato, setCopiato] = useState(false);
  const chiudi = () => menu.current?.removeAttribute("open");

  const voce = "flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted";

  return (
    <details ref={menu} className="relative inline-block">
      <summary
        className={`${buttonVariants({ size: "sm", variant: variante })} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {etichetta}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 z-30 mt-1 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
        <a href={linkWhatsApp(testo)} target="_blank" rel="noopener noreferrer" className={voce} onClick={chiudi}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {t("WhatsApp")}
        </a>
        <button
          type="button"
          className={voce}
          onClick={() => {
            void navigator.clipboard?.writeText(testo).then(() => {
              setCopiato(true);
              setTimeout(() => {
                setCopiato(false);
                chiudi();
              }, 1500);
            });
          }}
        >
          {copiato ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copiato ? t("Copiato: incollalo dove vuoi") : t("Copia il messaggio")}
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`}
          className={voce}
          onClick={chiudi}
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {t("Email")}
        </a>
      </div>
    </details>
  );
}
