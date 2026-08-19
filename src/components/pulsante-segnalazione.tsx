"use client";

import { useEffect, useState } from "react";
import { Bug, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  contestoAmbiente,
  inviaSegnalazione,
  raccogliErroriDiConsole,
  type ContestoSegnalazione,
} from "@/lib/segnalazioni";
import { reportError } from "@/lib/report-error";

/**
 * Il pulsante «qualcosa non va», con tutto il contesto già dentro.
 *
 * UN CAMPO DI TESTO E BASTA. Nessun modulo da compilare, nessun menù di
 * categorie: chi segnala sta facendo lezione e vuole tornare alla classe. Tutto
 * il resto — pagina, mano, compito, browser, errori — lo raccogliamo noi, e
 * glielo mostriamo perché sappia cosa sta mandando.
 *
 * LO SCREENSHOT SI PUÒ TOGLIERE. Fotografa lo schermo, e sullo schermo può
 * esserci qualsiasi cosa. Chi manda lo vede prima e decide: una casella spuntata
 * di default, perché nella stragrande maggioranza dei casi è la cosa più utile
 * di tutta la segnalazione, ma togliibile in un tocco.
 *
 * LA LIBRERIA SI CARICA SOLO QUI. `html-to-image` arriva con un import
 * dinamico all'apertura del pannello: chi non segnala non se la porta dietro,
 * e il pulsante sta su pagine che si aprono a lezione, dove ogni kilobyte in
 * più è tempo davanti a una classe che aspetta.
 */
export function PulsanteSegnalazione({
  zona,
  contestoExtra,
}: {
  /** In termini nostri: `lavagna`, `tavolo`, `compito`… */
  zona: string;
  contestoExtra?: Partial<ContestoSegnalazione>;
}) {
  const [aperto, setAperto] = useState(false);
  const [testo, setTesto] = useState("");
  const [conScreenshot, setConScreenshot] = useState(true);
  const [inCorso, setInCorso] = useState(false);
  const [mandata, setMandata] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    raccogliErroriDiConsole();
  }, []);

  async function manda() {
    setInCorso(true);
    setErrore(null);

    let immagine: Blob | null = null;
    if (conScreenshot) {
      try {
        const { toBlob } = await import("html-to-image");
        immagine = await toBlob(document.body, {
          // Il pannello stesso fuori dalla foto: fotografare il modulo di
          // segnalazione aperto sopra la pagina non aiuta nessuno.
          filter: (n) => !(n instanceof HTMLElement && n.dataset.senzaFoto === "1"),
          pixelRatio: 1,
          backgroundColor: getComputedStyle(document.body).backgroundColor || "#fff",
        });
      } catch (err) {
        // Niente foto, ma la segnalazione parte lo stesso.
        reportError("segnalazione:foto", err);
      }
    }

    const esito = await inviaSegnalazione({
      testo,
      contesto: { ...contestoAmbiente(), zona, ...contestoExtra } as ContestoSegnalazione,
      screenshot: immagine,
    });

    setInCorso(false);
    if (esito.ok) {
      setMandata(true);
      setTesto("");
      setTimeout(() => {
        setMandata(false);
        setAperto(false);
      }, 2200);
    } else {
      setErrore(esito.errore ?? "Non sono riuscito a mandarla.");
    }
  }

  if (!aperto) {
    return (
      <button
        data-senza-foto="1"
        onClick={() => setAperto(true)}
        aria-label="Segnala un problema"
        className="fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-md backdrop-blur transition-colors hover:text-foreground lg:bottom-4 print:hidden"
      >
        <Bug className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      data-senza-foto="1"
      className="fixed bottom-20 right-4 z-40 w-80 rounded-xl border border-border bg-card p-4 shadow-xl lg:bottom-4 print:hidden"
    >
      <div className="mb-2 flex items-center gap-2">
        <Bug className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-bold">Qualcosa non va</span>
        <button
          onClick={() => setAperto(false)}
          aria-label="Chiudi"
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mandata ? (
        <p className="py-4 text-center text-sm font-medium text-primary">
          Ricevuta, grazie. Ci guardiamo.
        </p>
      ) : (
        <>
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Cosa è successo? Anche solo una riga."
            className="w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />

          <label className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5"
              checked={conScreenshot}
              onChange={(e) => setConScreenshot(e.target.checked)}
            />
            <span>
              Manda anche una foto dello schermo
              <span className="block opacity-80">
                Fotografa quello che c&rsquo;è adesso sulla pagina. La vediamo solo noi.
              </span>
            </span>
          </label>

          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Mandiamo anche: pagina, mano in corso, dimensioni dello schermo, browser ed
            eventuali errori. Nessun dato personale.
          </p>

          {errore && <p className="mt-2 text-xs text-destructive">{errore}</p>}

          <Button
            onClick={() => void manda()}
            disabled={inCorso || testo.trim().length < 3}
            className="mt-3 w-full"
            size="sm"
          >
            {inCorso ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {inCorso ? "Mando…" : "Manda"}
          </Button>
        </>
      )}
    </div>
  );
}
