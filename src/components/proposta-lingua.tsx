"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { LINGUA_PREDEFINITA, type Lingua } from "@/lib/lingua";
import { useLingua } from "@/hooks/use-lingua";

const RICORDA = "bq_lingua_scelta";

/**
 * A chi ha il browser in inglese si PROPONE la versione inglese. Non lo si
 * porta.
 *
 * PERCHÉ PROPORRE E NON REINDIRIZZARE. Un rinvio automatico in base alla
 * lingua del browser sembra premuroso e fa danni: un italiano che apre il sito
 * da un computer configurato in inglese — al lavoro, in un albergo, su un
 * telefono comprato all'estero — si ritrova su un sito che non ha chiesto, e
 * l'indirizzo che aveva in mano non porta più dove portava. Vale anche per i
 * motori di ricerca, che indicizzano quello che ricevono: un rinvio automatico
 * può far sparire dall'indice metà del sito.
 *
 * Chi decide è chi legge. Il banner appare una volta, e la scelta — in
 * qualunque direzione — viene ricordata.
 *
 * IL TESTO È NELLA LINGUA CHE SI PROPONE, non in quella della pagina: chi
 * riceve questo avviso non capisce l'italiano, ed è tutto il punto.
 */
export function PropostaLingua() {
  const { lingua, versoLingua } = useLingua();
  const [proposta, setProposta] = useState<Lingua | null>(null);

  useEffect(() => {
    let scelta: string | null = null;
    try {
      scelta = localStorage.getItem(RICORDA);
    } catch {
      // Navigazione privata o archiviazione negata: si tace, invece di
      // riproporre l'avviso a ogni pagina.
      return;
    }
    if (scelta) return;

    // `navigator.languages` è l'ordine di preferenza vero; `language` da solo
    // è solo la prima voce, e su alcuni sistemi non è quella che l'utente ha
    // scelto.
    const preferite = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    const primaNota = preferite
      .map((l) => l.slice(0, 2).toLowerCase())
      .find((l) => l === "it" || l === "en");

    // Nessuna preferenza riconoscibile: non si propone niente. Meglio zitti che
    // a caso.
    if (!primaNota || primaNota === lingua) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la lingua del browser esiste solo nel browser: non c'è modo di saperla al momento della generazione della pagina
    setProposta(primaNota as Lingua);
  }, [lingua]);

  if (!proposta) return null;

  const ricorda = () => {
    try {
      localStorage.setItem(RICORDA, "1");
    } catch {}
    setProposta(null);
  };

  const inglese = proposta === "en";

  return (
    <div
      /* IN ALTO, non in basso: in fondo allo schermo ci sono già il banner
         dei cookie e la barra di navigazione del telefono. Sovrapposti, il
         cookie vince e questo avviso diventa un rettangolo che non si può
         né leggere né chiudere — il click ci finisce sopra. */
      className="fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:right-4"
      role="region"
      aria-label={inglese ? "Language suggestion" : "Suggerimento lingua"}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-foreground">
          {inglese
            ? "This site is also available in English."
            : "Questo sito è disponibile anche in italiano."}
        </p>
        <button
          onClick={ricorda}
          aria-label={inglese ? "Dismiss" : "Chiudi"}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href={versoLingua(proposta)}
          hrefLang={proposta}
          onClick={ricorda}
          className="rounded-xl bg-figb px-3 py-2 text-sm font-medium text-white hover:bg-figb-dark"
        >
          {inglese ? "Switch to English" : "Passa all'italiano"}
        </Link>
        <button
          onClick={ricorda}
          className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {inglese
            ? `Stay in ${LINGUA_PREDEFINITA === lingua ? "Italian" : "English"}`
            : "Resta in inglese"}
        </button>
      </div>
    </div>
  );
}
